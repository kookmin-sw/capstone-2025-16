import { Module } from '@nestjs/common';
import { VisitController } from './visit.controller';
import { VisitService } from './visit.service';

@Module({
  controllers: [VisitController],
  providers: [VisitService]
})
export class VisitModule {}
