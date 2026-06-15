import { createPublicClient, http } from 'viem';

async function main() {
  const client = createPublicClient({
    transport: http('https://rpc.testnet.arc.network'),
  });

  const txHash = '0x66f4d19e1460bb487db0d9751bc9181af57dc4a787659e1be64db2d307e29bc0';
  const receipt = await client.getTransactionReceipt({ hash: txHash });

  console.log('Receipt logs for 0x66f4...:');
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
