JSON_OUTPUT_EXAMPLE = """
{
  "PrimaryCriteria": {
    "CriteriaList": [
      {
        "CriteriaType": "ProcedureOccurrence",
        "ConceptName": "hemodialysis",
        "ProcedureOccurrence": {}
      }
    ],
    "PrimaryCriteriaLimit": {
      "Type": 0,
      "Count": 1
    }
  },
  "AdditionalCriteria": {
    "Type": "ALL",
    "CriteriaList": [],
    "DemographicCriteriaList": [],
    "Groups": [
      {
        "Type": "ALL",
        "CriteriaList": [
          {
            "Criteria": {
              "CriteriaType": "ObservationPeriod",
              "AgeAtStart": {
                "Value": 18,
                "Op": "gte"
              },
              "ObservationPeriod": {}
            }
          },
          {
            "Criteria": {
              "CriteriaType": "DrugExposure",
              "ConceptName": "erythropoiesis stimulating agent",
              "DrugExposure": {}
            }
          },
          {
            "Criteria": {
              "CriteriaType": "ConditionOccurrence",
              "ConceptName": "iron deficiency anemia",
              "ConditionOccurrence": {}
            }
          }
        ],
        "DemographicCriteriaList": [],
        "Groups": []
      },
      {
        "Type": "NONE",
        "CriteriaList": [
          {
            "Criteria": {
              "CriteriaType": "VisitOccurrence",
              "ConceptName": "intensive care unit",
              "VisitOccurrence": {}
            }
          },
          {
            "Criteria": {
              "CriteriaType": "Measurement",
              "ConceptName": "hemoglobin",
              "Measurement": {},
              "ValueAsNumber": {
                "Value": 13,
                "Op": "gt"
              }
            }
          },
          {
            "Criteria": {
              "CriteriaType": "ProcedureOccurrence",
              "ConceptName": "kidney transplant",
              "ProcedureOccurrence": {}
            }
          },
          {
            "Criteria": {
              "CriteriaType": "ConditionOccurrence",
              "ConceptName": "sepsis",
              "ConditionOccurrence": {}
            }
          }
        ],
        "DemographicCriteriaList": [],
        "Groups": []
      }
    ]
  },
  "ConceptSets": [],
  "EndStrategy": {
    "DateField": "EndDate",
    "Offset": 0
  },
  "cdmVersionRange": ">=5.0.0",
  "includeAllDescendants": true,
  "includedCovariateConceptIds": [],
  "CensoringCriteria": [],
  "InclusionRules": [],
  "CollapseSettings": {
    "CollapseType": "ERA",
    "EraPad": 0
  }
}
"""

