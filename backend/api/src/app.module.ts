import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CohortModule } from './cohort/cohort.module';
import { PersonModule } from './person/person.module';

@Module({
  imports: [CohortModule, PersonModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
