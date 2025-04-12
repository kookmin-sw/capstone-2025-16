import { Type } from "class-transformer";
import {
  IsString,
  IsOptional,
  IsDate,
  IsArray,
  ValidateNested,
  IsBoolean,
  ValidateIf,
} from "class-validator";
import { CohortDefinitionValidator } from "../validators/cohort-definition.validator";

// Request DTOs
export class CreateCohortRequestDto {
  @ValidateIf((o) => !o.temporary)
  @IsString()
  name?: string;

  @ValidateIf((o) => !o.temporary)
  @IsString()
  description?: string;

  @ValidateNested()
  @Type(() => CohortDefinitionValidator)
  cohortDefinition?: CohortDefinitionValidator;

  @IsOptional()
  @IsBoolean()
  temporary?: boolean;
}

export class UpdateCohortRequestDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CohortDefinitionValidator)
  cohortDefinition?: CohortDefinitionValidator;
}

export class CohortIdParamDto {
  @IsString()
  cohortId!: string;
}
