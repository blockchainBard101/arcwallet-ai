import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CircleModule } from './circle/circle.module';
import { AgentModule } from './agent/agent.module';
import { LlmModule } from './llm/llm.module';
import { RiskModule } from './risk/risk.module';
import { TransactionModule } from './transaction/transaction.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { RulesController } from './rules/rules.controller';
import { RedisModule } from './redis/redis.module';

import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CircleModule,
    AgentModule,
    LlmModule,
    RiskModule,
    TransactionModule,
    ScheduleModule.forRoot(),
    SchedulerModule,
    SubscriptionModule,
    RedisModule,
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      },
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
  ],
  controllers: [AppController, RulesController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
