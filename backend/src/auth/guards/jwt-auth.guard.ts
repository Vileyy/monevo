import { ExecutionContext, Injectable, Optional } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';
import { UsersService } from '../../users/users.service';

interface ClerkTokenPayload {
  sub?: string;
  email?: string;
  email_address?: string;
  [key: string]: unknown;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    @Optional() private readonly configService?: ConfigService,
    @Optional() private readonly usersService?: UsersService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: unknown;
    }>();

    const authHeader = request.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const secretKey =
        this.configService?.get<string>('CLERK_SECRET_KEY') ||
        process.env.CLERK_SECRET_KEY;

      if (secretKey) {
        try {
          const verifyClerkToken = verifyToken as (
            token: string,
            options: { secretKey: string },
          ) => Promise<ClerkTokenPayload>;

          const verified: ClerkTokenPayload = await verifyClerkToken(token, {
            secretKey,
          });

          if (verified && verified.sub && this.usersService) {
            const email = verified.email || verified.email_address;

            const user = await this.usersService.findOrCreateByClerk(
              verified.sub,
              email,
            );
            request.user = user;
            return true;
          }
        } catch {
          // If not a valid Clerk token, fall back to passport JWT
        }
      }
    }

    const result = await super.canActivate(context);
    return result as boolean;
  }
}
