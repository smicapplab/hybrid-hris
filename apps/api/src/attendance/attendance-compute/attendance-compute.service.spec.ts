import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceComputeService } from './attendance-compute.service';

describe('AttendanceComputeService', () => {
  let service: AttendanceComputeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AttendanceComputeService],
    }).compile();

    service = module.get<AttendanceComputeService>(AttendanceComputeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
