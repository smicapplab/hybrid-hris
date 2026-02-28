import { Test, TestingModule } from '@nestjs/testing';
import { ShiftAssignmentsController } from './shift-assignments.controller';

describe('ShiftAssignmentsController', () => {
  let controller: ShiftAssignmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShiftAssignmentsController],
    }).compile();

    controller = module.get<ShiftAssignmentsController>(ShiftAssignmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
