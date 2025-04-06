import cohort_json_schema as cohort_json_schema
from pdf_to_text import extract_cohort_definition_from_pdf

import os
import re
import json
from openai import OpenAI
from dotenv import load_dotenv
from clickhouse_driver import Client

load_dotenv()
openai_api_key = os.environ.get('OPENAI_API_KEY')
openai_api_base = "https://api.lambdalabs.com/v1"
model_name = os.environ.get('LLM_MODEL')
clickhouse_host = os.environ.get('CLICKHOUSE_HOST')
clickhouse_database = os.environ.get('CLICKHOUSE_DATABASE')
clickhouse_user = os.environ.get('CLICKHOUSE_USER')
clickhouse_password = os.environ.get('CLICKHOUSE_PASSWORD')

client = OpenAI(
    api_key=openai_api_key,
    base_url=openai_api_base,
)

clickhouse_client = Client(
    host=clickhouse_host,
    database=clickhouse_database,
    user=clickhouse_user, 
    password=clickhouse_password
)

STRICT_REQUIREMENT = f"""
Instructions
Strict requirements:
1. Structure:
   - conceptsets: Array of concept sets, each containing:
     * conceptset_id: String (starting from "0")
     * name: String (medical term)
     * items: Array of concept objects from database
   - cohort: Array of groups, each containing:
     * containers: Array of containers with filters
     * not: Boolean (true for exclusion criteria)

2. Each filter MUST include:
   - type: The type of criteria (must be one of: ["ConditionEra", "ConditionOccurrence", "Death", "DeviceExposure", "DoseEra", "DrugEra", "DrugExposure", "Measurement", "Observation", "ObservationPeriod", "ProcedureOccurrence", "Specimen", "VisitOccurrence", "VisitDetail", "LocationRegion", "DemographicCriteria"])
   - first: true
   - conceptset: String (matching conceptset_id)

3. For Measurement criteria:
   - Include "valueAsNumber" with appropriate operator ("gt", "lt", "eq", etc.)
   - For any field such as "measurementType", "drugType", "conditionType", etc., 
     do NOT invent or fabricate placeholder concept_id values
   - If a concept_id is not available, explicitly set the value to null

4. For age criteria:
   - Use "ObservationPeriod" as type
   - Include "age" with appropriate operator
"""

STRICT_REQUIREMENT_SCHEMA = f"""
5. The final JSON **must strictly conform** to the OMOP CDM cohort JSON schema below:
OMOP CDM cohort JSON schema:
{cohort_json_schema.JSON_SCHEMA}

Important Restriction!!!:
Only extract cohort criteria from the provided clinical study text.
DO NOT include or use any example data, JSON schema, or instructions shown above.
Your output must strictly reflect criteria that appear in the original text below.

Input Text Example:
{cohort_json_schema.JSON_INPUT_EXAMPLE}

Output Example:
{cohort_json_schema.JSON_OUTPUT_EXAMPLE}

6. Output format:
    - Return only the JSON structure
    - Do not include any explanations or markdown
    - Ensure all required fields are present
    - DO NOT include explanations, comments, or additional text.
    - Return only raw JSON without any labels, headers, or formatting.
    - DO NOT include any Markdown formatting or explanations
    - Any usage of Markdown formatting like ```json or ``` → strictly forbidden
    - Use valueAsNumber only for measurable criteria
    - Ensure that each domain has the correct key: drugType, procedureType, observationType, etc.
"""

