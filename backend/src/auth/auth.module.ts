import { Module } from '@nestjs/common';
import { PrivyService } from './privy.service';
import { AuthService } from './auth.service';
import { ApiKeyGuard } from './api-key.guard';
import { AuthGuard } from './auth.guard';

@Module({
  providers: [PrivyService, AuthService, ApiKeyGuard, AuthGuard],
  exports: [PrivyService, AuthService, ApiKeyGuard, AuthGuard],
})
export class AuthModule {}
