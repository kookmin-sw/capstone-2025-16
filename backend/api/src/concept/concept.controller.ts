import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConceptService } from './concept.service';
import {
  ConceptSearchResponseDto,
  SearchConceptQueryDto,
} from './dto/concept.dto';

@ApiTags('concept')
@Controller('/api/concept')
export class ConceptController {
  constructor(private readonly conceptService: ConceptService) {}

  @ApiOperation({ summary: 'Search concepts' })
  @ApiResponse({
    status: 200,
    description: 'Returns the list of concepts based on search query',
    type: ConceptSearchResponseDto,
  })
  @Get('search')
  async searchConcepts(
    @Query() queryParams: SearchConceptQueryDto,
  ): Promise<ConceptSearchResponseDto> {
    const { query, page = 0, limit = 100 } = queryParams;
    return this.conceptService.searchConcepts(query, page, limit);
  }
}
