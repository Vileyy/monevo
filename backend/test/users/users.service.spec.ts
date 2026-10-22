import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClerkClient } from '@clerk/backend';
jest.mock('@clerk/backend', () => ({
  createClerkClient: jest.fn(),
}));
jest.mock(
  '../../generated/prisma/client',
  () => ({
    PrismaClient: class {},
  }),
  { virtual: true },
);
import { UsersService } from '../../src/users/users.service';
import { PrismaService } from '../../src/prisma/prisma.service';

const mockedCreateClerkClient = createClerkClient as jest.Mock;

describe('UsersService', () => {
  let service: UsersService;
  let config: { get: jest.Mock };
  let prisma: {
    user: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    config = { get: jest.fn().mockReturnValue(undefined) };
    mockedCreateClerkClient.mockReset();
    prisma = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: ConfigService,
          useValue: config,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create user', async () => {
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test' };
      prisma.user.create.mockResolvedValue(mockUser);

      const result = await service.create({
        email: 'test@example.com',
        name: 'Test',
        passwordHash: 'hash',
      });
      expect(result).toEqual(mockUser);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          name: 'Test',
          password: 'hash',
        },
      });
    });
  });

  describe('getProfile', () => {
    it('should return user profile if found', async () => {
      const mockProfile = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'User One',
      };
      prisma.user.findUnique.mockResolvedValue(mockProfile);

      const result = await service.getProfile('user-1');
      expect(result).toEqual(mockProfile);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('unknown')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update and return user profile', async () => {
      const existingUser = { id: 'user-1', email: 'user@example.com' };
      const updatedUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'New Name',
      };

      prisma.user.findUnique.mockResolvedValue(existingUser);
      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('user-1', {
        name: 'New Name',
      });
      expect(result).toEqual(updatedUser);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { name: 'New Name' },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProfile('unknown', { name: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteAccount', () => {
    it('should delete the user row (cascade removes finance data)', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
      });
      prisma.user.delete.mockResolvedValue({ id: 'user-1' });

      const result = await service.deleteAccount('user-1');

      expect(result).toEqual({ deleted: true });
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });

    it('should delete the Clerk identity when one is linked', async () => {
      const deleteUser = jest.fn().mockResolvedValue({ id: 'clerk_1' });
      mockedCreateClerkClient.mockReturnValue({ users: { deleteUser } });
      config.get.mockReturnValue('sk_test_secret');
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        clerkId: 'clerk_1',
      });
      prisma.user.delete.mockResolvedValue({ id: 'user-1' });

      await service.deleteAccount('user-1');

      expect(mockedCreateClerkClient).toHaveBeenCalledWith({
        secretKey: 'sk_test_secret',
      });
      expect(deleteUser).toHaveBeenCalledWith('clerk_1');
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });

    it('should still delete local data when Clerk deletion fails', async () => {
      const deleteUser = jest.fn().mockRejectedValue(new Error('clerk down'));
      mockedCreateClerkClient.mockReturnValue({ users: { deleteUser } });
      config.get.mockReturnValue('sk_test_secret');
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        clerkId: 'clerk_1',
      });
      prisma.user.delete.mockResolvedValue({ id: 'user-1' });

      await expect(service.deleteAccount('user-1')).resolves.toEqual({
        deleted: true,
      });
      expect(prisma.user.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException when deleting an unknown user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.deleteAccount('unknown')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });
  });
});
