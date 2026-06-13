import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CircleModule } from './circle/circle.module';
import { AgentModule } from './agent/agent.module';
import { LlmModule } from './llm/llm.module';
import { RiskModule } from './risk/risk.module';
import { TransactionModule } from './transaction/transaction.module';

@Module({
  imports: [PrismaModule, AuthModule, CircleModule, AgentModule, LlmModule, RiskModule, TransactionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
