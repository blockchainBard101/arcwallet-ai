import { config } from 'dotenv';
config();

import { PrismaService } from '../prisma/prisma.service';
import { X402ClientService } from '../circle/x402-client.service';

const prisma = new PrismaService();

async function testAll40Services() {
  console.log('=== STARTING AUTOMATED TEST OF ALL 40 MARKETPLACE SERVICES ===\n');
  await prisma.$connect();

  const agent = await prisma.agent.findFirst({
    include: { wallet: true },
  });

  if (!agent) {
    console.error('No agent found in DB!');
    await prisma.$disconnect();
    process.exit(1);
  }

  const x402 = new X402ClientService();
  const services = await x402.searchServices('');

  console.log(`Agent Vault: ${agent.wallet?.address || agent.walletId}`);
  console.log(`Total Services to Test: ${services.length}\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < services.length; i++) {
    const s = services[i];
    console.log(`[${i + 1}/${services.length}] Testing "${s.name}" (${s.category?.toUpperCase()})...`);

    try {
      const result = await x402.callAndPay(
        s.url,
        agent.walletId,
        agent.wallet?.address || '0x36312eb359da7136110ed16450b99dac191cc32c',
        { query: 'test payload', handle: '@web3Bard101', domain: 'blockgent-agent.eth' }
      );

      if (result.success && result.data) {
        successCount++;
        console.log(`   ✅ SUCCESS | Cost: ${result.costUsdc} USDC | TxId: ${result.txId?.substring(0, 18)}...`);
        const sampleKey = Object.keys(result.data)[0];
        const sampleVal = result.data[sampleKey];
        console.log(`   └─ Returned Data: ${sampleKey} = "${typeof sampleVal === 'object' ? JSON.stringify(sampleVal) : sampleVal}"\n`);
      } else {
        failCount++;
        console.log(`   ❌ FAILED | Error: ${result.error}\n`);
      }
    } catch (err: any) {
      failCount++;
      console.log(`   ❌ ERROR | Exception: ${err.message}\n`);
    }
  }

  console.log('====================================================');
  console.log(`TEST SUMMARY: ${successCount} PASSED / ${failCount} FAILED out of ${services.length} total services.`);
  console.log('====================================================');

  await prisma.$disconnect();
}

testAll40Services().catch((err) => {
  console.error('Test script crashed:', err);
  prisma.$disconnect();
  process.exit(1);
});
