/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
jest.mock(
  '../../generated/prisma/client',
  () => ({
    PrismaClient: class {},
  }),
  { virtual: true },
);
import { RemindersController } from '../../src/reminders/reminders.controller';
import { RemindersService } from '../../src/reminders/reminders.service';

describe('RemindersController', () => {
  let controller: RemindersController;
  let service: RemindersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RemindersController],
      providers: [
        {
          provide: RemindersService,
          useValue: {
            create: jest.fn().mockResolvedValue({
              id: 'r1',
              title: 'Tiền điện',
              amount: 300000,
            }),
            findAll: jest.fn().mockResolvedValue([
              {
                id: 'r1',
                title: 'Tiền điện',
                amount: 300000,
                status: 'UPCOMING',
              },
            ]),
            findOne: jest.fn().mockResolvedValue({
              id: 'r1',
              title: 'Tiền điện',
              amount: 300000,
            }),
            pay: jest.fn().mockResolvedValue({
              reminder: { id: 'r1', lastPaidAt: new Date() },
              transaction: { id: 'tx1', amount: 300000 },
            }),
            update: jest
              .fn()
              .mockResolvedValue({ id: 'r1', title: 'Tiền điện tháng 8' }),
            remove: jest.fn().mockResolvedValue({ id: 'r1' }),
          },
        },
      ],
    }).compile();

    controller = module.get<RemindersController>(RemindersController);
    service = module.get<RemindersService>(RemindersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call remindersService.create', async () => {
      const dto = {
        title: 'Tiền điện',
        amount: 300000,
        dueDate: 10,
        category: 'ELECTRICITY',
      };
      const result = await controller.create('u1', dto);
      expect(service.create).toHaveBeenCalledWith('u1', dto);
      expect(result).toEqual({ id: 'r1', title: 'Tiền điện', amount: 300000 });
    });
  });

  describe('findAll', () => {
    it('should call remindersService.findAll', async () => {
      const result = await controller.findAll('u1');
      expect(service.findAll).toHaveBeenCalledWith('u1');
      expect(result).toHaveLength(1);
    });
  });

  describe('pay', () => {
    it('should call remindersService.pay', async () => {
      const result = await controller.pay('u1', 'r1', { walletId: 'w1' });
      expect(service.pay).toHaveBeenCalledWith('u1', 'r1', { walletId: 'w1' });
      expect(result.reminder.id).toBe('r1');
    });
  });

  describe('update', () => {
    it('should call remindersService.update', async () => {
      const result = await controller.update('u1', 'r1', {
        title: 'Tiền điện tháng 8',
      });
      expect(service.update).toHaveBeenCalledWith('u1', 'r1', {
        title: 'Tiền điện tháng 8',
      });
      expect(result.title).toBe('Tiền điện tháng 8');
    });
  });

  describe('remove', () => {
    it('should call remindersService.remove', async () => {
      const result = await controller.remove('u1', 'r1');
      expect(service.remove).toHaveBeenCalledWith('u1', 'r1');
      expect(result).toEqual({ id: 'r1' });
    });
  });
});
