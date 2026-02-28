import { Test, TestingModule } from '@nestjs/testing';
import { ShiftTemplatesService } from './shift-templates.service';

describe('ShiftTemplatesService', () => {
  let service: ShiftTemplatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShiftTemplatesService],
    }).compile();

    service = module.get<ShiftTemplatesService>(ShiftTemplatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
