/**
 * Atlas 형식의 인구통계학 기준(Demographic Criteria) 모델
 * 
 * 이 파일은 Atlas 코호트 빌더에서 사용하는 인구통계학 기준 구조를 정의합니다.
 * 인구통계학 기준은 성별, 연령, 인종 등의 인구통계학적 특성을 기준으로 합니다.
 */

/**
 * 새 인구통계학 기준 객체 생성
 * @param {Object} data - 초기화 데이터
 * @return {Object} - 인구통계학 기준 객체
 */
export function createDemographicCriteria(data = {}) {
  return {
    Age: data.Age || null,
    Gender: data.Gender || null,
    Race: data.Race || null,
    Ethnicity: data.Ethnicity || null,
    OccurrenceStartDate: data.OccurrenceStartDate || null,
    OccurrenceEndDate: data.OccurrenceEndDate || null
  };
}

/**
 * 연령 범위 업데이트
 * @param {Object} demographicCriteria - 인구통계학 기준 객체
 * @param {Number} min - 최소 연령
 * @param {Number} max - 최대 연령
 * @return {Object} - 업데이트된 인구통계학 기준 객체
 */
export function updateAgeRange(demographicCriteria, min, max) {
  const range = {};
  
  if (min !== null && min !== undefined && min !== "") {
    range.Value = Number(min);
  }
  
  if (max !== null && max !== undefined && max !== "") {
    range.Extent = Number(max);
  }
  
  return {
    ...demographicCriteria,
    Age: Object.keys(range).length > 0 ? range : null
  };
}

/**
 * 성별 설정 업데이트
 * @param {Object} demographicCriteria - 인구통계학 기준 객체
 * @param {Array} genderConceptIds - 성별 개념 ID 배열
 * @return {Object} - 업데이트된 인구통계학 기준 객체
 */
export function updateGender(demographicCriteria, genderConceptIds) {
  if (!genderConceptIds || genderConceptIds.length === 0) {
    return {
      ...demographicCriteria,
      Gender: null
    };
  }
  
  return {
    ...demographicCriteria,
    Gender: {
      CONCEPT_ID: genderConceptIds
    }
  };
}

/**
 * 인종 설정 업데이트
 * @param {Object} demographicCriteria - 인구통계학 기준 객체
 * @param {Array} raceConceptIds - 인종 개념 ID 배열
 * @return {Object} - 업데이트된 인구통계학 기준 객체
 */
export function updateRace(demographicCriteria, raceConceptIds) {
  if (!raceConceptIds || raceConceptIds.length === 0) {
    return {
      ...demographicCriteria,
      Race: null
    };
  }
  
  return {
    ...demographicCriteria,
    Race: {
      CONCEPT_ID: raceConceptIds
    }
  };
}

/**
 * 민족 설정 업데이트
 * @param {Object} demographicCriteria - 인구통계학 기준 객체
 * @param {Array} ethnicityConceptIds - 민족 개념 ID 배열
 * @return {Object} - 업데이트된 인구통계학 기준 객체
 */
export function updateEthnicity(demographicCriteria, ethnicityConceptIds) {
  if (!ethnicityConceptIds || ethnicityConceptIds.length === 0) {
    return {
      ...demographicCriteria,
      Ethnicity: null
    };
  }
  
  return {
    ...demographicCriteria,
    Ethnicity: {
      CONCEPT_ID: ethnicityConceptIds
    }
  };
}

/**
 * 날짜 범위 업데이트
 * @param {Object} demographicCriteria - 인구통계학 기준 객체
 * @param {String} startDate - 시작 날짜
 * @param {String} endDate - 종료 날짜
 * @return {Object} - 업데이트된 인구통계학 기준 객체
 */
export function updateDateRange(demographicCriteria, startDate, endDate) {
  const result = { ...demographicCriteria };
  
  if (startDate) {
    result.OccurrenceStartDate = {
      Value: startDate,
      Extent: null
    };
  } else {
    result.OccurrenceStartDate = null;
  }
  
  if (endDate) {
    result.OccurrenceEndDate = {
      Value: endDate,
      Extent: null
    };
  } else {
    result.OccurrenceEndDate = null;
  }
  
  return result;
}