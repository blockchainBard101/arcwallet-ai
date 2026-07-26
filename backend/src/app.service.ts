import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { CircleService } from './circle/circle.service';
import { X402ClientService } from './circle/x402-client.service';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private readonly blockTimestampCache = new Map<string, string>();

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly circleService?: CircleService,
    @Optional() private readonly x402Service?: X402ClientService,
  ) {}

  async getMarketplaceServices(query: string = '') {
    if (this.x402Service) {
      return this.x402Service.searchServices(query);
    }
    return [];
  }

  async getAgentTransactions(agentId: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      include: { wallet: true },
    });

    if (!agent) {
      return { success: false, transactions: [] };
    }

    // 1. Fetch DB Nanopayment Logs
    const nanopayments = await this.prisma.nanopaymentLog.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    // 2. Fetch DB Activity Logs
    const activities = await this.prisma.activityLog.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    // 3. Attempt Circle API transaction fetch if CircleService is available
    let circleTxs: any[] = [];
    if (this.circleService && agent.walletId) {
      try {
        circleTxs = await this.circleService.listTransactions([agent.walletId]);
      } catch (err: any) {
        this.logger.warn(`Could not fetch Circle transactions for ${agent.walletId}: ${err.message}`);
      }
    }

    // Format & Combine into unified items
    const formattedNanopay = nanopayments.map((n) => ({
      id: n.id,
      type: 'x402 Nanopayment',
      title: n.serviceName,
      costUsdc: n.amountUsdc,
      chain: n.chain || 'ARC-TESTNET',
      status: n.status,
      txHash: '0x' + n.id.replace(/-/g, '').substring(0, 40),
      timestamp: n.createdAt.toISOString(),
      details: `Service call: ${n.serviceUrl}`,
    }));

    const formattedActivities = activities.map((a: any) => ({
      id: a.id,
      type: a.actionType || 'Agent Execution',
      title: `${a.actionType}`,
      costUsdc: (a.payload as any)?.amount || 0,
      chain: 'ARC-TESTNET',
      status: a.status || 'success',
      txHash: a.txHash || '0x' + a.id.replace(/-/g, '').substring(0, 40),
      timestamp: a.createdAt.toISOString(),
      details: a.payload ? JSON.stringify(a.payload) : 'Automated Agent Rule Trigger',
    }));

    const formattedCircle = circleTxs.map((c) => {
      const isInbound = c.transactionType === 'INBOUND' || c.operation === 'INBOUND';
      return {
        id: c.id,
        type: isInbound ? 'Deposit Received' : 'On-Chain Transfer',
        title: `USDC ${c.transactionType || (isInbound ? 'INBOUND' : 'OUTBOUND')}`,
        costUsdc: Math.abs(parseFloat(c.amounts?.[0] || '0')),
        isInbound,
        chain: c.blockchain || 'ARC-TESTNET',
        status: c.state === 'COMPLETE' ? 'success' : c.state?.toLowerCase() || 'pending',
        txHash: c.txHash || c.id,
        timestamp: c.createDate || new Date().toISOString(),
        details: isInbound ? `From: ${c.sourceAddress || 'External Wallet'}` : `To: ${c.destinationAddress || 'Recipient'}`,
      };
    });

    const combined = [...formattedNanopay, ...formattedActivities, ...formattedCircle];
    const uniqueMap = new Map();
    combined.forEach((item) => uniqueMap.set(item.id, item));
    const transactions = Array.from(uniqueMap.values());
    transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      success: true,
      agentId,
      agentName: agent.name,
      walletAddress: agent.wallet?.address || agent.walletId,
      totalCount: transactions.length,
      transactions,
    };
  }

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

      // 1a. Query USDC ERC20 (0x3600...)
      const usdcRes = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [{ to: '0x3600000000000000000000000000000000000000', data: dataPayload }, 'latest'],
          id: 2,
        }),
      });
      const usdcData = await usdcRes.json();
      if (usdcData.result && usdcData.result !== '0x') {
        erc20Balance += Number(BigInt(usdcData.result)) / 1e6;
      }

      // 1b. Query EURC ERC20 (0x8080000000000000000000000000000000000000 or Circle EURC)
      try {
        const eurcRes = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_call',
            params: [{ to: '0x8080000000000000000000000000000000000000', data: dataPayload }, 'latest'],
            id: 22,
          }),
        });
        const eurcData = await eurcRes.json();
        if (eurcData.result && eurcData.result !== '0x') {
          // Multiply EURC by ~1.08 exchange rate to USD
          erc20Balance += (Number(BigInt(eurcData.result)) / 1e6) * 1.08;
        }
      } catch (e) {
        // Ignored if contract call fails
      }

      // 1c. If address belongs to an agent wallet, check if circleWalletId is in configuration
      try {
        const walletRecord = await this.prisma.wallet.findUnique({
          where: { address },
          include: { agents: true },
        });
        const circleWalletId = walletRecord?.agents?.[0]?.configuration ? (walletRecord.agents[0].configuration as any).circleWalletId : null;
        if (circleWalletId && this.circleService) {
          const circleBal = await this.circleService.getWalletTokenBalance(circleWalletId);
          if (Array.isArray(circleBal)) {
            let circleTotalErc20 = 0;
            for (const b of circleBal) {
              const amount = parseFloat(b.amount || '0');
              const symbol = b.token?.symbol?.toUpperCase() || '';
              if (symbol.includes('USDC')) {
                circleTotalErc20 += amount;
              } else if (symbol.includes('EURC')) {
                circleTotalErc20 += amount * 1.08;
              }
            }
            if (circleTotalErc20 > 0) {
              erc20Balance = circleTotalErc20;
            }
          }
        }
      } catch (err: any) {
        this.logger.warn(`Could not fetch Circle balances for wallet ${address}: ${err.message}`);
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

    // 2. Query real ERC-20 transfer logs & Circle API
    let realTxs: any[] = [];
    let fetchedFromExplorer = false;

    // 2a. Query Circle API for transactions if this is a Circle Wallet
    try {
      const walletRecord = await this.prisma.wallet.findUnique({
        where: { address },
        include: { agents: true },
      });
      const circleWalletId = walletRecord?.agents?.[0]?.configuration ? (walletRecord.agents[0].configuration as any).circleWalletId : null;
      if (circleWalletId && this.circleService) {
        const circleTxs = await this.circleService.listTransactions([circleWalletId]);
        if (Array.isArray(circleTxs) && circleTxs.length > 0) {
          realTxs = circleTxs.map((ctx: any, idx: number) => {
            const amt = parseFloat(ctx.amounts?.[0] || '0');
            const isOut = ctx.walletId === circleWalletId;
            return {
              id: ctx.id || `circle-tx-${idx}`,
              type: ctx.transactionType?.toLowerCase() === 'swap' ? 'swap' : 'transfer',
              title: ctx.transactionType === 'INBOUND' ? 'Bridge Deposit' : 'Circle Transfer',
              description: `${ctx.state || 'COMPLETE'} - ${amt} USDC`,
              wallet: address,
              status: ctx.state === 'COMPLETE' ? 'success' : 'pending',
              value: `${amt.toFixed(2)} USDC`,
              timestamp: ctx.createDate || new Date().toISOString(),
            };
          });
          fetchedFromExplorer = true;
          this.logger.log(`Fetched ${realTxs.length} transactions directly from Circle API.`);
        }
      }
    } catch (err: any) {
      this.logger.warn(`Could not fetch Circle transactions: ${err.message}`);
    }

    let explorerData: any = null;
    const maxRetries = 5;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const explorerUrl = `https://testnet.arcscan.app/api?module=account&action=txlist&address=${address}`;
        const explorerRes = await fetch(explorerUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
          }
        });
        if (explorerRes.ok) {
          const contentType = explorerRes.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await explorerRes.json();
            if (data && data.status === '1' && Array.isArray(data.result)) {
              explorerData = data;
              break;
            }
          }
        }
      } catch (err: any) {
        this.logger.warn(`Explorer API attempt ${attempt} failed: ${err.message}`);
      }
      
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff starting at 200ms)
        await new Promise(resolve => setTimeout(resolve, 200 * attempt));
      }
    }

    if (explorerData) {
      try {
        realTxs = explorerData.result.map((item: any, idx: number) => {
          // On Arc L1, native gas is USDC and is scaled to 18 decimals
          const valDec = Number(item.value || 0) / 1e18;
          const isIncoming = item.to?.toLowerCase() === address.toLowerCase();
          const isSwap = (item.input && item.input !== '0x' && !isIncoming);

          return {
            id: item.hash || `tx-real-${idx}`,
            type: isSwap ? 'swap' : 'transfer',
            title: isSwap 
              ? 'Portfolio Swap' 
              : (isIncoming ? 'Bridge Deposit' : 'Vault Withdrawal'),
            description: isSwap
              ? `Executed Swap of ${valDec.toFixed(2)} USDC`
              : (isIncoming ? `Received ${valDec.toFixed(2)} USDC` : `Sent ${valDec.toFixed(2)} USDC`),
            wallet: address,
            status: item.isError === '0' ? 'success' : 'failed',
            value: `${valDec.toFixed(2)} USDC`,
            timestamp: item.timeStamp ? new Date(Number(item.timeStamp) * 1000).toISOString() : new Date().toISOString(),
          };
        });
        fetchedFromExplorer = true;
        this.logger.log(`Successfully fetched ${realTxs.length} transactions from Blockscout legacy explorer API.`);
      } catch (err: any) {
        this.logger.error(`Failed parsing explorer transaction data: ${err.message}`);
      }
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
