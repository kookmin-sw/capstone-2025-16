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

/**
 * 숫자(정수/실수) 관련 연산자를 나타냅니다.
 */
export type NumberWithOperator = number | Operator<number>;

/**
 * 빅인트 관련 연산자를 나타냅니다.
 */
export type BigIntWithOperator = bigint | Operator<bigint>;

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

export interface FirstGroup extends BaseGroup {}

export interface SubsequentGroup extends BaseGroup {
  not: boolean | undefined | null;
}

export type Cohort = [FirstGroup, ...SubsequentGroup[]];

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
  conceptset?: BigIntWithOperator;
  first?: boolean;
  startAge?: NumberWithOperator;
  endAge?: NumberWithOperator;
  gender?: BigIntWithOperator;
  startDate?: DateWithOperator;
  endDate?: DateWithOperator;
  conditionCount?: NumberWithOperator;
  length?: NumberWithOperator;
}

/**
 * condition_occurrence 도메인에 대한 필터 인터페이스입니다.
 */
export interface ConditionOccurrenceFilter {
  conceptset?: BigIntWithOperator;
  first?: boolean;
  age?: NumberWithOperator;
  gender?: BigIntWithOperator;
  conditionStatus?: NumberWithOperator;
  startDate?: DateWithOperator;
  endDate?: DateWithOperator;
  conditionType?: BigIntWithOperator;
  visitType?: BigIntWithOperator;
  //stopReason?: StringWithOperator;
  source?: BigIntWithOperator;
  providerSpecialty?: BigIntWithOperator;
}

/**
 * death 도메인에 대한 필터 인터페이스입니다.
 */
export interface DeathFilter {
  conceptset?: BigIntWithOperator;
  age?: NumberWithOperator;
  gender?: BigIntWithOperator;
  date?: DateWithOperator;
  deathType?: BigIntWithOperator;
  cause?: NumberWithOperator;
}

/**
 * device_exposure 도메인에 대한 필터 인터페이스입니다.
 */
export interface DeviceExposureFilter {
  conceptset?: BigIntWithOperator;
  first?: boolean;
  age?: NumberWithOperator;
  gender?: BigIntWithOperator;
  startDate?: DateWithOperator;
  endDate?: DateWithOperator;
  deviceType?: BigIntWithOperator;
  visitType?: BigIntWithOperator;
  uniqueDeviceId?: StringWithOperator;
  quantity?: NumberWithOperator;
  source?: BigIntWithOperator;
  providerSpecialty?: BigIntWithOperator;
}

/**
 * dose_era 도메인에 대한 필터 인터페이스입니다.
 */
export interface DoseEraFilter {
  conceptset?: BigIntWithOperator;
  first?: boolean;
  startAge?: NumberWithOperator;
  endAge?: NumberWithOperator;
  gender?: BigIntWithOperator;
  startDate?: DateWithOperator;
  endDate?: DateWithOperator;
  doseUnit?: BigIntWithOperator;
  length?: NumberWithOperator;
  doseValue?: NumberWithOperator;
}

/**
 * drug_era 도메인에 대한 필터 인터페이스입니다.
 */
export interface DrugEraFilter {
  conceptset?: BigIntWithOperator;
  first?: boolean;
  startAge?: NumberWithOperator;
  endAge?: NumberWithOperator;
  gender?: BigIntWithOperator;
  startDate?: DateWithOperator;
  endDate?: DateWithOperator;
  length?: NumberWithOperator;
  eraExposureCount?: NumberWithOperator;
}

/**
 * drug_exposure 도메인에 대한 필터 인터페이스입니다.
 */
export interface DrugExposureFilter {
  conceptset?: BigIntWithOperator;
  first?: boolean;
  age?: NumberWithOperator;
  gender?: BigIntWithOperator;
  startDate?: DateWithOperator;
  endDate?: DateWithOperator;
  drugType?: BigIntWithOperator;
  visitType?: BigIntWithOperator;
  stopReason?: StringWithOperator;
  refill?: NumberWithOperator;
  quantity?: NumberWithOperator;
  daysSupply?: NumberWithOperator;
  routeType?: BigIntWithOperator;
  effectiveDose?: NumberWithOperator;
  doseUnit?: NumberWithOperator;
  lotNumber?: StringWithOperator;
  source?: BigIntWithOperator;
  providerSpecialty?: BigIntWithOperator;
}

