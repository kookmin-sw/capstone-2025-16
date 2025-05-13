/**
 * Atlas 코호트 빌더 데이터 모델 인덱스
 * 
 * 이 파일은 Atlas 형식의 코호트 정의를 위한 모든 데이터 모델을 
 * 중앙에서 내보냅니다.
 */

// 개념 집합 관련
export * from './ConceptSet';


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