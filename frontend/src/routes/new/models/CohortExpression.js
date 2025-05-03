/**
 * Atlas 형식의 코호트 표현식(Cohort Expression) 모델
 * 
 * 이 파일은 Atlas 코호트 빌더에서 사용하는 코호트 표현식의 전체 구조를 정의합니다.
 * 코호트 표현식은 코호트 정의의 모든 요소를 포함하는 최상위 객체입니다.
 */

import { createConceptSet } from './ConceptSet';
import { createInclusionRule } from './InclusionRule';
import { getStrategyFromObject } from './EndStrategy';
import { createCriteria } from './Criteria';
import { createCriteriaGroup } from './CriteriaGroup';

/**
 * 새 코호트 표현식 객체 생성
 * @param {Object} data - 초기화 데이터
 * @return {Object} - 코호트 표현식 객체
 */
export function createCohortExpression(data = {}) {
  return {
    ConceptSets: data.ConceptSets?.map(cs => createConceptSet(cs)) || [],
    PrimaryCriteria: {
      CriteriaList: data.PrimaryCriteria?.CriteriaList?.map(c => createCriteria(c)) || [],
      ObservationWindow: {
        PriorDays: data.PrimaryCriteria?.ObservationWindow?.PriorDays || 0,
        PostDays: data.PrimaryCriteria?.ObservationWindow?.PostDays || 0
      },
      PrimaryCriteriaLimit: {
        Type: data.PrimaryCriteria?.PrimaryCriteriaLimit?.Type || "First"
      }
    },
    AdditionalCriteria: data.AdditionalCriteria ? createCriteriaGroup(data.AdditionalCriteria) : null,
    QualifiedLimit: {
      Type: data.QualifiedLimit?.Type || "First"
    },
    ExpressionLimit: {
      Type: data.ExpressionLimit?.Type || "First"
    },
    InclusionRules: data.InclusionRules?.map(rule => createInclusionRule(rule)) || [],
    EndStrategy: getStrategyFromObject(data.EndStrategy),
    CensoringCriteria: data.CensoringCriteria?.map(c => createCriteria(c)) || [],
    CollapseSettings: {
      CollapseType: data.CollapseSettings?.CollapseType || "ERA",
      EraPad: data.CollapseSettings?.EraPad || 0
    },
    CensorWindow: data.CensorWindow || null,
    cdmVersionRange: data.cdmVersionRange || null
  };
}

/**
 * 코호트 표현식에 개념 집합 추가
 * @param {Object} cohortExpression - 코호트 표현식 객체
 * @param {Object} conceptSet - 추가할 개념 집합
 * @return {Object} - 업데이트된 코호트 표현식
 */
export function addConceptSet(cohortExpression, conceptSet) {
  return {
    ...cohortExpression,
    ConceptSets: [...cohortExpression.ConceptSets, conceptSet]
  };
}

/**
 * 코호트 표현식에서 개념 집합 제거
 * @param {Object} cohortExpression - 코호트 표현식 객체
 * @param {Number} index - 제거할 개념 집합 인덱스
 * @return {Object} - 업데이트된 코호트 표현식
 */
export function removeConceptSet(cohortExpression, index) {
  const newConceptSets = [...cohortExpression.ConceptSets];
  newConceptSets.splice(index, 1);
  
  return {
    ...cohortExpression,
    ConceptSets: newConceptSets
  };
}

/**
 * 코호트 표현식에 기본 조건 추가
 * @param {Object} cohortExpression - 코호트 표현식 객체
 * @param {Object} criteria - 추가할 조건
 * @return {Object} - 업데이트된 코호트 표현식
 */
export function addPrimaryCriteria(cohortExpression, criteria) {
  return {
    ...cohortExpression,
    PrimaryCriteria: {
      ...cohortExpression.PrimaryCriteria,
      CriteriaList: [...cohortExpression.PrimaryCriteria.CriteriaList, criteria]
    }
  };
}

/**
 * 코호트 표현식에서 기본 조건 제거
 * @param {Object} cohortExpression - 코호트 표현식 객체
 * @param {Number} index - 제거할 조건 인덱스
 * @return {Object} - 업데이트된 코호트 표현식
 */
export function removePrimaryCriteria(cohortExpression, index) {
  const newCriteriaList = [...cohortExpression.PrimaryCriteria.CriteriaList];
  newCriteriaList.splice(index, 1);
  
  return {
    ...cohortExpression,
    PrimaryCriteria: {
      ...cohortExpression.PrimaryCriteria,
      CriteriaList: newCriteriaList
    }
  };
}

