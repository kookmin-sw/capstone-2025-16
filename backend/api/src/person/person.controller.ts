import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { PersonService } from './person.service';
import {
  PersonIdParam,
  PersonResponse,
  PersonStatisticsResponse,
  VisitOccurrenceClass,
} from './dto/person.dto';

@ApiTags('Person')
@Controller('/api/person')
export class PersonController {
  constructor(private readonly personService: PersonService) {}

  @ApiOperation({ summary: 'Get person information' })
  @ApiParam({ name: 'personId', description: 'Person ID' })
  @ApiOkResponse({ description: 'Person information', type: PersonResponse })
  @ApiNotFoundResponse({ description: 'Person not found' })
  @Get(':personId')
  async getPerson(@Param() { personId }: PersonIdParam) {
    return await this.personService.getPerson(personId);
  }

  @ApiOperation({ summary: 'Get person visits' })
  @ApiParam({ name: 'personId', description: 'Person ID' })
  @ApiOkResponse({ description: 'Person visits', type: [VisitOccurrenceClass] })
  @ApiNotFoundResponse({ description: 'Person not found' })
  @Get(':personId/visit')
  async getPersonVisits(@Param() { personId }: PersonIdParam) {
    return await this.personService.getPersonVisits(personId);
  }

  @ApiOperation({ summary: 'Get person statistics' })
  @ApiParam({ name: 'personId', description: 'Person ID' })
  @ApiOkResponse({
    description: 'Person statistics',
    type: PersonStatisticsResponse,
  })
  @ApiNotFoundResponse({ description: 'Person not found' })
  @Get(':personId/statistics')
  async getPersonStatistics(@Param() { personId }: PersonIdParam) {
    return await this.personService.getPersonStatistics(personId);
  }
}
