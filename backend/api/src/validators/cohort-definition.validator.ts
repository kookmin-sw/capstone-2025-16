import "reflect-metadata";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import {
  IsDateWithOperator,
  IsIdentifierWithOperator,
  IsNumberWithOperator,
  IsStringWithOperator,
} from "./custom-validators";
import {
  DomainType,
  NumberWithOperator,
  DateWithOperator,
  IdentifierWithOperator,
  StringWithOperator,
} from "../types/type";

// Concept and ConceptSet validators
export class ConceptValidator {
  @IsString()
  concept_id!: string;

  @IsString()
  concept_name!: string;

  @IsString()
  domain_id!: string;

  @IsString()
  vocabulary_id!: string;

  @IsString()
  concept_class_id!: string;

  @IsString()
  standard_concept!: string;

  @IsString()
  concept_code!: string;

  @IsString()
  valid_start_date!: string;

  @IsString()
  valid_end_date!: string;

  @IsOptional()
  @IsString()
  invalid_reason?: string;

  @IsOptional()
  @IsBoolean()
  isExcluded?: boolean;

  @IsOptional()
  @IsBoolean()
  includeDescendants?: boolean;

  @IsOptional()
  @IsBoolean()
  includeMapped?: boolean;
}

export class ConceptSetValidator {
  @IsString()
  conceptset_id!: string;

  @IsString()
  name!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConceptValidator)
  items!: ConceptValidator[];
}

// Base filter class for common properties
export class BaseFilterValidator {
  @IsOptional()
  @IsString()
  conceptset?: string;

  @IsOptional()
  @IsBoolean()
  first?: boolean;
}

// All domain-specific filter validators

// Condition Era filter validator
export class ConditionEraFilterValidator extends BaseFilterValidator {
  @IsEnum(["condition_era"] as const)
  type!: "condition_era";

  @IsOptional()
  @IsNumberWithOperator()
  startAge?: NumberWithOperator;

  @IsOptional()
  @IsNumberWithOperator()
  endAge?: NumberWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  gender?: IdentifierWithOperator;

  @IsOptional()
  @IsDateWithOperator()
  startDate?: DateWithOperator;

  @IsOptional()
  @IsDateWithOperator()
  endDate?: DateWithOperator;

  @IsOptional()
  @IsNumberWithOperator()
  conditionCount?: NumberWithOperator;

  @IsOptional()
  @IsNumberWithOperator()
  length?: NumberWithOperator;
}

// Condition Occurrence filter validator
export class ConditionOccurrenceFilterValidator extends BaseFilterValidator {
  @IsEnum(["condition_occurrence"] as const)
  type!: "condition_occurrence";

  @IsOptional()
  @IsNumberWithOperator()
  age?: NumberWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  gender?: IdentifierWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  conditionStatus?: IdentifierWithOperator;

  @IsOptional()
  @IsDateWithOperator()
  startDate?: DateWithOperator;

  @IsOptional()
  @IsDateWithOperator()
  endDate?: DateWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  conditionType?: IdentifierWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  visitType?: IdentifierWithOperator;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsIdentifierWithOperator()
  providerSpecialty?: IdentifierWithOperator;
}

// Death filter validator
export class DeathFilterValidator extends BaseFilterValidator {
  @IsEnum(["death"] as const)
  type!: "death";

  @IsOptional()
  @IsNumberWithOperator()
  age?: NumberWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  gender?: IdentifierWithOperator;

  @IsOptional()
  @IsDateWithOperator()
  date?: DateWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  deathType?: IdentifierWithOperator;

  @IsOptional()
  @IsString()
  cause?: string;
}

// Device Exposure filter validator
export class DeviceExposureFilterValidator extends BaseFilterValidator {
  @IsEnum(["device_exposure"] as const)
  type!: "device_exposure";

  @IsOptional()
  @IsNumberWithOperator()
  age?: NumberWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  gender?: IdentifierWithOperator;

  @IsOptional()
  @IsDateWithOperator()
  startDate?: DateWithOperator;

