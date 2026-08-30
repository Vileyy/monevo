/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
jest.mock(
  '../../generated/prisma/client',
  () => ({
    PrismaClient: class {},
  }),
  { virtual: true },
);
import { WalletsService } from '../../src/wallets/wallets.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('WalletsService', () => {
  let service: WalletsService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletsService,
        {
          provide: PrismaService,
          useValue: {
            wallet: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<WalletsService>(WalletsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a wallet successfully', async () => {
      const dto = { name: 'Main Wallet', balance: 100, type: 'CASH' };
      const expectedWallet = {
        id: 'w1',
        ...dto,
        userId: 'u1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest
        .spyOn(prismaService.wallet, 'create')
        .mockResolvedValue(expectedWallet);

      const result = await service.create('u1', dto);
      expect(result).toEqual(expectedWallet);
      expect(prismaService.wallet.create).toHaveBeenCalledWith({
        data: { ...dto, userId: 'u1' },
      });
    });
  });

  describe('findAll', () => {
    it('should return all wallets for a user', async () => {
      const expectedWallets = [
        { id: 'w1', name: 'Cash', balance: 50, type: 'CASH', userId: 'u1' },
      ];
      jest
        .spyOn(prismaService.wallet, 'findMany')
        .mockResolvedValue(expectedWallets as any);

      const result = await service.findAll('u1');
      expect(result).toEqual(expectedWallets);
    });
  });

  describe('findOne', () => {
    it('should return the wallet if it belongs to the user', async () => {
      const wallet = {
        id: 'w1',
        name: 'Cash',
        balance: 50,
        type: 'CASH',
        userId: 'u1',
      };
      jest
        .spyOn(prismaService.wallet, 'findUnique')
        .mockResolvedValue(wallet as any);

      const result = await service.findOne('u1', 'w1');
      expect(result).toEqual(wallet);
    });

    it('should throw NotFoundException if wallet belongs to another user', async () => {
      const wallet = {
        id: 'w1',
        name: 'Cash',
        balance: 50,
        type: 'CASH',
        userId: 'other',
      };
      jest
        .spyOn(prismaService.wallet, 'findUnique')
        .mockResolvedValue(wallet as any);

      await expect(service.findOne('u1', 'w1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if wallet does not exist', async () => {
      jest.spyOn(prismaService.wallet, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('u1', 'w1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
