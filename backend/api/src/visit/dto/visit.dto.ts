import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumberString } from 'class-validator';
import {
  CareSite,
  ConditionEra,
  ConditionOccurrence,
  DeviceExposure,
  DrugExposure,
  Location,
  Measurement,
  Observation,
  Person,
  ProcedureOccurrence,
  Provider,
  Specimen,
  VisitOccurrence,
} from 'src/db/types';

export class VisitIdParam {
  @ApiProperty({ description: 'Visit Occurrence ID' })
  @IsNumberString()
  visitId: string;
}

export class VisitDetailResponse {
  @ApiProperty({ description: 'Visit information' })
  visitInfo: VisitOccurrence;

  @ApiPropertyOptional({ description: 'Person information' })
  person?: Person;

  @ApiPropertyOptional({ description: 'Care site information' })
  careSite?: CareSite;

  @ApiPropertyOptional({ description: 'Provider information' })
  provider?: Provider;

  @ApiPropertyOptional({ description: 'Location information' })
  location?: Location;

  @ApiProperty({
    description: 'Condition occurrences during this visit',
  })
  conditions: ConditionOccurrence[];

  @ApiProperty({ description: 'Condition eras related to this visit' })
  conditionEras: ConditionEra[];

  @ApiProperty({ description: 'Drug exposures during this visit' })
  drugs: DrugExposure[];

  @ApiProperty({
    description: 'Procedures performed during this visit',
  })
  procedures: ProcedureOccurrence[];

  @ApiProperty({ description: 'Measurements taken during this visit' })
  measurements: Measurement[];

  @ApiProperty({ description: 'Observations made during this visit' })
  observations: Observation[];

  @ApiProperty({ description: 'Specimens collected during this visit' })
  specimens: Specimen[];

  @ApiProperty({ description: 'Device exposures during this visit' })
  devices: DeviceExposure[];
}
