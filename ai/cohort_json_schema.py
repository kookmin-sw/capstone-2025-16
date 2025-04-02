JSON_INPUT_EXAMPLE = """
Input Text Example:
3.1. Inclusion criteria  
Patients who are 20 years old or older.
Patients with hemodialysis.
Patients using ESA therapy for at least three months.
Patients with iron deficiency anemia.

3.2. Exclusion criteria  
Patients in intensive care unit.  
Patients with hemoglobin value more than 13 g/dL.  
Kidney transplant patients.  
Patients with sepsis or active infections.
"""

JSON_OUTPUT_EXAMPLE = """
다음은 주어진 임상시험 텍스트를 바탕으로 OMOP CDM 규격에 맞게 구성된 최종 JSON 예시입니다:

const cohortExample: CohortDefinition = {
  conceptsets: [
    {
      conceptset_id: "0",
      name: "Hemodialysis",
      type: "ProcedureOccurrence",
      items: [
        {
          concept_id: "101",
          concept_name: "Hemodialysis",
          domain_id: "Procedure",
          vocabulary_id: "OMOP",
          concept_class_id: "Procedure",
          standard_concept: "S",
          concept_code: "HD01",
          valid_start_date: "2000-01-01",
          valid_end_date: "2099-12-31",
          invalid_reason: ""
        },
        {
          concept_id: "102",
          concept_name: "Hemodialysis2",
          domain_id: "Procedure",
          vocabulary_id: "OMOP",
          concept_class_id: "Procedure",
          standard_concept: "S",
          concept_code: "HD02",
          valid_start_date: "2000-01-01",
          valid_end_date: "2099-12-31",
          invalid_reason: ""
        }
      ]
    }
    // 추가 conceptset 항목이 있으면 여기에 추가합니다.
  ],
  cohort: [
    {
      // Group 1: Inclusion Criteria
      containers: [
        {
          name: "hemodialysis",
          filters: [
            {
              type: "procedure_occurrence",
              first: true,
              conceptset: "0",
              age: { gte: 20 }
            }
          ]
        },
        {
          operator: "AND",
          name: "ESA therapy",
          filters: [
            {
              type: "drug_exposure",
              first: true,
              conceptset: "1"
            }
          ]
        },
        {
          operator: "AND",
          name: "iron deficiency anemia",
          filters: [
            {
              type: "condition_era",
              first: true,
              conceptset: "2"
            }
          ]
        }
      ]
    },
    {
      // Group 2: Exclusion Criteria
      not: true,
      containers: [
        {
          name: "intensive care unit",
          filters: [
            {
              type: "observation",
              first: true,
              conceptset: "3"
            }
          ]
        },
        {
          operator: "AND",
          name: "hemoglobin > 13 g/dL",
          filters: [
            {
              type: "measurement",
              first: true,
              measurementType: { eq: "234567" },
              valueAsNumber: { gt: 13 },
              conceptset: "4"
            }
          ]
        },
        {
          operator: "AND",
          name: "kidney transplant",
          filters: [
            {
              type: "procedure_occurrence",
              first: true,
              conceptset: "5"
            }
          ]
        },
        {
          operator: "AND",
          name: "sepsis or active infections",
          filters: [
            {
              type: "condition_era",
              first: true,
              conceptset: "6"
            }
          ]
        }
      ]
    }
  ]
};

"""

