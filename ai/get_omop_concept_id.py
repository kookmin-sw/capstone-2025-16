import re
import os
from dotenv import load_dotenv
from clickhouse_driver import Client
import cohort_json_schema
from openai import OpenAI

# 환경 변수 로드
load_dotenv()
clickhouse_host = os.environ.get('CLICKHOUSE_HOST')
clickhouse_database = os.environ.get('CLICKHOUSE_DATABASE')
clickhouse_user = os.environ.get('CLICKHOUSE_USER')
clickhouse_password = os.environ.get('CLICKHOUSE_PASSWORD')
openai_api_key = os.environ.get('OPENROUTER_API_KEY')
openai_api_base = os.environ.get('OPENROUTER_API_BASE')
model_name = os.environ.get('LLM_MODEL')

# ClickHouse 클라이언트 초기화
clickhouse_client = Client(
    host=clickhouse_host,
    database=clickhouse_database,
    user=clickhouse_user, 
    password=clickhouse_password
)

# OpenAI 클라이언트 초기화
openai_client = OpenAI(
    api_key=openai_api_key,
    base_url=openai_api_base,
)

# 코호트 검색어 수정 - system
COHORT_JSON_SYSTEM_PROMPT = f"""
Role:  
Act as a **medical terminology search assistant** specialized in optimizing clinical terms for OMOP CDM database retrieval.

Context:  
You are given a medical term that failed to return a valid `concept_id` during OMOP CDM lookup. Your job is to improve the search term so it aligns better with standardized terminology used in the OMOP database.

Instructions:  
1. If the given term is an abbreviation (e.g., `"ESA"`), expand it to the full medical term (e.g., `"Erythropoiesis Stimulating Agent"`).
2. Replace vague or overly specific phrases with broader, standardized equivalents.
   - For example:  
     `"Sodium bicarbonate therapy"` → `"Sodium bicarbonate"`  
     `"Hemoglobin level over 13 g/dL"` → `"Hemoglobin"`

**Modified Examples**:
- Input: `"ESA"` → Output: `Erythropoiesis Stimulating Agent`
- Input: `"Sodium bicarbonate therapy"` → Output: `Sodium bicarbonate`
- Input: `"T2DM"` → Output: `Type 2 Diabetes Mellitus`
- Input: `"CKD"` → Output: `Chronic Kidney Disease`
"""

# 코호트 검색어 수정 - user
SEARCH_QUERY_REFINEMENT_PROMPT = """
Original Term: "{term}"

I need a more standardized medical term that will work better for database lookup.
If this is an abbreviation, please expand it to the full term.
If this is a specific treatment or condition with qualifiers, please convert it to a more general standard term.

IMPORTANT: Return ONLY the modified term, with no explanations or additional text.
"""

# 불필요한 정보가 추가된 문구를 제거하는 함수 
def clean_term(term):
    return re.sub(r"\s*\(.*?\)", "", term).strip() 

# 검색어 변경하여 재검색
def refine_search_query(term) -> str:
    """
    의학 용어를 OMOP CDM 데이터베이스에 더 적합한 형태로 수정합니다.
    약어를 풀거나, 너무 구체적인 표현을 표준 용어로 변환합니다.
    """
    response = openai_client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": COHORT_JSON_SYSTEM_PROMPT},
            {"role": "user", "content": SEARCH_QUERY_REFINEMENT_PROMPT.format(term=term)}
        ]
    )

    refined_term = response.choices[0].message.content.strip()
    print(f"검색어 수정: '{term}' → '{refined_term}'")
    return refined_term