  @IsOptional()
  @IsDateWithOperator()
  endDate?: DateWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  deviceType?: IdentifierWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  visitType?: IdentifierWithOperator;

  @IsOptional()
  @IsStringWithOperator()
  uniqueDeviceId?: StringWithOperator;

  @IsOptional()
  @IsNumberWithOperator()
  quantity?: NumberWithOperator;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsIdentifierWithOperator()
  providerSpecialty?: IdentifierWithOperator;
}

// Dose Era filter validator
export class DoseEraFilterValidator extends BaseFilterValidator {
  @IsEnum(["dose_era"] as const)
  type!: "dose_era";

  @IsOptional()
  @IsNumberWithOperator()
  startAge?: NumberWithOperator;

  @IsOptional()
  @IsNumberWithOperator()
  endAge?: NumberWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  gender?: IdentifierWithOperator;

  @IsOptional()
  @IsDateWithOperator()
  startDate?: DateWithOperator;

  @IsOptional()
  @IsDateWithOperator()
  endDate?: DateWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  doseUnit?: IdentifierWithOperator;

  @IsOptional()
  @IsNumberWithOperator()
  length?: NumberWithOperator;

  @IsOptional()
  @IsNumberWithOperator()
  doseValue?: NumberWithOperator;
}

// Drug Era filter validator
export class DrugEraFilterValidator extends BaseFilterValidator {
  @IsEnum(["drug_era"] as const)
  type!: "drug_era";

  @IsOptional()
  @IsNumberWithOperator()
  startAge?: NumberWithOperator;

  @IsOptional()
  @IsNumberWithOperator()
  endAge?: NumberWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  gender?: IdentifierWithOperator;

  @IsOptional()
  @IsDateWithOperator()
  startDate?: DateWithOperator;

  @IsOptional()
  @IsDateWithOperator()
  endDate?: DateWithOperator;

  @IsOptional()
  @IsNumberWithOperator()
  length?: NumberWithOperator;

  @IsOptional()
  @IsNumberWithOperator()
  eraExposureCount?: NumberWithOperator;
}

// Drug Exposure filter validator
export class DrugExposureFilterValidator extends BaseFilterValidator {
  @IsEnum(["drug_exposure"] as const)
  type!: "drug_exposure";

  @IsOptional()
  @IsNumberWithOperator()
  age?: NumberWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  gender?: IdentifierWithOperator;

  @IsOptional()
  @IsDateWithOperator()
  startDate?: DateWithOperator;

  @IsOptional()
  @IsDateWithOperator()
  endDate?: DateWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  drugType?: IdentifierWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  visitType?: IdentifierWithOperator;

  @IsOptional()
  @IsStringWithOperator()
  stopReason?: StringWithOperator;

  @IsOptional()
  @IsNumberWithOperator()
  refill?: NumberWithOperator;

  @IsOptional()
  @IsNumberWithOperator()
  quantity?: NumberWithOperator;

  @IsOptional()
  @IsNumberWithOperator()
  daysSupply?: NumberWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  routeType?: IdentifierWithOperator;

  @IsOptional()
  @IsNumberWithOperator()
  effectiveDose?: NumberWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  doseUnit?: IdentifierWithOperator;

  @IsOptional()
  @IsStringWithOperator()
  lotNumber?: StringWithOperator;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsIdentifierWithOperator()
  providerSpecialty?: IdentifierWithOperator;
}

// Measurement filter validator
export class MeasurementFilterValidator extends BaseFilterValidator {
  @IsEnum(["measurement"] as const)
  type!: "measurement";

  @IsOptional()
  @IsNumberWithOperator()
  age?: NumberWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  gender?: IdentifierWithOperator;

  @IsOptional()
  @IsDateWithOperator()
  date?: DateWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  measurementType?: IdentifierWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  visitType?: IdentifierWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  operatorType?: IdentifierWithOperator;

