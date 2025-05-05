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

  @ApiProperty({
    description: 'Statistics Type',
    example: 'bar',
  })
  @IsEnum(['bar', 'boxplot'])
  type: string;

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
  @ValidateIf((o) => o.type === 'boxplot')
  @IsObject()
  countBy?: BoxPlotCountBy;
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
    description: 'Statistics Type',
    example: 'bar',
  })
  @IsEnum(['bar', 'boxplot'])
  @IsOptional()
  type?: string;

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

  @ApiPropertyOptional({
    description: 'Custom groups',
    example: [
      {
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
    ],
  })
  @IsArray()
  @IsOptional()
  groups?: (BarChartCohortDefinition | CohortDefinition)[];

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

export class PaginationQuery {
  @ApiPropertyOptional({ description: 'Page number', default: 0, example: 0 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number = 0;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 50,
    example: 50,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 50;
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

  @ApiProperty({
    description: 'Statistics type',
    example: 'bar',
  })
  type: string;

  @ApiProperty({
    description: 'Statistics definition',
  })
  definition: string;

  @ApiProperty({
    description: 'Statistics Result',
  })
  result: string;

  @ApiProperty({
    description: 'Count by for BoxPlot statistics',
    example: {
      concept: '123123',
      age: 1,
      date: '2023-01-01',
      value: {
        gt: 1,
      },
    },
  })
  count_by?: string;

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

export class UpdateStatisticsResponse {
  @ApiProperty({
    description: 'Success message',
    example: 'Statistics updated successfully',
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
