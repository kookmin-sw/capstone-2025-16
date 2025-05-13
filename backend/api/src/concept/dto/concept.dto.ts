import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum DomainType {
  MEASUREMENT = 'Measurement',
  DRUG = 'Drug',
  OBSERVATION = 'Observation',
  NOTE = 'Note',
  PROCEDURE = 'Procedure',
  MEAS_VALUE = 'Meas Value',
  DEVICE = 'Device',
  CONDITION = 'Condition',
  METADATA = 'Metadata',
  SPEC_ANATOMIC_SITE = 'Spec Anatomic Site',
  SPECIMEN = 'Specimen',
  TYPE_CONCEPT = 'Type Concept',
  UNIT = 'Unit',
  PROVIDER = 'Provider',
  RACE = 'Race',
  RELATIONSHIP = 'Relationship',
  GEOGRAPHY = 'Geography',
  ROUTE = 'Route',
  LANGUAGE = 'Language',
  VISIT = 'Visit',
  PLAN = 'Plan',
  SPONSOR = 'Sponsor',
  PAYER = 'Payer',
  PLAN_STOP_REASON = 'Plan Stop Reason',
  GENDER = 'Gender',
  COST = 'Cost',
  EPISODE = 'Episode',
  REVENUE_CODE = 'Revenue Code',
  CONDITION_STATUS = 'Condition Status',
  REGIMEN = 'Regimen',
  CONDITION_PROCEDURE = 'Condition/Procedure',
  CONDITION_OBS = 'Condition/Obs',
  OBS_PROCEDURE = 'Obs/Procedure',
  CURRENCY = 'Currency',
  ETHNICITY = 'Ethnicity',
  MEAS_PROCEDURE = 'Meas/Procedure',
  MEAS_VALUE_OPERATOR = 'Meas Value Operator',
  CONDITION_MEAS = 'Condition/Meas',
  DEVICE_PROCEDURE = 'Device/Procedure',
  DRUG_PROCEDURE = 'Drug/Procedure',
  DEVICE_DRUG = 'Device/Drug',
  PLACE_OF_SERVICE = 'Place of Service',
  CONDITION_DEVICE = 'Condition/Device',
}

export class SearchConceptQueryDto {
  @ApiPropertyOptional({
    description: 'Search query for concept names',
    example: 'Diabetes',
  })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiPropertyOptional({
    description: 'Domain ID',
    example: 'Condition',
    enum: DomainType,
  })
  @IsEnum(DomainType)
  @IsOptional()
  domain?: DomainType;

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
    enum: DomainType,
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
