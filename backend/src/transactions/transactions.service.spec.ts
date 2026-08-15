/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
jest.mock(
  '../../generated/prisma/client',
  () => ({
    PrismaClient: class {},
  }),
  { virtual: true },
);
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: PrismaService,
          useValue: {
            transaction: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            wallet: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            category: {
              findUnique: jest.fn(),
            },
            $transaction: jest.fn((cb) =>
              cb({
                transaction: {
                  create: jest.fn().mockResolvedValue({
                    id: 't1',
                    amount: 100,
                    type: 'INCOME',
                  }),
                  findUnique: jest.fn().mockResolvedValue({
                    id: 't1',
                    amount: 100,
                    type: 'INCOME',
                    walletId: 'w1',
                    userId: 'u1',
                  }),
                  update: jest.fn(),
                  delete: jest.fn(),
                },
                wallet: {
                  findUnique: jest.fn(),
                  update: jest.fn(),
                },
                category: {
                  findUnique: jest.fn(),
                },
              }),
            ),
          },
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw NotFoundException if wallet is not found', async () => {
      const dto = {
        amount: 100,
        type: 'INCOME',
        walletId: 'w1',
        categoryId: 'c1',
      };
      jest.spyOn(prismaService.wallet, 'findUnique').mockResolvedValue(null);

      await expect(service.create('u1', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if types mismatch', async () => {
      const dto = {
        amount: 100,
        type: 'INCOME',
        walletId: 'w1',
        categoryId: 'c1',
      };
      jest
        .spyOn(prismaService.wallet, 'findUnique')
        .mockResolvedValue({ id: 'w1', userId: 'u1' } as any);
      jest
        .spyOn(prismaService.category, 'findUnique')
        .mockResolvedValue({ id: 'c1', type: 'EXPENSE', userId: 'u1' } as any);

      await expect(service.create('u1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