JSON_SCHEMA = """
The following is the required JSON format to be returned.
/*******************************************************************************
 * Copyright 2025 Observational Health Data Sciences and Informatics
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *   http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Authors: Christopher Knoll, Gowtham Rao
 ******************************************************************************/

import { ConceptSet } from './ConceptSet';

export enum CollapseType {
  ERA = "ERA",
  NONE = "NONE"
}

export class CollapseSettings {
  EraPad: number = 0;
  CollapseType: CollapseType = CollapseType.ERA;
}

export class NumericRange {
  Value: number = 0;
  Op: string = "gt";
  Extent?: number;
  // Add these for compatibility with Window.Endpoint
  Days?: number;
  Coeff?: number;
}

export class TextFilter {
  Text: string = "";
  Op: string = "contains";
}

export class Period {
  StartDate: Date = new Date();
  EndDate: Date = new Date();
}

export class DateRange {
  StartDate?: Date;
  EndDate?: Date;
  
  // Add these for compatibility with old code
  Value?: string | Date;
  Extent?: string | Date;
  Op?: string;
}

export class Window {
  Start: NumericRange | null = null;
  End: NumericRange | null = null;
  UseIndexEnd: boolean = false;
  UseEventEnd: boolean = false;
  // Properties for ObservationFilter compatibility
  ObservationTypeExclude?: boolean = false;
  ObservationType?: number[] = [];
  // Properties to bridge namespace usage
  PriorDays?: number;
  PostDays?: number;
}

export class DateOffsetStrategy {
  DateField: string = "";
  Offset: number = 0;
}

export class DateAdjustment {
  StartOffset: number = 0;
  EndOffset: number = 0;
}

export class EndStrategy {
  DateField?: string;
  Offset?: number;
}

export class CustomEraStrategy extends EndStrategy {
  DrugCodesetId: number = 0;
  GapDays: number = 0;
  Offset: number = 0;
}

export class ConceptSetSelection {
  Min: number = 1;
  Max: number = 1;
  CodesetId?: number;
}

export class Occurrence {
  Type: number = 0;  // 0: exactly, 1: at least, 2: at most
  Count: number = 0;
  IsDistinct: boolean = false;
}

import { ConditionEraProperties, ConditionOccurrenceProperties, DrugExposureProperties, DrugEraProperties } from './Criteria';

export class Criteria {
  CriteriaType?: string = null;
  CriteriaName: string = "";
  Domain?: string = null;
  CodesetId?: number = null;
  OccurrenceStartDate?: any;
  OccurrenceEndDate?: any;
  FirstOccurrenceOnly?: boolean = false;
  DateAdjustment?: DateAdjustment = null;
  
  // First property for history checks
  First?: boolean = false;
  
  // Domain-specific nested properties
  ConditionEra?: ConditionEraProperties;
  ConditionOccurrence?: ConditionOccurrenceProperties;
  DrugExposure?: DrugExposureProperties;
  DrugEra?: DrugEraProperties;
  
  // ConditionOccurrence
  ConditionTypeExclude?: boolean;
  ConditionType?: number[];
  ConditionSourceConcept?: number;
  ConditionStatus?: number[];
  ConditionStatusExclude?: boolean;
  StopReason?: TextFilter;
  
  // Death
  DeathDate?: any;
  DeathType?: number[];
  DeathTypeExclude?: boolean;
  
  // DeviceExposure
  DeviceType?: number[];
  DeviceTypeExclude?: boolean;
  UniqueDeviceId?: TextFilter;
  Quantity?: NumericRange;
  DeviceSourceConcept?: number;
  
  // DoseEra
  DoseValue?: NumericRange;
  UnitConceptId?: number;
  EraStartDate?: any;
  EraEndDate?: any;
  
  // DrugExposure
  DrugType?: number[];
  DrugTypeExclude?: boolean;
  Refills?: NumericRange;
  DaysSupply?: NumericRange;
  Route?: number[];
  RouteExclude?: boolean;
  EffectiveDrugDose?: NumericRange;
  DoseUnit?: number[];
  DoseUnitExclude?: boolean;
  LotNumber?: TextFilter;
  DrugSourceConcept?: number;
  
  // DrugEra
  EraLength?: NumericRange;
  OccurrenceCount?: NumericRange;
  GapDays?: NumericRange;
  
  // Measurement
  MeasurementType?: number[];
  MeasurementTypeExclude?: boolean;
  Operator?: number[];
  OperatorExclude?: boolean;
  Value?: any;
  ValueAsNumber?: NumericRange;
  ValueAsString?: TextFilter;
  ValueAsConcept?: number[];
  ValueAsConceptExclude?: boolean;
  Unit?: number[];
  UnitExclude?: boolean;
  MeasurementSourceConcept?: number;
  RangeLow?: number;
  RangeHigh?: number;
  RangeLowRatio?: number;
  RangeHighRatio?: number;
  
  // Observation
  ObservationType?: number[];
  ObservationTypeExclude?: boolean;
  Qualifier?: TextFilter;
  ValueAsDateTime?: any;
  ObservationSourceConcept?: number;
  
  // ObservationPeriod
  AgeAtStart?: NumericRange;
  AgeAtEnd?: NumericRange;
  UserDefinedPeriod?: boolean = false;
  PeriodStartDate?: any;
  PeriodEndDate?: any;
  PeriodType?: number[];
  PeriodTypeExclude?: boolean;
  PeriodLength?: number;
  
  // ProcedureOccurrence
  ProcedureType?: number[];
  ProcedureTypeExclude?: boolean;
  Modifier?: TextFilter;
  ProcedureQuantity?: NumericRange;
  ProcedureSourceConcept?: number;
  
  // Specimen
  SpecimenType?: number[];
  SpecimenTypeExclude?: boolean;
  SpecimenUnit?: number[];
  SpecimenUnitExclude?: boolean;
  AnatomicSite?: number[];
  AnatomicSiteExclude?: boolean;
  DiseaseStatus?: number[];
  DiseaseStatusExclude?: boolean;
  SpecimenSourceConcept?: number;
  SourceId?: string;
  
  // VisitOccurrence & VisitDetail
  VisitType?: number[];
  VisitTypeExclude?: boolean;
  VisitLength?: NumericRange;
  VisitSourceConcept?: number;
  VisitDetailStartDate?: any;
  VisitDetailEndDate?: any;
  VisitDetailLength?: number;
  VisitDetailSourceConcept?: number;
  
  // Additional Shared Properties
  Age?: NumericRange;
  Gender?: number[];
  GenderExclude?: boolean;
  Race?: number[];
  RaceExclude?: boolean;
  Ethnicity?: number[];
  EthnicityExclude?: boolean;
  
  // PayerPlanPeriod
  PayerPlanPeriodStartDate?: any;
  PayerPlanPeriodEndDate?: any;
  PayerConcept?: number;
  PayerSourceConcept?: number;
  PlanConcept?: number;
  PlanSourceConcept?: number;
  SponsorConcept?: number;
  SponsorSourceConcept?: number;
  StopReasonConcept?: number;
  StopReasonSourceConcept?: number;
  Payer?: TextFilter;
  Plan?: TextFilter;
  Sponsor?: TextFilter;
  TerminationReason?: TextFilter;
  
  // LocationRegion
  RegionConcept?: number;
  RegionSourceConcept?: number;
  StartDate?: any;
  EndDate?: any;
  
  // For conceptset selections
  VisitDetailTypeCS?: ConceptSetSelection;
  GenderCS?: ConceptSetSelection;
  ProviderSpecialtyCS?: ConceptSetSelection;
  PlaceOfServiceCS?: ConceptSetSelection;
  
  // For correlated criteria
  CorrelatedCriteria?: any;
}

export class ConditionOccurrence extends Criteria {
  constructor() {
    super();
    this.CriteriaType = "ConditionOccurrence";
    this.CriteriaName = "Condition Occurrence";
    this.Domain = "condition";
  }
}

export class ConditionEra extends Criteria {
  constructor() {
    super();
    this.CriteriaType = "ConditionEra";
    this.CriteriaName = "Condition Era";
    this.Domain = "condition";
  }
}

export class Death extends Criteria {
  constructor() {
    super();
    this.CriteriaType = "Death";
    this.CriteriaName = "Death";
    this.Domain = "death";
  }
}

export class DeviceExposure extends Criteria {
  constructor() {
    super();
    this.CriteriaType = "DeviceExposure";
    this.CriteriaName = "Device Exposure";
    this.Domain = "device";
  }
}

export class DoseEra extends Criteria {
  constructor() {
    super();
    this.CriteriaType = "DoseEra";
    this.CriteriaName = "Dose Era";
    this.Domain = "drug";
  }
}

export class DrugEra extends Criteria {
  constructor() {
    super();
    this.CriteriaType = "DrugEra";
    this.CriteriaName = "Drug Era";
    this.Domain = "drug";
  }
}

export class DrugExposure extends Criteria {
  constructor() {
    super();
    this.CriteriaType = "DrugExposure";
    this.CriteriaName = "Drug Exposure";
    this.Domain = "drug";
  }
}

export class Measurement extends Criteria {
  constructor() {
    super();
    this.CriteriaType = "Measurement";
    this.CriteriaName = "Measurement";
    this.Domain = "measurement";
  }
}

export class Observation extends Criteria {
  constructor() {
    super();
    this.CriteriaType = "Observation";
    this.CriteriaName = "Observation";
    this.Domain = "observation";
  }
}

export class ObservationPeriod extends Criteria {
  constructor() {
    super();
    this.CriteriaType = "ObservationPeriod";
    this.CriteriaName = "Observation Period";
    this.Domain = "observation_period";
  }
}

export class PayerPlanPeriod extends Criteria {
  constructor() {
    super();
    this.CriteriaType = "PayerPlanPeriod";
    this.CriteriaName = "Payer Plan Period";
    this.Domain = "payer_plan_period";
  }
}

export class ProcedureOccurrence extends Criteria {
  constructor() {
    super();
    this.CriteriaType = "ProcedureOccurrence";
    this.CriteriaName = "Procedure Occurrence";
    this.Domain = "procedure";
  }
}

export class Specimen extends Criteria {
  constructor() {
    super();
    this.CriteriaType = "Specimen";
    this.CriteriaName = "Specimen";
    this.Domain = "specimen";
  }
}

export class VisitOccurrence extends Criteria {
  constructor() {
    super();
    this.CriteriaType = "VisitOccurrence";
    this.CriteriaName = "Visit Occurrence";
    this.Domain = "visit";
  }
}

export class VisitDetail extends Criteria {
  // Don't declare these properties here since they're already in the base class 
  
  constructor() {
    super();
    this.CriteriaType = "VisitDetail";
    this.CriteriaName = "Visit Detail";
    this.Domain = "visit_detail";
  }
}

export class LocationRegion extends Criteria {
  constructor() {
    super();
    this.CriteriaType = "LocationRegion";
    this.CriteriaName = "Location Region";
    this.Domain = "location";
  }
}

export class DemographicCriteria extends Criteria {
  constructor() {
    super();
    this.CriteriaType = "DemographicCriteria";
    this.CriteriaName = "Demographics";
    this.Domain = null;
  }
}

export class ObservationFilter {
  ObservationTypeExclude: boolean = false;
  ObservationType: number[] = [];
  
  constructor(options?: any) {
    if (options) {
      Object.assign(this, options);
    }
  }
}

export class WindowedCriteria {
  Criteria?: Criteria;
  Window?: Window;
  
  constructor(options?: any) {
    if (options) {
      Object.assign(this, options);
    }
  }
}

export class ResultLimit {
  Type: number = 0;
  Count: number = 0;
}

export class CriteriaGroup {
  Type: string = "ALL";
  CriteriaList: (Criteria | WindowedCriteria)[] = [];
  DemographicCriteriaList: DemographicCriteria[] = [];
  Groups: CriteriaGroup[] = [];
  Count: number = 0;
  
  constructor(options?: any) {
    if (options) {
      Object.assign(this, options);
    }
  }
  
  /**
   * Checks if the criteria group is empty (has no criteria of any kind)
   * @returns true if the group has no criteria, otherwise false
   */
  isEmpty(): boolean {
    return (!this.CriteriaList || this.CriteriaList.length === 0) && 
           (!this.DemographicCriteriaList || this.DemographicCriteriaList.length === 0) &&
           (!this.Groups || this.Groups.length === 0);
  }
}

export class CorelatedCriteria {
  Criteria?: Criteria;
  StartWindow?: Window;
  EndWindow?: Window;
  Occurrence?: Occurrence;
  RestrictVisit?: boolean = false;
  // Properties to be compatible with Criteria
  CriteriaType?: string;
  CriteriaName?: string;
  Domain?: string;
  CodesetId?: number;
  // Add correlated criteria specific properties
  CorrelatedCriteria?: any;
  
  constructor(options?: any) {
    if (options) {
      Object.assign(this, options);
    }
  }
}

export class InclusionRule {
  name: string = "";
  description?: string;
  expression?: CriteriaGroup;
  
  constructor(options?: any) {
    if (options) {
      Object.assign(this, options);
    }
  }
}

export class PrimaryCriteria {
  // PascalCase로 변경 (Java와 일치)
  CriteriaList: Criteria[] = [];
  ObservationWindow?: Window;
  PrimaryCriteriaLimit?: ResultLimit;
  
  constructor(options?: any) {
    if (options) {
      // Java 스타일 속성 직접 매핑
      if (options.CriteriaList) {
        this.CriteriaList = options.CriteriaList;
      }
      
      if (options.ObservationWindow) {
        // ObservationWindow 처리
        this.ObservationWindow = {
          // Window 인터페이스와 호환되도록 변환
          Start: options.ObservationWindow.PriorDays !== undefined 
            ? { Value: options.ObservationWindow.PriorDays, Op: "eq" } 
            : null,
          End: options.ObservationWindow.PostDays !== undefined 
            ? { Value: options.ObservationWindow.PostDays, Op: "eq" } 
            : null,
          UseIndexEnd: false,
          UseEventEnd: false
        };
      }
      
      if (options.PrimaryCriteriaLimit) {
        this.PrimaryCriteriaLimit = options.PrimaryCriteriaLimit;
      }
      
      // 남은 속성 적용
      Object.assign(this, options);
    }
  }
}

export class CohortExpression {
  cdmVersionRange?: string;
  
  // PascalCase로 변경 (Java와 일치)
  PrimaryCriteria?: PrimaryCriteria;
  AdditionalCriteria?: CriteriaGroup;
  
  ObservationWindow?: Window;
  
  ConceptSets: ConceptSet[] = [];
  
  includeAllDescendants: boolean = true;
  includedCovariateConceptIds: number[] = [];
  CensorWindow?: Window;
  CensoringCriteria: CorelatedCriteria[] = [];
  QualifiedLimit?: ResultLimit;
  ExpressionLimit?: ResultLimit;
  InclusionRules: InclusionRule[] = [];
  censoring: ObservationFilter = new ObservationFilter();
  CollapseSettings?: CollapseSettings;
  EndStrategy?: EndStrategy;
  
  constructor(options?: any) {
    if (options) {
      // Initial copy of all properties
      Object.assign(this, options);
      
      // Ensure nested objects have proper types - use PascalCase directly (Java style)
      if (options.PrimaryCriteria) {
        this.PrimaryCriteria = new PrimaryCriteria(options.PrimaryCriteria);
      }
      
      if (options.AdditionalCriteria) {
        this.AdditionalCriteria = new CriteriaGroup(options.AdditionalCriteria);
      }
      
      if (options.InclusionRules) {
        this.InclusionRules = options.InclusionRules.map((rule: any) => new InclusionRule(rule));
      }
      
      if (options.censoring) {
        this.censoring = new ObservationFilter(options.censoring);
      }
      
      // Handle concept sets properly - use PascalCase for ConceptSets
      if (Array.isArray(options.ConceptSets)) {
        console.log('Found ConceptSets property');
        // Import at the top will cause circular dependency issues
        // To avoid this, we'll import dynamically here
        const ConceptSet = require('./ConceptSet').default;
        
        this.ConceptSets = options.ConceptSets.map((cs: any) => {
          console.log(`Processing concept set ${cs.id} with name '${cs.name}'`);
          return new ConceptSet(cs);
        });
        
        console.log(`Processed ${this.ConceptSets.length} concept sets`);
      }
    }
  }
}

export default CohortExpression;
"""

