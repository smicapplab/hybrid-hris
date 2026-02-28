import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceAdjustmentsService } from './attendance-adjustments.service';

describe('AttendanceAdjustmentsService', () => {
  let service: AttendanceAdjustmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AttendanceAdjustmentsService],
    }).compile();

    service = module.get<AttendanceAdjustmentsService>(AttendanceAdjustmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
