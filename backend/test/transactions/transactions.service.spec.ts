/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
jest.mock(
  '../../generated/prisma/client',
  () => ({
    PrismaClient: class {},
  }),
  { virtual: true },
);
import { TransactionsService } from '../../src/transactions/transactions.service';
import { PrismaService } from '../../src/prisma/prisma.service';
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
              count: jest.fn(),
              aggregate: jest.fn(),
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

  describe('findAll', () => {
    it('should return a paginated envelope when page/limit are provided', async () => {
      const findMany = jest
        .spyOn(prismaService.transaction, 'findMany')
        .mockResolvedValue([{ id: 't1' }] as any);
      const count = jest
        .spyOn(prismaService.transaction, 'count')
        .mockResolvedValue(55);

      const result = await service.findAll('u1', {
        page: 2,
        limit: 20,
      });

      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'u1' },
          skip: 20,
          take: 20,
          orderBy: { date: 'desc' },
        }),
      );
      expect(count).toHaveBeenCalledWith({ where: { userId: 'u1' } });
      expect(result).toEqual({
        data: [{ id: 't1' }],
        meta: { page: 2, limit: 20, total: 55, totalPages: 3, hasMore: true },
      });
    });

    it('should return a plain array when page/limit are not provided', async () => {
      jest
        .spyOn(prismaService.transaction, 'findMany')
        .mockResolvedValue([{ id: 't1' }] as any);
      const countSpy = jest.spyOn(prismaService.transaction, 'count');

      const result = await service.findAll('u1', {});

      expect(countSpy).not.toHaveBeenCalled();
      expect(result).toEqual([{ id: 't1' }]);
    });

    it('should apply search, filters and sorting to the where clause', async () => {
      const findMany = jest
        .spyOn(prismaService.transaction, 'findMany')
        .mockResolvedValue([]);

      await service.findAll('u1', {
        search: 'coffee',
        type: 'EXPENSE',
        walletId: 'w1',
        sortBy: 'amount',
        sortOrder: 'asc',
      } as any);

      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'u1',
            walletId: 'w1',
            type: 'EXPENSE',
            note: { contains: 'coffee', mode: 'insensitive' },
          },
          orderBy: { amount: 'asc' },
        }),
      );
    });
  });

  describe('getSummary', () => {
    it('should aggregate income and expense totals with the same filters', async () => {
      const aggregate = jest
        .spyOn(prismaService.transaction, 'aggregate')
        .mockImplementation(((args: { where: { type: string } }) => {
          if (args.where.type === 'INCOME') {
            return Promise.resolve({
              _sum: { amount: 500 },
              _count: { _all: 2 },
            });
          }
          return Promise.resolve({
            _sum: { amount: 200 },
            _count: { _all: 3 },
          });
        }) as any);

      const result = await service.getSummary('u1', {
        type: 'EXPENSE',
      });

      expect(aggregate).toHaveBeenCalledTimes(2);
      expect(aggregate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'u1', type: 'INCOME' } }),
      );
      expect(result).toEqual({
        totalIncome: 500,
        totalExpense: 200,
        count: 5,
      });
    });

    it('should default missing sums to zero', async () => {
      jest.spyOn(prismaService.transaction, 'aggregate').mockResolvedValue({
        _sum: { amount: null },
        _count: { _all: 0 },
      } as any);

      const result = await service.getSummary('u1', {});

      expect(result).toEqual({
        totalIncome: 0,
        totalExpense: 0,
        count: 0,
      });
    });
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

  describe('update', () => {
    it('should reject changing type when the current category type no longer matches', async () => {
      const tx = {
        transaction: {
          findUnique: jest.fn().mockResolvedValue({
            id: 't1',
            amount: '100',
            type: 'INCOME',
            walletId: 'w1',
            categoryId: 'c1',
            userId: 'u1',
            note: null,
            date: new Date(),
          }),
          update: jest.fn(),
        },
        wallet: {
          findUnique: jest.fn().mockResolvedValue({ id: 'w1', userId: 'u1' }),
          update: jest.fn(),
        },
        category: {
          findUnique: jest
            .fn()
            .mockResolvedValue({ id: 'c1', userId: 'u1', type: 'INCOME' }),
        },
      };

      jest
        .spyOn(prismaService, '$transaction')
        .mockImplementation((callback: any) => callback(tx));

      await expect(
        service.update('u1', 't1', { type: 'EXPENSE' } as any),
      ).rejects.toThrow(BadRequestException);
      expect(tx.wallet.update).not.toHaveBeenCalled();
    });
  });
});
