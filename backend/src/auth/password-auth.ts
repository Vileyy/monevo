import { ConfigService } from '@nestjs/config';

/**
 * Email/password authentication is legacy: the mobile app signs in through
 * Clerk (Google) only. Keeping registration enabled without email verification
 * lets an attacker pre-register a victim's email and retain password access
 * after the victim signs in with Google. Production therefore defaults to off;
 * development and tests keep it enabled for local tooling and fixtures.
 */
export function resolvePasswordAuthEnabled(
  configService: Pick<ConfigService, 'get'>,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): boolean {
  const configured = configService
    .get<string>('PASSWORD_AUTH_ENABLED')
    ?.trim()
    .toLowerCase();

  if (configured === 'true') return true;
  if (configured === 'false') return false;

  return nodeEnv !== 'production';
}
