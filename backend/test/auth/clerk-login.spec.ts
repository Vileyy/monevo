import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createClerkClient, verifyToken } from '@clerk/backend';
jest.mock(
  '../../generated/prisma/client',
  () => ({
    PrismaClient: class {},
  }),
  { virtual: true },
);
jest.mock('@clerk/backend', () => ({
  verifyToken: jest.fn(),
  createClerkClient: jest.fn(),
}));
import { AuthService } from '../../src/auth/auth.service';
import { UsersService } from '../../src/users/users.service';

const mockedVerifyToken = verifyToken as jest.Mock;
const mockedCreateClerkClient = createClerkClient as jest.Mock;

describe('AuthService.clerkLogin', () => {
  let service: AuthService;
  let findOrCreateByClerk: jest.Mock;

  beforeEach(async () => {
    mockedVerifyToken.mockReset();
    mockedCreateClerkClient.mockReset();
    findOrCreateByClerk = jest
      .fn()
      .mockImplementation((clerkId: string, email?: string) =>
        Promise.resolve({ id: 'user-1', email: email ?? '', name: 'Hieu' }),
      );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: { findOrCreateByClerk },
        },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn().mockResolvedValue('app_token') },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              key === 'CLERK_SECRET_KEY' ? 'sk_test_secret' : undefined,
            ),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('reads the primary email from Clerk when the token carries none', async () => {
    mockedVerifyToken.mockResolvedValue({ sub: 'user_abc' });
    mockedCreateClerkClient.mockReturnValue({
      users: {
        getUser: jest.fn().mockResolvedValue({
          primaryEmailAddressId: 'idn_2',
          emailAddresses: [
            { id: 'idn_1', emailAddress: 'old@example.com' },
            { id: 'idn_2', emailAddress: 'Hieu.Nguyen@Example.com' },
          ],
        }),
      },
    });

    const result = await service.clerkLogin('clerk_token');

    expect(mockedCreateClerkClient).toHaveBeenCalledWith({
      secretKey: 'sk_test_secret',
    });
    expect(findOrCreateByClerk).toHaveBeenCalledWith(
      'user_abc',
      'hieu.nguyen@example.com',
    );
    expect(result.user.email).toBe('hieu.nguyen@example.com');
    expect(result.accessToken).toBe('app_token');
  });

  it('uses the token email and skips the Clerk lookup when present', async () => {
    mockedVerifyToken.mockResolvedValue({
      sub: 'user_abc',
      email: 'Token@Example.com',
    });

    await service.clerkLogin('clerk_token');

    expect(mockedCreateClerkClient).not.toHaveBeenCalled();
    expect(findOrCreateByClerk).toHaveBeenCalledWith(
      'user_abc',
      'token@example.com',
    );
  });

  it('still signs in when the Clerk profile cannot be read', async () => {
    mockedVerifyToken.mockResolvedValue({ sub: 'user_abc' });
    mockedCreateClerkClient.mockReturnValue({
      users: {
        getUser: jest.fn().mockRejectedValue(new Error('clerk down')),
      },
    });

    const result = await service.clerkLogin('clerk_token');

    expect(result.accessToken).toBe('app_token');
    expect(findOrCreateByClerk).toHaveBeenCalledWith('user_abc', undefined);
  });

  it('rejects an invalid Clerk token', async () => {
    mockedVerifyToken.mockRejectedValue(new Error('bad token'));

    await expect(service.clerkLogin('bad_token')).rejects.toThrow(
      'Invalid Clerk token',
    );
    expect(findOrCreateByClerk).not.toHaveBeenCalled();
  });
});
