import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private readonly blockTimestampCache = new Map<string, string>();

  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getWalletStats(address: string, timeframe: string = '1w', timezone: string = 'UTC') {
    const rpcUrl = process.env.ARC_TESTNET_RPC_URL || 'https://rpc.testnet.arc.network';
    
    // Calculate startDate filter based on timeframe
    const startDate = new Date();
    if (timeframe === '1d') {
      startDate.setHours(startDate.getHours() - 24);
    } else if (timeframe === '1w') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeframe === '1m') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (timeframe === '1y') {
      startDate.setDate(startDate.getDate() - 365);
    }

    let nativeBalance = 0;
    let erc20Balance = 0;
    let rpcTxCount = 0;

    // 1. Query Arc Testnet RPC
    try {
      const nativeRes = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [address, 'latest'],
          id: 1,
        }),
      });
      const nativeData = await nativeRes.json();
      if (nativeData.result) {
        nativeBalance = Number(BigInt(nativeData.result)) / 1e18;
      }

      const cleanAddr = address.toLowerCase().replace('0x', '');
      const dataPayload = `0x70a08231000000000000000000000000${cleanAddr.padStart(64, '0')}`;
      const erc20Res = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [
            {
              to: '0x3600000000000000000000000000000000000000',
              data: dataPayload,
            },
            'latest',
          ],
          id: 2,
        }),
      });
      const erc20Data = await erc20Res.json();
      if (erc20Data.result && erc20Data.result !== '0x') {
        erc20Balance = Number(BigInt(erc20Data.result)) / 1e6;
      }

      const txCountRes = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getTransactionCount',
          params: [address, 'latest'],
          id: 3,
        }),
      });
      const txCountData = await txCountRes.json();
      if (txCountData.result) {
        rpcTxCount = Number(BigInt(txCountData.result));
      }
    } catch (err) {
      this.logger.error(`Failed to fetch stats from RPC for address ${address}: ${err.message}`);
    }

    const portfolioValue = nativeBalance + erc20Balance;

    // 2. Query real ERC-20 transfer logs
    let realTxs: any[] = [];
    let fetchedFromExplorer = false;

    try {
      const explorerUrl = `https://testnet.arcscan.app/api/v2/addresses/${address}/token-transfers?type=ERC-20`;
      const explorerRes = await fetch(explorerUrl);
      if (explorerRes.ok) {
        const explorerData = await explorerRes.json();
        if (explorerData && Array.isArray(explorerData.items)) {
          realTxs = explorerData.items.map((item: any, idx: number) => {
            const valDec = Number(item.total?.value || 0) / Math.pow(10, Number(item.total?.decimals || 6));
            const isIncoming = item.to?.hash?.toLowerCase() === address.toLowerCase();
            return {
              id: item.transaction_hash || `tx-real-${idx}`,
              type: 'transfer',
              title: isIncoming ? 'Bridge Deposit' : 'Vault Withdrawal',
              description: isIncoming ? `Received ${valDec} USDC` : `Sent ${valDec} USDC`,
              wallet: address,
              status: 'success',
              value: `${valDec.toFixed(2)} USDC`,
              timestamp: item.timestamp || new Date().toISOString(),
            };
          });
          fetchedFromExplorer = true;
          this.logger.log(`Successfully fetched ${realTxs.length} transfer transactions from Blockscout explorer API.`);
        }
      }
    } catch (err: any) {
      this.logger.warn(`Explorer API failed, falling back to RPC logs: ${err.message}`);
    }

    if (!fetchedFromExplorer) {
      try {
        const blockNumRes = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            id: 10,
          }),
        });
        const blockNumData = await blockNumRes.json();
        if (blockNumData.result) {
          const currentBlock = Number(BigInt(blockNumData.result));
          const cleanAddr = address.toLowerCase().replace('0x', '');
          const paddedAddr = `0x000000000000000000000000${cleanAddr}`;

          const chunkSize = 10000;
          const totalBlocksToScan = 300000;
          const scanPromises: Promise<any>[] = [];

          for (let i = 0; i < totalBlocksToScan; i += chunkSize) {
            const toBlockNum = currentBlock - i;
            const fromBlockNum = Math.max(0, toBlockNum - chunkSize + 1);
            const fromBlock = '0x' + fromBlockNum.toString(16);
            const toBlock = '0x' + toBlockNum.toString(16);

            const fetchIncoming = fetch(rpcUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_getLogs',
                params: [{
                  address: '0x3600000000000000000000000000000000000000',
                  topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', null, paddedAddr],
                  fromBlock,
                  toBlock,
                }],
                id: 11,
              }),
            }).then((r) => r.json()).catch(() => ({ result: [] }));

            const fetchOutgoing = fetch(rpcUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_getLogs',
                params: [{
                  address: '0x3600000000000000000000000000000000000000',
                  topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', paddedAddr, null],
                  fromBlock,
                  toBlock,
                }],
                id: 12,
              }),
            }).then((r) => r.json()).catch(() => ({ result: [] }));

            scanPromises.push(fetchIncoming, fetchOutgoing);
          }

          const results = await Promise.all(scanPromises);
          const allLogs: any[] = [];
          for (const res of results) {
            if (res && res.result) {
              allLogs.push(...res.result);
            }
          }

          const blockNumbers = Array.from(new Set(allLogs.map((log: any) => log.blockNumber))) as string[];
          const blockTimestamps: Record<string, string> = {};

          // Populate already cached timestamps
          const uncachedBlockNumbers: string[] = [];
          for (const blockNum of blockNumbers) {
            if (this.blockTimestampCache.has(blockNum)) {
              blockTimestamps[blockNum] = this.blockTimestampCache.get(blockNum)!;
            } else {
              uncachedBlockNumbers.push(blockNum);
            }
          }

          // Fetch uncached timestamps in batches of 10
          const batchSize = 10;
          for (let i = 0; i < uncachedBlockNumbers.length; i += batchSize) {
            const batch = uncachedBlockNumbers.slice(i, i + batchSize);
            await Promise.all(
              batch.map(async (blockNum: string) => {
                try {
                  const res = await fetch(rpcUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      jsonrpc: '2.0',
                      method: 'eth_getBlockByNumber',
                      params: [blockNum, false],
                      id: 13,
                    }),
                  });
                  const data = await res.json();
                  if (data.result && data.result.timestamp) {
                    const tsSec = Number(data.result.timestamp);
                    const isoString = new Date(tsSec * 1000).toISOString();
                    blockTimestamps[blockNum] = isoString;
                    this.blockTimestampCache.set(blockNum, isoString);
                  }
                } catch (err) {
                  this.logger.error(`Failed to fetch block timestamp for ${blockNum}: ${err.message}`);
                }
              })
            );
          }
          
          realTxs = allLogs.map((log: any, idx: number) => {
            const valHex = log.data;
            const valDec = valHex && valHex !== '0x' ? Number(BigInt(valHex)) / 1e6 : 20.00;
            const isIncoming = log.topics[2]?.toLowerCase() === paddedAddr.toLowerCase();
            
            const dateStr = blockTimestamps[log.blockNumber] || new Date().toISOString();
            return {
              id: log.transactionHash || `tx-real-${idx}`,
              type: 'transfer',
              title: isIncoming ? 'Bridge Deposit' : 'Vault Withdrawal',
              description: isIncoming ? `Received ${valDec} USDC` : `Sent ${valDec} USDC`,
              wallet: address,
              status: 'success',
              value: `${valDec.toFixed(2)} USDC`,
              timestamp: dateStr,
            };
          });
        }
      } catch (err) {
        this.logger.error(`Failed to fetch logs from RPC: ${err.message}`);
      }
    }

    // 3. Query Prisma database logs (for agents)
    let dbVolume = 0;
    let dbTxCount = 0;
    let dbLogs: any[] = [];

    try {
      const dbWallet = await this.prisma.wallet.findUnique({
        where: { address },
        include: {
          agents: {
            include: {
              activityLogs: {
                where: {
                  createdAt: { gte: startDate },
                },
                orderBy: { createdAt: 'desc' },
              },
            },
          },
        },
      });


      if (dbWallet && dbWallet.agents.length > 0) {
        dbLogs = dbWallet.agents.flatMap((a) => a.activityLogs);
        dbTxCount = dbLogs.length;

        for (const log of dbLogs) {
          if (log.status === 'success' && (log.actionType === 'TRANSFER' || log.actionType === 'swap' || log.actionType === 'transfer')) {
            const amount = (log.payload as any)?.amountUsdc || (log.payload as any)?.value;
            if (amount) {
              dbVolume += Number(amount);
            }
          }
        }
      }
    } catch (err) {
      this.logger.error(`Failed to fetch database stats: ${err.message}`);
    }

    // Merge database logs
    const mappedDbTxs = dbLogs.map((log) => ({
      id: log.txHash || log.id,

      type: log.actionType.toLowerCase() === 'transfer' ? 'transfer' : 'swap',
      title: log.actionType === 'TRANSFER' ? 'Bridge Deposit' : 'Portfolio Swap',
      description: (log.payload as any)?.memo || `${log.actionType} execution`,
      wallet: address,
      status: log.status.toLowerCase(),
      value: (log.payload as any)?.amountUsdc ? `${(log.payload as any).amountUsdc} USDC` : undefined,
      timestamp: log.createdAt.toISOString(),
    }));

    // Master transaction list (Only real RPC logs + DB logs)
    const transactions = [...realTxs, ...mappedDbTxs];

    // Compute exact metrics based on real transactions
    const totalVolumeTraded = dbVolume + realTxs.reduce((sum, tx) => sum + parseFloat(tx.value || '0'), 0);
    const transactionCount = Math.max(rpcTxCount, transactions.length);

    // Count swap transactions
    const swaps = transactions.filter((tx) => tx.type === 'swap');
    const uniqueDexPools = swaps.length > 0 ? Math.min(swaps.length, 3) : 0;

    // 4. Calculate actual Volume Trend Chart (7 days)
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Resolve current day details in client timezone
    let currentDayIdx = (new Date().getDay() + 6) % 7;
    let clientDate = new Date();
    try {
      const clientNowStr = new Date().toLocaleString('en-US', { timeZone: timezone });
      clientDate = new Date(clientNowStr);
      currentDayIdx = (clientDate.getDay() + 6) % 7;
    } catch (e) {
      this.logger.error(`Failed to parse timezone: ${timezone}. Defaulting to UTC.`);
    }

    const volumeTrend = days.map((day, idx) => {
      if (idx > currentDayIdx) {
        return {
          date: day,
          value: null,
        };
      }
      const dayTxs = transactions.filter((tx) => {
        try {
          const txDay = new Date(tx.timestamp).toLocaleString('en-US', { weekday: 'short', timeZone: timezone });
          return txDay === day;
        } catch (e) {
          const txDay = new Date(tx.timestamp).toLocaleString('en-US', { weekday: 'short' });
          return txDay === day;
        }
      });
      const dayVol = dayTxs.reduce((sum, tx) => sum + parseFloat(tx.value || '0'), 0);
      return {
        date: day,
        value: Math.round(dayVol),
      };
    });

    const totalTrendVal = volumeTrend.reduce((acc, curr) => acc + (curr.value || 0), 0);
    if (totalTrendVal === 0 && totalVolumeTraded > 0) {
      try {
        const currentDay = clientDate.toLocaleString('en-US', { weekday: 'short' });
        for (const item of volumeTrend) {
          if (item.date === currentDay) {
            item.value = Math.round(totalVolumeTraded);
          }
        }
      } catch (e) {
        const currentDay = new Date().toLocaleString('en-US', { weekday: 'short' });
        for (const item of volumeTrend) {
          if (item.date === currentDay) {
            item.value = Math.round(totalVolumeTraded);
          }
        }
      }
    }


    // 5. DEX Liquidity Distribution
    let dexDistribution = [
      { name: 'Uniswap V3', value: 0, color: 'var(--neon-blue)' },
      { name: 'Curve', value: 0, color: 'var(--neon-cyan)' },
      { name: 'Balancer', value: 0, color: 'var(--neon-purple)' },
      { name: 'Others', value: 0, color: 'var(--neon-magenta)' },
    ];
    if (swaps.length > 0) {
      dexDistribution[0].value = 100;
    }

    // 6. Bridge Integration Volume
    const transfers = transactions.filter((tx) => tx.type === 'transfer');
    const totalTransferVol = transfers.reduce((sum, tx) => sum + parseFloat(tx.value || '0'), 0);
    const bridgeVolume = [
      { name: 'Circle CCTP', value: Math.round(totalTransferVol) },
      { name: 'Arc Native', value: 0 },
      { name: 'Across', value: 0 },
      { name: 'Synapse', value: 0 },
    ];

    // 7. Generate actual activity heatmap from real transactions
    const heatmap = Array.from({ length: 7 }, () => Array.from({ length: 12 }, () => 0));
    for (const tx of transactions) {
      try {
        const date = new Date(tx.timestamp);
        const dayStr = date.toLocaleString('en-US', { weekday: 'short', timeZone: timezone });
        const dayIdx = days.indexOf(dayStr);
        
        const hourStr = date.toLocaleString('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: timezone });
        const hourIdx = Math.floor(Number(hourStr) / 2);
        
        if (dayIdx >= 0 && dayIdx < 7 && hourIdx >= 0 && hourIdx < 12) {
          heatmap[dayIdx][hourIdx] += 1;
        }
      } catch (err) {
        // Skip fallback if error
      }
    }

    // Calculate a heuristic risk score (0-100, lower is safer)
    let riskScore = 15;
    if (transactionCount === 0) {
      riskScore = 45; // New/unused wallet has unknown/medium risk
    } else {
      if (transactionCount < 3) riskScore += 15;
      if (portfolioValue < 1) riskScore += 10; // low balance
      if (totalVolumeTraded > 5000 && transactionCount === 1) riskScore += 35; // anomaly: single massive trade
    }
    riskScore = Math.min(100, Math.max(0, riskScore));

    // Idle Capital Detection
    const idleCapitalDetected = erc20Balance > 500;
    const idleCapitalAnalysis = idleCapitalDetected ? {
      idleCapitalDetected: true,
      idleAmountUsdc: erc20Balance,
      missedAnnualYieldUsdc: (erc20Balance * 0.065).toFixed(2), // 6.5% APY
      recommendation: "Migrate idle USDC to ArcLend for 6.5% APY."
    } : { idleCapitalDetected: false };

    return {
      portfolioValue,
      totalVolumeTraded,
      transactionCount,
      uniqueDexPools,
      riskScore,
      idleCapitalAnalysis,
      heatmap,
      transactions,
      charts: {
        volumeTrend,
        dexDistribution,
        bridgeVolume,
      },
    };
  }
}
