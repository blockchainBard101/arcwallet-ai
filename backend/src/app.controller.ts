import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthGuard } from './auth/auth.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
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
