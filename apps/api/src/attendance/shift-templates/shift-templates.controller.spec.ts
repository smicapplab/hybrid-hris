import { Test, TestingModule } from '@nestjs/testing';
import { ShiftTemplatesController } from './shift-templates.controller';

describe('ShiftTemplatesController', () => {
  let controller: ShiftTemplatesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShiftTemplatesController],
    }).compile();

    controller = module.get<ShiftTemplatesController>(ShiftTemplatesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
