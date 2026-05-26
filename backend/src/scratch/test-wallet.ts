import { CircleService } from '../circle/circle.service';
import * as dotenv from 'dotenv';

// Load env variables
dotenv.config();

async function run() {
  console.log('🏁 Starting Circle Wallets Integration Test...');

  const apiKey = process.env.CIRCLE_API_KEY;
  const entitySecret = process.env.ENTITY_SECRET;

  if (!apiKey || apiKey.includes('your-circle-api-key')) {
    console.error('❌ Error: CIRCLE_API_KEY is not configured.');
    process.exit(1);
  }

  if (!entitySecret || entitySecret.includes('0123456789abcdef')) {
    console.error('❌ Error: ENTITY_SECRET is not configured or is using the default placeholder.');
    console.log('💡 Please run the registration script first:');
    console.log('   npx ts-node src/scratch/register-secret.ts');
    process.exit(1);
  }

  const circleService = new CircleService();

  try {
    // 1. Create a Wallet Set
    const walletSetName = `Test-WalletSet-${Date.now()}`;
    console.log(`🔄 1. Creating Wallet Set "${walletSetName}"...`);
    const walletSetId = await circleService.createWalletSet(walletSetName);
    console.log(`✅ Wallet Set Created! ID: ${walletSetId}`);

    // 2. Create SCA Wallet on Arc Testnet
    console.log('🔄 2. Provisioning Smart Contract Account (SCA) Wallet on ARC-TESTNET...');
    const { address, id: walletId } = await circleService.createAgentWallet(walletSetId);
    console.log(`✅ SCA Wallet Provisioned Successfully!`);
    console.log(`   Address: ${address}`);
    console.log(`   Circle Wallet ID: ${walletId}`);

    // 3. Query Token Balances
    console.log('🔄 3. Fetching live token balances from Circle...');
    const balances = await circleService.getWalletTokenBalance(walletId);
    console.log(`✅ Live Balances Fetched:`, JSON.stringify(balances, null, 2));

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
  } catch (error: any) {
    console.error('❌ Test failed with error:');
    console.error(error.message || error);
    if (error.response?.data) {
      console.error(JSON.stringify(error.response.data, null, 2));
    }
  }
}

run();
