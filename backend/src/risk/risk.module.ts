import { Module } from '@nestjs/common';
import { RiskGuardianService } from './risk.service';

@Module({
  providers: [RiskGuardianService],
  exports: [RiskGuardianService],
})
export class RiskModule {}