# ClickHouse에서 concept 정보 조회 (검색 결과가 없으면 용어 수정하여 재시도)
# # 결과가 너무 많으면 limit만큼만 반환 -> 나중에 늘릴 예정
def get_omop_concept_id(term: str, domain_id: str, limit: int = 3, auto_refine: bool = True) -> list:
    cleaned_term = clean_term(term)
    
    # 디버깅을 위한 출력
    print(f"\n[get_omop_concept_id] 검색 용어: '{cleaned_term}', 도메인: '{domain_id}'")
    
    query = """
    WITH all_concepts AS (
        SELECT
            concept_id,
            concept_name,
            domain_id,
            vocabulary_id,
            concept_class_id,
            standard_concept,
            concept_code,
            valid_start_date,
            valid_end_date,
            invalid_reason
        FROM concept
        WHERE (concept_name ILIKE %(term)s) 
          AND (domain_id = %(domain_id)s) 
          AND (invalid_reason IS NULL)
        LIMIT 30
    )
    SELECT
        ac.concept_id,
        ac.concept_name,
        ac.domain_id,
        ac.vocabulary_id,
        ac.concept_class_id,
        COALESCE(ac.standard_concept, '') as standard_concept,
        ac.concept_code,
        ac.valid_start_date,
        ac.valid_end_date,
        COALESCE(ac.invalid_reason, '') as invalid_reason,
        COALESCE(pc.parent_count, 0) AS parent_count,
        COALESCE(cc.child_count, 0) AS child_count,
        CASE %(domain_id)s
            WHEN 'Condition' THEN CASE WHEN ac.concept_id IN (SELECT condition_concept_id FROM condition_occurrence) THEN 1 ELSE 0 END
            WHEN 'Drug' THEN CASE WHEN ac.concept_id IN (SELECT drug_concept_id FROM drug_exposure) THEN 1 ELSE 0 END
            WHEN 'Measurement' THEN CASE WHEN ac.concept_id IN (SELECT measurement_concept_id FROM measurement) THEN 1 ELSE 0 END
            WHEN 'Observation' THEN CASE WHEN ac.concept_id IN (SELECT observation_concept_id FROM observation) THEN 1 ELSE 0 END
            WHEN 'Procedure' THEN CASE WHEN ac.concept_id IN (SELECT procedure_concept_id FROM procedure_occurrence) THEN 1 ELSE 0 END
            WHEN 'Visit' THEN CASE WHEN ac.concept_id IN (SELECT visit_concept_id FROM visit_occurrence) THEN 1 ELSE 0 END
            WHEN 'Device' THEN CASE WHEN ac.concept_id IN (SELECT device_concept_id FROM device_exposure) THEN 1 ELSE 0 END
            WHEN 'Death' THEN CASE WHEN ac.concept_id IN (SELECT cause_concept_id FROM death) THEN 1 ELSE 0 END
            WHEN 'Specimen' THEN CASE WHEN ac.concept_id IN (SELECT specimen_concept_id FROM specimen) THEN 1 ELSE 0 END
            WHEN 'Location' THEN CASE WHEN ac.concept_id IN (SELECT country_concept_id FROM location) THEN 1 ELSE 0 END
            WHEN 'Demographic' THEN CASE WHEN ac.concept_id IN (
                SELECT gender_concept_id FROM person
                UNION
                SELECT race_concept_id FROM person
                UNION
                SELECT ethnicity_concept_id FROM person
            ) THEN 1 ELSE 0 END
            ELSE 1
        END as is_used
    FROM all_concepts ac
    LEFT JOIN
    (
        SELECT
            descendant_concept_id AS concept_id,
            COUNT(*) AS parent_count
        FROM concept_ancestor
        WHERE descendant_concept_id IN (
            SELECT concept_id
            FROM all_concepts
        )
        GROUP BY descendant_concept_id
    ) AS pc ON ac.concept_id = pc.concept_id
    LEFT JOIN
    (
        SELECT
            ancestor_concept_id AS concept_id,
            COUNT(*) AS child_count
        FROM concept_ancestor
        WHERE ancestor_concept_id IN (
            SELECT concept_id
            FROM all_concepts
        )
        GROUP BY ancestor_concept_id
    ) AS cc ON ac.concept_id = cc.concept_id
    ORDER BY 
        is_used DESC,  -- 실제 사용되는 개념을 먼저 정렬
        child_count DESC
    LIMIT %(limit)s
    """
    
    results = clickhouse_client.execute(query, {'term': f'%{cleaned_term}%', 'domain_id': domain_id, 'limit': limit})
    
    # 결과가 없고 auto_refine이 True이면 용어를 수정하여 재검색
    if not results and auto_refine:
        # print(f"'{cleaned_term}' 검색 결과가 없습니다. 용어를 수정하여 재검색합니다...")
        refined_term = refine_search_query(cleaned_term)
        if refined_term != cleaned_term:
            # 무한 재귀 방지를 위해 auto_refine=False로 설정
            return get_omop_concept_id(refined_term, domain_id, limit, auto_refine=False)
    
    # 결과가 너무 많으면 limit만큼만 반환
    if len(results) > limit:
        results = results[:limit]
    
    # Concept 객체로 변환
    concepts = []
    for result in results:
        # is_used가 1인 경우만 추가 -> 해당 도메인에서 사용되는 개념만 추가
        if result[12] == 1:  # is_used가 12번째 컬럼임 
            concept = {
                "concept_id": str(result[0]),  # Identifier는 string
                "concept_name": result[1],
                "domain_id": result[2],
                "vocabulary_id": result[3],
                "concept_class_id": result[4],
                "standard_concept": result[5],
                "concept_code": result[6],
                "valid_start_date": result[7].strftime("%Y-%m-%d") if result[7] else None,  # date를 문자열로 변환
                "valid_end_date": result[8].strftime("%Y-%m-%d") if result[8] else None,    # date를 문자열로 변환
                "invalid_reason": result[9],
                "parent_count": result[10],    # 부모 개념 수
                "child_count": result[11],     # 자식 개념 수
                "includeDescendants": True,  # 기본값 설정
                "includeMapped": True
            }
            concepts.append(concept)
    
    # 결과 개수 출력
    # print(f"[get_omop_concept_id] 검색 결과: {len(concepts)}개")
    return concepts

