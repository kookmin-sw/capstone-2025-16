/**
 * Atlas 형식의 종료 전략(End Strategy) 모델
 * 
 * 이 파일은 Atlas 코호트 빌더에서 사용하는 종료 전략 구조를 정의합니다.
 * 종료 전략은 코호트 멤버십의 종료 시점을 결정하는 방법을 정의합니다.
 */

/**
 * 새 날짜 오프셋 종료 전략 생성
 * @param {Object} data - 초기화 데이터
 * @return {Object} - 날짜 오프셋 종료 전략 객체
 */
export function createDateOffsetStrategy(data = {}) {
  return {
    DateOffset: {
      DateField: data.DateField || "StartDate",
      Offset: data.Offset || 0
    }
  };
}

/**
 * 새 커스텀 시대 종료 전략 생성
 * @param {Object} data - 초기화 데이터
 * @return {Object} - 커스텀 시대 종료 전략 객체
 */
export function createCustomEraStrategy(data = {}) {
  return {
    CustomEra: {
      DrugCodesetId: data.DrugCodesetId || null,
      GapDays: data.GapDays || 0,
      Offset: data.Offset || 0
    }
  };
}

/**
 * 날짜 오프셋 종료 전략의 날짜 필드 업데이트
 * @param {Object} endStrategy - 종료 전략 객체
 * @param {String} dateField - 날짜 필드 ("StartDate" 또는 "EndDate")
 * @return {Object} - 업데이트된 종료 전략 객체
 */
export function updateDateField(endStrategy, dateField) {
  if (!endStrategy || !endStrategy.DateOffset) {
    return endStrategy;
  }
  
  return {
    DateOffset: {
      ...endStrategy.DateOffset,
      DateField: dateField
    }
  };
}

/**
 * 날짜 오프셋 종료 전략의 오프셋 값 업데이트
 * @param {Object} endStrategy - 종료 전략 객체
 * @param {Number} offset - 오프셋 값
 * @return {Object} - 업데이트된 종료 전략 객체
 */
export function updateDateOffset(endStrategy, offset) {
  if (!endStrategy || !endStrategy.DateOffset) {
    return endStrategy;
  }
  
  return {
    DateOffset: {
      ...endStrategy.DateOffset,
      Offset: offset
    }
  };
}

/**
 * 커스텀 시대 종료 전략의 약물 코드셋 ID 업데이트
 * @param {Object} endStrategy - 종료 전략 객체
 * @param {Number} drugCodesetId - 약물 코드셋 ID
 * @return {Object} - 업데이트된 종료 전략 객체
 */
export function updateDrugCodesetId(endStrategy, drugCodesetId) {
  if (!endStrategy || !endStrategy.CustomEra) {
    return endStrategy;
  }
  
  return {
    CustomEra: {
      ...endStrategy.CustomEra,
      DrugCodesetId: drugCodesetId
    }
  };
}

/**
 * 커스텀 시대 종료 전략의 갭 데이 값 업데이트
 * @param {Object} endStrategy - 종료 전략 객체
 * @param {Number} gapDays - 갭 데이 값
 * @return {Object} - 업데이트된 종료 전략 객체
 */
export function updateGapDays(endStrategy, gapDays) {
  if (!endStrategy || !endStrategy.CustomEra) {
    return endStrategy;
  }
  
  return {
    CustomEra: {
      ...endStrategy.CustomEra,
      GapDays: gapDays
    }
  };
}

/**
 * 커스텀 시대 종료 전략의 오프셋 값 업데이트
 * @param {Object} endStrategy - 종료 전략 객체
 * @param {Number} offset - 오프셋 값
 * @return {Object} - 업데이트된 종료 전략 객체
 */
export function updateCustomEraOffset(endStrategy, offset) {
  if (!endStrategy || !endStrategy.CustomEra) {
    return endStrategy;
  }
  
  return {
    CustomEra: {
      ...endStrategy.CustomEra,
      Offset: offset
    }
  };
}

/**
 * 객체로부터 종료 전략 생성
 * @param {Object} data - 초기화 데이터
 * @return {Object} - 종료 전략 객체
 */
export function getStrategyFromObject(data) {
  if (!data) {
    return null;
  }
  
  if (data.DateOffset) {
    return createDateOffsetStrategy(data.DateOffset);
  } else if (data.CustomEra) {
    return createCustomEraStrategy(data.CustomEra);
  }
  
  return null;
}