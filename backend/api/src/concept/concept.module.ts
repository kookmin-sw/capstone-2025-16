import { Module } from '@nestjs/common';
import { ConceptController } from './concept.controller';
import { ConceptService } from './concept.service';

@Module({
  controllers: [ConceptController],
  providers: [ConceptService]
})
export class ConceptModule {}
