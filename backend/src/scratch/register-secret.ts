import {
  registerEntitySecretCiphertext,
} from '@circle-fin/developer-controlled-wallets';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

// Load environmental variables
dotenv.config();

async function run() {
  const apiKey = process.env.CIRCLE_API_KEY;
  if (!apiKey || apiKey.includes('your-circle-api-key')) {
    console.error('❌ Error: CIRCLE_API_KEY is not configured in backend/.env');
    process.exit(1);
  }

  console.log('🔄 Generating a fresh 32-byte hex Entity Secret...');
  const entitySecret = crypto.randomBytes(32).toString('hex');
  console.log(`✅ Entity Secret Generated: ${entitySecret}`);

  const recoveryPath = path.join(__dirname, '../../');
  console.log(`🔄 Registering Entity Secret with Circle and generating recovery file in:\n   ${recoveryPath}...`);

  try {
    const response = await registerEntitySecretCiphertext({
      apiKey,
      entitySecret,
      recoveryFileDownloadPath: recoveryPath,
    });

    console.log('\n🎉 Successfully Registered Entity Secret!');
    console.log('----------------------------------------------------');
    console.log('1. Copy the generated Entity Secret below:');
    console.log(`   ENTITY_SECRET="${entitySecret}"`);
    console.log('2. Replace the placeholder ENTITY_SECRET value in your backend/.env with it.');
    console.log('3. Keep your "circle-recovery-file.json" secure and DO NOT commit it to Git.');
    console.log('----------------------------------------------------');
  } catch (error: any) {
    console.error('❌ Failed to register Entity Secret with Circle API:');
    console.error(error.message || error);
    if (error.response?.data) {
      console.error(JSON.stringify(error.response.data, null, 2));
    }
  }
}

run();
