import { Test, TestingModule } from '@nestjs/testing';
import { ConceptService } from './concept.service';

describe('ConceptService', () => {
  let service: ConceptService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConceptService],
    }).compile();

    service = module.get<ConceptService>(ConceptService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
