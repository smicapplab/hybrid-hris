import { Test, TestingModule } from '@nestjs/testing';
import { OrgUnitsService } from './org-units.service';
import { DatabaseService } from 'src/database/database.service';

describe('OrgUnitsService', () => {
  let service: OrgUnitsService;
  let dbService: jest.Mocked<DatabaseService>;

  const mockDb = {
    db: {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
    },
  } as unknown as jest.Mocked<DatabaseService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrgUnitsService,
        {
          provide: DatabaseService,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<OrgUnitsService>(OrgUnitsService);
    dbService = module.get(DatabaseService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call select for getFlat', async () => {
    const db = dbService.db as unknown as {
      select: jest.Mock;
      orderBy: jest.Mock;
    };

    db.orderBy.mockResolvedValue([]);

    await service.getFlat();

    expect(db.select).toHaveBeenCalled();
    expect(db.orderBy).toHaveBeenCalled();
  });

  it('should return null if getById not found', async () => {
    const db = dbService.db as unknown as {
      limit: jest.Mock;
    };

    db.limit.mockResolvedValue([]);

    const result = await service.getById('id');
    expect(result).toBeNull();
  });
});
