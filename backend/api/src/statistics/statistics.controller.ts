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
  @ApiResponse({
    status: 200,
    description: 'Statistics list',
    type: StatisticsListResponse,
  })
  @Get()
  async getStatistics(@Query() { page, limit }: PaginationQuery) {
    return await this.statisticsService.getStatistics(page, limit);
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
}
