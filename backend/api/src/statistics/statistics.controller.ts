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
import { StatisticsService } from './statistics.service';
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
  CreateStatisticsDto,
  UpdateStatisticsDto,
  StatisticsIdParam,
  PaginationQuery,
  StatisticsResponse,
  StatisticsListResponse,
  CreateStatisticsResponse,
  UpdateStatisticsResponse,
  DeleteStatisticsResponse,
  CreateChartDto,
  UpdateChartDto,
  ChartIdParam,
  ChartResponse,
  ChartListResponse,
  CreateChartResponse,
  UpdateChartResponse,
  DeleteChartResponse,
  PaginationSearchQuery,
} from './dto/statistics.dto';

@ApiTags('Statistics')
@Controller('/api/statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @ApiOperation({ summary: 'Get statistics list' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
  })
  @ApiQuery({
    name: 'query',
    required: false,
    type: String,
    description: 'Search query',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics list',
    type: StatisticsListResponse,
  })
  @Get()
  async getStatistics(@Query() { page, limit, query }: PaginationSearchQuery) {
    return await this.statisticsService.getStatistics(page, limit, query);
  }

  @ApiOperation({ summary: 'Get statistics details' })
  @ApiParam({ name: 'statisticsId', description: 'Statistics ID' })
  @ApiOkResponse({
    description: 'Statistics information',
    type: StatisticsResponse,
  })
  @ApiNotFoundResponse({ description: 'Statistics not found' })
  @Get(':statisticsId')
  async getStatisticsById(@Param() { statisticsId }: StatisticsIdParam) {
    return await this.statisticsService.getStatisticsById(statisticsId);
  }

  @ApiOperation({ summary: 'Create statistics' })
  @ApiBody({ type: CreateStatisticsDto })
  @ApiCreatedResponse({
    description: 'Statistics created successfully',
    type: CreateStatisticsResponse,
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createStatistics(@Body() createStatisticsDto: CreateStatisticsDto) {
    return await this.statisticsService.createStatistics(createStatisticsDto);
  }

  @ApiOperation({ summary: 'Update statistics' })
  @ApiParam({ name: 'statisticsId', description: 'Statistics ID' })
  @ApiBody({ type: UpdateStatisticsDto })
  @ApiOkResponse({
    description: 'Statistics updated successfully',
    type: UpdateStatisticsResponse,
  })
  @ApiNotFoundResponse({ description: 'Statistics not found' })
  @Put(':statisticsId')
  async updateStatistics(
    @Param() { statisticsId }: StatisticsIdParam,
    @Body() updateStatisticsDto: UpdateStatisticsDto,
  ) {
    return await this.statisticsService.updateStatistics(
      statisticsId,
      updateStatisticsDto,
    );
  }

  @ApiOperation({ summary: 'Delete statistics' })
  @ApiParam({ name: 'statisticsId', description: 'Statistics ID' })
  @ApiOkResponse({
    description: 'Statistics deleted successfully',
    type: DeleteStatisticsResponse,
  })
  @ApiNotFoundResponse({ description: 'Statistics not found' })
  @Delete(':statisticsId')
  async deleteStatistics(@Param() { statisticsId }: StatisticsIdParam) {
    return await this.statisticsService.deleteStatistics(statisticsId);
  }

  // 차트 관련 엔드포인트
  @ApiOperation({ summary: 'Get statistics charts' })
  @ApiParam({ name: 'statisticsId', description: 'Statistics ID' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
  })
  @ApiOkResponse({
    description: 'Chart list',
    type: ChartListResponse,
  })
  @ApiNotFoundResponse({ description: 'Statistics not found' })
  @Get(':statisticsId/chart')
  async getCharts(
    @Param() { statisticsId }: StatisticsIdParam,
    @Query() { page, limit }: PaginationQuery,
  ) {
    return await this.statisticsService.getCharts(statisticsId, page, limit);
  }

  @ApiOperation({ summary: 'Create statistics chart' })
  @ApiParam({ name: 'statisticsId', description: 'Statistics ID' })
  @ApiBody({ type: CreateChartDto })
  @ApiCreatedResponse({
    description: 'Chart created successfully',
    type: CreateChartResponse,
  })
  @ApiNotFoundResponse({ description: 'Statistics not found' })
  @Post(':statisticsId/chart')
  @HttpCode(HttpStatus.CREATED)
  async createChart(
    @Param() { statisticsId }: StatisticsIdParam,
    @Body() createChartDto: CreateChartDto,
  ) {
    return await this.statisticsService.createChart(
      statisticsId,
      createChartDto,
    );
  }

  @ApiOperation({ summary: 'Get statistics chart details' })
  @ApiParam({ name: 'statisticsId', description: 'Statistics ID' })
  @ApiParam({ name: 'chartId', description: 'Chart ID' })
  @ApiOkResponse({
    description: 'Chart information',
    type: ChartResponse,
  })
  @ApiNotFoundResponse({ description: 'Statistics or Chart not found' })
  @Get(':statisticsId/chart/:chartId')
  async getChartById(
    @Param() { statisticsId }: StatisticsIdParam,
    @Param() { chartId }: ChartIdParam,
  ) {
    return await this.statisticsService.getChartById(statisticsId, chartId);
  }

  @ApiOperation({ summary: 'Update statistics chart' })
  @ApiParam({ name: 'statisticsId', description: 'Statistics ID' })
  @ApiParam({ name: 'chartId', description: 'Chart ID' })
  @ApiBody({ type: UpdateChartDto })
  @ApiOkResponse({
    description: 'Chart updated successfully',
    type: UpdateChartResponse,
  })
  @ApiNotFoundResponse({ description: 'Statistics or Chart not found' })
  @Put(':statisticsId/chart/:chartId')
  async updateChart(
    @Param() { statisticsId }: StatisticsIdParam,
    @Param() { chartId }: ChartIdParam,
    @Body() updateChartDto: UpdateChartDto,
  ) {
    return await this.statisticsService.updateChart(
      statisticsId,
      chartId,
      updateChartDto,
    );
  }

  @ApiOperation({ summary: 'Delete statistics chart' })
  @ApiParam({ name: 'statisticsId', description: 'Statistics ID' })
  @ApiParam({ name: 'chartId', description: 'Chart ID' })
  @ApiOkResponse({
    description: 'Chart deleted successfully',
    type: DeleteChartResponse,
  })
  @ApiNotFoundResponse({ description: 'Statistics or Chart not found' })
  @Delete(':statisticsId/chart/:chartId')
  async deleteChart(
    @Param() { statisticsId }: StatisticsIdParam,
    @Param() { chartId }: ChartIdParam,
  ) {
    return await this.statisticsService.deleteChart(statisticsId, chartId);
  }
}
