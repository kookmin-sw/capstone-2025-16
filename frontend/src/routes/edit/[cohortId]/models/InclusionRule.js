/**
 * Atlas 형식의 포함 규칙(Inclusion Rule) 모델
 * 
 * 이 파일은 Atlas 코호트 빌더에서 사용하는 포함 규칙 구조를 정의합니다.
 * 포함 규칙은 코호트 정의의 조건을 더욱 구체화하는 방법을 제공합니다.
 */

import { createCriteriaGroup } from './CriteriaGroup.js';

/**
 * 새 포함 규칙 객체 생성
 * @param {Object} data - 초기화 데이터
 * @return {Object} - 포함 규칙 객체
 */
export function createInclusionRule(data = {}) {
  return {
    name: data.name || "",
    description: data.description || "",
    expression: data.expression ? createCriteriaGroup(data.expression) : createCriteriaGroup()
  };
}

/**
 * 포함 규칙 이름 업데이트
 * @param {Object} inclusionRule - 포함 규칙 객체
 * @param {String} name - 새 이름
 * @return {Object} - 업데이트된 포함 규칙 객체
 */
export function updateName(inclusionRule, name) {
  return {
    ...inclusionRule,
    name: name
  };
}

/**
 * 포함 규칙 설명 업데이트
 * @param {Object} inclusionRule - 포함 규칙 객체
 * @param {String} description - 새 설명
 * @return {Object} - 업데이트된 포함 규칙 객체
 */
export function updateDescription(inclusionRule, description) {
  return {
    ...inclusionRule,
    description: description
  };
}

/**
 * 포함 규칙 표현식 업데이트
 * @param {Object} inclusionRule - 포함 규칙 객체
 * @param {Object} expression - 새 표현식 (CriteriaGroup)
 * @return {Object} - 업데이트된 포함 규칙 객체
 */
export function updateExpression(inclusionRule, expression) {
  return {
    ...inclusionRule,
    expression: expression
  };
}

/**
 * 기본 이름으로 새 포함 규칙 생성
 * @param {Number} index - 포함 규칙 인덱스
 * @return {Object} - 새 포함 규칙 객체
 */
export function createDefaultInclusionRule(index) {
  return createInclusionRule({
    name: `Inclusion Criteria ${index + 1}`,
    description: ""
  });
}