/**
 * Atlas 형식의 윈도우 조건(Windowed Criteria) 모델
 * 
 * 이 파일은 Atlas 코호트 빌더에서 사용하는 윈도우 조건 구조를 정의합니다.
 * 윈도우 조건은 이벤트 발생 시점을 기준으로 시간 윈도우를 정의하고 해당 윈도우 내에서의 
 * 이벤트 발생을 검색합니다.
 */

import { createCriteria } from './Criteria.js';

/**
 * 새 윈도우 조건 객체 생성
 * @param {Object} data - 초기화 데이터
 * @return {Object} - 윈도우 조건 객체
 */
export function createWindowedCriteria(data = {}) {
  return {
    Criteria: data.Criteria ? createCriteria(data.Criteria) : null,
    StartWindow: {
      Start: {
        Days: data.StartWindow?.Start?.Days || 0,
        Coeff: data.StartWindow?.Start?.Coeff || -1
      },
      End: {
        Days: data.StartWindow?.End?.Days || 0,
        Coeff: data.StartWindow?.End?.Coeff || 1
      },
      UseEventEnd: data.StartWindow?.UseEventEnd || false
    },
    EndWindow: {
      Start: {
        Days: data.EndWindow?.Start?.Days || 0,
        Coeff: data.EndWindow?.Start?.Coeff || -1
      },
      End: {
        Days: data.EndWindow?.End?.Days || 0,
        Coeff: data.EndWindow?.End?.Coeff || 1
      },
      UseEventEnd: data.EndWindow?.UseEventEnd || false
    },
    Occurrence: {
      Type: data.Occurrence?.Type || 0, // 0: at least, 1: exactly, 2: at most
      Count: data.Occurrence?.Count || 1,
      IsDistinct: data.Occurrence?.IsDistinct || false
    }
  };
}

/**
 * 윈도우 조건의 기준 업데이트
 * @param {Object} windowedCriteria - 윈도우 조건 객체
 * @param {Object} criteria - 새 기준 객체
 * @return {Object} - 업데이트된 윈도우 조건
 */
export function updateCriteria(windowedCriteria, criteria) {
  return {
    ...windowedCriteria,
    Criteria: criteria
  };
}

/**
 * 시작 윈도우 업데이트
 * @param {Object} windowedCriteria - 윈도우 조건 객체
 * @param {Object} startWindow - 새 시작 윈도우 객체
 * @return {Object} - 업데이트된 윈도우 조건
 */
export function updateStartWindow(windowedCriteria, startWindow) {
  return {
    ...windowedCriteria,
    StartWindow: {
      ...windowedCriteria.StartWindow,
      ...startWindow
    }
  };
}

/**
 * 종료 윈도우 업데이트
 * @param {Object} windowedCriteria - 윈도우 조건 객체
 * @param {Object} endWindow - 새 종료 윈도우 객체
 * @return {Object} - 업데이트된 윈도우 조건
 */
export function updateEndWindow(windowedCriteria, endWindow) {
  return {
    ...windowedCriteria,
    EndWindow: {
      ...windowedCriteria.EndWindow,
      ...endWindow
    }
  };
}

/**
 * 발생 설정 업데이트
 * @param {Object} windowedCriteria - 윈도우 조건 객체
 * @param {Object} occurrence - 새 발생 설정 객체
 * @return {Object} - 업데이트된 윈도우 조건
 */
export function updateOccurrence(windowedCriteria, occurrence) {
  return {
    ...windowedCriteria,
    Occurrence: {
      ...windowedCriteria.Occurrence,
      ...occurrence
    }
  };
}

/**
 * 발생 유형 (정확히, 최소, 최대) 업데이트
 * @param {Object} windowedCriteria - 윈도우 조건 객체
 * @param {Number} type - 새 발생 유형 (0: at least, 1: exactly, 2: at most)
 * @return {Object} - 업데이트된 윈도우 조건
 */
export function updateOccurrenceType(windowedCriteria, type) {
  return updateOccurrence(windowedCriteria, { Type: type });
}

/**
 * 발생 횟수 업데이트
 * @param {Object} windowedCriteria - 윈도우 조건 객체
 * @param {Number} count - 새 발생 횟수
 * @return {Object} - 업데이트된 윈도우 조건
 */
export function updateOccurrenceCount(windowedCriteria, count) {
  return updateOccurrence(windowedCriteria, { Count: count });
}

/**
 * 고유 발생 여부 업데이트
 * @param {Object} windowedCriteria - 윈도우 조건 객체
 * @param {Boolean} isDistinct - 고유 발생 여부
 * @return {Object} - 업데이트된 윈도우 조건
 */
export function updateOccurrenceIsDistinct(windowedCriteria, isDistinct) {
  return updateOccurrence(windowedCriteria, { IsDistinct: isDistinct });
}