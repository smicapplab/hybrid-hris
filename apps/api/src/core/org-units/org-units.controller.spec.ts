/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { OrgUnitsController } from './org-units.controller';
import { OrgUnitsService } from './org-units.service';

describe('OrgUnitsController', () => {
  let controller: OrgUnitsController;
  let service: jest.Mocked<OrgUnitsService>;

  const mockService = {
    getFlat: jest.fn(),
    getTree: jest.fn(),
    getById: jest.fn(),
    createOrgUnit: jest.fn(),
    updateOrgUnit: jest.fn(),
    softDeleteOrgUnit: jest.fn(),
  } as unknown as jest.Mocked<OrgUnitsService>;

  const mockOrgUnit = {
    id: 'id',
    name: 'Test Unit',
    code: 'TST',
    parentId: null,
    isActive: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrgUnitsController],
      providers: [
        {
          provide: OrgUnitsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<OrgUnitsController>(OrgUnitsController);
    service = module.get(OrgUnitsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return flat org units', async () => {
    service.getFlat.mockResolvedValue([]);
    await controller.getFlat();
    expect(service.getFlat as jest.Mock).toHaveBeenCalled();
  });

  it('should return tree', async () => {
    service.getTree.mockResolvedValue([]);
    await controller.getTree();
    expect(service.getTree as jest.Mock).toHaveBeenCalled();
  });

  it('should get by id', async () => {
    (service.getById as jest.Mock).mockResolvedValue(null as any);
    await controller.getById('test-id');
    expect(service.getById as jest.Mock).toHaveBeenCalledWith('test-id');
  });

  it('should create org unit', async () => {
    service.createOrgUnit.mockResolvedValue(mockOrgUnit);
    await controller.create({ name: 'Test', code: 'TST' });
    expect(service.createOrgUnit as jest.Mock).toHaveBeenCalled();
  });

  it('should update org unit', async () => {
    service.updateOrgUnit.mockResolvedValue(mockOrgUnit);
    await controller.update('id', { name: 'Updated' });
    expect(service.updateOrgUnit as jest.Mock).toHaveBeenCalledWith('id', { name: 'Updated' });
  });

  it('should delete org unit', async () => {
    service.softDeleteOrgUnit.mockResolvedValue({ success: true });
    await controller.remove('id');
    expect(service.softDeleteOrgUnit as jest.Mock).toHaveBeenCalledWith('id');
  });
});
