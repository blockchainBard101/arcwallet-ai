import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CircleModule } from '../circle/circle.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [PrismaModule, CircleModule, SubscriptionModule],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
