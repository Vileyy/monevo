import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
jest.mock(
  '../../generated/prisma/client',
  () => ({
    PrismaClient: class {},
  }),
  { virtual: true },
);
import { RemindersService } from '../../src/reminders/reminders.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('RemindersService', () => {
  let service: RemindersService;
  let prisma: {
    reminder: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    wallet: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    category: {
      findFirst: jest.Mock;
      create: jest.Mock;
    };
    transaction: {
      create: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      reminder: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      wallet: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      category: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      transaction: {
        create: jest.fn(),
      },
      $transaction: jest.fn((cb: (tx: unknown) => Promise<unknown>) =>
        cb({
          wallet: {
            update: jest.fn().mockResolvedValue({ id: 'w1', balance: 700000 }),
          },
          transaction: {
            create: jest.fn().mockResolvedValue({
              id: 'tx1',
              amount: 300000,
              type: 'EXPENSE',
            }),
          },
          reminder: {
            update: jest.fn().mockResolvedValue({
              id: 'r1',
              title: 'Tiền điện',
              lastPaidAt: new Date(),
            }),
          },
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemindersService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<RemindersService>(RemindersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw NotFoundException if specified wallet is not found', async () => {
      prisma.wallet.findUnique.mockResolvedValue(null);

      await expect(
        service.create('u1', {
          title: 'Tiền điện',
          amount: 300000,
          dueDate: 10,
          walletId: 'w_unknown',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create and return reminder', async () => {
      const mockReminder = {
        id: 'r1',
        title: 'Tiền điện',
        amount: 300000,
        dueDate: 10,
        frequency: 'MONTHLY',
        category: 'ELECTRICITY',
        walletId: null,
      };
      prisma.reminder.create.mockResolvedValue(mockReminder);

      const result = await service.create('u1', {
        title: 'Tiền điện',
        amount: 300000,
        dueDate: 10,
        category: 'ELECTRICITY',
      });

      expect(result).toEqual(mockReminder);
      expect(prisma.reminder.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return reminders with computed status', async () => {
      const mockReminders = [
        {
          id: 'r1',
          title: 'Tiền điện',
          amount: 300000,
          dueDate: 10,
          lastPaidAt: new Date(), // Paid this month
          wallet: null,
        },
      ];
      prisma.reminder.findMany.mockResolvedValue(mockReminders);

      const result = await service.findAll('u1');
      expect(result).toHaveLength(1);
      expect(result[0].isPaidThisMonth).toBe(true);
      expect(result[0].status).toBe('PAID');
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if reminder not found', async () => {
      prisma.reminder.findUnique.mockResolvedValue(null);

      await expect(service.findOne('u1', 'r_unknown')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('pay', () => {
    it('should execute atomic payment and update lastPaidAt', async () => {
      const mockReminder = {
        id: 'r1',
        userId: 'u1',
        title: 'Tiền điện',
        amount: 300000,
        walletId: 'w1',
      };
      prisma.reminder.findUnique.mockResolvedValue(mockReminder);
      prisma.wallet.findUnique.mockResolvedValue({ id: 'w1', userId: 'u1' });
      prisma.category.findFirst.mockResolvedValue({ id: 'c1', userId: 'u1' });

      const result = await service.pay('u1', 'r1', { walletId: 'w1' });

      expect(result.reminder.id).toBe('r1');
      expect(result.transaction.amount).toBe(300000);
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update reminder', async () => {
      const mockReminder = { id: 'r1', userId: 'u1' };
      prisma.reminder.findUnique.mockResolvedValue(mockReminder);
      prisma.reminder.update.mockResolvedValue({
        ...mockReminder,
        title: 'Updated',
      });

      const result = await service.update('u1', 'r1', { title: 'Updated' });
      expect(result.title).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should delete reminder', async () => {
      const mockReminder = { id: 'r1', userId: 'u1' };
      prisma.reminder.findUnique.mockResolvedValue(mockReminder);
      prisma.reminder.delete.mockResolvedValue(mockReminder);

      const result = await service.remove('u1', 'r1');
      expect(result).toEqual(mockReminder);
    });
  });
});