/**
 * 기본 조건 제한 유형 업데이트
 * @param {Object} cohortExpression - 코호트 표현식 객체
 * @param {String} limitType - 제한 유형 ("First", "All", "Last")
 * @return {Object} - 업데이트된 코호트 표현식
 */
export function updatePrimaryCriteriaLimit(cohortExpression, limitType) {
  return {
    ...cohortExpression,
    PrimaryCriteria: {
      ...cohortExpression.PrimaryCriteria,
      PrimaryCriteriaLimit: {
        Type: limitType
      }
    }
  };
}

/**
 * 관찰 윈도우 업데이트
 * @param {Object} cohortExpression - 코호트 표현식 객체
 * @param {Number} priorDays - 이전 일수
 * @param {Number} postDays - 이후 일수
 * @return {Object} - 업데이트된 코호트 표현식
 */
export function updateObservationWindow(cohortExpression, priorDays, postDays) {
  return {
    ...cohortExpression,
    PrimaryCriteria: {
      ...cohortExpression.PrimaryCriteria,
      ObservationWindow: {
        PriorDays: priorDays,
        PostDays: postDays
      }
    }
  };
}

/**
 * 추가 조건 업데이트
 * @param {Object} cohortExpression - 코호트 표현식 객체
 * @param {Object} additionalCriteria - 새 추가 조건 그룹
 * @return {Object} - 업데이트된 코호트 표현식
 */
export function updateAdditionalCriteria(cohortExpression, additionalCriteria) {
  return {
    ...cohortExpression,
    AdditionalCriteria: additionalCriteria
  };
}

/**
 * 코호트 표현식에 포함 규칙 추가
 * @param {Object} cohortExpression - 코호트 표현식 객체
 * @param {Object} inclusionRule - 추가할 포함 규칙
 * @return {Object} - 업데이트된 코호트 표현식
 */
export function addInclusionRule(cohortExpression, inclusionRule) {
  return {
    ...cohortExpression,
    InclusionRules: [...cohortExpression.InclusionRules, inclusionRule]
  };
}

/**
 * 코호트 표현식에서 포함 규칙 제거
 * @param {Object} cohortExpression - 코호트 표현식 객체
 * @param {Number} index - 제거할 포함 규칙 인덱스
 * @return {Object} - 업데이트된 코호트 표현식
 */
export function removeInclusionRule(cohortExpression, index) {
  const newInclusionRules = [...cohortExpression.InclusionRules];
  newInclusionRules.splice(index, 1);
  
  return {
    ...cohortExpression,
    InclusionRules: newInclusionRules
  };
}

/**
 * 종료 전략 업데이트
 * @param {Object} cohortExpression - 코호트 표현식 객체
 * @param {Object} endStrategy - 새 종료 전략
 * @return {Object} - 업데이트된 코호트 표현식
 */
export function updateEndStrategy(cohortExpression, endStrategy) {
  return {
    ...cohortExpression,
    EndStrategy: endStrategy
  };
}

/**
 * 코호트 표현식에 검열 기준 추가
 * @param {Object} cohortExpression - 코호트 표현식 객체
 * @param {Object} censoringCriteria - 추가할 검열 기준
 * @return {Object} - 업데이트된 코호트 표현식
 */
export function addCensoringCriteria(cohortExpression, censoringCriteria) {
  return {
    ...cohortExpression,
    CensoringCriteria: [...cohortExpression.CensoringCriteria, censoringCriteria]
  };
}

/**
 * 코호트 표현식에서 검열 기준 제거
 * @param {Object} cohortExpression - 코호트 표현식 객체
 * @param {Number} index - 제거할 검열 기준 인덱스
 * @return {Object} - 업데이트된 코호트 표현식
 */
export function removeCensoringCriteria(cohortExpression, index) {
  const newCensoringCriteria = [...cohortExpression.CensoringCriteria];
  newCensoringCriteria.splice(index, 1);
  
  return {
    ...cohortExpression,
    CensoringCriteria: newCensoringCriteria
  };
}

/**
 * 코호트 표현식 JSON 변환
 * @param {Object} cohortExpression - 코호트 표현식 객체
 * @return {String} - JSON 문자열
 */
export function cohortExpressionToJson(cohortExpression) {
  return JSON.stringify(cohortExpression, null, 2);
}

/**
 * JSON에서 코호트 표현식 가져오기
 * @param {String} json - JSON 문자열
 * @return {Object} - 코호트 표현식 객체
 */
export function cohortExpressionFromJson(json) {
  try {
    const data = JSON.parse(json);
    return createCohortExpression(data);
  } catch (e) {
    console.error("코호트 표현식 파싱 오류:", e);
    return createCohortExpression();
  }
}