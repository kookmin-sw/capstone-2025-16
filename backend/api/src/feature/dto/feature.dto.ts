import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FeatureExtractionDto {
  @ApiProperty({
    description: 'Feature extraction cohort ID',
    example: '0196815f-1e2d-7db9-b630-a747f8393a2d',
  })
  cohort_id: string;

  @ApiProperty({
    description: 'Multiple',
    example: 'single',
  })
  multiple: string;

  @ApiProperty({
    description: 'Domain name',
    example: 'Condition',
  })
  domain_name: string;

  @ApiProperty({
    description: 'Rank',
    example: '1',
  })
  rank: string;

  @ApiProperty({
    description: 'Concept ID',
    example: '201826',
  })
  concept_id: string;

  @ApiProperty({
    description: 'Concept name',
    example: 'Hypertension',
  })
  concept_name: string | null;

  @ApiProperty({
    description: 'Influence value',
    example: 0.85,
  })
  influence: number;

  @ApiProperty({
    description: 'Execution time',
    example: '2023-01-01 12:00:00',
  })
  execution_time: string;

  @ApiProperty({
    description: 'F1 score',
    example: 0.95,
  })
  avg_f1_score: number;
}

export class FeatureListResponseDto {
  @ApiProperty({
    description: 'List of feature extractions',
    type: [FeatureExtractionDto],
  })
  features: FeatureExtractionDto[];

  @ApiProperty({
    description: 'Total number of results',
    example: 150,
  })
  total: number;

  @ApiProperty({
    description: 'Current page',
    example: 0,
  })
  page: number;

  @ApiProperty({
    description: 'Number of results per page',
    example: 100,
  })
  limit: number;
}

export class FeatureStatusResponseDto {
  @ApiProperty({
    description: 'Cohort ID',
    example: '0196815f-1e2d-7db9-b630-a747f8393a2d',
  })
  cohort_id: string;

  @ApiProperty({
    description: 'Status of feature extraction',
    example: 'completed',
    enum: ['running', 'pending', 'completed'],
  })
  status: 'running' | 'pending' | 'completed';

  @ApiProperty({
    description: 'Feature extraction data, if available',
    type: FeatureListResponseDto,
    required: false,
  })
  features?: FeatureListResponseDto;
}

export class FeatureRequestDto {
  @ApiProperty({
    description: 'Number of features to extract',
    example: 30,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  k: number;
}

export class FeaturePaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (0-based)',
    default: 0,
    example: 0,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 100,
    example: 100,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
