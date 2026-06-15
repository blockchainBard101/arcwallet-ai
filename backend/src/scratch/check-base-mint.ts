import { createPublicClient, http, formatUnits } from 'viem';

async function main() {
  const client = createPublicClient({
    transport: http('https://sepolia.base.org'),
  });

  const recipient = '0x0ee487cb7A70175AE94d05eA229f094939D5E620';
  const usdcBaseSepolia = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

  const blockNumber = await client.getBlockNumber();
  console.log('Current Base Sepolia block:', blockNumber);

  // Incoming transfers to recipient on Base Sepolia
  const logs = await client.getLogs({
    address: usdcBaseSepolia,
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
      to: recipient as `0x${string}`,
    },
    fromBlock: blockNumber - 2000n,
  });

  console.log('Mints/transfers to recipient on Base Sepolia:');
  for (const log of logs) {
    console.log(`- Tx: ${log.transactionHash}`);
    console.log(`  From: ${log.args.from}`);
    console.log(`  Value: ${formatUnits(log.args.value || 0n, 6)} USDC`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
