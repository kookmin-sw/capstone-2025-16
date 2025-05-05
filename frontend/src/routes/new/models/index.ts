/**
 * Atlas 코호트 빌더 데이터 모델 인덱스
 * 
 * 이 파일은 Atlas 형식의 코호트 정의를 위한 모든 데이터 모델을 
 * 중앙에서 내보냅니다.
 */

// 코호트 표현식 - 최상위 객체
export * from './CohortExpression';

// 개념 집합 관련
export * from './ConceptSet';

// 조건 관련
export * from './Criteria';
export * from './CriteriaGroup';
export * from './WindowedCriteria';

// 인구통계학 관련
export * from './DemographicCriteria';

// 포함 규칙 관련
export * from './InclusionRule';

// 종료 전략 관련
export * from './EndStrategy';

/**
 * 새로운 빈 코호트 정의 생성
 * @return {Object} - 기본 Atlas 형식의 코호트 표현식
 */
export function createEmptyCohortExpression() {
  return {
    ConceptSets: [], // 개념 집합 목록
    PrimaryCriteria: {
      CriteriaList: [], // 초기 이벤트 목록
      ObservationWindow: {
        PriorDays: 0, // 이벤트 전 관찰 기간
        PostDays: 0 // 이벤트 후 관찰 기간
      },
      PrimaryCriteriaLimit: {
        Type: "First" // 이벤트 제한 (First, All, Last)
      }
    },
    AdditionalCriteria: null, // 추가 조건
    QualifiedLimit: {
      Type: "First" 
    },
    ExpressionLimit: {
      Type: "First"
    },
    InclusionRules: [], // 포함 규칙
    EndStrategy: null, // 종료 전략
    CensoringCriteria: [], // 검열 기준
    CollapseSettings: {
      CollapseType: "ERA",
      EraPad: 0
    },
    CensorWindow: null
  };
}

/**
 * UI 상태와 Atlas 형식 간 매핑 테이블
 */
export const typeMapping = {
  // UI ID에서 Atlas 유형으로 변환
  "condition-era": "ConditionEra",
  "condition-occurrence": "ConditionOccurrence",
  "death": "Death",
  "device-exposure": "DeviceExposure",
  "dose-era": "DoseEra",
  "drug-era": "DrugEra",
  "drug-exposure": "DrugExposure",
  "measurement": "Measurement",
  "observation": "Observation",
  "observation-period": "ObservationPeriod",
  "procedure-occurrence": "ProcedureOccurrence",
  "specimen": "Specimen",
  "visit-occurrence": "VisitOccurrence",
  "visit-detail": "VisitDetail",
  "demographic": "DemographicCriteria",
  
  // Atlas 유형에서 UI ID로 변환 (역매핑)
  "ConditionEra": "condition-era",
  "ConditionOccurrence": "condition-occurrence",
  "Death": "death",
  "DeviceExposure": "device-exposure",
  "DoseEra": "dose-era",
  "DrugEra": "drug-era",
  "DrugExposure": "drug-exposure",
  "Measurement": "measurement",
  "Observation": "observation",
  "ObservationPeriod": "observation-period",
  "ProcedureOccurrence": "procedure-occurrence",
  "Specimen": "specimen",
  "VisitOccurrence": "visit-occurrence",
  "VisitDetail": "visit-detail",
  "DemographicCriteria": "demographic"
};