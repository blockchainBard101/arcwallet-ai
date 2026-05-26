import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrivyService } from './privy.service';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly privyService: PrivyService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid Authorization header format. Expected "Bearer <token>"');
    }

    try {
      // 1. Verify claims on Privy Access Token
      const claims = await this.privyService.verifyToken(token);
      
      // 2. Sync / Upsert user profile in our database
      const user = await this.authService.syncUser(claims.user_id);

      // 3. Attach full user object to the request context
      request.user = user;
      
      return true;
    } catch (error) {
      throw new UnauthorizedException(`Unauthorized access: ${error.message}`);
    }
  }
}
