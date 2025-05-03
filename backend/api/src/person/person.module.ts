import { Module } from '@nestjs/common';
import { PersonController } from './person.controller';
import { PersonService } from './person.service';

@Module({
  controllers: [PersonController],
  providers: [PersonService]
})
export class PersonModule {}
