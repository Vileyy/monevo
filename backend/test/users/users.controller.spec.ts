import { Test, TestingModule } from '@nestjs/testing';
jest.mock(
  '../../generated/prisma/client',
  () => ({
    PrismaClient: class {},
  }),
  { virtual: true },
);
import { UsersController } from '../../src/users/users.controller';
import { UsersService } from '../../src/users/users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: {
    findAll: jest.Mock;
    create: jest.Mock;
    findByEmail: jest.Mock;
    findById: jest.Mock;
    getProfile: jest.Mock;
    updateProfile: jest.Mock;
  };

  beforeEach(async () => {
    usersService = {
      findAll: jest.fn(),
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const mockUsers = [{ id: '1', email: 'test@example.com' }];
      usersService.findAll.mockResolvedValue(mockUsers);

      const result = await controller.findAll();
      expect(result).toBe(mockUsers);
      expect(usersService.findAll).toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should return user profile for current user', async () => {
      const mockProfile = { id: 'u1', email: 'u1@test.com', name: 'U1' };
      usersService.getProfile.mockResolvedValue(mockProfile);

      const result = await controller.getProfile('u1');
      expect(result).toBe(mockProfile);
      expect(usersService.getProfile).toHaveBeenCalledWith('u1');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile for current user', async () => {
      const updateDto = { name: 'Updated Name' };
      const mockProfile = {
        id: 'u1',
        email: 'u1@test.com',
        name: 'Updated Name',
      };
      usersService.updateProfile.mockResolvedValue(mockProfile);

      const result = await controller.updateProfile('u1', updateDto);
      expect(result).toBe(mockProfile);
      expect(usersService.updateProfile).toHaveBeenCalledWith('u1', updateDto);
    });
  });
});
