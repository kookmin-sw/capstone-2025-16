/**
 * Atlas 형식의 개념 집합(Concept Set) 모델
 * 
 * 이 파일은 Atlas 코호트 빌더에서 사용하는 개념 집합 구조를 정의합니다.
 * 개념 집합은 관련 의학 개념들의 모음으로, 코호트 정의에서 재사용됩니다.
 */

/**
 * 새 개념 집합 객체 생성
 * @param {Object} data - 초기화 데이터
 * @return {Object} - 개념 집합 객체
 */
export function createConceptSet(data = {}) {
  return {
    id: data.id || null,
    name: data.name || "",
    expression: {
      items: data.expression?.items?.map(item => createConceptSetItem(item)) || []
    }
  };
}

/**
 * 새 개념 집합 항목 객체 생성
 * @param {Object} data - 초기화 데이터
 * @return {Object} - 개념 집합 항목 객체
 */
export function createConceptSetItem(data = {}) {
  return {
    concept: data.concept || {
      CONCEPT_ID: null,
      CONCEPT_NAME: "",
      STANDARD_CONCEPT: "",
      STANDARD_CONCEPT_CAPTION: "",
      INVALID_REASON: "",
      INVALID_REASON_CAPTION: "",
      CONCEPT_CODE: "",
      DOMAIN_ID: "",
      VOCABULARY_ID: "",
      CONCEPT_CLASS_ID: ""
    },
    isExcluded: data.isExcluded || false,
    includeDescendants: data.includeDescendants || false,
    includeMapped: data.includeMapped || false
  };
}

/**
 * 선택된 개념을 개념 집합에 추가
 * @param {Object} conceptSet - 개념 집합 객체
 * @param {Object} concept - 추가할 개념 객체
 * @return {Object} - 업데이트된 개념 집합
 */
export function addConceptToSet(conceptSet, concept) {
  const newConceptSet = { ...conceptSet };
  
  // 이미 있는지 확인
  const exists = newConceptSet.expression.items.some(
    item => item.concept.CONCEPT_ID === concept.CONCEPT_ID
  );
  
  if (!exists) {
    newConceptSet.expression.items.push(createConceptSetItem({
      concept: concept
    }));
  }
  
  return newConceptSet;
}

/**
 * 개념 집합에서 항목 제거
 * @param {Object} conceptSet - 개념 집합 객체
 * @param {Number} conceptId - 제거할 개념 ID
 * @return {Object} - 업데이트된 개념 집합
 */
export function removeConceptFromSet(conceptSet, conceptId) {
  const newConceptSet = { ...conceptSet };
  
  newConceptSet.expression.items = newConceptSet.expression.items.filter(
    item => item.concept.CONCEPT_ID !== conceptId
  );
  
  return newConceptSet;
}

/**
 * 개념 집합 항목 속성 업데이트
 * @param {Object} conceptSet - 개념 집합 객체
 * @param {Number} conceptId - 업데이트할 개념 ID
 * @param {String} property - 업데이트할 속성 이름
 * @param {*} value - 새 값
 * @return {Object} - 업데이트된 개념 집합
 */
export function updateConceptSetItem(conceptSet, conceptId, property, value) {
  const newConceptSet = { ...conceptSet };
  
  newConceptSet.expression.items = newConceptSet.expression.items.map(item => {
    if (item.concept.CONCEPT_ID === conceptId) {
      return {
        ...item,
        [property]: value
      };
    }
    return item;
  });
  
  return newConceptSet;
}

/**
 * 개념 집합 가져오기 (JSON 문자열로부터)
 * @param {String} json - JSON 문자열
 * @return {Object} - 개념 집합 객체
 */
export function importConceptSetFromJson(json) {
  try {
    const data = JSON.parse(json);
    return createConceptSet(data);
  } catch (e) {
    console.error("개념 집합 가져오기 오류:", e);
    return createConceptSet();
  }
}

/**
 * 개념 집합 내보내기 (JSON 문자열로)
 * @param {Object} conceptSet - 개념 집합 객체
 * @return {String} - JSON 문자열
 */
export function exportConceptSetToJson(conceptSet) {
  return JSON.stringify(conceptSet, null, 2);
}