# 코호트 키워드 뽑기 - system
COHORT_EXTRACTION_SYSTEM_PROMPT = f"""
Role: Medical Cohort Extraction Expert

Context:
You are an AI assistant that extracts key OMOP-compatible medical keywords from clinical trial eligibility criteria.
These keywords will be used to search for concept codes in a structured OMOP CDM concept database.

{STRICT_REQUIREMENT}

## Rules
1. Extract only the following information for each criterion:
   - type: The type of criteria (must be one of: ["ConditionOccurrence", "Death", "DeviceExposure", "DoseEra", "DrugEra", "DrugExposure", "Measurement", "Observation", "ObservationPeriod", "ProcedureOccurrence", "Specimen", "VisitOccurrence", "VisitDetail", "LocationRegion", "DemographicCriteria"])
   - name: The medical term or concept name
   - exclusion: Boolean (true for exclusion criteria)
   - valueAsNumber: For measurement criteria (MANDATORY for Measurement type)
   - age: For age criteria (MANDATORY for DemographicCriteria type)

2. Important:
   - [CRITICAL] Each concept should appear only ONCE
   - [CRITICAL] DO NOT include any Markdown formatting
   - [CRITICAL] DO NOT include explanations or additional text
   - [CRITICAL] DO NOT include any introductory text like "Here is..." or "The extracted criteria are:"
   - [CRITICAL] DO NOT include any ```json or ``` markers
   - [CRITICAL] For Measurement type:
     * MUST include valueAsNumber with operator and value
     * Example: "Hemoglobin > 13" → {{ "valueAsNumber": {{ "gt": 13 }} }}
   - [CRITICAL] For age criteria:
     * MUST use "DemographicCriteria" as type
     * MUST include age value and operator
     * Example: "Age > 18" → {{ "type": "DemographicCriteria", "name": "Age", "age": {{ "gt": 18 }} }}
   - For conditions:
     * Use "ConditionOccurrence" as type (NOT ConditionEra)

3. Return ONLY this exact JSON format (no other text):
{{
  "criteria": [
    {{
      "type": "ConditionOccurrence",
      "name": "Diabetes",
      "exclusion": false
    }},
    {{
      "type": "Measurement",
      "name": "Hemoglobin",
      "exclusion": true,
      "valueAsNumber": {{ "gt": 13 }}
    }},
    {{
      "type": "DemographicCriteria",
      "name": "Age",
      "age": {{ "gt": 18, "lt": 65 }},
      "exclusion": false
    }}
  ]
}}
"""
# 코호트 키워드 뽑기 - user
COHORT_EXTRACTION_PROMPT = """
You are an AI assistant specialized in processing medical cohort selection criteria.
Your task is to extract medical conditions, treatments, medications, and procedures mentioned explicitly in the provided text
and classify them into appropriate OMOP CDM domains.

Extract the cohort selection criteria from the following text and return ONLY the JSON response:
{text}
"""

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

{STRICT_REQUIREMENT}
{STRICT_REQUIREMENT_SCHEMA}

