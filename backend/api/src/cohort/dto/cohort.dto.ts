import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
  IsUUID,
} from 'class-validator';
import { CohortDefinition } from '../../types/type';

export class CreateCohortDto {
  @ApiProperty({ description: '코호트 이름' })
  @IsString()
  name: string;

  @ApiProperty({ description: '코호트 설명' })
  @IsString()
  description: string;

  @ApiProperty({ description: '코호트 정의' })
  @IsObject()
  cohortDefinition: CohortDefinition;

  @ApiPropertyOptional({ description: '임시 코호트 여부', default: false })
  @IsBoolean()
  @IsOptional()
  temporary?: boolean;
}

export class UpdateCohortDto {
  @ApiPropertyOptional({ description: '코호트 이름' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '코호트 설명' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '코호트 정의' })
  @IsObject()
  @IsOptional()
  cohortDefinition?: CohortDefinition;
}

export class CohortIdParam {
  @ApiProperty({ description: '코호트 ID' })
  @IsUUID()
  cohortId: string;
}

export class PaginationQuery {
  @ApiPropertyOptional({ description: '페이지 번호', default: 0 })
  @IsOptional()
  page?: number = 0;
}

export class CohortResponse {
  @ApiProperty()
  cohort_id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  cohort_definition: string;

  @ApiProperty()
  author: string;

  @ApiProperty()
  created_at: string;

  @ApiProperty()
  updated_at: string;
}

export class CohortStatisticsResponse {
  @ApiProperty()
  gender: Array<{
    concept_id: string;
    concept_name: string;
    count: string;
  }>;

  @ApiProperty()
  mortality: {
    alive: string;
    deceased: string;
  };

  @ApiProperty()
  age: Array<{
    age_start: string;
    age_end: string;
    count: string;
  }>;
}

export class CreateCohortResponse {
  @ApiProperty()
  message: string;

  @ApiProperty()
  cohortId: string;

  @ApiProperty({ type: [Number] })
  containerCounts: number[];
}

export class UpdateCohortResponse {
  @ApiProperty()
  message: string;
}

export class DeleteCohortResponse {
  @ApiProperty()
  message: string;
}
