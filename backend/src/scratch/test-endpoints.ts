import { X402ClientService } from '../circle/x402-client.service';

async function testAllEndpoints() {
  const service = new X402ClientService();
  const services = await service.searchServices('');

  console.log(`Testing ${services.length} marketplace services...\n`);

  for (const s of services) {
    try {
      const res = await service.inspectService(s.url);
      console.log(`[${s.name}] (${s.url}): status=${res.details?.status}, cost=${res.cost} USDC`);
    } catch (err: any) {
      console.log(`[${s.name}] (${s.url}): FAILED (${err.message})`);
    }
  }
}

testAllEndpoints();
