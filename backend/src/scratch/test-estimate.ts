import { AppKit } from '@circle-fin/app-kit';
import { createCircleWalletsAdapter } from '@circle-fin/adapter-circle-wallets';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
  const apiKey = process.env.CIRCLE_API_KEY!;
  const entitySecret = process.env.ENTITY_SECRET!;

  const kit = new AppKit();
  const adapter = createCircleWalletsAdapter({
    apiKey,
    entitySecret,
  });

  try {
    const estimation = await kit.estimateBridge({
      from: {
        adapter,
        chain: 'Arc_Testnet',
        address: '0xde611f95474138631b37ea5d9de822ab247c4ac2',
      },
      to: {
        recipientAddress: '0x0ee487cb7A70175AE94d05eA229f094939D5E620',
        chain: 'Base_Sepolia' as any,
        useForwarder: true,
      },
      amount: '1.00',
    });
    const replacer = (key: string, value: any) => typeof value === 'bigint' ? value.toString() : value;
    console.log('Estimation result:', JSON.stringify(estimation, replacer, 2));
  } catch (e) {
    console.error('Estimation error:', e);
  }
}

main().catch(console.error);
