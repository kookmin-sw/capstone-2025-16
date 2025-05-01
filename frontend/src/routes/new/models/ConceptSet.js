/**
 * 개념 집합(Concept Set) 관련 모델 및 유틸리티
 * 
 * 이 파일은 개념 집합 객체를 생성, 관리하고 조작하는 함수들을 제공합니다.
 * types.ts에 정의된 ConceptSet 타입에 맞게 구현되었습니다.
 */

/**
 * 새 개념 집합 생성
 * @param {Object} data - 초기 데이터
 * @return {Object} - 새 개념 집합 객체
 */
export function createConceptSet(data = {}) {
  // types.ts의 ConceptSet 인터페이스에 맞춘 구조
  return {
    conceptset_id: data.conceptset_id || Date.now().toString(), // 고유 ID 생성
    name: data.name || "New Concept Set",
    items: data.items || [],
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
 * 개념 집합에 개념 추가
 * @param {Object} conceptSet - 개념 집합 객체
 * @param {Object} concept - 추가할 개념
 * @return {Object} - 업데이트된 개념 집합
 */
export function addConceptToSet(conceptSet, concept) {
  // 이미 존재하는지 확인
  const exists = conceptSet.expression.items.some(item => 
    item.concept.CONCEPT_ID === concept.CONCEPT_ID
  );
  
  if (exists) {
    return conceptSet;
  }

  // types.ts의 Concept 타입에 맞게 변환
  const conceptItem = {
    concept: {
      CONCEPT_ID: concept.CONCEPT_ID,
      CONCEPT_NAME: concept.CONCEPT_NAME,
      DOMAIN_ID: concept.DOMAIN_ID,
      VOCABULARY_ID: concept.VOCABULARY_ID,
      CONCEPT_CLASS_ID: concept.CONCEPT_CLASS_ID,
      STANDARD_CONCEPT: concept.STANDARD_CONCEPT || "",
      CONCEPT_CODE: concept.CONCEPT_CODE,
      INVALID_REASON: concept.INVALID_REASON
    },
    isExcluded: false,
    includeDescendants: false,
    includeMapped: false
  };
  
  // 아이템 추가
  const newConceptSet = { ...conceptSet };
  newConceptSet.expression.items.push(conceptItem);
  
  // types.ts의 Concept 타입에 맞춰 items 배열에도 추가
  newConceptSet.items.push({
    concept_id: concept.CONCEPT_ID.toString(),
    concept_name: concept.CONCEPT_NAME,
    domain_id: concept.DOMAIN_ID,
    vocabulary_id: concept.VOCABULARY_ID,
    concept_class_id: concept.CONCEPT_CLASS_ID,
    standard_concept: concept.STANDARD_CONCEPT || "",
    concept_code: concept.CONCEPT_CODE,
    valid_start_date: "1970-01-01",
    valid_end_date: "2099-12-31",
    invalid_reason: concept.INVALID_REASON,
    isExcluded: false,
    includeDescendants: false,
    includeMapped: false
  });
  
  return newConceptSet;
}

/**
 * 개념 집합에서 개념 제거
 * @param {Object} conceptSet - 개념 집합 객체
 * @param {string|number} conceptId - 제거할 개념 ID
 * @return {Object} - 업데이트된 개념 집합
 */
export function removeConceptFromSet(conceptSet, conceptId) {
  const newConceptSet = { ...conceptSet };
  
  // 문자열로 통일
  const idStr = conceptId.toString();
  
  // expression.items에서 제거
  newConceptSet.expression.items = newConceptSet.expression.items.filter(
    item => item.concept.CONCEPT_ID.toString() !== idStr
  );
  
  // items 배열에서도 제거
  newConceptSet.items = newConceptSet.items.filter(
    concept => concept.concept_id.toString() !== idStr
  );
  
  return newConceptSet;
}

/**
 * 개념 집합 내 항목 속성 업데이트
 * @param {Object} conceptSet - 개념 집합 객체
 * @param {string|number} conceptId - 업데이트할 개념 ID
 * @param {string} property - 업데이트할 속성 ('isExcluded', 'includeDescendants', 'includeMapped')
 * @param {boolean} value - 새 속성 값
 * @return {Object} - 업데이트된 개념 집합
 */
export function updateConceptSetItem(conceptSet, conceptId, property, value) {
  const newConceptSet = { ...conceptSet };
  
  // 문자열로 통일
  const idStr = conceptId.toString();
  
  // expression.items 업데이트
  newConceptSet.expression.items = newConceptSet.expression.items.map(item => {
    if (item.concept.CONCEPT_ID.toString() === idStr) {
      return {
        ...item,
        [property]: value
      };
    }
    return item;
  });
  
  // items 배열도 업데이트
  newConceptSet.items = newConceptSet.items.map(concept => {
    if (concept.concept_id.toString() === idStr) {
      return {
        ...concept,
        [property]: value
      };
    }
    return concept;
  });
  
  return newConceptSet;
}

/**
 * 개념 집합을 JSON 문자열로 내보내기
 * @param {Object} conceptSet - 개념 집합 객체
 * @return {string} - JSON 문자열
 */
export function exportConceptSetToJson(conceptSet) {
  return JSON.stringify(conceptSet, null, 2);
}

/**
 * JSON 문자열에서 개념 집합 가져오기
 * @param {string} json - JSON 문자열
 * @return {Object} - 파싱된 개념 집합 객체
 */
export function importConceptSetFromJson(json) {
  try {
    const data = JSON.parse(json);
    
    // ID 재생성 (중복 방지)
    return {
      ...data,
      conceptset_id: data.conceptset_id || Date.now().toString()
    };
  } catch (e) {
    console.error("개념 집합 가져오기 오류:", e);
    return createConceptSet();
  }
}