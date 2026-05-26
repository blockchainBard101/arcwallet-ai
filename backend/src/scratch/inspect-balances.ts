import { CircleService } from '../circle/circle.service';
import * as dotenv from 'dotenv';

dotenv.config();

async function run() {
  const walletId = '2510ae21-549a-5b42-a10e-2fd4cf45394d';
  console.log(`Querying Circle balances for wallet ID: ${walletId}...`);
  const circleService = new CircleService();
  try {
    const balances = await circleService.getWalletTokenBalance(walletId);
    console.log('Circle Balances:', JSON.stringify(balances, null, 2));
  } catch (err: any) {
    console.error('Error fetching balances:', err.message);
  }
}

run();
