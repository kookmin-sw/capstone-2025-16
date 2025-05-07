import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CohortModule } from './cohort/cohort.module';
import { PersonModule } from './person/person.module';
import { VisitModule } from './visit/visit.module';
import { ConceptModule } from './concept/concept.module';
import { StatisticsModule } from './statistics/statistics.module';
import { FeatureModule } from './feature/feature.module';

@Module({
  imports: [CohortModule, PersonModule, VisitModule, ConceptModule, StatisticsModule, FeatureModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
