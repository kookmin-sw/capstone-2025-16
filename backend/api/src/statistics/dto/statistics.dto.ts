import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsObject,
  IsString,
  IsUUID,
  IsOptional,
  IsNumber,
  ValidateIf,
} from 'class-validator';
import {
  BarChartCohortDefinition,
  BoxPlotCountBy,
  CohortDefinition,
  Identifier,
} from 'src/types/type';

// 통계 생성 DTO - 소스 정보만 포함
export class CreateStatisticsDto {
  @ApiProperty({
    description: 'Statistics name',
    example: 'Statistics name',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Statistics description',
    example: 'Statistics description',
  })
  @IsString()
  description: string;

  @ApiPropertyOptional({
    description: 'Cohort IDs',
    example: ['00000000-0000-0000-0000-000000000000'],
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @ValidateIf((o) => !o.personId)
  cohortIds?: Identifier[];

  @ApiPropertyOptional({
    description: 'Person ID',
    example: '1',
  })
  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.cohortIds)
  personId?: Identifier;
}

export class UpdateStatisticsDto {
  @ApiPropertyOptional({
    description: 'Statistics name',
    example: 'Updated Statistics name',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Statistics description',
    example: 'Updated Statistics description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Cohort IDs',
    example: ['00000000-0000-0000-0000-000000000000'],
    type: [String],
  })
  @IsArray()
  @IsOptional()
  cohortIds?: Identifier[];

  @ApiPropertyOptional({
    description: 'Person ID',
    example: '1',
  })
  @IsString()
  @IsOptional()
  personId?: Identifier;
}

// 차트 관련 DTO 추가
export class CreateChartDto {
  @ApiProperty({
    description: 'Chart name',
    example: 'Chart name',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Chart description',
    example: 'Chart description',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Chart Type',
    example: 'bar',
  })
  @IsEnum(['bar', 'boxplot'])
  type: string;

  @ApiProperty({
    description: 'Custom groups',
    example: [
      {
        name: 'Group 1',
        definition: {
          conceptsets: [],
          initialGroup: {
            containers: [
              {
                name: 'Measurement',
                filters: [
                  {
                    type: 'condition_era',
                  },
                ],
              },
            ],
          },
        },
      },
    ],
  })
  @IsArray()
  groups: {
    name: string;
    definition: BarChartCohortDefinition | CohortDefinition;
  }[];

  @ApiPropertyOptional({
    description: 'Statistics count by (required for boxplot type)',
    example: {
      concept: '123123',
      age: 1,
      date: '2023-01-01',
      value: {
        gt: 1,
      },
    },
  })
  @ValidateIf((o) => o.type === 'boxplot')
  @IsObject()
  countBy?: BoxPlotCountBy;
}

export class UpdateChartDto {
  @ApiPropertyOptional({
    description: 'Chart name',
    example: 'Updated Chart name',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Chart description',
    example: 'Updated Chart description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Chart Type',
    example: 'bar',
  })
  @IsEnum(['bar', 'boxplot'])
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({
    description: 'Custom groups',
    example: [
      {
        name: 'Group 1',
        definition: {
          conceptsets: [],
          initialGroup: {
            containers: [
              {
                name: 'Measurement',
                filters: [
                  {
                    type: 'condition_era',
                  },
                ],
              },
            ],
          },
        },
      },
    ],
  })
  @IsArray()
  @IsOptional()
  groups?: {
    name: string;
    definition: BarChartCohortDefinition | CohortDefinition;
  }[];

