import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumberString } from 'class-validator';
import { Death, Person } from 'src/db/types';

export class PersonIdParam {
  @ApiProperty({ description: 'Person ID' })
  @IsNumberString()
  personId: string;
}

class PersonClass implements Person {
  @ApiProperty({ description: 'Person ID' })
  person_id: string;

  @ApiProperty({ description: 'Gender concept ID' })
  gender_concept_id: string;

  @ApiProperty({ description: 'Year of birth' })
  year_of_birth: number;

  @ApiPropertyOptional({ description: 'Month of birth' })
  month_of_birth?: number;

  @ApiPropertyOptional({ description: 'Day of birth' })
  day_of_birth?: number;

  @ApiPropertyOptional({ description: 'Birth date and time' })
  birth_datetime?: string;

  @ApiProperty({ description: 'Race concept ID' })
  race_concept_id: string;

  @ApiProperty({ description: 'Ethnicity concept ID' })
  ethnicity_concept_id: string;

  @ApiPropertyOptional({ description: 'Location ID' })
  location_id?: string;

  @ApiPropertyOptional({ description: 'Provider ID' })
  provider_id?: string;

  @ApiPropertyOptional({ description: 'Care site ID' })
  care_site_id?: string;
  person_source_value?: string;

  @ApiPropertyOptional({ description: 'Gender source value' })
  gender_source_value?: string;

  @ApiPropertyOptional({ description: 'Gender source concept ID' })
  gender_source_concept_id?: string;

  @ApiPropertyOptional({ description: 'Race source value' })
  race_source_value?: string;

  @ApiPropertyOptional({ description: 'Race source concept ID' })
  race_source_concept_id?: string;

  @ApiPropertyOptional({ description: 'Ethnicity source value' })
  ethnicity_source_value?: string;

  @ApiPropertyOptional({ description: 'Ethnicity source concept ID' })
  ethnicity_source_concept_id?: string;
}

class DeathClass implements Death {
  @ApiProperty({ description: 'Person ID' })
  person_id: string;

  @ApiProperty({ description: 'Death date' })
  death_date: string;

  @ApiPropertyOptional({ description: 'Death date and time' })
  death_datetime?: string;

  @ApiPropertyOptional({ description: 'Death type concept ID' })
  death_type_concept_id?: string;

  @ApiPropertyOptional({ description: 'Cause of death source value' })
  cause_of_death_source_value?: string;

  @ApiPropertyOptional({ description: 'Cause of death source concept ID' })
  cause_of_death_source_concept_id?: string;
}

export class PersonResponse {
  @ApiProperty({
    description: 'Person information',
    example: {
      person_id: '123456',
      gender_concept_id: '123456',
      year_of_birth: 1990,
      month_of_birth: 1,
      day_of_birth: 1,
      birth_datetime: '1990-01-01 00:00:00',
      race_concept_id: '123456',
      ethnicity_concept_id: '123456',
      location_id: '123456',
      provider_id: '123456',
      care_site_id: '123456',
      person_source_value: '123456',
      gender_source_value: '123456',
      gender_source_concept_id: '123456',
      race_source_value: '123456',
      race_source_concept_id: '123456',
      ethnicity_source_value: '123456',
      ethnicity_source_concept_id: '123456',
    },
  })
  info: PersonClass;

  @ApiProperty({
    description: 'Death information',
    example: {
      person_id: '123456',
      death_date: '2020-01-01',
      death_datetime: '2020-01-01 00:00:00',
      death_type_concept_id: '123456',
      cause_of_death_source_value: '123456',
      cause_of_death_source_concept_id: '123456',
    },
  })
  death?: DeathClass;
}

export class VisitOccurrenceClass {
  @ApiProperty({ description: 'Visit occurrence ID' })
  visit_occurrence_id: string;

  @ApiProperty({ description: 'Person ID' })
  person_id: string;

  @ApiProperty({ description: 'Visit concept ID' })
  visit_concept_id: string;

  @ApiProperty({ description: 'Visit start date' })
  visit_start_date: string;

  @ApiPropertyOptional({ description: 'Visit start date and time' })
  visit_start_datetime?: string;

  @ApiProperty({ description: 'Visit end date' })
  visit_end_date: string;

  @ApiPropertyOptional({ description: 'Visit end date and time' })
  visit_end_datetime?: string;

  @ApiProperty({ description: 'Visit type concept ID' })
  visit_type_concept_id: string;

  @ApiPropertyOptional({ description: 'Visit type source value' })
  provider_id?: string;

  @ApiPropertyOptional({ description: 'Visit type source value' })
  care_site_id?: string;

  @ApiPropertyOptional({ description: 'Visit type source value' })
  visit_source_value?: string;

  @ApiPropertyOptional({ description: 'Visit source concept ID' })
  visit_source_concept_id?: string;

  @ApiPropertyOptional({ description: 'Visit source value' })
  admitted_from_concept_id?: string;

  @ApiPropertyOptional({ description: 'Admitted from source value' })
  admitted_from_source_value?: string;

  @ApiPropertyOptional({ description: 'Admitted from source concept ID' })
  discharged_to_concept_id?: string;

  @ApiPropertyOptional({ description: 'Discharged to source value' })
  discharged_to_source_value?: string;

  @ApiPropertyOptional({ description: 'Previous visit occurrence ID' })
  preceding_visit_occurrence_id?: string;
}

export class PersonStatisticsResponse {
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
