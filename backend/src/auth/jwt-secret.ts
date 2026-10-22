import { ConfigService } from '@nestjs/config';

export const DEVELOPMENT_JWT_FALLBACK = 'fallback_secret';

/**
 * Resolve the JWT signing secret.
 *
 * Production must never run with a predictable fallback: a missing secret
 * would let anyone forge tokens for any user. Development and tests keep the
 * fallback so local setup stays zero-config.
 */
export function resolveJwtSecret(
  configService: Pick<ConfigService, 'get'>,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): string {
  const secret = configService.get<string>('JWT_SECRET');
  if (typeof secret === 'string' && secret.trim().length > 0) {
    return secret;
  }

  if (nodeEnv === 'production') {
    throw new Error(
      'JWT_SECRET is required in production. Refusing to start with the development fallback.',
    );
  }

  return DEVELOPMENT_JWT_FALLBACK;
}
