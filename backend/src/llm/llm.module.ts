import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';
import { LlmController } from './llm.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CircleModule } from '../circle/circle.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, CircleModule, AuthModule],
  controllers: [LlmController],
  providers: [LlmService],
  exports: [LlmService],
})
export class LlmModule {}
