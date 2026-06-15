import { createPublicClient, http, formatUnits } from 'viem';

async function main() {
  const client = createPublicClient({
    transport: http('https://rpc.testnet.arc.network'),
  });

  const address = '0xde611f95474138631b37ea5d9de822ab247c4ac2';
  const usdcAddress = '0x3600000000000000000000000000000000000000';

  const blockNumber = await client.getBlockNumber();
  console.log('Current block number:', blockNumber);

  // Outgoing transfers (last 9900 blocks)
  const outgoingLogs = await client.getLogs({
    address: usdcAddress,
    event: {
      type: 'event',
      name: 'Transfer',
      inputs: [
        { type: 'address', name: 'from', indexed: true },
        { type: 'address', name: 'to', indexed: true },
        { type: 'uint256', name: 'value' },
      ],
    },
    args: {
      from: address as `0x${string}`,
    },
    fromBlock: blockNumber - 9900n,
  });

  // Incoming transfers
  const incomingLogs = await client.getLogs({
    address: usdcAddress,
    event: {
      type: 'event',
      name: 'Transfer',
      inputs: [
        { type: 'address', name: 'from', indexed: true },
        { type: 'address', name: 'to', indexed: true },
        { type: 'uint256', name: 'value' },
      ],
    },
    args: {
      to: address as `0x${string}`,
    },
    fromBlock: blockNumber - 9900n,
  });

  console.log('--- Outgoing ---');
  for (const log of outgoingLogs) {
    console.log(`Tx: ${log.transactionHash}`);
    console.log(`To: ${log.args.to}`);
    console.log(`Value: ${formatUnits(log.args.value || 0n, 6)} USDC`);
  }

  console.log('--- Incoming ---');
  for (const log of incomingLogs) {
    console.log(`Tx: ${log.transactionHash}`);
    console.log(`From: ${log.args.from}`);
    console.log(`Value: ${formatUnits(log.args.value || 0n, 6)} USDC`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
