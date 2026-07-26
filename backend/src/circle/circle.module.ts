import { Module } from '@nestjs/common';
import { CircleService } from './circle.service';
import { X402ClientService } from './x402-client.service';

@Module({
  providers: [CircleService, X402ClientService],
  exports: [CircleService, X402ClientService],
})
export class CircleModule {}