/**
 * measurement 도메인에 대한 필터 인터페이스입니다.
 */
export interface MeasurementFilter {
  conceptset?: BigIntWithOperator;
  first?: boolean;
  age?: NumberWithOperator;
  gender?: BigIntWithOperator;
  date?: DateWithOperator;
  measurementType?: BigIntWithOperator;
  visitType?: BigIntWithOperator;
  operatorType?: BigIntWithOperator;
  valueAsNumber?: NumberWithOperator;
  valueAsConcept?: BigIntWithOperator;
  unitType?: BigIntWithOperator;
  abnormal?: boolean;
  rangeLow?: NumberWithOperator;
  rangeHigh?: NumberWithOperator;
  //rangeLowRatio?: NumberWithOperator;
  //rangeHighRatio?: NumberWithOperator;
  providerSpecialty?: BigIntWithOperator;
  source?: BigIntWithOperator;
}

/**
 * observation 도메인에 대한 필터 인터페이스입니다.
 */
export interface ObservationFilter {
  conceptset?: BigIntWithOperator;
  first?: boolean;
  age?: NumberWithOperator;
  gender?: BigIntWithOperator;
  date?: DateWithOperator;
  observationType?: BigIntWithOperator;
  visitType?: BigIntWithOperator;
  valueAsNumber?: NumberWithOperator;
  valueAsString?: StringWithOperator;
  valueAsConcept?: BigIntWithOperator;
  qualifierType?: BigIntWithOperator;
  unitType?: BigIntWithOperator;
  source?: BigIntWithOperator;
  providerSpecialty?: BigIntWithOperator;
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
  conceptset?: BigIntWithOperator;
  first?: boolean;
  age?: NumberWithOperator;
  gender?: BigIntWithOperator;
  startDate?: DateWithOperator;
  procedureType?: BigIntWithOperator;
  visitType?: BigIntWithOperator;
  modifierType?: BigIntWithOperator;
  quantity?: NumberWithOperator;
  source?: BigIntWithOperator;
  providerSpecialty?: BigIntWithOperator;
}

/**
 * specimen 도메인에 대한 필터 인터페이스입니다.
 */
export interface SpecimenFilter {
  conceptset?: BigIntWithOperator;
  first?: boolean;
  age?: NumberWithOperator;
  gender?: BigIntWithOperator;
  date?: DateWithOperator;
  specimenType?: BigIntWithOperator;
  quantity?: NumberWithOperator;
  unitType?: BigIntWithOperator;
  anatomicSiteType?: BigIntWithOperator;
  diseaseStatus?: NumberWithOperator;
  //source?: StringWithOperator;
}

/**
 * visit_occurrence 도메인에 대한 필터 인터페이스입니다.
 */
export interface VisitOccurrenceFilter {
  conceptset?: BigIntWithOperator;
  first?: boolean;
  age?: NumberWithOperator;
  gender?: BigIntWithOperator;
  startDate?: DateWithOperator;
  endDate?: DateWithOperator;
  visitType?: BigIntWithOperator;
  length?: NumberWithOperator;
  source?: BigIntWithOperator;
  providerSpecialty?: BigIntWithOperator;
  placeOfService?: NumberWithOperator;
  //location?: NumberWithOperator;
}

/**
 * demographic 도메인에 대한 필터 인터페이스입니다.
 */
export interface DemographicFilter {
  age?: NumberWithOperator;
  gender?: BigIntWithOperator;
  startDate?: DateWithOperator;
  endDate?: DateWithOperator;
  raceType?: BigIntWithOperator;
  ethnicityType?: BigIntWithOperator;
}

/**
 * 코호트 예시
 *
 * 코호트는 그룹 배열로 구성되고, AND 연산으로 결합됩니다. 첫번째를 제외한 그룹은 모두 NOT 연산을 사용할 수 있습니다. 예시: (group1 AND (NOT group2) AND group3)
 * 각 그룹은 컨테이너 배열로 구성됩니다. 컨테이너는 AND, OR, NOT 연산을 사용할 수 있습니다. 복잡한 연산은 불가능하고, 항상 왼쪽에서 오른쪽으로 연산됩니다. 예시: (container1 AND container2) OR container3
 * 각 컨테이너는 필터 배열로 구성됩니다. 필터는 모두 AND 연산으로 결합됩니다.
 *
 */
const cohort1: Cohort = [
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
];
