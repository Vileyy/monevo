/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
jest.mock(
  '../../generated/prisma/client',
  () => ({
    PrismaClient: class {},
  }),
  { virtual: true },
);
import { CategoriesController } from '../../src/categories/categories.controller';
import { CategoriesService } from '../../src/categories/categories.service';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let service: CategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: {
            create: jest.fn().mockResolvedValue({ id: 'c1', name: 'Food' }),
            findAll: jest.fn().mockResolvedValue([{ id: 'c1', name: 'Food' }]),
            findOne: jest.fn().mockResolvedValue({ id: 'c1', name: 'Food' }),
            update: jest
              .fn()
              .mockResolvedValue({ id: 'c1', name: 'Food Updated' }),
            remove: jest.fn().mockResolvedValue({ id: 'c1', name: 'Food' }),
          },
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call categoriesService.create', async () => {
      const dto = { name: 'Food', type: 'EXPENSE', icon: 'food-icon' };
      const result = await controller.create('u1', dto);
      expect(service.create).toHaveBeenCalledWith('u1', dto);
      expect(result).toEqual({ id: 'c1', name: 'Food' });
    });
  });

  describe('findAll', () => {
    it('should call categoriesService.findAll', async () => {
      const result = await controller.findAll('u1');
      expect(service.findAll).toHaveBeenCalledWith('u1');
      expect(result).toEqual([{ id: 'c1', name: 'Food' }]);
    });
  });
});
