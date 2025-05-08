/**
 * Atlas 형식의 조건 그룹(Criteria Group) 모델
 * 
 * 이 파일은 Atlas 코호트 빌더에서 사용하는 조건 그룹 구조를 정의합니다.
 * 조건 그룹은 여러 조건을 논리적으로 결합하는 방식을 정의합니다.
 */

import { createWindowedCriteria } from './WindowedCriteria.js';
import { createDemographicCriteria } from './DemographicCriteria.js';

/**
 * 새 조건 그룹 객체 생성
 * @param {Object} data - 초기화 데이터
 * @return {Object} - 조건 그룹 객체
 */
export function createCriteriaGroup(data = {}) {
  return {
    Type: data.Type || "ALL", // "ALL", "ANY", "AT_LEAST"
    Count: data.Count || 0,   // AT_LEAST 유형에서만 사용됨
    CriteriaList: data.CriteriaList?.map(criteria => createWindowedCriteria(criteria)) || [],
    DemographicCriteriaList: data.DemographicCriteriaList?.map(criteria => createDemographicCriteria(criteria)) || [],
    Groups: data.Groups?.map(group => createCriteriaGroup(group)) || []
  };
}

/**
 * 조건 그룹에 윈도우 조건 추가
 * @param {Object} criteriaGroup - 조건 그룹 객체
 * @param {Object} windowedCriteria - 추가할 윈도우 조건
 * @return {Object} - 업데이트된 조건 그룹
 */
export function addWindowedCriteria(criteriaGroup, windowedCriteria) {
  return {
    ...criteriaGroup,
    CriteriaList: [...criteriaGroup.CriteriaList, windowedCriteria]
  };
}

/**
 * 조건 그룹에 인구통계학 조건 추가
 * @param {Object} criteriaGroup - 조건 그룹 객체
 * @param {Object} demographicCriteria - 추가할 인구통계학 조건
 * @return {Object} - 업데이트된 조건 그룹
 */
export function addDemographicCriteria(criteriaGroup, demographicCriteria) {
  return {
    ...criteriaGroup,
    DemographicCriteriaList: [...criteriaGroup.DemographicCriteriaList, demographicCriteria]
  };
}

/**
 * 조건 그룹에 하위 그룹 추가
 * @param {Object} criteriaGroup - 조건 그룹 객체
 * @param {Object} subGroup - 추가할 하위 그룹
 * @return {Object} - 업데이트된 조건 그룹
 */
export function addSubGroup(criteriaGroup, subGroup) {
  return {
    ...criteriaGroup,
    Groups: [...criteriaGroup.Groups, subGroup]
  };
}

/**
 * 조건 그룹에서 윈도우 조건 제거
 * @param {Object} criteriaGroup - 조건 그룹 객체
 * @param {Number} index - 제거할 조건 인덱스
 * @return {Object} - 업데이트된 조건 그룹
 */
export function removeWindowedCriteria(criteriaGroup, index) {
  const newCriteriaList = [...criteriaGroup.CriteriaList];
  newCriteriaList.splice(index, 1);
  
  return {
    ...criteriaGroup,
    CriteriaList: newCriteriaList
  };
}

/**
 * 조건 그룹에서 인구통계학 조건 제거
 * @param {Object} criteriaGroup - 조건 그룹 객체
 * @param {Number} index - 제거할 조건 인덱스
 * @return {Object} - 업데이트된 조건 그룹
 */
export function removeDemographicCriteria(criteriaGroup, index) {
  const newDemographicList = [...criteriaGroup.DemographicCriteriaList];
  newDemographicList.splice(index, 1);
  
  return {
    ...criteriaGroup,
    DemographicCriteriaList: newDemographicList
  };
}

/**
 * 조건 그룹에서 하위 그룹 제거
 * @param {Object} criteriaGroup - 조건 그룹 객체
 * @param {Number} index - 제거할 하위 그룹 인덱스
 * @return {Object} - 업데이트된 조건 그룹
 */
export function removeSubGroup(criteriaGroup, index) {
  const newGroups = [...criteriaGroup.Groups];
  newGroups.splice(index, 1);
  
  return {
    ...criteriaGroup,
    Groups: newGroups
  };
}

/**
 * 조건 그룹 유형 업데이트
 * @param {Object} criteriaGroup - 조건 그룹 객체
 * @param {String} type - 새 유형 ("ALL", "ANY", "AT_LEAST")
 * @return {Object} - 업데이트된 조건 그룹
 */
export function updateGroupType(criteriaGroup, type) {
  const updatedGroup = {
    ...criteriaGroup,
    Type: type
  };
  
  // AT_LEAST가 아닌 경우 Count 속성 제거
  if (type !== "AT_LEAST") {
    delete updatedGroup.Count;
  }
  
  return updatedGroup;
}

/**
 * AT_LEAST 유형의 조건 그룹 카운트 업데이트
 * @param {Object} criteriaGroup - 조건 그룹 객체
 * @param {Number} count - 새 카운트 값
 * @return {Object} - 업데이트된 조건 그룹
 */
export function updateAtLeastCount(criteriaGroup, count) {
  if (criteriaGroup.Type !== "AT_LEAST") {
    return criteriaGroup;
  }
  
  return {
    ...criteriaGroup,
    Count: count
  };
}