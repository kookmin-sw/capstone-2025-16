/**
 * Atlas 형식의 기준(Criteria) 모델
 * 
 * 이 파일은 Atlas 코호트 빌더에서 사용하는 이벤트 기준 구조를 정의합니다.
 * 기준은 조건, 약물, 측정 등의 이벤트 유형을 표현합니다.
 */

/**
 * 새 기준 객체 생성
 * @param {Object} data - 초기화 데이터
 * @return {Object} - 기준 객체
 */
export function createCriteria(data = {}) {
  // 기준 객체의 키를 확인 (ConditionOccurrence, DrugExposure, 등)
  const criteriaType = data ? Object.keys(data)[0] : null;
  
  if (!criteriaType) {
    return null;
  }
  
  // 기준 유형에 따라 해당 객체 생성
  const criteriaObj = {};
  criteriaObj[criteriaType] = { ...data[criteriaType] };
  
  return criteriaObj;
}

/**
 * 특정 이벤트 유형의 빈 기준 객체 생성
 * @param {String} type - 이벤트 유형 (ConditionOccurrence, DrugExposure, 등)
 * @param {Number} codesetId - 개념 집합 ID
 * @return {Object} - 기준 객체
 */
export function createEmptyCriteria(type, codesetId = null) {
  const criteria = {};
  criteria[type] = {
    CodesetId: codesetId
  };
  
  return criteria;
}

/**
 * 조건 발생(Condition Occurrence) 기준 생성
 * @param {Object} data - 초기화 데이터
 * @return {Object} - 조건 발생 기준 객체
 */
export function createConditionOccurrence(data = {}) {
  return {
    ConditionOccurrence: {
      CodesetId: data.CodesetId || null,
      First: data.First || false,
      OccurrenceStartDate: data.OccurrenceStartDate || null,
      OccurrenceEndDate: data.OccurrenceEndDate || null,
      ConditionType: data.ConditionType || null,
      StopReason: data.StopReason || null,
      Age: data.Age || null,
      Gender: data.Gender || null,
      ProviderSpecialty: data.ProviderSpecialty || null,
      VisitType: data.VisitType || null,
      ConditionStatus: data.ConditionStatus || null
    }
  };
}

/**
 * 약물 노출(Drug Exposure) 기준 생성
 * @param {Object} data - 초기화 데이터
 * @return {Object} - 약물 노출 기준 객체
 */
export function createDrugExposure(data = {}) {
  return {
    DrugExposure: {
      CodesetId: data.CodesetId || null,
      First: data.First || false,
      OccurrenceStartDate: data.OccurrenceStartDate || null,
      OccurrenceEndDate: data.OccurrenceEndDate || null,
      DrugType: data.DrugType || null,
      StopReason: data.StopReason || null,
      Refills: data.Refills || null,
      Quantity: data.Quantity || null,
      DaysSupply: data.DaysSupply || null,
      RouteConcept: data.RouteConcept || null,
      EffectiveDrugDose: data.EffectiveDrugDose || null,
      DoseUnit: data.DoseUnit || null,
      Age: data.Age || null,
      Gender: data.Gender || null,
      ProviderSpecialty: data.ProviderSpecialty || null,
      VisitType: data.VisitType || null
    }
  };
}

/**
 * 측정(Measurement) 기준 생성
 * @param {Object} data - 초기화 데이터
 * @return {Object} - 측정 기준 객체
 */
export function createMeasurement(data = {}) {
  return {
    Measurement: {
      CodesetId: data.CodesetId || null,
      First: data.First || false,
      OccurrenceStartDate: data.OccurrenceStartDate || null,
      MeasurementType: data.MeasurementType || null,
      Operator: data.Operator || null,
      ValueAsNumber: data.ValueAsNumber || null,
      ValueAsConcept: data.ValueAsConcept || null,
      Unit: data.Unit || null,
      RangeLow: data.RangeLow || null,
      RangeHigh: data.RangeHigh || null,
      Abnormal: data.Abnormal || false,
      Age: data.Age || null,
      Gender: data.Gender || null,
      ProviderSpecialty: data.ProviderSpecialty || null,
      VisitType: data.VisitType || null
    }
  };
}

/**
 * 기준 속성 업데이트
 * @param {Object} criteria - 기준 객체
 * @param {String} property - 업데이트할 속성 이름
 * @param {*} value - 새 값
 * @return {Object} - 업데이트된 기준 객체
 */
export function updateCriteriaProperty(criteria, property, value) {
  if (!criteria) return null;
  
  const criteriaType = Object.keys(criteria)[0];
  if (!criteriaType) return criteria;
  
  const updatedCriteria = { ...criteria };
  updatedCriteria[criteriaType] = { 
    ...updatedCriteria[criteriaType],
    [property]: value
  };
  
  return updatedCriteria;
}

/**
 * 기준 객체의 유형 이름 얻기
 * @param {Object} criteria - 기준 객체
 * @return {String} - 기준 유형 이름
 */
export function getCriteriaType(criteria) {
  if (!criteria) return "";
  
  return Object.keys(criteria)[0] || "";
}

/**
 * 기준 객체에서 개념 집합 ID 얻기
 * @param {Object} criteria - 기준 객체
 * @return {Number} - 개념 집합 ID
 */
export function getCodesetId(criteria) {
  if (!criteria) return null;
  
  const criteriaType = Object.keys(criteria)[0];
  if (!criteriaType) return null;
  
  return criteria[criteriaType].CodesetId;
}