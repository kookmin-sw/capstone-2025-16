import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CohortService } from './cohort.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import {
  CreateCohortDto,
  UpdateCohortDto,
  CohortIdParam,
  PaginationQuery,
  CohortResponse,
  CohortStatisticsResponse,
  CreateCohortResponse,
  UpdateCohortResponse,
  DeleteCohortResponse,
} from './dto/cohort.dto';

@ApiTags('코호트')
@Controller('/api/cohort')
export class CohortController {
  constructor(private readonly cohortService: CohortService) {}

  @ApiOperation({ summary: '코호트 목록 조회' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '페이지 번호',
  })
  @ApiResponse({
    status: 200,
    description: '코호트 목록',
    type: [CohortResponse],
  })
  @Get()
  async getCohorts(@Query() { page }: PaginationQuery) {
    return await this.cohortService.getCohorts(page);
  }

  @ApiOperation({ summary: '코호트 조회' })
  @ApiParam({ name: 'cohortId', description: '코호트 ID' })
  @ApiOkResponse({ description: '코호트 정보', type: CohortResponse })
  @ApiNotFoundResponse({ description: '코호트를 찾을 수 없음' })
  @Get(':cohortId')
  async getCohort(@Param() { cohortId }: CohortIdParam) {
    return await this.cohortService.getCohort(cohortId);
  }

  @ApiOperation({ summary: '코호트 통계 조회' })
  @ApiParam({ name: 'cohortId', description: '코호트 ID' })
  @ApiOkResponse({
    description: '코호트 통계 정보',
    type: CohortStatisticsResponse,
  })
  @ApiNotFoundResponse({ description: '코호트를 찾을 수 없음' })
  @Get(':cohortId/statistics')
  async getCohortStatistics(@Param() { cohortId }: CohortIdParam) {
    return await this.cohortService.getCohortStatistics(cohortId);
  }

  @ApiOperation({ summary: '코호트 환자 목록 조회' })
  @ApiParam({ name: 'cohortId', description: '코호트 ID' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '페이지 번호',
  })
  @ApiOkResponse({ description: '코호트 환자 목록', type: [Number] })
  @ApiNotFoundResponse({ description: '코호트를 찾을 수 없음' })
  @Get(':cohortId/persons')
  async getCohortPersons(
    @Param() { cohortId }: CohortIdParam,
    @Query() { page }: PaginationQuery,
  ) {
    return await this.cohortService.getCohortPersons(cohortId, page);
  }

  @ApiOperation({ summary: '코호트 생성' })
  @ApiBody({ type: CreateCohortDto })
  @ApiCreatedResponse({
    description: '코호트 생성 성공',
    type: CreateCohortResponse,
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCohort(@Body() createCohortDto: CreateCohortDto) {
    const { name, description, cohortDefinition, temporary } = createCohortDto;
    return await this.cohortService.createNewCohort(
      name,
      description,
      cohortDefinition,
      temporary,
    );
  }

  @ApiOperation({ summary: '코호트 수정' })
  @ApiParam({ name: 'cohortId', description: '코호트 ID' })
  @ApiBody({ type: UpdateCohortDto })
  @ApiOkResponse({
    description: '코호트 수정 성공',
    type: UpdateCohortResponse,
  })
  @ApiNotFoundResponse({ description: '코호트를 찾을 수 없음' })
  @Put(':cohortId')
  async updateCohort(
    @Param() { cohortId }: CohortIdParam,
    @Body() updateCohortDto: UpdateCohortDto,
  ) {
    const { name, description, cohortDefinition } = updateCohortDto;
    return await this.cohortService.updateExistingCohort(
      cohortId,
      name,
      description,
      cohortDefinition,
    );
  }

  @ApiOperation({ summary: '코호트 삭제' })
  @ApiParam({ name: 'cohortId', description: '코호트 ID' })
  @ApiOkResponse({
    description: '코호트 삭제 성공',
    type: DeleteCohortResponse,
  })
  @ApiNotFoundResponse({ description: '코호트를 찾을 수 없음' })
  @Delete(':cohortId')
  async deleteCohort(@Param() { cohortId }: CohortIdParam) {
    return await this.cohortService.removeExistingCohort(cohortId);
  }
}