JSON_SCHEMA = """
The following is the required JSON format to be returned.
/**
 * 특정 값을 필터링하기 위한 일반적인 비교 연산자를 나타냅니다.
 *
 * - `Operator<T>` 내의 모든 조건은 AND 로직으로 결합됩니다.
 *   예시:
 *   `{ gt: 1, lt: 3 }` → `(VALUE > 1 AND VALUE < 3)`
 *
 * - 특정 조건에 배열(`T[]`)이 제공되면, OR 조건으로 처리됩니다.
 *   예시:
 *   `{ gt: [1, 5] }` → `(VALUE > 1 OR VALUE > 5)`
 */
export interface Operator<T> {
  neq?: T | T[];
  eq?: T | T[];
  gt?: T | T[];
  gte?: T | T[];
  lt?: T | T[];
  lte?: T | T[];
}

/**
 * 문자열을 대상으로 하는 필터링 연산을 나타냅니다.
 *
 * - `StringOperator` 내의 조건들은 AND 로직으로 결합됩니다.
 * - 배열이 주어진 조건은 OR 조건으로 처리됩니다.
 *
 * 예시:
 * `{ startsWith: ["a", "b"], endsWith: ["c", "d"] }`
 * → `((VALUE LIKE "a%" OR VALUE LIKE "b%") AND (VALUE LIKE "%c" OR VALUE LIKE "%d"))`
 */
export interface StringOperator {
  neq?: string | string[];
  eq?: string | string[];
  startsWith?: string | string[];
  endsWith?: string | string[];
  contains?: string | string[];
}

export type Identifier = string;

export interface IdentifierOperator {
  neq?: Identifier | Identifier[];
  eq?: Identifier | Identifier[];
}

/**
 * 숫자(정수/실수) 관련 연산자를 나타냅니다.
 */
export type NumberWithOperator = number | Operator<number>;

/**
 * 식별자(string) 관련 연산자를 나타냅니다.
 */
export type IdentifierWithOperator = Identifier | IdentifierOperator;

/**
 * 날짜(문자열) 관련 연산자를 나타냅니다.
 */
export type DateWithOperator = string | Operator<string>;

/**
 * 문자열 관련 연산자를 나타냅니다.
 */
export type StringWithOperator = string | StringOperator;

export interface BaseContainer {
  name: string;
  filters: Filter[];
}

export interface FirstContainer extends BaseContainer {}

export interface SubsequentContainer extends BaseContainer {
  operator: "AND" | "OR" | "NOT";
}

export interface BaseGroup {
  containers: [FirstContainer, ...SubsequentContainer[]];
}

export interface FirstGroup extends BaseGroup {
  mergeByPersonId?: boolean;
}

export interface SubsequentGroup extends BaseGroup {
  not: boolean | undefined | null;
}

export type Cohort = [FirstGroup, ...SubsequentGroup[]];

export type Concept = {
  concept_id: Identifier;
  concept_name: string;
  domain_id: string;
  vocabulary_id: string;
  concept_class_id: string;
  standard_concept: string;
  concept_code: string;
  valid_start_date: string;
  valid_end_date: string;
  invalid_reason: string;

  isExcluded?: boolean;
  includeDescendants?: boolean;
  includeMapped?: boolean;
};

export interface ConceptSet {
  id: Identifier;
  name: string;
  items: Concept[];
}

export interface CohortDefinition {
  conceptsets?: ConceptSet[];
  cohort: Cohort;
}

/**
 * 도메인 타입에 따른 필터 맵핑입니다.
 */
export type FilterMap = {
  condition_era: ConditionEraFilter;
  condition_occurrence: ConditionOccurrenceFilter;
  death: DeathFilter;
  device_exposure: DeviceExposureFilter;
  dose_era: DoseEraFilter;
  drug_era: DrugEraFilter;
  drug_exposure: DrugExposureFilter;
  measurement: MeasurementFilter;
  observation: ObservationFilter;
  observation_period: ObservationPeriodFilter;
  procedure_occurrence: ProcedureOccurrenceFilter;
  specimen: SpecimenFilter;
  visit_occurrence: VisitOccurrenceFilter;
  demographic: DemographicFilter;
};

/**
 * 각 도메인 타입을 FilterMap의 키 값으로부터 추출합니다.
 */
export type DomainType = keyof FilterMap;

/**
 * 모든 가능한 필터 타입을 정의합니다.
 */
export type Filter = {
  [K in DomainType]: { type: K } & FilterMap[K];
}[DomainType];

/**
 * condition_era 도메인에 대한 필터 인터페이스입니다.
 */
export interface ConditionEraFilter {
  conceptset?: Identifier;
  first?: boolean;
  startAge?: NumberWithOperator;
  endAge?: NumberWithOperator;
  gender?: IdentifierWithOperator;
  startDate?: DateWithOperator;
  endDate?: DateWithOperator;
  conditionCount?: NumberWithOperator;
  length?: NumberWithOperator;
}

/**
 * condition_occurrence 도메인에 대한 필터 인터페이스입니다.
 */
export interface ConditionOccurrenceFilter {
  conceptset?: Identifier;
  first?: boolean;
  age?: NumberWithOperator;
  gender?: IdentifierWithOperator;
  conditionStatus?: IdentifierWithOperator;
  startDate?: DateWithOperator;
  endDate?: DateWithOperator;
  conditionType?: IdentifierWithOperator;
  visitType?: IdentifierWithOperator;
  //stopReason?: StringWithOperator;
  source?: IdentifierWithOperator;
  providerSpecialty?: IdentifierWithOperator;
}

/**
 * death 도메인에 대한 필터 인터페이스입니다.
 */
export interface DeathFilter {
  conceptset?: Identifier;
  age?: NumberWithOperator;
  gender?: IdentifierWithOperator;
  date?: DateWithOperator;
  deathType?: IdentifierWithOperator;
  cause?: NumberWithOperator;
}

/**
 * device_exposure 도메인에 대한 필터 인터페이스입니다.
 */
export interface DeviceExposureFilter {
  conceptset?: Identifier;
  first?: boolean;
  age?: NumberWithOperator;
  gender?: IdentifierWithOperator;
  startDate?: DateWithOperator;
  endDate?: DateWithOperator;
  deviceType?: IdentifierWithOperator;
  visitType?: IdentifierWithOperator;
  uniqueDeviceId?: StringWithOperator;
  quantity?: NumberWithOperator;
  source?: IdentifierWithOperator;
  providerSpecialty?: IdentifierWithOperator;
}

/**
 * dose_era 도메인에 대한 필터 인터페이스입니다.
 */
export interface DoseEraFilter {
  conceptset?: Identifier;
  first?: boolean;
  startAge?: NumberWithOperator;
  endAge?: NumberWithOperator;
  gender?: IdentifierWithOperator;
  startDate?: DateWithOperator;
  endDate?: DateWithOperator;
  doseUnit?: IdentifierWithOperator;
  length?: NumberWithOperator;
  doseValue?: NumberWithOperator;
}

/**
 * drug_era 도메인에 대한 필터 인터페이스입니다.
 */
export interface DrugEraFilter {
  conceptset?: Identifier;
  first?: boolean;
  startAge?: NumberWithOperator;
  endAge?: NumberWithOperator;
  gender?: IdentifierWithOperator;
  startDate?: DateWithOperator;
  endDate?: DateWithOperator;
  length?: NumberWithOperator;
  eraExposureCount?: NumberWithOperator;
}

/**
 * drug_exposure 도메인에 대한 필터 인터페이스입니다.
 */
export interface DrugExposureFilter {
  conceptset?: Identifier;
  first?: boolean;
  age?: NumberWithOperator;
  gender?: IdentifierWithOperator;
  startDate?: DateWithOperator;
  endDate?: DateWithOperator;
  drugType?: IdentifierWithOperator;
  visitType?: IdentifierWithOperator;
  stopReason?: StringWithOperator;
  refill?: NumberWithOperator;
  quantity?: NumberWithOperator;
  daysSupply?: NumberWithOperator;
  routeType?: IdentifierWithOperator;
  effectiveDose?: NumberWithOperator;
  doseUnit?: NumberWithOperator;
  lotNumber?: StringWithOperator;
  source?: IdentifierWithOperator;
  providerSpecialty?: IdentifierWithOperator;
}

/**
 * measurement 도메인에 대한 필터 인터페이스입니다.
 */
export interface MeasurementFilter {
  conceptset?: Identifier;
  first?: boolean;
  age?: NumberWithOperator;
  gender?: IdentifierWithOperator;
  date?: DateWithOperator;
  measurementType?: IdentifierWithOperator;
  visitType?: IdentifierWithOperator;
  operatorType?: IdentifierWithOperator;
  valueAsNumber?: NumberWithOperator;
  valueAsConcept?: IdentifierWithOperator;
  unitType?: IdentifierWithOperator;
  abnormal?: boolean;
  rangeLow?: NumberWithOperator;
  rangeHigh?: NumberWithOperator;
  //rangeLowRatio?: NumberWithOperator;
  //rangeHighRatio?: NumberWithOperator;
  providerSpecialty?: IdentifierWithOperator;
  source?: IdentifierWithOperator;
}

/**
 * observation 도메인에 대한 필터 인터페이스입니다.
 */
export interface ObservationFilter {
  conceptset?: Identifier;
  first?: boolean;
  age?: NumberWithOperator;
  gender?: IdentifierWithOperator;
  date?: DateWithOperator;
  observationType?: IdentifierWithOperator;
  visitType?: IdentifierWithOperator;
  valueAsNumber?: NumberWithOperator;
  valueAsString?: StringWithOperator;
  valueAsConcept?: IdentifierWithOperator;
  qualifierType?: IdentifierWithOperator;
  unitType?: IdentifierWithOperator;
  source?: IdentifierWithOperator;
  providerSpecialty?: IdentifierWithOperator;
}

/**
 * observation_period 도메인에 대한 필터 인터페이스입니다.
 */
export interface ObservationPeriodFilter {
  first?: boolean;
  startAge?: NumberWithOperator;
  endAge?: NumberWithOperator;
  startDate?: DateWithOperator;
  endDate?: DateWithOperator;
  //periodType?: BigIntWithOperator;
  length?: NumberWithOperator;
}

/**
 * procedure_occurrence 도메인에 대한 필터 인터페이스입니다.
 */
export interface ProcedureOccurrenceFilter {
  conceptset?: Identifier;
  first?: boolean;
  age?: NumberWithOperator;
  gender?: IdentifierWithOperator;
  startDate?: DateWithOperator;
  procedureType?: IdentifierWithOperator;
  visitType?: IdentifierWithOperator;
  modifierType?: IdentifierWithOperator;
  quantity?: NumberWithOperator;
  source?: IdentifierWithOperator;
  providerSpecialty?: IdentifierWithOperator;
}

/**
 * specimen 도메인에 대한 필터 인터페이스입니다.
 */
export interface SpecimenFilter {
  conceptset?: Identifier;
  first?: boolean;
  age?: NumberWithOperator;
  gender?: IdentifierWithOperator;
  date?: DateWithOperator;
  specimenType?: IdentifierWithOperator;
  quantity?: NumberWithOperator;
  unitType?: IdentifierWithOperator;
  anatomicSiteType?: IdentifierWithOperator;
  diseaseStatus?: IdentifierWithOperator;
  //source?: StringWithOperator;
}

/**
 * visit_occurrence 도메인에 대한 필터 인터페이스입니다.
 */
export interface VisitOccurrenceFilter {
  conceptset?: Identifier;
  first?: boolean;
  age?: NumberWithOperator;
  gender?: IdentifierWithOperator;
  startDate?: DateWithOperator;
  endDate?: DateWithOperator;
  visitType?: IdentifierWithOperator;
  length?: NumberWithOperator;
  source?: IdentifierWithOperator;
  providerSpecialty?: IdentifierWithOperator;
  placeOfService?: NumberWithOperator;
  //location?: NumberWithOperator;
}

/**
 * demographic 도메인에 대한 필터 인터페이스입니다.
 */
export interface DemographicFilter {
  age?: NumberWithOperator;
  gender?: IdentifierWithOperator;
  startDate?: DateWithOperator;
  endDate?: DateWithOperator;
  raceType?: IdentifierWithOperator;
  ethnicityType?: IdentifierWithOperator;
}

"""

