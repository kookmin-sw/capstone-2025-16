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
  conceptset_id: Identifier;
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
  source?: Identifier;
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
  cause?: Identifier;
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
  source?: Identifier;
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
  source?: Identifier;
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
  source?: Identifier;
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
  source?: Identifier;
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
  source?: Identifier;
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
  //source?: Identifier;
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
  source?: Identifier;
  providerSpecialty?: IdentifierWithOperator;
  placeOfService?: IdentifierWithOperator;
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

/**
 * 코호트 예시
 *
 * 코호트는 그룹 배열로 구성되고, AND 연산으로 결합됩니다. 첫번째를 제외한 그룹은 모두 NOT 연산을 사용할 수 있습니다. 예시: (group1 AND (NOT group2) AND group3)
 * 각 그룹은 컨테이너 배열로 구성됩니다. 컨테이너는 AND, OR, NOT 연산을 사용할 수 있습니다. 복잡한 연산은 불가능하고, 항상 왼쪽에서 오른쪽으로 연산됩니다. 예시: (container1 AND container2) OR container3
 * 각 컨테이너는 필터 배열로 구성됩니다. 필터는 모두 AND 연산으로 결합됩니다.
 *
 */
const cohort1: CohortDefinition = {
  conceptsets: [],
  cohort: [
    {
      // Group 1
      containers: [
        {
          name: "컨테이너 1",
          filters: [
            {
              type: "condition_era",
              first: true,
              startAge: {
                gte: 18,
              },
            },
            {
              type: "observation",
              first: true,
            },
          ],
        },
        {
          operator: "OR",
          name: "컨테이너 2",
          filters: [
            {
              type: "condition_era",
              first: true,
            },
          ],
        },
      ],
    },
    {
      // Group 2
      not: true,
      containers: [
        {
          name: "컨테이너 3",
          filters: [
            {
              type: "measurement",
              first: true,
            },
          ],
        },
      ],
    },
  ],
};
