/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { PositionsService } from './positions.service';
import { DatabaseService } from 'src/database/database.service';

describe('PositionsService', () => {
  let service: PositionsService;
  let dbService: jest.Mocked<DatabaseService>;

  const mockDb = {
    db: {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    },
  } as unknown as jest.Mocked<DatabaseService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PositionsService,
        {
          provide: DatabaseService,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<PositionsService>(PositionsService);
    dbService = module.get(DatabaseService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call getAll', async () => {
    (dbService.db.select as jest.Mock).mockReturnValue({
      from: () => ({
        orderBy: () => [],
      }),
    });

    await service.getAll();
    expect(dbService.db.select).toHaveBeenCalled();
  });

  it('should call getById', async () => {
    (dbService.db.select as jest.Mock).mockReturnValue({
      from: () => ({
        where: () => ({
          limit: () => [],
        }),
      }),
    });

    await service.getById('id');
    expect(dbService.db.select).toHaveBeenCalled();
  });

  it('should call create', async () => {
    (dbService.db.insert as jest.Mock).mockReturnValue({
      values: () => ({
        returning: () => [{}],
      }),
    });

    await service.create({ code: 'DEV', title: 'Developer' });
    expect(dbService.db.insert).toHaveBeenCalled();
  });

  it('should call update', async () => {
    (dbService.db.update as jest.Mock).mockReturnValue({
      set: () => ({
        where: () => ({
          returning: () => [{}],
        }),
      }),
    });

    await service.update('id', { title: 'Updated' });
    expect(dbService.db.update).toHaveBeenCalled();
  });

  it('should call softDelete', async () => {
    (dbService.db.update as jest.Mock).mockReturnValue({
      set: () => ({
        where: () => ({}),
      }),
    });

    await service.softDelete('id');
    expect(dbService.db.update).toHaveBeenCalled();
  });

  it('should call restore', async () => {
    (dbService.db.update as jest.Mock).mockReturnValue({
      set: () => ({
        where: () => ({}),
      }),
    });

    await service.restore('id');
    expect(dbService.db.update).toHaveBeenCalled();
  });
});