**Modified Examples**:
- Input: `"ESA"` → Output: `Erythropoiesis Stimulating Agent`
- Input: `"Sodium bicarbonate therapy"` → Output: `Sodium bicarbonate`
"""

# 코호트 검색어 수정 - user
SEARCH_QUERY_REFINEMENT_PROMPT = """
Original Term: "{term}"
"""

# 2. 키워드 검색어 + type 자동 추출
def extract_terms_from_text(text: str) -> list:
    
    
    response = client.chat.completions.create(
        model=model_name,
        messages=[{"role": "system", "content": COHORT_EXTRACTION_SYSTEM_PROMPT},
                 {"role": "user", "content": COHORT_EXTRACTION_PROMPT.format(text=text)}]
    )
    llm_response = response.choices[0].message.content
    
    try:
        # 응답에서 리스트 부분만 추출
        content = llm_response.strip()
        
        # Markdown 코드 블록 제거
        if "```" in content:
            content = content.split("```")[1].strip()
            print("\n[``` 마크다운 블록 제거 후]:")
            print(content)
        
        # LLM 응답을 JSON으로 변환
        cohort_json = json.loads(content)

        criteria_list = []

        # 모든 criteria 처리
        for criteria in cohort_json.get("criteria", []):
            if "type" in criteria and "name" in criteria:
                criteria_info = cohort_json_schema.map_criteria_info(criteria["type"])
                if criteria_info:
                    criteria_list.append({
                        "type": criteria["type"],
                        "name": criteria["name"],
                        "exclusion": criteria.get("exclusion", False),
                        "valueAsNumber": criteria.get("valueAsNumber"),
                        "age": criteria.get("age")
                    })

        return criteria_list
    
    except Exception as e:
        print(f"\n[Unexpected Error]")
        print(f"Error: {e}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return []

# 불필요한 정보가 추가된 문구를 제거하는 함수 
def clean_term(term):
    return re.sub(r"\s*\(.*?\)", "", term).strip() 

# 3. ClickHouse에서 concept 정보 조회
def get_omop_concept_id(term: str, domain_id: str) -> list:
    cleaned_term = clean_term(term).replace('%', '%%')
    
    query = """
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
    WHERE concept_name ILIKE %(term)s 
    AND domain_id = %(domain_id)s 
    AND invalid_reason IS NULL
    LIMIT 3
    """
    
    results = clickhouse_client.execute(query, {'term': f'%{cleaned_term}%', 'domain_id': domain_id})
    
    # Concept 객체로 변환
    concepts = []
    for result in results:
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
            "includeDescendants": True,  # 기본값 설정
            "includeMapped": True
        }
        concepts.append(concept)
    
    return concepts

# concept_set_id에 해당하는 filter의 type을 찾아 domain_id를 반환
def get_concept_set_domain_id(cohort_json: dict, concept_set_id: str) -> str:
    for group in cohort_json.get("cohort", []):
        for container in group.get("containers", []):
            for filter_obj in container.get("filters", []):
                if filter_obj.get("conceptset") == concept_set_id:
                    criteria_type = filter_obj["type"]
                    criteria_info = cohort_json_schema.map_criteria_info(criteria_type)
                    if criteria_info:
                        return criteria_info["Domain_id"]
    return None

# concept_set의 items를 DB에서 조회한 결과로 업데이트
def update_concept_set_items(concept_set: dict, domain_id: str) -> dict:
    if not domain_id:
        return concept_set
        
    concept_results = get_omop_concept_id(concept_set["name"], domain_id)
    if concept_results:
        concept_set["items"] = concept_results
    return concept_set

# cohort_json의 conceptset에서 concept_id를 조회하여 업데이트
def get_concept_ids(cohort_json: dict) -> dict:
    for concept_set in cohort_json.get("conceptsets", []):
        if "name" in concept_set and "conceptset_id" in concept_set:
            domain_id = get_concept_set_domain_id(cohort_json, concept_set["conceptset_id"])
            concept_set = update_concept_set_items(concept_set, domain_id)
    
    return cohort_json

# 4. 검색어 변경하여 재검색
def refine_search_query(term) -> str:
    response = client.chat.completions.create(
        model=model_name,
        messages=[{"role": "system", "content": COHORT_JSON_SYSTEM_PROMPT},
                  {"role": "user", "content": SEARCH_QUERY_REFINEMENT_PROMPT.format(term=term)}]
    )

    return response.choices[0].message.content.strip()

# 5. 추출된 criteria를 OMOP CDM JSON 형식으로 변환
def create_cohort_json(extracted_criteria: list) -> dict:
    result = {
        "conceptsets": [],
        "cohort": []
    }
    
    concept_set_id = 0
    
    # inclusion criteria 처리
    inclusion_containers = []
    exclusion_containers = []
    
    for criteria in extracted_criteria:
        if criteria.get("age"):
            filter_obj = {
                "type": "DemographicCriteria",
                "first": True,
                "age": criteria["age"]
            }
        else:
            # ConceptSet 생성
            concept_set = {
                "conceptset_id": str(concept_set_id),
                "name": criteria["name"],
                "items": []  # DB에서 조회 후 업데이트
            }
            result["conceptsets"].append(concept_set)
            
            # Filter 생성
            filter_obj = {
                "type": criteria["type"],
                "first": True,
                "conceptset": str(concept_set_id)
            }
            
            # 추가 필터 조건
            if criteria.get("valueAsNumber"):
                filter_obj["valueAsNumber"] = criteria["valueAsNumber"]
        
        # Container 생성
        container = {
            "name": criteria["name"],
            "filters": [filter_obj]
        }
        
        # inclusion/exclusion 구분
        if criteria.get("exclusion", False):
            if len(exclusion_containers) > 0:
                container["operator"] = "AND"
            exclusion_containers.append(container)
        else:
            if len(inclusion_containers) > 0:
                container["operator"] = "AND"
            inclusion_containers.append(container)
        
        if not criteria.get("age"):  # age가 아닌 경우에만 concept_set_id 증가
            concept_set_id += 1

    # cohort에 groups 추가
    if inclusion_containers:
        result["cohort"].append({
            "containers": inclusion_containers
        })
    
    if exclusion_containers:
        result["cohort"].append({
            "not": True,
            "containers": exclusion_containers
        })
    
    return result

def main():
    # 현재 스크립트의 디렉토리 경로
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # PDF 파일 경로
    pdf_path = os.path.join(current_dir, "pdf", "A novel clinical prediction model for in-hospital mortality in sepsis patients complicated by ARDS- A MIMIC IV database and external validation study.pdf")
    
    # 1. PDF에서 텍스트 추출
    # extracted_text = extract_text_from_pdf(pdf_path)
    implementable_text, non_implementable_text = extract_cohort_definition_from_pdf(pdf_path)
    
    print("\n[Implementable Criteria 부분만]:")
    print(implementable_text)
    
    # 2. 텍스트에서 criteria 추출 (implementable 부분만 사용)
    extracted_criteria = extract_terms_from_text(implementable_text)
    print("\n[extracted_criteria]:")
    print(json.dumps(extracted_criteria, indent=2, ensure_ascii=False))
    
    if not extracted_criteria:
        print("Failed to extract criteria")
        return
    
    # 3. OMOP CDM JSON 구조 생성
    cohort_json = create_cohort_json(extracted_criteria)
    print("\n[cohort_json]:")
    print(json.dumps(cohort_json, indent=2, ensure_ascii=False))
    
    # 4. DB에서 concept_id 조회
    cohort_json = get_concept_ids(cohort_json)
    print("\n[cohort_json with concept_ids]:")
    print(json.dumps(cohort_json, indent=2, ensure_ascii=False))
    
    # 5. JSON 파일로 저장
    output_file = os.path.join(current_dir, "cohort_criteria.json")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(cohort_json, f, indent=4, ensure_ascii=False)
    print(f"\nCohort definition saved to: {output_file}")

if __name__ == "__main__":
    main()
    