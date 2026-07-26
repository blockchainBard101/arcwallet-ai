import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CircleService } from '../circle/circle.service';
import { PrismaService } from '../prisma/prisma.service';

@Processor('rule-execution')
export class RuleExecutionProcessor extends WorkerHost {
  private readonly logger = new Logger(RuleExecutionProcessor.name);

  constructor(
    private readonly circleService: CircleService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing async rule execution job ${job.id} for rule ${job.data.ruleId}`);
    const { ruleId, action, walletId, walletAddress } = job.data;

    try {
      if (action.type === 'swap') {
        this.logger.log(`[BullMQ Worker] Executing swap for agent wallet ${walletAddress}`);
        const res = await this.circleService.sendUsdcFromAgentWallet(
          walletId,
          action.to || walletAddress,
          action.amount || 1,
        );
        this.logger.log(`[BullMQ Worker] Rule ${ruleId} swap job complete: ${JSON.stringify(res)}`);
        return res;
      }
    } catch (err: any) {
      this.logger.error(`[BullMQ Worker] Rule ${ruleId} job failed: ${err.message}`);
      throw err;
    }
  }
}
