JSON_OUTPUT_EXAMPLE = """
{{
    "entry": {{
        "criteria": {{
            "type": "condition_era",
            "filters": {{
                "conditionCount": {{ "gte": 1 }}
            }}
        }},
        "initialEventLimit": "first"
    }},
    "inclusion": {{
        "criteria": {{
            "and": [
                {{
                    "type": "procedure_occurrence",
                    "filters": {{
                        "procedureType": {{ "eq": 789012 }},
                        "concept_name": "Hemodialysis",
                        "domain_id": "Procedure"
                    }}
                }},
                {{
                    "type": "drug_exposure",
                    "filters": {{
                        "drugType": {{ "eq": 345678 }},
                        "concept_name": "Erythropoiesis Stimulating Agent",
                        "domain_id": "Drug"
                    }}
                }},
                {{
                    "type": "condition_era",
                    "filters": {{
                        "conditionType": {{ "eq": 901234 }},
                        "concept_name": "Iron deficiency anemia",
                        "domain_id": "Condition"
                    }}
                }}
            ],
            "not": [
                {{
                    "type": "observation",
                    "filters": {{
                        "observationType": {{ "eq": 567890 }},
                        "concept_name": "Intensive care unit",
                        "domain_id": "Observation"
                    }}
                }},
                {{
                    "type": "measurement",
                    "filters": {{
                        "measurementType": {{ "eq": 234567 }},
                        "valueAsNumber": {{ "gt": 13 }},
                        "concept_name": "Hemoglobin",
                        "domain_id": "Measurement"
                    }}
                }},
                {{
                    "type": "procedure_occurrence",
                    "filters": {{
                        "procedureType": {{ "eq": 890123 }},
                        "concept_name": "Kidney transplant",
                        "domain_id": "Procedure"
                    }}
                }},
                {{
                    "type": "condition_era",
                    "filters": {{
                        "conditionType": {{ "eq": 678901 }},
                        "concept_name": "Sepsis",
                        "domain_id": "Condition"
                    }}
                }}
            ]
        }}
    }},
    "exit": {{
        "exitStrategy": {{
            "type": "endOfContinuousObservation"
        }}
    }}
}}
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
interface Operator<T> {
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
interface StringOperator {
  neq?: string | string[];
  eq?: string | string[];
  startsWith?: string | string[];
  endsWith?: string | string[];
  contains?: string | string[];
}

/**
 * 여러 조건을 결합하기 위한 논리 연산자를 나타냅니다.
 *
 * - `and`: 내부의 모든 조건이 참이어야 합니다.
 * - `or`: 내부 조건 중 하나 이상이 참이면 됩니다.
 * - `not`: 특정 조건 또는 조건 그룹을 부정합니다.
 *
 * 예시:
 * `{ and: [{ eq: 1 }, { lt: 5 }] }` → `(VALUE = 1 AND VALUE < 5)`
 * `{ or: [{ gt: 10 }, { lt: 3 }] }` → `(VALUE > 10 OR VALUE < 3)`
 * `{ not: { eq: 7 } }` → `NOT (VALUE = 7)`
 * `{ not: { eq: [1, 2, 3] } }` → `NOT (VALUE = 1 OR VALUE = 2 OR VALUE = 3)`
 * `{ not: [{ gt: 10 }, { lt: 3 }] }` → `NOT (VALUE > 10 OR VALUE < 3)`
 */
interface LogicalOperator<T> {
  and?: T[];
  or?: T[];
  not?: T | T[];
}

/**
 * 숫자(정수/실수) 관련 연산자를 나타냅니다.
 */
type NumberWithOperator =
  | number
  | Operator<number>
  | LogicalOperator<NumberWithOperator>;

/**
 * 날짜(문자열) 관련 연산자를 나타냅니다.
 */
type DateWithOperator =
  | string
  | Operator<string>
  | LogicalOperator<DateWithOperator>;

/**
 * 문자열 관련 연산자를 나타냅니다.
 */
type StringWithOperator =
  | string
  | StringOperator
  | LogicalOperator<StringWithOperator>;

/**
 * 각 도메인(condition_era, condition_occurrence 등)과
 * 해당 도메인의 필터 인터페이스 간 매핑을 정의합니다.
 */
interface CriteriaFilterMap {
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
}

/**
 * 일반적인 Criteria의 구조를 정의합니다.
 * 하나의 도메인 기반 필터(예: { type: 'condition_era', filters: ... })를 사용하거나,
 * 여러 Criteria를 묶는 논리 연산자를 사용할 수 있습니다.
 */
type Criteria =
  | {
      [K in keyof CriteriaFilterMap]: {
        type: K;
        filters: CriteriaFilterMap[K];
      };
    }[keyof CriteriaFilterMap]
  | LogicalOperator<Criteria>;

/**
 * 이니셜 이벤트를 어떻게 제한할지 지정합니다:
 * - "all": 모든 이벤트
 * - "first": 최초 이벤트
 * - "last": 마지막 이벤트
 */
type InitialEventLimit = "all" | "first" | "last";

/**
 * 이벤트 날짜를 기준으로 필요한 최소 관찰 기간을 정의합니다.
 */
interface RequiredObservationPeriod {
  /**
   * 이벤트 발생일로부터 과거 몇 일(`daysBefore`)을 연속 관찰해야 하는지.
   */
  daysBefore: number;

  /**
   * 이벤트 발생일로부터 이후 몇 일(`daysAfter`)을 연속 관찰해야 하는지.
   */
  daysAfter: number;
}

/**
 * 약물 노출 지속성(종료 시점)을 기준으로 코호트를 종료하기 위한 추가 옵션입니다.
 */
interface DrugExposureEndOption {
  /**
   * 노출을 판단할 약물(Drug)의 컨셉셋(컨셉 ID 배열 등).
   */
  drugConceptSet: number[];

  /**
   * 서로 다른 노출 기록을 연속된 하나의 Era로 볼 때 허용 가능한 최대 Gap 일수.
   */
  maxGapDays?: NumberWithOperator;

  /**
   * 약물 노출 Era가 종료된 이후, 추가로 감시해야 하는 일수.
   */
  additionalSurveillanceDays?: number;

  /**
   * 약물 투여 일수(daysSupply)에 대한 조건.
   */
  daysSupply?: NumberWithOperator;
}

/**
 * 코호트 종료 전략을 정의합니다.
 *
 * 1) "endOfContinuousObservation": 연속 관찰 기간이 끝날 때 종료
 * 2) "fixedOffset": 이니셜 이벤트 후 특정 일수(offsetDays)가 지난 시점에 종료
 * 3) "endOfDrugExposure": 특정 약물 노출(지속성)이 끝나는 시점에 종료
 */
type ExitStrategy =
  | {
      type: "endOfContinuousObservation";
    }
  | {
      type: "fixedOffset";
      offsetDays: number;
    }
  | {
      type: "endOfDrugExposure";
      options: DrugExposureEndOption;
    };

/**
 * 코호트 인터페이스로, 엔트리/인클루전/익지트에 대한 조건을 정의합니다.
 */
interface Cohort {
  entry: {
    /**
     * 코호트 엔트리를 결정하는 Criteria.
     */
    criteria?: Criteria;

    /**
     * 이벤트 기준일 주변에 필요한 연속 관찰 기간 (daysBefore, daysAfter). 기본값은 0.
     */
    requiredObservationPeriod?: RequiredObservationPeriod;

    /**
     * 이니셜 이벤트를 모든(all), 최초(first), 마지막(last) 중 어떻게 제한할지. 기본값은 first.
     */
    initialEventLimit?: InitialEventLimit;
  };
  inclusion: {
    /**
     * 추가 인클루전 조건.
     */
    criteria?: Criteria;

    /**
     * 인클루전 단계에서 이니셜 이벤트를 어떻게 적용할지(all, first, last). 기본값은 first.
     */
    initialEventLimit?: InitialEventLimit;
  };
  exit: {
    /**
     * 코호트 종료 전 추가로 확인할 Criteria가 필요한 경우 사용.
     */
    criteria?: Criteria;

    /**
     * 코호트를 어떤 전략으로 종료할지 지정. 기본값은 endOfContinuousObservation.
     */
    exitStrategy?: ExitStrategy;
  };
}

/**
 * condition_era 도메인에 대한 필터 인터페이스입니다.
 */
interface ConditionEraFilter {
  first?: boolean;
  startAge?: NumberWithOperator;
  endAge?: NumberWithOperator;
  gender?: NumberWithOperator;
  startDate?: DateWithOperator;
  endDate?: DateWithOperator;
  conditionCount?: NumberWithOperator;
  length?: NumberWithOperator;
}

/**
 * condition_occurrence 도메인에 대한 필터 인터페이스입니다.
 */
interface ConditionOccurrenceFilter {
  first?: boolean;
  age?: NumberWithOperator;
  gender?: NumberWithOperator;
  conditionStatus?: NumberWithOperator;
  startDate?: DateWithOperator;
  endDate?: DateWithOperator;
  conditionType?: NumberWithOperator;
  visitType?: NumberWithOperator;
  //stopReason?: StringWithOperator;
  source?: NumberWithOperator;
  providerSpecialty?: NumberWithOperator;
}

/**
 * death 도메인에 대한 필터 인터페이스입니다.
 */
interface DeathFilter {
  age?: NumberWithOperator;
  gender?: NumberWithOperator;
  date?: DateWithOperator;
  deathType?: NumberWithOperator;
  cause?: NumberWithOperator;
}

/**
 * device_exposure 도메인에 대한 필터 인터페이스입니다.
 */
interface DeviceExposureFilter {
  first?: boolean;
  age?: NumberWithOperator;
  gender?: NumberWithOperator;
  startDate?: DateWithOperator;
  endDate?: DateWithOperator;
  deviceType?: NumberWithOperator;
  visitType?: NumberWithOperator;
  uniqueDeviceId?: StringWithOperator;
  quantity?: NumberWithOperator;
  source?: NumberWithOperator;
  providerSpecialty?: NumberWithOperator;
}

/**
 * dose_era 도메인에 대한 필터 인터페이스입니다.
 */
interface DoseEraFilter {
  first?: boolean;
  startAge?: NumberWithOperator;
  endAge?: NumberWithOperator;
  gender?: NumberWithOperator;
  startDate?: DateWithOperator;
  endDate?: DateWithOperator;
  doseUnit?: NumberWithOperator;
  length?: NumberWithOperator;
  doseValue?: NumberWithOperator;
}

/**
 * drug_era 도메인에 대한 필터 인터페이스입니다.
 */
interface DrugEraFilter {
  first?: boolean;
  startAge?: NumberWithOperator;
  endAge?: NumberWithOperator;
  gender?: NumberWithOperator;
  startDate?: DateWithOperator;
  endDate?: DateWithOperator;
  length?: NumberWithOperator;
  eraExposureCount?: NumberWithOperator;
}

/**
 * drug_exposure 도메인에 대한 필터 인터페이스입니다.
 */
interface DrugExposureFilter {
  first?: boolean;
  age?: NumberWithOperator;
  gender?: NumberWithOperator;
  startDate?: DateWithOperator;
  endDate?: DateWithOperator;
  drugType?: NumberWithOperator;
  visitType?: NumberWithOperator;
  stopReason?: StringWithOperator;
  refill?: NumberWithOperator;
  quantity?: NumberWithOperator;
  daysSupply?: NumberWithOperator;
  routeType?: NumberWithOperator;
  effectiveDose?: NumberWithOperator;
  doseUnit?: NumberWithOperator;
  lotNumber?: StringWithOperator;
  source?: NumberWithOperator;
  providerSpecialty?: NumberWithOperator;
}

/**
 * measurement 도메인에 대한 필터 인터페이스입니다.
 */
interface MeasurementFilter {
  first?: boolean;
  age?: NumberWithOperator;
  gender?: NumberWithOperator;
  date?: DateWithOperator;
  measurementType?: NumberWithOperator;
  visitType?: NumberWithOperator;
  operatorType?: NumberWithOperator;
  valueAsNumber?: NumberWithOperator;
  valueAsConcept?: NumberWithOperator;
  unitType?: NumberWithOperator;
  abnormal?: boolean;
  rangeLow?: NumberWithOperator;
  rangeHigh?: NumberWithOperator;
  //rangeLowRatio?: NumberWithOperator;
  //rangeHighRatio?: NumberWithOperator;
  providerSpecialty?: NumberWithOperator;
  source?: NumberWithOperator;
}

/**
 * observation 도메인에 대한 필터 인터페이스입니다.
 */
interface ObservationFilter {
  first?: boolean;
  age?: NumberWithOperator;
  gender?: NumberWithOperator;
  date?: DateWithOperator;
  observationType?: NumberWithOperator;
  visitType?: NumberWithOperator;
  valueAsNumber?: NumberWithOperator;
  valueAsString?: StringWithOperator;
  valueAsConcept?: NumberWithOperator;
  qualifierType?: NumberWithOperator;
  unitType?: NumberWithOperator;
  source?: NumberWithOperator;
  providerSpecialty?: NumberWithOperator;
}

/**
 * observation_period 도메인에 대한 필터 인터페이스입니다.
 */
interface ObservationPeriodFilter {
  first?: boolean;
  startAge?: NumberWithOperator;
  endAge?: NumberWithOperator;
  startDate?: DateWithOperator;
  endDate?: DateWithOperator;
  //periodType?: NumberWithOperator;
  length?: NumberWithOperator;
}

/**
 * procedure_occurrence 도메인에 대한 필터 인터페이스입니다.
 */
interface ProcedureOccurrenceFilter {
  first?: boolean;
  age?: NumberWithOperator;
  gender?: NumberWithOperator;
  startDate?: DateWithOperator;
  procedureType?: NumberWithOperator;
  visitType?: NumberWithOperator;
  modifierType?: NumberWithOperator;
  quantity?: NumberWithOperator;
  source?: NumberWithOperator;
  providerSpecialty?: NumberWithOperator;
}

/**
 * specimen 도메인에 대한 필터 인터페이스입니다.
 */
interface SpecimenFilter {
  first?: boolean;
  age?: NumberWithOperator;
  gender?: NumberWithOperator;
  date?: DateWithOperator;
  specimenType?: NumberWithOperator;
  quantity?: NumberWithOperator;
  unitType?: NumberWithOperator;
  anatomicSiteType?: NumberWithOperator;
  diseaseStatus?: NumberWithOperator;
  //source?: StringWithOperator;
}

/**
 * visit_occurrence 도메인에 대한 필터 인터페이스입니다.
 */
interface VisitOccurrenceFilter {
  first?: boolean;
  age?: NumberWithOperator;
  gender?: NumberWithOperator;
  startDate?: DateWithOperator;
  endDate?: DateWithOperator;
  visitType?: NumberWithOperator;
  length?: NumberWithOperator;
  source?: NumberWithOperator;
  providerSpecialty?: NumberWithOperator;
  placeOfService?: NumberWithOperator;
  //location?: NumberWithOperator;
}

/**
 * demographic 도메인에 대한 필터 인터페이스입니다.
 */
interface DemographicFilter {
  age?: NumberWithOperator;
  gender?: NumberWithOperator;
  startDate?: DateWithOperator;
  endDate?: DateWithOperator;
  raceType?: NumberWithOperator;
  ethnicityType?: NumberWithOperator;
}

// 표현은 최대한 간단하게 유지하는 것이 좋습니다.
// 쿼리는 프론트엔드에서 받은 그대로 사용되며, 추가적인 최적화 과정을 거치지 않습니다.
//
// ---
//
// `Operator`로 표현할 수 있는 조건이라면 가능한 `Operator`를 사용하세요.
// 백엔드에서 훨씬 더 효율적으로 처리됩니다.
// `LogicalOperator`(and, or, not 등)는 꼭 필요한 경우가 아니라면 피하십시오.
//
// 아래는 `LogicalOperator`를 비효율적으로 사용한 예시입니다:
// const ex1_Inefficient: Cohort = {
//   entry: {
//     // criteria 내부에서 최상위에 `not`이 오는 경우 (불필요한 LogicalOperator 사용)
//     criteria: {
//       not: {
//         type: "condition_era",
//         filters: {
//           startAge: {
//             eq: [1, 2, 3],
//           },
//         },
//       },
//     },
//   },
//   inclusion: {},
//   exit: {},
// };
//
// 보다 효율적인 방법:
// const ex1_Efficient: Cohort = {
//   entry: {
//     criteria: {
//       type: "condition_era",
//       filters: {
//         // 동일한 의미를 Operator로 표현 (NOT 사용 대신 neq)
//         startAge: {
//           neq: [1, 2, 3],
//         },
//       },
//     },
//   },
//   inclusion: {},
//   exit: {},
// };
//
// 불필요한 `AND`, `OR`를 맨 위에 두는 것은 어느 정도 허용됩니다.
// (프론트엔드 구현 편의를 위해)
// 하지만 `NOT`을 최상위에 두는 것은 다릅니다.
// 최상위에서 NOT을 사용하면 전체 테이블 스캔을 유발해 매우 비효율적이며,
// 메모리 문제까지 일으킬 수 있습니다.
//
// 예시: 허용 가능한 `AND` 사용 사례
// const ex2_WithAND: Cohort = {
//   entry: {
//     criteria: {
//       and: [
//         // 프론트엔드에서 항상 AND로 시작하면 편리할 수 있으므로 허용
//         {
//           type: "condition_era",
//           filters: {
//             startAge: {
//               neq: [1, 2, 3],
//             },
//           },
//         },
//       ],
//     },
//   },
//   inclusion: {},
//   exit: {},
// };
//
//
// ---
//
// 여러 조건을 각각 따로 나누기보다는 하나의 객체에 합쳐서 표현하는 것이 더 효율적입니다.
//
// 비효율적인 예시 (불필요한 `LogicalOperator` 사용):
// const ex3_Inefficient: Cohort = {
//   entry: {
//     criteria: {
//       and: [
//         // 불필요한 AND 배열 내에서 같은 도메인을 두 번 사용
//         {
//           type: "condition_era",
//           filters: {
//             startAge: 10,
//           },
//         },
//         {
//           type: "condition_era",
//           filters: {
//             endAge: 20,
//           },
//         },
//       ],
//     },
//   },
//   inclusion: {},
//   exit: {},
// };

// 더 효율적인 접근:
// const ex3_Efficient: Cohort = {
//   entry: {
//     criteria: {
//       // 한 번에 startAge, endAge를 설정
//       type: "condition_era",
//       filters: {
//         startAge: 10,
//         endAge: 20,
//       },
//     },
//   },
//   inclusion: {},
//   exit: {},
// };

// 단일 조건, startAge가 10세인 환자
const cohort1: Cohort = {
  entry: {
    criteria: {
      type: "condition_era",
      filters: {
        startAge: 10,
      },
    },
  },
  inclusion: {},
  exit: {},
};

// 연산자 사용, startAge가 (10세 또는 20세이고) 15세가 아닌 환자
const cohort2: Cohort = {
  entry: {
    criteria: {
      type: "condition_era",
      filters: {
        startAge: {
          eq: [10, 20], // 10 또는 20세
          neq: 15, // 15세가 아닌
        },
      },
    },
  },
  inclusion: {},
  exit: {},
};

// 범위 지정, startAge가 10세 초과 20세 미만인 환자
const cohort3: Cohort = {
  entry: {
    criteria: {
      type: "condition_era",
      filters: {
        startAge: {
          gt: 10, // 10세 초과
          lt: 20, // 20세 미만
        },
      },
    },
  },
  inclusion: {},
  exit: {},
};

// 여러 조건, condition_era에서 startAge가 10세이고 condition_occurrence에서 first인 환자
const cohort4: Cohort = {
  entry: {
    criteria: {
      and: [
        {
          type: "condition_era",
          filters: {
            startAge: 10,
          },
        },
        {
          type: "condition_occurrence",
          filters: {
            first: true,
          },
        },
      ],
    },
  },
  inclusion: {},
  exit: {},
};

// not 연산자, not (startAge가 10세이고 first인 환자) -> startAge가 10세가 아니고 first가 아닌 환자
const cohort5: Cohort = {
  entry: {
    criteria: {
      not: {
        and: [
          {
            type: "condition_era",
            filters: {
              startAge: 10,
            },
          },
          {
            type: "condition_occurrence",
            filters: {
              first: true,
            },
          },
        ],
      },
    },
  },
  inclusion: {},
  exit: {},
};

// 이런것도 가능은 한데.. startAge가 10세가 아니고 20세도 아닌 환자. 그런데 이런건 그냥 neq: [10, 20]으로도 가능.
const cohort6: Cohort = {
  entry: {
    criteria: {
      type: "condition_era",
      filters: {
        startAge: {
          not: {
            and: [
              {
                eq: 10,
              },
              {
                eq: 20,
              },
            ],
          },
        },
      },
    },
  },
  inclusion: {},
  exit: {},
};
"""