# concept_set_id에 해당하는 filter의 type을 찾아 domain_id를 반환
def get_concept_set_domain_id(cohort_json: dict, concept_set_id: str) -> str:
    # print(f"\n[get_concept_set_domain_id] concept_set_id '{concept_set_id}'에 대한 도메인 ID 검색:")
    
    # cohort 구조 처리
    if "cohort" in cohort_json:
        for group in cohort_json.get("cohort", []):
            for container in group.get("containers", []):
                for filter_obj in container.get("filters", []):
                    # 1. conceptset이 문자열인 경우 직접 비교
                    if isinstance(filter_obj.get("conceptset"), str) and filter_obj.get("conceptset") == concept_set_id:
                        criteria_type = filter_obj["type"]
                        
                        criteria_info = cohort_json_schema.map_criteria_info(criteria_type)
                        if criteria_info:
                            domain_id = criteria_info["Domain_id"]
                            # print(f"- 매핑된 domain_id: {domain_id}")
                            return domain_id
                    
                    # 2. conceptset이 딕셔너리인 경우 (neq 등)
                    elif isinstance(filter_obj.get("conceptset"), dict) and "neq" in filter_obj.get("conceptset") and filter_obj.get("conceptset")["neq"] == concept_set_id:
                        criteria_type = filter_obj["type"]
                        # print(f"- 찾은 criteria_type: {criteria_type}")
                        
                        criteria_info = cohort_json_schema.map_criteria_info(criteria_type)
                        if criteria_info:
                            domain_id = criteria_info["Domain_id"]
                            # print(f"- 매핑된 domain_id: {domain_id}")
                            return domain_id
    
    # initialGroup/comparisonGroup 구조 처리
    for group_name in ["initialGroup", "comparisonGroup"]:
        if group_name in cohort_json:
            for container in cohort_json[group_name].get("containers", []):
                for filter_obj in container.get("filters", []):
                    # 1. conceptset이 문자열인 경우 직접 비교
                    if isinstance(filter_obj.get("conceptset"), str) and filter_obj.get("conceptset") == concept_set_id:
                        criteria_type = filter_obj["type"]
                        # print(f"- 찾은 criteria_type: {criteria_type} (in {group_name})")
                        
                        criteria_info = cohort_json_schema.map_criteria_info(criteria_type)
                        if criteria_info:
                            domain_id = criteria_info["Domain_id"]
                            # print(f"- 매핑된 domain_id: {domain_id}")
                            return domain_id
                        else:
                            # print(f"- criteria_type '{criteria_type}'에 대한 매핑 정보가 없습니다.")
                            pass
                    
                    # 2. conceptset이 딕셔너리인 경우 (neq 등)
                    elif isinstance(filter_obj.get("conceptset"), dict) and "neq" in filter_obj.get("conceptset") and filter_obj.get("conceptset")["neq"] == concept_set_id:
                        criteria_type = filter_obj["type"]
                        # print(f"- 찾은 criteria_type: {criteria_type} (in {group_name}, neq)")
                        
                        criteria_info = cohort_json_schema.map_criteria_info(criteria_type)
                        if criteria_info:
                            domain_id = criteria_info["Domain_id"]
                            # print(f"- 매핑된 domain_id: {domain_id}")
                            return domain_id
                        else:
                            # print(f"- criteria_type '{criteria_type}'에 대한 매핑 정보가 없습니다.")
                            pass
    
    # print(f"- concept_set_id '{concept_set_id}'에 대한 도메인 ID를 찾을 수 없습니다.")
    return None

