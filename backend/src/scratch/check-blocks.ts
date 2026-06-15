import { createPublicClient, http } from 'viem';

async function main() {
  const client = createPublicClient({
    transport: http('https://rpc.testnet.arc.network'),
  });

  const tx1 = '0x66f4d19e1460bb487db0d9751bc9181af57dc4a787659e1be64db2d307e29bc0';
  const tx2 = '0x3d703a36db6c99190f6ff9e0d58b6554523b0c5637e27d1bd200ae894f8090f9';

  const r1 = await client.getTransactionReceipt({ hash: tx1 });
  const r2 = await client.getTransactionReceipt({ hash: tx2 });

  console.log(`Tx 1: Block ${r1.blockNumber}`);
  console.log(`Tx 2: Block ${r2.blockNumber}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