def map_criteria_info(criteria_type):
    """
    CriteriaType을 CriteriaName(규격), Domain(규격), Domain_id(clickhouse 도메인)로 매핑
    """
    criteria_info = {
        "ConditionEra": {
            "CriteriaName": "Condition Era",
            "Domain": "condition",
            "Domain_id": "Condition"
        },
        "ConditionOccurrence": {
            "CriteriaName": "Condition Occurrence",
            "Domain": "condition",
            "Domain_id": "Condition"
        },
        "Death": {
            "CriteriaName": "Death",
            "Domain": "death",
            "Domain_id": "Death"
        },
        "DeviceExposure": {
            "CriteriaName": "Device Exposure",
            "Domain": "device",
            "Domain_id": "Device"
        },
        "DoseEra": {
            "CriteriaName": "Dose Era",
            "Domain": "drug",
            "Domain_id": "Drug"
        },
        "DrugEra": {
            "CriteriaName": "Drug Era",
            "Domain": "drug",
            "Domain_id": "Drug"
        },
        "DrugExposure": {
            "CriteriaName": "Drug Exposure",
            "Domain": "drug",
            "Domain_id": "Drug"
        },
        "Measurement": {
            "CriteriaName": "Measurement",
            "Domain": "measurement",
            "Domain_id": "Measurement"
        },
        "Observation": {
            "CriteriaName": "Observation",
            "Domain": "observation",
            "Domain_id": "Observation"
        },
        "ObservationPeriod": {
            "CriteriaName": "Observation Period",
            "Domain": "observation_period",
            "Domain_id": "Observation"
        },
        "ProcedureOccurrence": {
            "CriteriaName": "Procedure Occurrence",
            "Domain": "procedure",
            "Domain_id": "Procedure"
        },
        "Specimen": {
            "CriteriaName": "Specimen",
            "Domain": "specimen",
            "Domain_id": "Specimen"
        },
        "VisitOccurrence": {
            "CriteriaName": "Visit Occurrence",
            "Domain": "visit",
            "Domain_id": "Visit"
        },
        "VisitDetail": {
            "CriteriaName": "Visit Detail",
            "Domain": "visit_detail",
            "Domain_id": "Visit"
        },
        "LocationRegion": {
            "CriteriaName": "Location Region",
            "Domain": "location",
            "Domain_id": "Geography"
        },
        "DemographicCriteria": {
            "CriteriaName": "Demographics",
            "Domain": None,
            "Domain_id": None
        }
    }
    
    return criteria_info.get(criteria_type, None)