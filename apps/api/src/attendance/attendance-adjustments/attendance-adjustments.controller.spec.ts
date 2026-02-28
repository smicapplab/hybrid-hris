import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceAdjustmentsController } from './attendance-adjustments.controller';

describe('AttendanceAdjustmentsController', () => {
  let controller: AttendanceAdjustmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendanceAdjustmentsController],
    }).compile();

    controller = module.get<AttendanceAdjustmentsController>(AttendanceAdjustmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
