import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CohortModule } from './cohort/cohort.module';

@Module({
  imports: [CohortModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
