import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchConceptQueryDto {
  @ApiPropertyOptional({
    description: 'Search query for concept names',
    example: 'Diabetes',
  })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiPropertyOptional({
    description: 'Page number (0-based)',
    default: 0,
    example: 0,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number = 0;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 100,
    example: 100,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 100;
}

export class ConceptResponseDto {
  @ApiProperty({
    description: 'Concept ID',
    example: '201826',
  })
  concept_id: string;

  @ApiProperty({
    description: 'Concept name',
    example: 'Type 2 diabetes mellitus',
  })
  concept_name: string;

  @ApiProperty({
    description: 'Concept code',
    example: 'E11',
  })
  concept_code: string;

  @ApiProperty({
    description: 'Vocabulary ID',
    example: 'ICD10CM',
  })
  vocabulary_id: string;

  @ApiProperty({
    description: 'Domain ID',
    example: 'Condition',
  })
  domain_id: string;
}

export class ConceptSearchResponseDto {
  @ApiProperty({
    description: 'Array of concepts',
    type: [ConceptResponseDto],
  })
  concepts: ConceptResponseDto[];

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
