import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
jest.mock(
  '../../generated/prisma/client',
  () => ({
    PrismaClient: class {},
  }),
  { virtual: true },
);
import { BudgetsService } from '../../src/budgets/budgets.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('BudgetsService', () => {
  let service: BudgetsService;
  let prisma: {
    budget: {
      upsert: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    category: {
      findUnique: jest.Mock;
    };
    transaction: {
      findMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      budget: {
        upsert: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      category: {
        findUnique: jest.fn(),
      },
      transaction: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<BudgetsService>(BudgetsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrUpdate', () => {
    it('should throw NotFoundException if category does not belong to user', async () => {
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(
        service.createOrUpdate('u1', {
          categoryId: 'c1',
          amount: 1000,
          month: 8,
          year: 2026,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should upsert and return budget', async () => {
      prisma.category.findUnique.mockResolvedValue({ id: 'c1', userId: 'u1' });
      const mockBudget = {
        id: 'b1',
        categoryId: 'c1',
        amount: 1000,
        month: 8,
        year: 2026,
        userId: 'u1',
      };
      prisma.budget.upsert.mockResolvedValue(mockBudget);

      const result = await service.createOrUpdate('u1', {
        categoryId: 'c1',
        amount: 1000,
        month: 8,
        year: 2026,
      });

      expect(result).toEqual(mockBudget);
      expect(prisma.budget.upsert).toHaveBeenCalledWith({
        where: {
          userId_categoryId_month_year: {
            userId: 'u1',
            categoryId: 'c1',
            month: 8,
            year: 2026,
          },
        },
        update: { amount: 1000 },
        create: {
          userId: 'u1',
          categoryId: 'c1',
          amount: 1000,
          month: 8,
          year: 2026,
        },
        include: { category: true },
      });
    });
  });

  describe('findAll', () => {
    it('should calculate spending, remaining, percentage, and summary', async () => {
      const mockBudgets = [
        {
          id: 'b1',
          categoryId: 'c1',
          amount: 1000000,
          month: 8,
          year: 2026,
          category: { id: 'c1', name: 'Food' },
        },
        {
          id: 'b2',
          categoryId: 'c2',
          amount: 500000,
          month: 8,
          year: 2026,
          category: { id: 'c2', name: 'Transport' },
        },
      ];

      const mockTransactions = [
        { categoryId: 'c1', amount: 400000 },
        { categoryId: 'c1', amount: 100000 },
        { categoryId: 'c2', amount: 100000 },
      ];

      prisma.budget.findMany.mockResolvedValue(mockBudgets);
      prisma.transaction.findMany.mockResolvedValue(mockTransactions);

      const result = await service.findAll('u1', { month: 8, year: 2026 });

      expect(result.month).toBe(8);
      expect(result.year).toBe(2026);
      expect(result.summary.totalBudget).toBe(1500000);
      expect(result.summary.totalSpent).toBe(600000);
      expect(result.summary.totalRemaining).toBe(900000);
      expect(result.summary.overallPercentage).toBe(40);

      expect(result.items[0].spent).toBe(500000);
      expect(result.items[0].remaining).toBe(500000);
      expect(result.items[0].percentage).toBe(50);

      expect(result.items[1].spent).toBe(100000);
      expect(result.items[1].remaining).toBe(400000);
      expect(result.items[1].percentage).toBe(20);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if budget not found', async () => {
      prisma.budget.findUnique.mockResolvedValue(null);

      await expect(service.findOne('u1', 'b1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return budget with calculated spending', async () => {
      const mockBudget = {
        id: 'b1',
        userId: 'u1',
        categoryId: 'c1',
        amount: 1000000,
        month: 8,
        year: 2026,
        category: { id: 'c1', name: 'Food' },
      };
      prisma.budget.findUnique.mockResolvedValue(mockBudget);
      prisma.transaction.findMany.mockResolvedValue([
        { amount: 300000 },
        { amount: 200000 },
      ]);

      const result = await service.findOne('u1', 'b1');

      expect(result.spent).toBe(500000);
      expect(result.remaining).toBe(500000);
      expect(result.percentage).toBe(50);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if budget not found', async () => {
      prisma.budget.findUnique.mockResolvedValue(null);

      await expect(
        service.update('u1', 'b1', { amount: 2000 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update budget amount', async () => {
      prisma.budget.findUnique.mockResolvedValue({ id: 'b1', userId: 'u1' });
      prisma.budget.update.mockResolvedValue({ id: 'b1', amount: 2000 });

      const result = await service.update('u1', 'b1', { amount: 2000 });
      expect(result.amount).toBe(2000);
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if budget not found', async () => {
      prisma.budget.findUnique.mockResolvedValue(null);

      await expect(service.remove('u1', 'b1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete budget', async () => {
      prisma.budget.findUnique.mockResolvedValue({ id: 'b1', userId: 'u1' });
      prisma.budget.delete.mockResolvedValue({ id: 'b1' });

      const result = await service.remove('u1', 'b1');
      expect(result).toEqual({ id: 'b1' });
    });
  });
});
