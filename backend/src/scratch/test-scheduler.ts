import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SchedulerService } from '../scheduler/scheduler.service';

async function main() {
  console.log('Bootstrapping NestJS application context for testing...');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const schedulerService = app.get(SchedulerService);
  
  console.log('Invoking evaluateRules()...');
  await schedulerService.evaluateRules();
  
  await app.close();
  console.log('Done.');
}

main().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
