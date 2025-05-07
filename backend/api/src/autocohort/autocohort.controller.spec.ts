import { Test, TestingModule } from '@nestjs/testing';
import { AutocohortController } from './autocohort.controller';

describe('AutocohortController', () => {
  let controller: AutocohortController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AutocohortController],
    }).compile();

    controller = module.get<AutocohortController>(AutocohortController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