  @IsOptional()
  @IsNumberWithOperator()
  valueAsNumber?: NumberWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  valueAsConcept?: IdentifierWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  unitType?: IdentifierWithOperator;

  @IsOptional()
  @IsBoolean()
  abnormal?: boolean;

  @IsOptional()
  @IsNumberWithOperator()
  rangeLow?: NumberWithOperator;

  @IsOptional()
  @IsNumberWithOperator()
  rangeHigh?: NumberWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  providerSpecialty?: IdentifierWithOperator;

  @IsOptional()
  @IsString()
  source?: string;
}

// Observation filter validator
export class ObservationFilterValidator extends BaseFilterValidator {
  @IsEnum(["observation"] as const)
  type!: "observation";

  @IsOptional()
  @IsNumberWithOperator()
  age?: NumberWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  gender?: IdentifierWithOperator;

  @IsOptional()
  @IsDateWithOperator()
  date?: DateWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  observationType?: IdentifierWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  visitType?: IdentifierWithOperator;

  @IsOptional()
  @IsNumberWithOperator()
  valueAsNumber?: NumberWithOperator;

  @IsOptional()
  @IsStringWithOperator()
  valueAsString?: StringWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  valueAsConcept?: IdentifierWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  qualifierType?: IdentifierWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  unitType?: IdentifierWithOperator;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsIdentifierWithOperator()
  providerSpecialty?: IdentifierWithOperator;
}

// Observation Period filter validator
export class ObservationPeriodFilterValidator extends BaseFilterValidator {
  @IsEnum(["observation_period"] as const)
  type!: "observation_period";

  @IsOptional()
  @IsNumberWithOperator()
  startAge?: NumberWithOperator;

  @IsOptional()
  @IsNumberWithOperator()
  endAge?: NumberWithOperator;

  @IsOptional()
  @IsDateWithOperator()
  startDate?: DateWithOperator;

  @IsOptional()
  @IsDateWithOperator()
  endDate?: DateWithOperator;

  @IsOptional()
  @IsNumberWithOperator()
  length?: NumberWithOperator;
}

// Procedure Occurrence filter validator
export class ProcedureOccurrenceFilterValidator extends BaseFilterValidator {
  @IsEnum(["procedure_occurrence"] as const)
  type!: "procedure_occurrence";

  @IsOptional()
  @IsNumberWithOperator()
  age?: NumberWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  gender?: IdentifierWithOperator;

  @IsOptional()
  @IsDateWithOperator()
  startDate?: DateWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  procedureType?: IdentifierWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  visitType?: IdentifierWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  modifierType?: IdentifierWithOperator;

  @IsOptional()
  @IsNumberWithOperator()
  quantity?: NumberWithOperator;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsIdentifierWithOperator()
  providerSpecialty?: IdentifierWithOperator;
}

// Specimen filter validator
export class SpecimenFilterValidator extends BaseFilterValidator {
  @IsEnum(["specimen"] as const)
  type!: "specimen";

  @IsOptional()
  @IsNumberWithOperator()
  age?: NumberWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  gender?: IdentifierWithOperator;

  @IsOptional()
  @IsDateWithOperator()
  date?: DateWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  specimenType?: IdentifierWithOperator;

  @IsOptional()
  @IsNumberWithOperator()
  quantity?: NumberWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  unitType?: IdentifierWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  anatomicSiteType?: IdentifierWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  diseaseStatus?: IdentifierWithOperator;
}

// Visit Occurrence filter validator
export class VisitOccurrenceFilterValidator extends BaseFilterValidator {
  @IsEnum(["visit_occurrence"] as const)
  type!: "visit_occurrence";

  @IsOptional()
  @IsNumberWithOperator()
  age?: NumberWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  gender?: IdentifierWithOperator;

  @IsOptional()
  @IsDateWithOperator()
  startDate?: DateWithOperator;

  @IsOptional()
  @IsDateWithOperator()
  endDate?: DateWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  visitType?: IdentifierWithOperator;

