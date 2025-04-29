import { Module } from '@nestjs/common';
import { CohortController } from './cohort.controller';
import { CohortService } from './cohort.service';

@Module({
  controllers: [CohortController],
  providers: [CohortService],
})
export class CohortModule {}
