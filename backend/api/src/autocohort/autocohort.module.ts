import { Module } from '@nestjs/common';
import { AutocohortController } from './autocohort.controller';
import { AutocohortService } from './autocohort.service';

@Module({
  controllers: [AutocohortController],
  providers: [AutocohortService]
})
export class AutocohortModule {}
