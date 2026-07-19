import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('subscription')
@UseGuards(AuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  async getSubscription(@Request() req: any) {
    const userId = req.user.id;
    return this.subscriptionService.getSubscription(userId);
  }

  @Post('upgrade')
  async upgradeSubscription(
    @Request() req: any,
    @Body() body: { tier: string },
  ) {
    const userId = req.user.id;
    // In a real scenario, this endpoint would verify the payment transaction
    // before actually updating the tier. For the MVP, we just update it.
    await this.subscriptionService.updateTier(userId, body.tier);
    return { success: true };
  }
}
