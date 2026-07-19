import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createHash } from 'crypto';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API key is missing. Please provide the X-API-Key header.');
    }

    const keyHash = createHash('sha256').update(apiKey).digest('hex');

    const keyRecord = await this.prisma.apiKey.findUnique({
      where: { keyHash },
    });

    if (!keyRecord) {
      throw new UnauthorizedException('Invalid API key.');
    }

    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('API key has expired.');
    }

    // Update usage asynchronously
    this.prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: {
        callCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    }).catch(err => {
      console.error('Failed to update API key usage:', err);
    });

    // Attach user information to request
    request.user = { id: keyRecord.userId, isEnterprise: true, tier: keyRecord.tier };

    return true;
  }
}
