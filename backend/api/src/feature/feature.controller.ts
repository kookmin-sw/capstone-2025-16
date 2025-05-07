import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FeatureService } from './feature.service';
import {
  FeatureStatusResponseDto,
  FeatureRequestDto,
  FeaturePaginationQueryDto,
} from './dto/feature.dto';

@ApiTags('feature')
@Controller('/api/feature')
export class FeatureController {
  constructor(private readonly featureService: FeatureService) {}

  @ApiOperation({
    summary: 'Get feature extraction status and results for a cohort',
  })
  @ApiParam({ name: 'cohortId', description: 'Cohort ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description:
      'Returns the feature extraction status and results for the specified cohort',
    type: FeatureStatusResponseDto,
  })
  @Get(':cohortId')
  async getFeatureStatus(
    @Param('cohortId') cohortId: string,
    @Query() query: FeaturePaginationQueryDto,
  ): Promise<FeatureStatusResponseDto> {
    const { page = 0, limit = 100 } = query;
    return await this.featureService.getFeatureStatus(cohortId, page, limit);
  }

  @ApiOperation({ summary: 'Request feature extraction for a cohort' })
  @ApiParam({ name: 'cohortId', description: 'Cohort ID', type: 'string' })
  @ApiResponse({
    status: 202,
    description: 'Feature extraction request has been accepted',
  })
  @HttpCode(HttpStatus.ACCEPTED)
  @Post(':cohortId')
  async requestFeatureExtraction(
    @Param('cohortId') cohortId: string,
    @Body() requestDto: FeatureRequestDto,
  ): Promise<void> {
    await this.featureService.requestFeatureExtraction(cohortId, requestDto.k);
  }

  @ApiOperation({ summary: 'Delete feature extraction data for a cohort' })
  @ApiParam({ name: 'cohortId', description: 'Cohort ID', type: 'string' })
  @ApiResponse({
    status: 204,
    description: 'Feature extraction data has been deleted',
  })
  @Delete(':cohortId')
  async deleteFeatureExtraction(
    @Param('cohortId') cohortId: string,
  ): Promise<void> {
    await this.featureService.deleteFeatureExtractions(cohortId);
  }
}
