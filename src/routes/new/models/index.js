/**
 * 포함 규칙(inclusion rule)을 업데이트하는 함수
 * @param {Object} cohortDefinition - 코호트 정의 객체
 * @param {Number} index - 업데이트할 규칙의 인덱스
 * @param {Object} rule - 새 규칙 데이터
 * @returns {Object} - 업데이트된 코호트 정의 객체
 */
export function updateInclusionRule(cohortDefinition, index, rule) {
  if (!cohortDefinition || !cohortDefinition.inclusionRules) {
    return cohortDefinition;
  }

  // 객체의 불변성을 유지하기 위해 새 객체 생성
  const newCohortDefinition = {
    ...cohortDefinition,
    inclusionRules: [...cohortDefinition.inclusionRules]
  };

  // 해당 인덱스의 규칙 업데이트
  if (index >= 0 && index < newCohortDefinition.inclusionRules.length) {
    newCohortDefinition.inclusionRules[index] = {
      ...newCohortDefinition.inclusionRules[index],
      ...rule
    };
  }

  return newCohortDefinition;
} 