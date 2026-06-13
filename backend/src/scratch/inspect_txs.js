const rpcUrl = 'https://rpc.testnet.arc.network';
const address = '0x70E3Fb28e1794bb91D5bCEB7d66b731d0C61Af8e';
const cleanAddr = address.toLowerCase().replace('0x', '');
const paddedAddr = `0x000000000000000000000000${cleanAddr}`;

async function main() {
  const blockNumRes = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_blockNumber',
      id: 1,
    }),
  });
  const blockNumData = await blockNumRes.json();
  const currentBlock = Number(BigInt(blockNumData.result));
  console.log('Current block:', currentBlock);

  // Scan last 150,000 blocks in chunks of 10,000
  const chunkSize = 10000;
  const totalBlocksToScan = 150000;
  let allLogs = [];

  for (let i = 0; i < totalBlocksToScan; i += chunkSize) {
    const toBlockNum = currentBlock - i;
    const fromBlockNum = Math.max(0, toBlockNum - chunkSize + 1);
    const fromBlock = '0x' + fromBlockNum.toString(16);
    const toBlock = '0x' + toBlockNum.toString(16);

    console.log(`Scanning from block ${fromBlockNum} to ${toBlockNum}...`);

    // Fetch incoming
    const resIn = await fetch(rpcUrl, {
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
        id: 2,
      }),
    });
    const dataIn = await resIn.json();
    if (dataIn.result && dataIn.result.length > 0) {
      allLogs.push(...dataIn.result);
    }

    // Fetch outgoing
    const resOut = await fetch(rpcUrl, {
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
        id: 3,
      }),
    });
    const dataOut = await resOut.json();
    if (dataOut.result && dataOut.result.length > 0) {
      allLogs.push(...dataOut.result);
    }
  }

  console.log(`Total transfer logs found: ${allLogs.length}`);
  for (const log of allLogs) {
    console.log(`Block: ${Number(log.blockNumber)}, Tx: ${log.transactionHash}`);
  }
}

main();
