/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from './roles.service';
import { DatabaseService } from '../../database/database.service';

describe('RolesService', () => {
  let service: RolesService;

  const mockDb = {
    db: {
      select: jest.fn(),
      insert: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: DatabaseService,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllRoles', () => {
    it('should query roles table', async () => {
      const mockResult = [{ code: 'HR_ADMIN' }];

      mockDb.db.select.mockReturnValue({
        from: jest.fn().mockResolvedValue(mockResult),
      });

      const result = await service.getAllRoles();

      expect(result).toEqual(mockResult);
      expect(mockDb.db.select).toHaveBeenCalled();
    });
  });

  describe('assignRoleToUser', () => {
    it('should throw if user not found', async () => {
      mockDb.db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(
        service.assignRoleToUser('user-1', 'EMPLOYEE'),
      ).rejects.toThrow();
    });
  });

  describe('removeRoleFromUser', () => {
    it('should not throw if role exists and delete is called', async () => {
      mockDb.db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'role-1' }]),
          }),
        }),
      });

      mockDb.db.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });

      await expect(
        service.removeRoleFromUser('user-1', 'EMPLOYEE'),
      ).resolves.toEqual({ success: true });
    });
  });
});
