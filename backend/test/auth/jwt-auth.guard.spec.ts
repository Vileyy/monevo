import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  JwtAuthGuard,
  hasClerkKeyId,
} from '../../src/auth/guards/jwt-auth.guard';
import { UsersService } from '../../src/users/users.service';
import * as clerkBackend from '@clerk/backend';

jest.mock('@clerk/backend', () => ({
  verifyToken: jest.fn(),
}));

/** Builds a JWT-shaped string with the given header, e.g. a Clerk `kid`. */
function makeToken(header: Record<string, unknown>): string {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode(header)}.${encode({ sub: 'user-1' })}.signature`;
}

const CLERK_TOKEN = makeToken({
  alg: 'RS256',
  kid: 'ins_abc123',
  typ: 'JWT',
});
const LOCAL_TOKEN = makeToken({ alg: 'HS256', typ: 'JWT' });

describe('hasClerkKeyId', () => {
  it('detects Clerk tokens by their kid header', () => {
    expect(hasClerkKeyId(CLERK_TOKEN)).toBe(true);
  });

  it('rejects local HS256 tokens without a kid', () => {
    expect(hasClerkKeyId(LOCAL_TOKEN)).toBe(false);
  });

  it('rejects opaque and malformed tokens', () => {
    expect(hasClerkKeyId('not-a-jwt')).toBe(false);
    expect(hasClerkKeyId('')).toBe(false);
    expect(hasClerkKeyId('!!!.payload.signature')).toBe(false);
  });
});

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let mockConfigService: Partial<ConfigService>;
  let mockUsersService: Partial<UsersService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'CLERK_SECRET_KEY') return 'test_clerk_secret';
        return undefined;
      }),
    };
    mockUsersService = {
      findOrCreateByClerk: jest.fn().mockResolvedValue({
        id: 'user-123',
        email: 'clerk@user.com',
      }),
    };
    guard = new JwtAuthGuard(
      mockConfigService as ConfigService,
      mockUsersService as UsersService,
    );
  });

  const createMockContext = (authHeader?: string) => {
    const request = {
      headers: {
        authorization: authHeader,
      },
      user: undefined,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({}),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  const spyOnPassport = () =>
    jest
      .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate')
      .mockResolvedValue(true);

  it('authenticates a Clerk token', async () => {
    (clerkBackend.verifyToken as jest.Mock).mockResolvedValue({
      sub: 'clerk_user_123',
      email: 'clerk@user.com',
    });

    const result = await guard.canActivate(
      createMockContext(`Bearer ${CLERK_TOKEN}`),
    );

    expect(result).toBe(true);
    expect(clerkBackend.verifyToken).toHaveBeenCalledWith(CLERK_TOKEN, {
      secretKey: 'test_clerk_secret',
    });
    expect(mockUsersService.findOrCreateByClerk).toHaveBeenCalledWith(
      'clerk_user_123',
      'clerk@user.com',
    );
  });

  it('never calls Clerk for a local token', async () => {
    const superCanActivateSpy = spyOnPassport();

    const result = await guard.canActivate(
      createMockContext(`Bearer ${LOCAL_TOKEN}`),
    );

    expect(result).toBe(true);
    expect(clerkBackend.verifyToken).not.toHaveBeenCalled();
    expect(superCanActivateSpy).toHaveBeenCalled();
  });

  it('falls back to passport when Clerk verification fails', async () => {
    (clerkBackend.verifyToken as jest.Mock).mockRejectedValue(
      new Error('Invalid token'),
    );
    const superCanActivateSpy = spyOnPassport();

    const result = await guard.canActivate(
      createMockContext(`Bearer ${CLERK_TOKEN}`),
    );

    expect(result).toBe(true);
    expect(superCanActivateSpy).toHaveBeenCalled();
  });
});
