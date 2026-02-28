import { Test, TestingModule } from '@nestjs/testing';
import { ShiftAssignmentsService } from './shift-assignments.service';

describe('ShiftAssignmentsService', () => {
  let service: ShiftAssignmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShiftAssignmentsService],
    }).compile();

    service = module.get<ShiftAssignmentsService>(ShiftAssignmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
