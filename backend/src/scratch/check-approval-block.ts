import { createPublicClient, http } from 'viem';

async function main() {
  const client = createPublicClient({
    transport: http('https://rpc.testnet.arc.network'),
  });

  const txHash = '0x9e847e37357250b450f5419ed21c6999868ef578b45c7b6c79eb5d9ae7fd2b14';
  const receipt = await client.getTransactionReceipt({ hash: txHash });

  console.log(`Approval tx block number: ${receipt.blockNumber}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