def map_criteria_info(criteria_type):
    """
    CriteriaType을 Domain_id(clickhouse 도메인)와 type(OMOP CDM type)으로 매핑
    """
    criteria_info = {
        "ConditionEra": {
            "Domain_id": "Condition",
            "type": "condition_era"
        },
        "ConditionOccurrence": {
            "Domain_id": "Condition",
            "type": "condition_occurrence"
        },
        "Death": {
            "Domain_id": "Death",
            "type": "death"
        },
        "DeviceExposure": {
            "Domain_id": "Device",
            "type": "device_exposure"
        },
        "DoseEra": {
            "Domain_id": "Drug",
            "type": "dose_era"
        },
        "DrugEra": {
            "Domain_id": "Drug",
            "type": "drug_era"
        },
        "DrugExposure": {
            "Domain_id": "Drug",
            "type": "drug_exposure"
        },
        "Measurement": {
            "Domain_id": "Measurement",
            "type": "measurement"
        },
        "Observation": {
            "Domain_id": "Observation",
            "type": "observation"
        },
        "ObservationPeriod": {
            "Domain_id": "Observation",
            "type": "observation_period"
        },
        "ProcedureOccurrence": {
            "Domain_id": "Procedure",
            "type": "procedure_occurrence"
        },
        "Specimen": {
            "Domain_id": "Specimen",
            "type": "specimen"
        },
        "VisitOccurrence": {
            "Domain_id": "Visit",
            "type": "visit_occurrence"
        },
        "VisitDetail": {
            "Domain_id": "Visit",
            "type": "visit_detail"
        },
        "LocationRegion": {
            "Domain_id": "Geography",
            "type": "location_region"
        },
        "DemographicCriteria": {
            "Domain_id": "Demographic",
            "type": "demographic"
        }
    }
    
    return criteria_info.get(criteria_type)