import { AppService } from '../app.service';
import { PrismaService } from '../prisma/prisma.service';
import * as dotenv from 'dotenv';

dotenv.config();

async function run() {
  const address = '0x0Da9DB8b9164C0EdaFFB1007813619f702486036';
  console.log(`Querying stats for address: ${address}...`);
  const prisma = new PrismaService();
  const appService = new AppService(prisma, undefined);
  try {
    const stats = await appService.getWalletStats(address);
    console.log('Stats:', JSON.stringify(stats, null, 2));
  } catch (err: any) {
    console.error('Error fetching stats:', err.stack || err.message || err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
