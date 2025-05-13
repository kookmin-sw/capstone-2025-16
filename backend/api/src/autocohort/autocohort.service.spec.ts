import { Test, TestingModule } from '@nestjs/testing';
import { AutocohortService } from './autocohort.service';

describe('AutocohortService', () => {
  let service: AutocohortService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AutocohortService],
    }).compile();

    service = module.get<AutocohortService>(AutocohortService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
