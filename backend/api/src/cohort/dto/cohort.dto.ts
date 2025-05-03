import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
  IsUUID,
} from 'class-validator';
import { CohortDefinition } from '../../types/type';

const cohortDefExample = {
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
  comparisonGroup: {
    containers: [
      {
        name: 'Male',
        filters: [
          {
            type: 'demographic',
            gender: '8507',
          },
        ],
      },
    ],
  },
};

export class CreateCohortDto {
  @ApiProperty({ description: 'Cohort name', example: 'Cohort name' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Cohort description',
    example: 'Cohort description',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Cohort definition',
    example: cohortDefExample,
  })
  @IsObject()
  cohortDefinition: CohortDefinition;

  @ApiPropertyOptional({
    description: 'Temporary cohort flag',
    default: false,
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  temporary?: boolean;
}

export class UpdateCohortDto {
  @ApiPropertyOptional({ description: 'Cohort name', example: 'Cohort name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Cohort description',
    example: 'Cohort description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Cohort definition',
    example: cohortDefExample,
  })
  @IsObject()
  @IsOptional()
  cohortDefinition?: CohortDefinition;
}

export class CohortIdParam {
  @ApiProperty({
    description: 'Cohort ID',
    example: '00000000-0000-0000-0000-000000000000',
  })
  @IsUUID()
  cohortId: string;
}

export class PaginationQuery {
  @ApiPropertyOptional({ description: 'Page number', default: 0, example: 0 })
  @IsOptional()
  page?: number = 0;
}

export class CohortResponse {
  @ApiProperty({
    description: 'Cohort ID',
    example: '00000000-0000-0000-0000-000000000000',
  })
  cohort_id: string;

  @ApiProperty({
    description: 'Cohort name',
    example: 'Cohort name',
  })
  name: string;

  @ApiProperty({
    description: 'Cohort description',
    example: 'Cohort description',
  })
  description: string;

  @ApiProperty({
    description: 'Cohort definition',
    example: JSON.stringify(cohortDefExample),
  })
  cohort_definition: string;

  @ApiProperty({
    description: 'Cohort author',
    example: '00000000-0000-0000-0000-000000000000',
  })
  author: string;

  @ApiProperty({
    description: 'Cohort created datetime',
    example: '2000-01-01 00:00:00',
  })
  created_at: string;

  @ApiProperty({
    description: 'Cohort updated datetime',
    example: '2000-01-01 00:00:00',
  })
  updated_at: string;
}

export class CohortStatisticsResponse {
  @ApiProperty({
    description: 'Gender statistics',
    example: [
      {
        concept_id: '8507',
        concept_name: 'MALE',
        count: 143623,
      },
      {
        concept_id: '8532',
        concept_name: 'FEMALE',
        count: 170916,
      },
    ],
  })
  gender: Array<{
    concept_id: string;
    concept_name: string;
    count: number;
  }>;

  @ApiProperty({
    description: 'Morality statistics',
    example: {
      alive: 302758,
      deceased: 11781,
    },
  })
  mortality: {
    alive: number;
    deceased: number;
  };

  @ApiProperty({
    description: 'Age statistics',
    example: {
      '80-89': 16888,
      '90-99': 36180,
      '100-109': 39356,
      '110-119': 39319,
      '120-129': 39239,
      '130-139': 39321,
      '140-149': 39253,
      '150-159': 39345,
      '160-169': 22575,
      '170-179': 2938,
      '180-189': 125,
    },
  })
  age: { [age_range: string]: number };

  @ApiProperty({
    description: 'Visit type statistics',
    example: {
      'Ambulatory Surgical Center': 100,
      'Emergency Room - Hospital': 300,
      'Unknown Visit Type': 200,
    },
  })
  visitType: { [concept_name: string]: number };

  @ApiProperty({
    description: 'Visit count statistics',
    example: {
      '1': 100,
      '2': 200,
      '3': 300,
    },
  })
  visitCount: { [count: string]: number };

  @ApiProperty({
    description: 'Top 10 Drug',
    example: {
      Metformin: 450,
    },
  })
  topTenDrug: { [concept_name: string]: number };

  @ApiProperty({
    description: 'Top 10 Condition',
    example: {
      Hypertension: 450,
    },
  })
  topTenCondition: { [concept_name: string]: number };

  @ApiProperty({
    description: 'Top 10 Procedure',
    example: {
      Appendectomy: 450,
    },
  })
  topTenProcedure: { [concept_name: string]: number };

  @ApiProperty({
    description: 'Top 10 Measurement',
    example: {
      'Blood Pressure': 450,
    },
  })
  topTenMeasurement: { [concept_name: string]: number };
}

export class CreateCohortResponse {
  @ApiProperty({
    description: 'Success message',
    example: 'Cohort created successfully',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Cohort ID',
    example: '00000000-0000-0000-0000-000000000000',
  })
  cohortId?: string;

  @ApiProperty({
    description: 'Person count per containers',
    type: [Number],
    example: [400, 200],
  })
  containerCounts: number[];
}

export class UpdateCohortResponse {
  @ApiProperty({
    description: 'Success message',
    example: 'Cohort updated successfully',
  })
  message: string;
}

export class DeleteCohortResponse {
  @ApiProperty({
    description: 'Success message',
    example: 'Cohort deleted successfully',
  })
  message: string;
}
