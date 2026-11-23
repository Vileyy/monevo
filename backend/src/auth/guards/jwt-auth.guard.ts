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

/**
 * Clerk session tokens are RS256 and always carry a `kid` in their header.
 * Monevo's own JWTs are HS256 with no `kid`.
 *
 * This check matters for latency: without it every email/password request made
 * a network call to Clerk to fetch JWKS, failed, and only then fell back to the
 * local strategy — ~60ms added to every authenticated request.
 */
export function hasClerkKeyId(token: string): boolean {
  const [encodedHeader] = token.split('.');
  if (!encodedHeader) return false;

  try {
    const header = JSON.parse(
      Buffer.from(encodedHeader, 'base64url').toString('utf8'),
    ) as { kid?: unknown };
    return typeof header.kid === 'string' && header.kid.length > 0;
  } catch {
    return false;
  }
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

      if (secretKey && hasClerkKeyId(token)) {
        try {
          const verifyClerkToken = verifyToken as (
            token: string,
            options: { secretKey: string },
          ) => Promise<ClerkTokenPayload>;

          const verified: ClerkTokenPayload = await verifyClerkToken(token, {
            secretKey,
          });

          if (verified && verified.sub) {
            if (this.usersService) {
              const email = verified.email || verified.email_address;
              const user = await this.usersService.findOrCreateByClerk(
                verified.sub,
                email,
              );
              request.user = user;
              return true;
            } else {
              console.warn(
                '[JwtAuthGuard] UsersService is undefined in context',
              );
            }
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn('[JwtAuthGuard] Clerk verify error:', msg);
          // If not a valid Clerk token, fall back to passport JWT
        }
      }
    }

    const result = await super.canActivate(context);
    return result as boolean;
  }
}
