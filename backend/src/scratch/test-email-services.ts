import { config } from 'dotenv';
config();

import { PrismaService } from '../prisma/prisma.service';
import { X402ClientService } from '../circle/x402-client.service';

const prisma = new PrismaService();

async function testEmailServices() {
  console.log('=== STARTING AUTOMATED TEST OF EMAIL SERVICES ===\n');
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
  
  const emailServices = [
    { name: "Resend Email Dispatch", url: "https://resend.com/x402" },
    { name: "SendGrid Email Relay", url: "https://sendgrid.com/x402" }
  ];

  console.log(`Agent Vault: ${agent.wallet?.address || agent.walletId}`);
  console.log(`Email Services to Test: ${emailServices.length}\n`);

  for (let i = 0; i < emailServices.length; i++) {
    const s = emailServices[i];
    console.log(`[${i + 1}/${emailServices.length}] Testing "${s.name}"...`);

    try {
      const result = await x402.callAndPay(
        s.url,
        agent.walletId,
        agent.wallet?.address || '0x36312eb359da7136110ed16450b99dac191cc32c',
        { to: 'user@blockgent.ai', subject: 'Agent Telemetry Report', html: '<p>Report details here...</p>' }
      );

      if (result.success && result.data) {
        console.log(`   ✅ SUCCESS | Cost: ${result.costUsdc} USDC | TxId: ${result.txId}`);
        console.log(`   └─ Returned Data:`, JSON.stringify(result.data, null, 2), '\n');
      } else {
        console.log(`   ❌ FAILED | Error: ${result.error}\n`);
      }
    } catch (err: any) {
      console.log(`   ❌ ERROR | Exception: ${err.message}\n`);
    }
  }

  await prisma.$disconnect();
}

testEmailServices().catch((err) => {
  console.error('Test script crashed:', err);
  prisma.$disconnect();
  process.exit(1);
});
