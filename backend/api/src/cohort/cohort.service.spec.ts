import { Test, TestingModule } from '@nestjs/testing';
import { CohortService } from './cohort.service';

describe('CohortService', () => {
  let service: CohortService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CohortService],
    }).compile();

    service = module.get<CohortService>(CohortService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
