import { config } from 'dotenv';
config();

import { PrismaService } from '../prisma/prisma.service';
import { X402ClientService } from '../circle/x402-client.service';

const prisma = new PrismaService();

async function testRealPayment() {
  console.log('--- Testing Real On-Chain USDC Nanopayment on Arc Testnet ---\n');
  await prisma.$connect();

  // 1. Fetch first agent from DB
  const agent = await prisma.agent.findFirst({
    include: { wallet: true },
  });

  if (!agent) {
    console.error('No agent found in database!');
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log(`Using Agent: ${agent.name} (ID: ${agent.id})`);
  console.log(`Agent Vault Address: ${agent.wallet?.address || agent.walletId}`);

  // 2. Instantiate x402 Client Service
  const x402 = new X402ClientService();

  // 3. Test Service: CoinGecko Market Data
  const serviceUrl = 'https://coingecko.com/x402';
  console.log(`Calling x402 Service: ${serviceUrl}...`);

  const result = await x402.callAndPay(
    serviceUrl,
    agent.walletId,
    agent.wallet?.address || '0x0000000000000000000000000000000000000000',
    { query: 'BTC' }
  );

  console.log('\n--- Real Payment Execution Result ---');
  console.log('Success:', result.success);
  console.log('Cost USDC:', result.costUsdc);
  console.log('Arc Testnet Tx ID / Hash:', result.txId);
  console.log('Returned Service Response:', JSON.stringify(result.data, null, 2));

  // 4. Record Nanopayment log in DB
  if (result.success) {
    const log = await prisma.nanopaymentLog.create({
      data: {
        agentId: agent.id,
        serviceUrl,
        serviceName: 'CoinGecko Market Data',
        chain: 'ARC-TESTNET',
        amountUsdc: result.costUsdc,
        status: 'success',
        responseSnippet: JSON.stringify(result.data).substring(0, 500),
      },
    });
    console.log('\nNanopayment DB Log Entry Created:', log.id);
  }

  await prisma.$disconnect();
}

testRealPayment().catch((err) => {
  console.error('Test execution failed:', err);
  prisma.$disconnect();
  process.exit(1);
});
