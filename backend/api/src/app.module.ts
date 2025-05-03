import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CohortModule } from './cohort/cohort.module';
import { PersonModule } from './person/person.module';
import { VisitModule } from './visit/visit.module';

@Module({
  imports: [CohortModule, PersonModule, VisitModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
