/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { PositionsController } from './positions.controller';
import { PositionsService } from './positions.service';

describe('PositionsController', () => {
  let controller: PositionsController;
  let service: jest.Mocked<PositionsService>;

  const mockService = {
    getAll: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
  } as unknown as jest.Mocked<PositionsService>;

  const mockPosition = {
    id: 'id',
    code: 'DEV',
    title: 'Developer',
    description: 'Software Developer',
    isActive: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PositionsController],
      providers: [
        {
          provide: PositionsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<PositionsController>(PositionsController);
    service = module.get(PositionsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return all positions', async () => {
    service.getAll.mockResolvedValue([] as any);
    await controller.getAll();
    expect(service.getAll as jest.Mock).toHaveBeenCalled();
  });

  it('should get by id', async () => {
    (service.getById as jest.Mock).mockResolvedValue(null as any);
    await controller.getById('test-id');
    expect(service.getById as jest.Mock).toHaveBeenCalledWith('test-id');
  });

  it('should create position', async () => {
    service.create.mockResolvedValue(mockPosition as any);
    await controller.create({ code: 'DEV', title: 'Developer' });
    expect(service.create as jest.Mock).toHaveBeenCalled();
  });

  it('should update position', async () => {
    service.update.mockResolvedValue(mockPosition as any);
    await controller.update('id', { title: 'Updated' });
    expect(service.update as jest.Mock).toHaveBeenCalledWith('id', { title: 'Updated' });
  });

  it('should delete position', async () => {
    service.softDelete.mockResolvedValue({ success: true } as any);
    await controller.softDelete('id');
    expect(service.softDelete as jest.Mock).toHaveBeenCalledWith('id');
  });

  it('should restore position', async () => {
    service.restore.mockResolvedValue({ success: true } as any);
    await controller.restore('id');
    expect(service.restore as jest.Mock).toHaveBeenCalledWith('id');
  });
});