  @ApiPropertyOptional({
    description: 'Statistics count by',
    example: {
      concept: '123123',
      age: 1,
      date: '2023-01-01',
      value: {
        gt: 1,
      },
    },
  })
  @IsObject()
  @IsOptional()
  countBy?: BoxPlotCountBy;
}

export class StatisticsIdParam {
  @ApiProperty({
    description: 'Statistics ID',
    example: '00000000-0000-0000-0000-000000000000',
  })
  @IsUUID('all')
  statisticsId: string;
}

export class ChartIdParam {
  @ApiProperty({
    description: 'Chart ID',
    example: '00000000-0000-0000-0000-000000000000',
  })
  @IsUUID('all')
  chartId: string;
}

export class PaginationQuery {
  @ApiPropertyOptional({ description: 'Page number', default: 0, example: 0 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 50,
    example: 50,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

export class StatisticsResponse {
  @ApiProperty({
    description: 'Statistics ID',
    example: '00000000-0000-0000-0000-000000000000',
  })
  statistics_id: string;

  @ApiProperty({
    description: 'Statistics name',
    example: 'My Statistics',
  })
  name: string;

  @ApiProperty({
    description: 'Statistics description',
    example: 'This is my statistics description',
  })
  description: string;

  @ApiPropertyOptional({
    description: 'Cohort IDs',
    example:
      '00000000-0000-0000-0000-000000000000,00000000-0000-0000-0000-000000000000,00000000-0000-0000-0000-000000000000',
    type: String,
  })
  cohort_ids?: string;

  @ApiPropertyOptional({
    description: 'Person ID',
    example: '1',
  })
  person_id?: Identifier;

  @ApiProperty({
    description: 'Statistics author',
    example: '00000000-0000-0000-0000-000000000000',
  })
  author: string;

  @ApiProperty({
    description: 'Statistics creation date',
    example: '2023-01-01 00:00:00',
  })
  created_at: string;

  @ApiProperty({
    description: 'Statistics last update date',
    example: '2023-01-01 00:00:00',
  })
  updated_at: string;
}

export class ChartResponse {
  @ApiProperty({
    description: 'Chart ID',
    example: '00000000-0000-0000-0000-000000000000',
  })
  chart_id: string;

  @ApiProperty({
    description: 'Statistics ID',
    example: '00000000-0000-0000-0000-000000000000',
  })
  statistics_id: string;

  @ApiProperty({
    description: 'Chart name',
    example: 'My Chart',
  })
  name: string;

  @ApiProperty({
    description: 'Chart description',
    example: 'This is my chart description',
  })
  description: string;

  @ApiProperty({
    description: 'Chart type',
    example: 'bar',
  })
  type: string;

  @ApiProperty({
    description: 'Chart definition (JSON string)',
    example:
      '{"groups":[{"name":"Group 1","definition":{}}],"countBy":{"concept":"123123"}}',
  })
  definition: string;

  @ApiProperty({
    description: 'Chart Result (JSON string)',
    example:
      '[{"cohortId":"00000000-0000-0000-0000-000000000000","values":[10,20,30]}]',
  })
  result: string;

  @ApiProperty({
    description: 'Chart author',
    example: '00000000-0000-0000-0000-000000000000',
  })
  author: string;

  @ApiProperty({
    description: 'Chart creation date',
    example: '2023-01-01 00:00:00',
  })
  created_at: string;

  @ApiProperty({
    description: 'Chart last update date',
    example: '2023-01-01 00:00:00',
  })
  updated_at: string;
}

export class StatisticsListResponse {
  @ApiProperty({
    description: 'Statistics list',
    type: [StatisticsResponse],
  })
  statistics: StatisticsResponse[];

  @ApiProperty({
    description: 'Total number of statistics',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 0,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 50,
  })
  limit: number;
}

export class ChartListResponse {
  @ApiProperty({
    description: 'Chart list',
    type: [ChartResponse],
  })
  charts: ChartResponse[];

  @ApiProperty({
    description: 'Total number of charts',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 0,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 50,
  })
  limit: number;
}

export class CreateStatisticsResponse {
  @ApiProperty({
    description: 'Success message',
    example: 'Statistics created successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Statistics ID',
    example: '00000000-0000-0000-0000-000000000000',
  })
  statisticsId: string;
}

export class CreateChartResponse {
  @ApiProperty({
    description: 'Success message',
    example: 'Chart created successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Chart ID',
    example: '00000000-0000-0000-0000-000000000000',
  })
  chartId: string;
}

export class UpdateStatisticsResponse {
  @ApiProperty({
    description: 'Success message',
    example: 'Statistics updated successfully',
  })
  message: string;
}

export class UpdateChartResponse {
  @ApiProperty({
    description: 'Success message',
    example: 'Chart updated successfully',
  })
  message: string;
}

export class DeleteStatisticsResponse {
  @ApiProperty({
    description: 'Success message',
    example: 'Statistics deleted successfully',
  })
  message: string;
}

export class DeleteChartResponse {
  @ApiProperty({
    description: 'Success message',
    example: 'Chart deleted successfully',
  })
  message: string;
}
