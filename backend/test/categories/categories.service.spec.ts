/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
jest.mock(
  '../../generated/prisma/client',
  () => ({
    PrismaClient: class {},
  }),
  { virtual: true },
);
import { CategoriesService } from '../../src/categories/categories.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: {
            category: {
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

    service = module.get<CategoriesService>(CategoriesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a category successfully', async () => {
      const dto = { name: 'Food', type: 'EXPENSE', icon: 'food-icon' };
      const expectedCategory = {
        id: 'c1',
        ...dto,
        userId: 'u1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest
        .spyOn(prismaService.category, 'create')
        .mockResolvedValue(expectedCategory);

      const result = await service.create('u1', dto);
      expect(result).toEqual(expectedCategory);
      expect(prismaService.category.create).toHaveBeenCalledWith({
        data: { ...dto, userId: 'u1' },
      });
    });
  });

  describe('findAll', () => {
    it('should return all categories for a user', async () => {
      const expectedCategories = [
        {
          id: 'c1',
          name: 'Food',
          type: 'EXPENSE',
          icon: 'food-icon',
          userId: 'u1',
        },
      ];
      jest
        .spyOn(prismaService.category, 'findMany')
        .mockResolvedValue(expectedCategories as any);

      const result = await service.findAll('u1');
      expect(result).toEqual(expectedCategories);
    });
  });

  describe('findOne', () => {
    it('should return the category if it belongs to the user', async () => {
      const category = {
        id: 'c1',
        name: 'Food',
        type: 'EXPENSE',
        icon: 'food-icon',
        userId: 'u1',
      };
      jest
        .spyOn(prismaService.category, 'findUnique')
        .mockResolvedValue(category as any);

      const result = await service.findOne('u1', 'c1');
      expect(result).toEqual(category);
    });

    it('should throw NotFoundException if category belongs to another user', async () => {
      const category = {
        id: 'c1',
        name: 'Food',
        type: 'EXPENSE',
        icon: 'food-icon',
        userId: 'other',
      };
      jest
        .spyOn(prismaService.category, 'findUnique')
        .mockResolvedValue(category as any);

      await expect(service.findOne('u1', 'c1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
