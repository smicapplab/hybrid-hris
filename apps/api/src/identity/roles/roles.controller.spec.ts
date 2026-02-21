/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

describe('RolesController', () => {
  let controller: RolesController;
  let rolesService: {
    getAllRoles: jest.Mock;
    getUserRoles: jest.Mock;
    assignRoleToUser: jest.Mock;
    removeRoleFromUser: jest.Mock;
  };

  const mockRolesService = {
    getAllRoles: jest.fn(),
    getUserRoles: jest.fn(),
    assignRoleToUser: jest.fn(),
    removeRoleFromUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        {
          provide: RolesService,
          useValue: mockRolesService,
        },
      ],
    }).compile();

    controller = module.get<RolesController>(RolesController);
    rolesService = module.get<typeof mockRolesService>(RolesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllRoles', () => {
    it('should return all roles', async () => {
      const result = [
        { code: 'HR_ADMIN', name: 'HR Admin' },
      ];

      rolesService.getAllRoles.mockResolvedValue(result as any);

      expect(await controller.getAllRoles()).toEqual(result);
      expect(rolesService.getAllRoles).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUserRoles', () => {
    it('should return roles for a user', async () => {
      const result = [{ code: 'MANAGER', name: 'Manager' }];
      const userId = 'user-123';

      rolesService.getUserRoles.mockResolvedValue(result as any);

      expect(await controller.getUserRoles(userId)).toEqual(result);
      expect(rolesService.getUserRoles).toHaveBeenCalledWith(userId);
    });
  });

  describe('assignRole', () => {
    it('should assign role to user', async () => {
      const userId = 'user-123';
      const roleCode = 'EMPLOYEE';
      const response = { success: true };

      rolesService.assignRoleToUser.mockResolvedValue(response as any);

      expect(
        await controller.assignRole(userId, roleCode),
      ).toEqual(response);

      expect(rolesService.assignRoleToUser).toHaveBeenCalledWith(
        userId,
        roleCode,
      );
    });
  });

  describe('removeRole', () => {
    it('should remove role from user', async () => {
      const userId = 'user-123';
      const roleCode = 'EMPLOYEE';
      const response = { success: true };

      rolesService.removeRoleFromUser.mockResolvedValue(response as any);

      expect(
        await controller.removeRole(userId, roleCode),
      ).toEqual(response);

      expect(rolesService.removeRoleFromUser).toHaveBeenCalledWith(
        userId,
        roleCode,
      );
    });
  });
});
