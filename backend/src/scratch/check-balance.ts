import { createPublicClient, http, formatUnits } from 'viem';

async function main() {
  const client = createPublicClient({
    transport: http('https://rpc.testnet.arc.network'),
  });

  const address = '0xde611f95474138631b37ea5d9de822ab247c4ac2';
  const nativeBalance = await client.getBalance({ address });
  console.log('Native balance (USDC 18 decimals):', formatUnits(nativeBalance, 18));

  // ERC20 USDC balance
  const usdcAbi = [{
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  }] as const;

  const erc20Balance = await client.readContract({
    address: '0x3600000000000000000000000000000000000000',
    abi: usdcAbi,
    functionName: 'balanceOf',
    args: [address],
  });

  console.log('ERC20 USDC balance (6 decimals):', formatUnits(erc20Balance, 6));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
