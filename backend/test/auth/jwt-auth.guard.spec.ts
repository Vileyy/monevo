import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { UsersService } from '../../src/users/users.service';
import * as clerkBackend from '@clerk/backend';

jest.mock('@clerk/backend', () => ({
  verifyToken: jest.fn(),
}));

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

  it('should authenticate with valid Clerk token', async () => {
    (clerkBackend.verifyToken as jest.Mock).mockResolvedValue({
      sub: 'clerk_user_123',
      email: 'clerk@user.com',
    });

    const context = createMockContext('Bearer clerk_jwt_token');
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(clerkBackend.verifyToken).toHaveBeenCalledWith('clerk_jwt_token', {
      secretKey: 'test_clerk_secret',
    });
    expect(mockUsersService.findOrCreateByClerk).toHaveBeenCalledWith(
      'clerk_user_123',
      'clerk@user.com',
    );
  });

  it('should fall back to passport AuthGuard when Clerk token verification fails', async () => {
    (clerkBackend.verifyToken as jest.Mock).mockRejectedValue(
      new Error('Invalid token'),
    );

    const superCanActivateSpy = jest
      .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate')
      .mockResolvedValue(true);

    const context = createMockContext('Bearer invalid_token');
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(superCanActivateSpy).toHaveBeenCalled();
  });
});
