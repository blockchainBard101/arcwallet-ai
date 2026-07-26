import { config } from 'dotenv';
config();

import { PrismaService } from '../prisma/prisma.service';

const prisma = new PrismaService();

async function upgradeSubscriptions() {
  await prisma.$connect();
  console.log('--- Inspecting user subscriptions ---');
  
  const subscriptions = await prisma.subscription.findMany();
  console.log('Current subscriptions in database:', subscriptions);

  if (subscriptions.length === 0) {
    console.log('No subscriptions found to upgrade.');
  } else {
    console.log('\n--- Upgrading all subscriptions to Enterprise tier ---');
    const updateResult = await prisma.subscription.updateMany({
      data: {
        tier: 'enterprise',
        nanopayUsed: 0,
      }
    });
    console.log(`Successfully upgraded ${updateResult.count} subscription(s) to Enterprise.`);
    
    const updated = await prisma.subscription.findMany();
    console.log('Updated subscriptions:', updated);
  }

  await prisma.$disconnect();
}

upgradeSubscriptions().catch((err) => {
  console.error('Failed to upgrade subscriptions:', err);
  prisma.$disconnect();
});