  @IsOptional()
  @IsNumberWithOperator()
  length?: NumberWithOperator;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsIdentifierWithOperator()
  providerSpecialty?: IdentifierWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  placeOfService?: IdentifierWithOperator;
}

// Demographic filter validator
export class DemographicFilterValidator extends BaseFilterValidator {
  @IsEnum(["demographic"] as const)
  type!: "demographic";

  @IsOptional()
  @IsNumberWithOperator()
  age?: NumberWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  gender?: IdentifierWithOperator;

  @IsOptional()
  @IsDateWithOperator()
  startDate?: DateWithOperator;

  @IsOptional()
  @IsDateWithOperator()
  endDate?: DateWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  raceType?: IdentifierWithOperator;

  @IsOptional()
  @IsIdentifierWithOperator()
  ethnicityType?: IdentifierWithOperator;
}

// Combined filter validator that can validate any filter type
export class FilterValidator {
  @ValidateNested()
  @Type((options) => {
    // Get the raw data to check the type field
    const rawObj = options?.object;
    if (!rawObj || typeof rawObj !== "object") return Object;

    // Return appropriate validator class based on type
    switch (rawObj.type as DomainType) {
      case "condition_era":
        return ConditionEraFilterValidator;
      case "condition_occurrence":
        return ConditionOccurrenceFilterValidator;
      case "death":
        return DeathFilterValidator;
      case "device_exposure":
        return DeviceExposureFilterValidator;
      case "dose_era":
        return DoseEraFilterValidator;
      case "drug_era":
        return DrugEraFilterValidator;
      case "drug_exposure":
        return DrugExposureFilterValidator;
      case "measurement":
        return MeasurementFilterValidator;
      case "observation":
        return ObservationFilterValidator;
      case "observation_period":
        return ObservationPeriodFilterValidator;
      case "procedure_occurrence":
        return ProcedureOccurrenceFilterValidator;
      case "specimen":
        return SpecimenFilterValidator;
      case "visit_occurrence":
        return VisitOccurrenceFilterValidator;
      case "demographic":
        return DemographicFilterValidator;
      default:
        return Object;
    }
  })
  filter!:
    | ConditionEraFilterValidator
    | ConditionOccurrenceFilterValidator
    | DeathFilterValidator
    | DeviceExposureFilterValidator
    | DoseEraFilterValidator
    | DrugEraFilterValidator
    | DrugExposureFilterValidator
    | MeasurementFilterValidator
    | ObservationFilterValidator
    | ObservationPeriodFilterValidator
    | ProcedureOccurrenceFilterValidator
    | SpecimenFilterValidator
    | VisitOccurrenceFilterValidator
    | DemographicFilterValidator;
}

// First container doesn't have an operator
export class FirstContainerValidator {
  @IsString()
  name!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FilterValidator)
  filters!: FilterValidator[];
}

// Subsequent containers must have an operator
export class SubsequentContainerValidator {
  @IsEnum(["AND", "OR", "NOT"] as const)
  operator!: "AND" | "OR" | "NOT";

  @IsString()
  name!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FilterValidator)
  filters!: FilterValidator[];
}

// Base group validator
export class BaseGroupValidator {
  @ValidateNested()
  @Type(() => FirstContainerValidator)
  containers!: [FirstContainerValidator, ...SubsequentContainerValidator[]];
}

// First group validator
export class FirstGroupValidator extends BaseGroupValidator {
  @IsOptional()
  @IsBoolean()
  mergeByPersonId?: boolean;
}

// Subsequent group validator
export class SubsequentGroupValidator extends BaseGroupValidator {
  @IsOptional()
  @IsBoolean()
  not?: boolean;
}

// Cohort definition validator
export class CohortDefinitionValidator {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConceptSetValidator)
  conceptsets?: ConceptSetValidator[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type((options) => {
    const index = options?.object?.cohort?.indexOf(options.object);
    return index === 0 ? FirstGroupValidator : SubsequentGroupValidator;
  })
  cohort!: [FirstGroupValidator, ...SubsequentGroupValidator[]];
}
