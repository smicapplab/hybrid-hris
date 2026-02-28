import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceEventsService } from './attendance-events.service';

describe('AttendanceEventsService', () => {
  let service: AttendanceEventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AttendanceEventsService],
    }).compile();

    service = module.get<AttendanceEventsService>(AttendanceEventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
