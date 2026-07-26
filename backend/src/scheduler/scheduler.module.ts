import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SchedulerService } from './scheduler.service';
import { RuleExecutionProcessor } from './rule-execution.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { CircleModule } from '../circle/circle.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [
    PrismaModule,
    CircleModule,
    SubscriptionModule,
    BullModule.registerQueue({
      name: 'rule-execution',
    }),
  ],
  providers: [SchedulerService, RuleExecutionProcessor],
  exports: [SchedulerService, BullModule],
})
export class SchedulerModule {}
