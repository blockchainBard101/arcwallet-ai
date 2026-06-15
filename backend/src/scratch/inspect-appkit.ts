import { AppKit } from '@circle-fin/app-kit';

async function main() {
  const kit = new AppKit();
  console.log('AppKit keys:', Object.getOwnPropertyNames(AppKit.prototype));
  console.log('kit instance keys:', Object.keys(kit));
}

main().catch(console.error);
