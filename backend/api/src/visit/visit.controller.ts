import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { VisitService } from './visit.service';
import { VisitDetailResponse, VisitIdParam } from './dto/visit.dto';

@ApiTags('Visit')
@Controller('/api/visit')
export class VisitController {
  constructor(private readonly visitService: VisitService) {}

  @ApiOperation({ summary: 'Get detailed information for a specific visit' })
  @ApiParam({ name: 'visitId', description: 'Visit Occurrence ID' })
  @ApiOkResponse({
    description: 'Visit details including related information',
    type: VisitDetailResponse,
  })
  @ApiNotFoundResponse({ description: 'Visit not found' })
  @Get(':visitId')
  async getVisitDetail(@Param() { visitId }: VisitIdParam) {
    return await this.visitService.getVisitDetail(visitId);
  }
}