# concept_set의 items를 DB에서 조회한 결과로 업데이트
def update_concept_set_items(concept_set: dict, domain_id: str) -> dict:
    print(f"\n[update_concept_set_items] 개념 이름: '{concept_set.get('name')}', domain_id: '{domain_id}'")
    
    if not domain_id:
        print(f"- domain_id가 없습니다. 개념 업데이트를 건너뜁니다.")
        return concept_set
        
    concept_results = get_omop_concept_id(concept_set["name"], domain_id)
    
    if concept_results:
        concept_set["items"] = concept_results
    return concept_set

# cohort_json의 conceptset에서 concept_id를 조회하여 업데이트
def get_concept_ids(cohort_json: dict) -> dict:
    print(f"\n[get_concept_ids] conceptsets 개수: {len(cohort_json.get('conceptsets', []))}")
    
    for concept_set in cohort_json.get("conceptsets", []):
        if "name" in concept_set and "conceptset_id" in concept_set:
            print(f"\n처리 중: conceptset '{concept_set['name']}' (ID: {concept_set['conceptset_id']})")
            domain_id = get_concept_set_domain_id(cohort_json, concept_set["conceptset_id"])
            
            if domain_id:
                concept_set = update_concept_set_items(concept_set, domain_id)
            else:
                print(f"- WARNING: conceptset '{concept_set['name']}'의 domain_id를 찾을 수 없습니다.")
                # 기본값으로 Condition 도메인 사용
                print(f"- 기본 도메인 'Condition'으로 시도합니다.")
                concept_set = update_concept_set_items(concept_set, "Condition")
    
    # cohort_json 전체 출력 (items 항목 확인용)
    print("\n[get_concept_ids] 결과 JSON의 conceptsets:")
    for concept_set in cohort_json.get("conceptsets", []):
        print(f"- {concept_set['name']} (ID: {concept_set['conceptset_id']}): {len(concept_set.get('items', []))}개 항목")
    
    return cohort_json

################################################################################
# 테스트용 함수
def test_concept_search(term: str, domain_id: str, auto_refine: bool = True):
    """
    주어진 용어와 도메인 ID로 개념을 검색하고 결과를 출력하는 테스트 함수
    
    Args:
        term: 검색할 의학 용어
        domain_id: 도메인 ID (예: 'Condition', 'Drug', 'Measurement' 등)
        auto_refine: 검색 결과가 없을 경우 자동으로 용어를 수정하여 재검색할지 여부
    """
    print(f"\n[검색] 용어: '{term}', 도메인: '{domain_id}'")
    concepts = get_omop_concept_id(term, domain_id, auto_refine=auto_refine)
    
    if concepts:
        print(f"검색 결과 ({len(concepts)}개):")
        print(f"자식 수가 많은 순으로 정렬됨")
        print("=" * 60)
        for concept in concepts:
            print(f"Concept ID: {concept['concept_id']}")
            print(f"Concept Name: {concept['concept_name']}")
            print(f"Domain: {concept['domain_id']}")
            print(f"Vocabulary: {concept['vocabulary_id']}")
            print(f"Class: {concept['concept_class_id']}")
            print(f"Standard: {concept['standard_concept']}")
            print(f"Code: {concept['concept_code']}")
            print(f"Parents Count: {concept['parent_count']} | Children Count: {concept['child_count']}")
            print("=" * 60)
    else:
        print(f"'{term}' 검색 결과가 없습니다.")

if __name__ == "__main__":
    print("===== 검색 테스트 =====")
    
    # 일반 검색 테스트
    test_concept_search("Sepsis", "Condition")
    
    # 검색 결과가 없는 경우
    test_concept_search("ARDS", "Condition")
    test_concept_search("T2DM", "Condition") 
    
    # 구체적인 표현 -> 일반 표현
    test_concept_search("Hemoglobin level over 13 g/dL", "Measurement") 