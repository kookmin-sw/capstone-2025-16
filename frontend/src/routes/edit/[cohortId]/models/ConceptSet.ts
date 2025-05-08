/**
 * 개념 집합(Concept Set) 관련 모델 및 유틸리티
 * 
 * 이 파일은 개념 집합 객체를 생성, 관리하고 조작하는 함수들을 제공합니다.
 * types.ts에 정의된 ConceptSet 타입에 맞게 구현되었습니다.
 */

/**
 * ConceptSet 모델 - type.ts에 맞게 구현
 */

// 타입 정의
export type Identifier = string;

export interface Concept {
  concept_id: Identifier;
  concept_name: string;
  domain_id: string;
  vocabulary_id: string;
  concept_class_id: string;
  standard_concept: string;
  concept_code: string;
  valid_start_date: string;
  valid_end_date: string;
  invalid_reason?: string;
  
  isExcluded?: boolean;
  includeDescendants?: boolean;
  includeMapped?: boolean;
}

export interface ConceptSet {
  conceptset_id: Identifier;
  name: string;
  items: Concept[];
}

// 유틸리티 함수
let nextId = 1;

/**
 * 새 ConceptSet 생성
 */
export function createConceptSet(data: Partial<ConceptSet>): ConceptSet {
  return {
    conceptset_id: data.conceptset_id || String(nextId++),
    name: data.name || `Concept Set ${nextId}`,
    items: data.items || []
  };
}

/**
 * ConceptSet에 개념 추가
 */
export function addConceptToSet(conceptSet: ConceptSet, concept: Concept): ConceptSet {
  // 이미 존재하는지 확인
  const exists = conceptSet.items.some(item => item.concept_id === concept.concept_id);
  
  if (exists) return conceptSet;
  
  // 기본 속성 설정
  const conceptWithProps: Concept = {
    ...concept,
    isExcluded: false,
    includeDescendants: false,
    includeMapped: false
  };
  
  return {
    ...conceptSet,
    items: [...conceptSet.items, conceptWithProps]
  };
}

/**
 * ConceptSet에서 개념 제거
 */
export function removeConceptFromSet(conceptSet: ConceptSet, index: number): ConceptSet {
  const newItems = [...conceptSet.items];
  newItems.splice(index, 1);
  
  return {
    ...conceptSet,
    items: newItems
  };
}

/**
 * ConceptSet 항목 속성 업데이트
 */
export function updateConceptSetItem(
  conceptSet: ConceptSet, 
  index: number, 
  isExcluded: boolean, 
  includeDescendants: boolean, 
  includeMapped: boolean
): ConceptSet {
  const newItems = [...conceptSet.items];
  
  newItems[index] = {
    ...newItems[index],
    isExcluded,
    includeDescendants,
    includeMapped
  };
  
  return {
    ...conceptSet,
    items: newItems
  };
}

/**
 * ConceptSet을 JSON으로 내보내기
 */
export function exportConceptSetToJson(conceptSet: ConceptSet): string {
  return JSON.stringify(conceptSet, null, 2);
}

/**
 * JSON에서 ConceptSet 가져오기
 */
export function importConceptSetFromJson(json: string): ConceptSet {
  try {
    const parsed = JSON.parse(json);
    
    // 기본 유효성 검사
    if (!parsed.name || !Array.isArray(parsed.items)) {
      throw new Error('Invalid concept set format');
    }
    
    return createConceptSet({
      conceptset_id: parsed.conceptset_id,
      name: parsed.name,
      items: parsed.items
    });
  } catch (error) {
    console.error('Error parsing concept set JSON:', error);
    throw new Error('Invalid JSON format');
  }
}