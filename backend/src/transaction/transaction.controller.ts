import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('transactions')
@UseGuards(AuthGuard)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('prepare')
  async prepare(
    @Req() req: any,
    @Body('agentId') agentId: string,
    @Body('toAddress') toAddress: string,
    @Body('amountUsdc') amountUsdc: number,
    @Body('data') data?: string,
  ) {
    const userId = req.user.id;
    return this.transactionService.prepareTransaction(
      userId,
      agentId,
      toAddress,
      amountUsdc,
      data,
    );
  }

  @Post('execute')
  async execute(@Body('signedTx') signedTx: string) {
    return this.transactionService.executeTransaction(signedTx);
  }
}
