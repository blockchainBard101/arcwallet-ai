import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthGuard } from './auth/auth.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('stats/:address')
  async getStats(
    @Param('address') address: string,
    @Query('timeframe') timeframe?: string,
    @Query('timezone') timezone?: string,
  ) {
    return this.appService.getWalletStats(address, timeframe, timezone);
  }

  @Get('marketplace/services')
  async getMarketplaceServices(@Query('q') query?: string) {
    return this.appService.getMarketplaceServices(query || '');
  }

  @Get('agent/:id/transactions')
  async getAgentTransactions(@Param('id') id: string) {
    return this.appService.getAgentTransactions(id);
  }


  @Get('auth-test')
  @UseGuards(AuthGuard)
  testAuth(@Req() req: any) {
    return {
      status: 'success',
      message: 'Authentication successful! Privy token validated and user database sync complete.',
      user: req.user,
    };
  }
}

