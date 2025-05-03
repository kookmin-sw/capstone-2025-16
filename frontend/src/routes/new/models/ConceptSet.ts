/**
 * 개념 집합(Concept Set) 관련 모델 및 유틸리티
 * 
 * 이 파일은 개념 집합 객체를 생성, 관리하고 조작하는 함수들을 제공합니다.
 * types.ts에 정의된 ConceptSet 타입에 맞게 구현되었습니다.
 */

// 인터페이스 정의
export interface Concept {
  concept_id: string;
  concept_name: string;
  domain_id?: string;
  vocabulary_id?: string;
  concept_class_id?: string;
  standard_concept?: string;
  concept_code?: string;
  valid_start_date?: string;
  valid_end_date?: string;
  invalid_reason?: string;
  isExcluded?: boolean;
  includeDescendants?: boolean;
  includeMapped?: boolean;
}

export interface ConceptSetItem {
  concept: Concept;
  isExcluded?: boolean;
  includeDescendants?: boolean;
  includeMapped?: boolean;
}

export interface ConceptSet {
  conceptset_id: string;
  name: string;
  expression?: {
    items: ConceptSetItem[];
  };
}

export interface SearchConcept {
  CONCEPT_ID: string | number;
  CONCEPT_NAME: string;
  DOMAIN_ID?: string;
  VOCABULARY_ID?: string;
  CONCEPT_CLASS_ID?: string;
  STANDARD_CONCEPT?: string;
  CONCEPT_CODE?: string;
  INVALID_REASON?: string | null;
}

/**
 * 새 개념 집합 생성
 * @param data - 초기 데이터
 * @return - 새 개념 집합 객체
 */
export function createConceptSet(data: Partial<ConceptSet> = {}): ConceptSet {
  // types.ts의 ConceptSet 인터페이스에 맞춘 구조
  return {
    conceptset_id: data.conceptset_id || `cs-${Date.now()}`, // 고유 ID 생성
    name: data.name || "New Concept Set",
    expression: {
      items: data.expression?.items || []
    }
  };
}

/**
 * 새 개념 집합 항목 객체 생성
 * @param data - 초기화 데이터
 * @return - 개념 집합 항목 객체
 */
export function createConceptSetItem(data: Partial<ConceptSetItem> = {}): ConceptSetItem {
  return {
    concept: data.concept || {
      concept_id: "",
      concept_name: "",
      domain_id: "",
      vocabulary_id: "",
      concept_class_id: "",
      standard_concept: "",
      concept_code: ""
    },
    isExcluded: data.isExcluded || false,
    includeDescendants: data.includeDescendants || false,
    includeMapped: data.includeMapped || false
  };
}

/**
 * 개념 집합에 개념 추가
 * @param conceptSet - 개념 집합 객체
 * @param concept - 추가할 개념
 * @return - 업데이트된 개념 집합
 */
export function addConceptToSet(conceptSet: ConceptSet, concept: SearchConcept): ConceptSet {
  if (!conceptSet.expression) {
    conceptSet.expression = { items: [] };
  }
  
  // 이미 존재하는지 확인
  const exists = conceptSet.expression.items.some(item => 
    item.concept.concept_id === concept.CONCEPT_ID.toString()
  );
  
  if (exists) {
    return conceptSet;
  }

  // 새 개념 아이템 생성
  const conceptItem: ConceptSetItem = {
    concept: {
      concept_id: concept.CONCEPT_ID.toString(),
      concept_name: concept.CONCEPT_NAME,
      domain_id: concept.DOMAIN_ID,
      vocabulary_id: concept.VOCABULARY_ID,
      concept_class_id: concept.CONCEPT_CLASS_ID,
      standard_concept: concept.STANDARD_CONCEPT || "",
      concept_code: concept.CONCEPT_CODE,
      valid_start_date: "1970-01-01",
      valid_end_date: "2099-12-31",
      invalid_reason: concept.INVALID_REASON || undefined
    },
    isExcluded: false,
    includeDescendants: false,
    includeMapped: false
  };
  
  // 아이템 추가
  return {
    ...conceptSet,
    expression: {
      items: [...conceptSet.expression.items, conceptItem]
    }
  };
}

/**
 * 개념 집합에서 개념 제거
 * @param conceptSet - 개념 집합 객체
 * @param conceptId - 제거할 개념 ID
 * @return - 업데이트된 개념 집합
 */
export function removeConceptFromSet(conceptSet: ConceptSet, conceptId: string): ConceptSet {
  if (!conceptSet.expression) {
    return conceptSet;
  }
  
  return {
    ...conceptSet,
    expression: {
      items: conceptSet.expression.items.filter(
        item => item.concept.concept_id !== conceptId
      )
    }
  };
}

/**
 * 개념 집합 내 항목 속성 업데이트
 * @param conceptSet - 개념 집합 객체
 * @param conceptId - 업데이트할 개념 ID
 * @param property - 업데이트할 속성 ('isExcluded', 'includeDescendants', 'includeMapped')
 * @param value - 새 속성 값
 * @return - 업데이트된 개념 집합
 */
export function updateConceptSetItem(
  conceptSet: ConceptSet, 
  conceptId: string, 
  property: string, 
  value: boolean
): ConceptSet {
  if (!conceptSet.expression) {
    return conceptSet;
  }
  
  return {
    ...conceptSet,
    expression: {
      items: conceptSet.expression.items.map(item => {
        if (item.concept.concept_id === conceptId) {
          return {
            ...item,
            [property]: value
          };
        }
        return item;
      })
    }
  };
}

/**
 * 개념 집합을 JSON 문자열로 내보내기
 * @param conceptSet - 개념 집합 객체
 * @return - JSON 문자열
 */
export function exportConceptSetToJson(conceptSet: ConceptSet): string {
  return JSON.stringify(conceptSet, null, 2);
}

/**
 * JSON 문자열에서 개념 집합 가져오기
 * @param json - JSON 문자열
 * @return - 파싱된 개념 집합 객체
 */
export function importConceptSetFromJson(json: string): ConceptSet {
  try {
    const data = JSON.parse(json) as Partial<ConceptSet>;
    
    // 기본값 설정
    const result: ConceptSet = {
      conceptset_id: data.conceptset_id || `cs-${Date.now()}`,
      name: data.name || "Imported Concept Set",
      expression: {
        items: data.expression?.items || []
      }
    };
    
    return result;
  } catch (e) {
    console.error("개념 집합 가져오기 오류:", e);
    return createConceptSet();
  }
}