/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
jest.mock(
  '../../generated/prisma/client',
  () => ({
    PrismaClient: class {},
  }),
  { virtual: true },
);
import { WalletsController } from '../../src/wallets/wallets.controller';
import { WalletsService } from '../../src/wallets/wallets.service';

describe('WalletsController', () => {
  let controller: WalletsController;
  let service: WalletsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletsController],
      providers: [
        {
          provide: WalletsService,
          useValue: {
            create: jest.fn().mockResolvedValue({ id: 'w1', name: 'Cash' }),
            findAll: jest.fn().mockResolvedValue([{ id: 'w1', name: 'Cash' }]),
            findOne: jest.fn().mockResolvedValue({ id: 'w1', name: 'Cash' }),
            update: jest
              .fn()
              .mockResolvedValue({ id: 'w1', name: 'Cash Updated' }),
            remove: jest.fn().mockResolvedValue({ id: 'w1', name: 'Cash' }),
          },
        },
      ],
    }).compile();

    controller = module.get<WalletsController>(WalletsController);
    service = module.get<WalletsService>(WalletsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call walletsService.create', async () => {
      const dto = { name: 'Cash', balance: 100, type: 'CASH' };
      const result = await controller.create('u1', dto);
      expect(service.create).toHaveBeenCalledWith('u1', dto);
      expect(result).toEqual({ id: 'w1', name: 'Cash' });
    });
  });

  describe('findAll', () => {
    it('should call walletsService.findAll', async () => {
      const result = await controller.findAll('u1');
      expect(service.findAll).toHaveBeenCalledWith('u1');
      expect(result).toEqual([{ id: 'w1', name: 'Cash' }]);
    });
  });
});
