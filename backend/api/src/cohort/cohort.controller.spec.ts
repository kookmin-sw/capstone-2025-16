import { Test, TestingModule } from '@nestjs/testing';
import { CohortController } from './cohort.controller';

describe('CohortController', () => {
  let controller: CohortController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CohortController],
    }).compile();

    controller = module.get<CohortController>(CohortController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
