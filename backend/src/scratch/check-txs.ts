import { createPublicClient, http, formatUnits } from 'viem';

async function main() {
  const client = createPublicClient({
    transport: http('https://rpc.testnet.arc.network'),
  });

  const txHash = '0x3d703a36db6c99190f6ff9e0d58b6554523b0c5637e27d1bd200ae894f8090f9';
  const receipt = await client.getTransactionReceipt({ hash: txHash });

  console.log('Receipt logs for burn/bridge transaction:');
  for (const log of receipt.logs) {
    console.log(`Contract: ${log.address}`);
    console.log(`Topics: ${JSON.stringify(log.topics)}`);
    console.log(`Data: ${log.data}`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
