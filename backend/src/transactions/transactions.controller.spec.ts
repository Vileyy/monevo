/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
jest.mock(
  '../../generated/prisma/client',
  () => ({
    PrismaClient: class {},
  }),
  { virtual: true },
);
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let service: TransactionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        {
          provide: TransactionsService,
          useValue: {
            create: jest.fn().mockResolvedValue({ id: 't1', amount: 100 }),
            findAll: jest.fn().mockResolvedValue([{ id: 't1', amount: 100 }]),
            findOne: jest.fn().mockResolvedValue({ id: 't1', amount: 100 }),
            update: jest.fn().mockResolvedValue({ id: 't1', amount: 120 }),
            remove: jest.fn().mockResolvedValue({ id: 't1' }),
          },
        },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
    service = module.get<TransactionsService>(TransactionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call transactionsService.create', async () => {
      const dto = {
        amount: 100,
        type: 'INCOME',
        walletId: 'w1',
        categoryId: 'c1',
      };
      const result = await controller.create('u1', dto);
      expect(service.create).toHaveBeenCalledWith('u1', dto);
      expect(result).toEqual({ id: 't1', amount: 100 });
    });
  });
});
