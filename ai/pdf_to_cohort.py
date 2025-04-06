import cohort_json_schema as cohort_json_schema
from pdf_to_text import extract_cohort_definition_from_pdf
from get_omop_concept_id import clean_term, get_omop_concept_id, get_concept_set_domain_id, update_concept_set_items, get_concept_ids

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
        content = llm_response.strip()
        
        if "```" in content:
            content = content.split("```")[1].strip()
        
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
    