/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
jest.mock(
  '../../generated/prisma/client',
  () => ({
    PrismaClient: class {},
  }),
  { virtual: true },
);
import { BudgetsController } from '../../src/budgets/budgets.controller';
import { BudgetsService } from '../../src/budgets/budgets.service';

describe('BudgetsController', () => {
  let controller: BudgetsController;
  let service: BudgetsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BudgetsController],
      providers: [
        {
          provide: BudgetsService,
          useValue: {
            createOrUpdate: jest
              .fn()
              .mockResolvedValue({ id: 'b1', amount: 2000000 }),
            findAll: jest.fn().mockResolvedValue({
              month: 8,
              year: 2026,
              summary: {
                totalBudget: 2000000,
                totalSpent: 500000,
                totalRemaining: 1500000,
                overallPercentage: 25,
              },
              items: [{ id: 'b1', amount: 2000000, spent: 500000 }],
            }),
            findOne: jest
              .fn()
              .mockResolvedValue({ id: 'b1', amount: 2000000, spent: 500000 }),
            update: jest.fn().mockResolvedValue({ id: 'b1', amount: 2500000 }),
            remove: jest.fn().mockResolvedValue({ id: 'b1' }),
          },
        },
      ],
    }).compile();

    controller = module.get<BudgetsController>(BudgetsController);
    service = module.get<BudgetsService>(BudgetsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createOrUpdate', () => {
    it('should call budgetsService.createOrUpdate', async () => {
      const dto = {
        amount: 2000000,
        month: 8,
        year: 2026,
        categoryId: 'c1',
      };
      const result = await controller.createOrUpdate('u1', dto);
      expect(service.createOrUpdate).toHaveBeenCalledWith('u1', dto);
      expect(result).toEqual({ id: 'b1', amount: 2000000 });
    });
  });

  describe('findAll', () => {
    it('should call budgetsService.findAll', async () => {
      const query = { month: 8, year: 2026 };
      const result = await controller.findAll('u1', query);
      expect(service.findAll).toHaveBeenCalledWith('u1', query);
      expect(result.items).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should call budgetsService.findOne', async () => {
      const result = await controller.findOne('u1', 'b1');
      expect(service.findOne).toHaveBeenCalledWith('u1', 'b1');
      expect(result.id).toBe('b1');
    });
  });

  describe('update', () => {
    it('should call budgetsService.update', async () => {
      const result = await controller.update('u1', 'b1', { amount: 2500000 });
      expect(service.update).toHaveBeenCalledWith('u1', 'b1', {
        amount: 2500000,
      });
      expect(result.amount).toBe(2500000);
    });
  });

  describe('remove', () => {
    it('should call budgetsService.remove', async () => {
      const result = await controller.remove('u1', 'b1');
      expect(service.remove).toHaveBeenCalledWith('u1', 'b1');
      expect(result).toEqual({ id: 'b1' });
    });
  });
});
