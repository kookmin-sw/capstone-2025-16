import cohort_json_schema as cohort_json_schema

import pymupdf
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
1. For each item in the inclusion section:
   - You must include the following keys:
     - "CriteriaType" (must be one of: ["ConditionEra", "ConditionOccurrence", "Death", "DeviceExposure", "DoseEra", "DrugEra", "DrugExposure", "Measurement", "Observation", "ObservationPeriod", "ProcedureOccurrence", "Specimen", "VisitOccurrence", "VisitDetail", "LocationRegion", "DemographicCriteria"])
     - "Domain" (will be automatically mapped based on CriteriaType)
     - "Domain_id" (will be automatically mapped based on CriteriaType)
     - "CodesetId" (will be filled later)
     - "CriteriaName" (human readable name)
   
   - The "CriteriaType" must be one of the following valid values:
     ["ConditionEra", "ConditionOccurrence", "Death", "DeviceExposure", "DoseEra", "DrugEra", "DrugExposure", "Measurement", "Observation", "ObservationPeriod", "ProcedureOccurrence", "Specimen", "VisitOccurrence"]

2. For Measurement criteria:
   - Include "ValueAsNumber" with appropriate operator ("gt", "lt", "eq", etc.)
   - For any field such as "MeasurementType", "DrugType", "ConditionType", etc., 
     do NOT invent or fabricate placeholder concept_id values
   - If a concept_id is not available, explicitly set the value to null

3. You must use the exact concept_id and domain_id values provided in the concept list.
   - Follow the exact structure shown in the schema
   - Avoid creating entirely new diseases or medications unrelated to the input.
   - Avoid adding extra qualifiers, descriptions, or text that didn't exist in the original term.
   - **Do NOT fabricate or hallucinate any concept_id, domain_id, or type values.**
   - If any required value is missing or uncertain, omit that item from the output.
   - Include empty objects ({{}}) for type-specific properties
   - Include ConceptName for reference (this will be used for concept mapping)
   
4. The final JSON **must strictly conform** to the OMOP CDM cohort JSON schema below:
OMOP CDM cohort JSON schema:
{cohort_json_schema.JSON_SCHEMA}

Important Restriction!!!:
Only extract cohort criteria from the provided clinical study text.
DO NOT include or use any example data, JSON schema, or instructions shown above.
Your output must strictly reflect criteria that appear in the original text below.

Input Text Example:
3.1. Inclusion criteria  
Patients who are 20 years old or older.
Patients with hemodialysis.
Patients using ESA therapy for at least three months.
Patients with iron deficiency anemia.

3.2. Exclusion criteria  
Patients in intensive care unit.  
Patients with hemoglobin value more than 13 g/dL.  
Kidney transplant patients.  
Patients with sepsis or active infections.

Output Example:
{cohort_json_schema.JSON_OUTPUT_EXAMPLE}

5. Output format:
    - Return only the JSON structure
    - Do not include any explanations or markdown
    - Ensure all required fields are present
    - DO NOT include explanations, comments, or additional text.
    - Return only raw JSON without any labels, headers, or formatting.
    - DO NOT include any Markdown formatting or explanations
    - Any usage of Markdown fosmatting like ```json or ``` → strictly forbidden
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
"""
# 코호트 키워드 뽑기 - user
COHORT_EXTRACTION_PROMPT = """
You are an AI assistant specialized in processing medical cohort selection criteria.
Your task is to extract medical conditions, treatments, medications, and procedures mentioned explicitly in the provided text
and classify them into appropriate OMOP CDM domains.

## Rules
1. Structure:
   - PrimaryCriteria: The MAIN condition/procedure that defines the cohort (usually the first inclusion criteria)
   - AdditionalCriteria:
     - Groups[0] (Type: "ALL"): Additional inclusion criteria
     - Groups[1] (Type: "NONE"): Exclusion criteria

2. Each criteria MUST include:
   - "CriteriaType": The type of criteria (e.g., "ConditionOccurrence", "DrugExposure", etc.)
   - "ConceptName": [CRITICAL] This is the exact medical term that will be used for database search
     * Must be precise and standardized medical terminology
     * Avoid general descriptions or complex phrases
     * Examples of good ConceptName:
       - "sepsis" (not "sepsis or active infections")
       - "hemodialysis" (not "patients with hemodialysis")
       - "iron deficiency anemia" (exact medical condition)
     * This field is crucial for finding correct concept_ids in the database
   - Other required fields will be filled automatically

3. Example format:
   {{
     "PrimaryCriteria": {{
       "CriteriaList": [
         {{
           "CriteriaType": "ProcedureOccurrence",
           "ConceptName": "hemodialysis",
           "ProcedureOccurrence": {{}}
         }}
       ],
       "PrimaryCriteriaLimit": {{
         "Type": 0,
         "Count": 1
       }}
     }},
     "AdditionalCriteria": {{
       "Type": "ALL",
       "CriteriaList": [],
       "DemographicCriteriaList": [],
       "Groups": [
         {{
           "Type": "ALL",  # Inclusion criteria - MUST be met
           "CriteriaList": [
             {{
               "Criteria": {{
                 "CriteriaType": "ObservationPeriod",
                 "AgeAtStart": {{
                   "Value": 20,
                   "Op": "gte"
                 }},
                 "ObservationPeriod": {{}}
               }}
             }},
             {{
               "Criteria": {{
                 "CriteriaType": "DrugExposure",
                 "ConceptName": "erythropoiesis stimulating agent",
                 "DrugExposure": {{}}
               }}
             }},
             {{
               "Criteria": {{
                 "CriteriaType": "ConditionOccurrence",
                 "ConceptName": "iron deficiency anemia",
                 "ConditionOccurrence": {{}}
               }}
             }}
           ],
           "DemographicCriteriaList": [],
           "Groups": []
         }},
         {{
           "Type": "NONE",  # Exclusion criteria - MUST NOT be met
           "CriteriaList": [
             {{
               "Criteria": {{
                 "CriteriaType": "VisitOccurrence",
                 "ConceptName": "intensive care unit",
                 "VisitOccurrence": {{}}
               }}
             }},
             {{
               "Criteria": {{
                 "CriteriaType": "Measurement",
                 "ConceptName": "hemoglobin",
                 "Measurement": {{}},
                 "ValueAsNumber": {{
                   "Value": 13,
                   "Op": "gt"
                 }}
               }}
             }},
             {{
               "Criteria": {{
                 "CriteriaType": "ProcedureOccurrence",
                 "ConceptName": "kidney transplant",
                 "ProcedureOccurrence": {{}}
               }}
             }},
             {{
               "Criteria": {{
                 "CriteriaType": "ConditionOccurrence",
                 "ConceptName": "sepsis",
                 "ConditionOccurrence": {{}}
               }}
             }}
           ],
           "DemographicCriteriaList": [],
           "Groups": []
         }}
       ]
     }}
   }}

4. Important:
   - [CRITICAL] DO NOT duplicate conditions in CriteriaList
   - [CRITICAL] Each unique ConceptName should appear only ONCE in PrimaryCriteria
   - [CRITICAL] Each unique ConceptName should appear only ONCE in each AdditionalCriteria group
   - The first inclusion criteria should be used as PrimaryCriteria
   - All inclusion criteria (except Primary) go to AdditionalCriteria Groups[0] with Type: "ALL"
   - All exclusion criteria go to AdditionalCriteria Groups[1] with Type: "NONE"
   - DO NOT generate concept_id - it will be retrieved separately
   - DO NOT include any Markdown formatting
   - DO NOT include explanations or additional text
   - ALWAYS include ConceptName for each criteria
   - Return only the JSON output in the correct format
   - For age criteria:
     * Use "ObservationPeriod" as CriteriaType
     * Include "AgeAtStart" or "AgeAtEnd" with "Value" and "Op"
     * Valid operators: "gt", "lt", "gte", "lte", "eq", "bt", "!bt"
   - For other numeric criteria (lab values, etc.):
     * Use "Measurement" as CriteriaType
     * Include "ValueAsNumber" with "Value" and "Op"
   
   - [CRITICAL] Only extract criteria from sections clearly labeled as inclusion/exclusion criteria
     * Usually found in sections labeled as "Inclusion criteria", "Exclusion criteria", "Eligibility criteria"
     * These criteria are typically grouped together in a single section/paragraph
     * Ignore any medical terms or conditions mentioned in other parts of the text (e.g., results, discussion)
   
   - [CRITICAL] Only extract criteria that are EXPLICITLY stated as inclusion/exclusion criteria
     * Do not include conditions mentioned in other contexts
     * Do not include conditions from case descriptions or examples
     * Do not include conditions from background or discussion sections
   
   - [CRITICAL] For each criteria:
     * Extract ONLY the core medical concept
     * Remove patient-related phrases (e.g., "patients with", "history of")
     * Remove temporal qualifiers unless they are critical to the criteria
     * Remove descriptive text that isn't part of the medical concept

Example of what to extract:
Text: "The study included patients with chronic kidney disease who were receiving hemodialysis. Patients with a history of cardiovascular disease were excluded."
✓ DO extract:
  - Inclusion: "hemodialysis", "chronic kidney disease"
  - Exclusion: "cardiovascular disease"
✗ DON'T extract:
  - Random medical terms mentioned in results
  - Conditions discussed in background
  - Outcomes or complications

Extract the cohort selection criteria from the following text and return only a valid JSON response:
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

**Modified Examples**:
- Input: `"ESA"` → Output: `Erythropoiesis Stimulating Agent`
- Input: `"Sodium bicarbonate therapy"` → Output: `Sodium bicarbonate`
"""

# 코호트 검색어 수정 - user
SEARCH_QUERY_REFINEMENT_PROMPT = """
Original Term: "{term}"
"""

# 1. PDF에서 텍스트 추출
def extract_text_from_pdf(pdf_path) -> str:
    doc = pymupdf.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text() + "\n"
    return text

# 2. 키워드 검색어 + type 자동 추출
def extract_terms_from_text(text: str) -> dict:
    """
    PDF 텍스트에서 코호트 기준을 추출하여 기본 OMOP CDM JSON 형식으로 반환
    
    Args:
        text (str): PDF에서 추출한 텍스트
        
    Returns:
        dict: 기본 OMOP CDM JSON 형식
    """
    response = client.chat.completions.create(
        model=model_name,
        messages=[{"role": "system", "content": COHORT_EXTRACTION_SYSTEM_PROMPT},
                  {"role": "user", "content": COHORT_EXTRACTION_PROMPT.format(text=text)}]
    )

    try:
        # LLM 응답을 JSON으로 변환
        cohort_json = json.loads(response.choices[0].message.content)
        
        # PrimaryCriteria의 CriteriaList 처리
        if "PrimaryCriteria" in cohort_json and "CriteriaList" in cohort_json["PrimaryCriteria"]:
            for criteria in cohort_json["PrimaryCriteria"]["CriteriaList"]:
                if "CriteriaType" in criteria:
                    criteria_info = cohort_json_schema.map_criteria_info(criteria["CriteriaType"])
                    if criteria_info:
                        # 기존 정보 보존하면서 새로운 정보 추가
                        criteria.update({
                            "CriteriaName": criteria_info["CriteriaName"],
                            "Domain": criteria_info["Domain"],
                            "Domain_id": criteria_info["Domain_id"]
                        })

        # AdditionalCriteria의 Groups 처리
        if "AdditionalCriteria" in cohort_json and "Groups" in cohort_json["AdditionalCriteria"]:
            for group in cohort_json["AdditionalCriteria"]["Groups"]:
                if "CriteriaList" in group:
                    for criteria in group["CriteriaList"]:
                        if "Criteria" in criteria and "CriteriaType" in criteria["Criteria"]:
                            criteria_info = cohort_json_schema.map_criteria_info(criteria["Criteria"]["CriteriaType"])
                            if criteria_info:
                                # 기존 정보 보존하면서 새로운 정보 추가
                                criteria["Criteria"].update({
                                    "CriteriaName": criteria_info["CriteriaName"],
                                    "Domain": criteria_info["Domain"],
                                    "Domain_id": criteria_info["Domain_id"]
                                })
                                
                                # ObservationPeriod 타입인 경우 빈 객체 추가
                                if criteria["Criteria"]["CriteriaType"] == "ObservationPeriod":
                                    criteria["Criteria"]["ObservationPeriod"] = {}
        return cohort_json
    
    except json.JSONDecodeError:
        print("JSONDecodeError: 응답이 유효한 JSON 형식이 아님")
        return None
    
    except Exception as e:
        print(f"Unexpected Error: {e}")
        return None

# 불필요한 정보가 추가된 문구를 제거하는 함수 
def clean_term(term):
    return re.sub(r"\s*\(.*?\)", "", term).strip() 

# 3. ClickHouse에서 `concept_id` 조회
def get_omop_concept_id(term: str, domain_id: str) -> list:
    cleaned_term = clean_term(term).replace('%', '%%')
    
    # 일반적인 검색
    query = """
    SELECT concept_id, concept_name 
    FROM concept 
    WHERE concept_name ILIKE %(term)s 
    AND domain_id = %(domain_id)s 
    AND invalid_reason IS NULL
    LIMIT 3
    """
    results = clickhouse_client.execute(query, {'term': f'%{cleaned_term}%', 'domain_id': domain_id})
    
    return [(r[0], r[1]) for r in results]

# 4. 검색어 변경하여 재검색
def refine_search_query(term) -> str:
    response = client.chat.completions.create(
        model=model_name,
        messages=[{"role": "system", "content": COHORT_JSON_SYSTEM_PROMPT},
                  {"role": "user", "content": SEARCH_QUERY_REFINEMENT_PROMPT.format(term=term)}]
    )

    return response.choices[0].message.content.strip()

# cohort_json의 ConceptName을 기반으로 DB에서 concept_id를 조회하여 업데이트
def get_concept_ids(cohort_json: dict) -> dict:
    # PrimaryCriteria 처리
    if "PrimaryCriteria" in cohort_json and "CriteriaList" in cohort_json["PrimaryCriteria"]:
        for criteria in cohort_json["PrimaryCriteria"]["CriteriaList"]:
            # ObservationPeriod는 concept_id 검색 건너뛰기
            if criteria.get("CriteriaType") == "ObservationPeriod":
                continue
                
            if "ConceptName" in criteria and "Domain_id" in criteria:
                search_term = criteria["ConceptName"]  # 원래 검색어
                concept_results = get_omop_concept_id(search_term, criteria["Domain_id"])
                if concept_results:
                    criteria["CodesetId"] = [result[0] for result in concept_results]
                    criteria["ConceptName"] = search_term
                    # DB 결과는 나중에 ConceptSets에서 명시하기 위해 임시 저장
                    criteria["_db_results"] = concept_results  # 임시 저장
    
    # AdditionalCriteria 처리
    if "AdditionalCriteria" in cohort_json and "Groups" in cohort_json["AdditionalCriteria"]:
        for group in cohort_json["AdditionalCriteria"]["Groups"]:
            if "CriteriaList" in group:
                for criteria in group["CriteriaList"]:
                    if "Criteria" in criteria:
                        # ObservationPeriod는 concept_id 검색 건너뛰기
                        if criteria["Criteria"].get("CriteriaType") == "ObservationPeriod":
                            continue
                            
                        if "ConceptName" in criteria["Criteria"] and "Domain_id" in criteria["Criteria"]:
                            search_term = criteria["Criteria"]["ConceptName"]
                            concept_results = get_omop_concept_id(search_term, criteria["Criteria"]["Domain_id"])
                            if concept_results:
                                criteria["Criteria"]["CodesetId"] = [result[0] for result in concept_results]
                                criteria["Criteria"]["ConceptName"] = search_term
                                criteria["Criteria"]["_db_results"] = concept_results
    
    return cohort_json

def create_omop_json(cohort_json: dict) -> dict:
    """
    concept_id가 포함된 cohort_json을 최종 OMOP CDM JSON 형식으로 변환
    """
    result = {
        "PrimaryCriteria": {
            "CriteriaList": [],
            "PrimaryCriteriaLimit": {"Type": 0, "Count": 1}
        },
        "AdditionalCriteria": {
            "Type": "ALL",
            "CriteriaList": [],
            "DemographicCriteriaList": [],
            "Groups": [
                {"Type": "ALL", "CriteriaList": [], "DemographicCriteriaList": [], "Groups": []},
                {"Type": "NONE", "CriteriaList": [], "DemographicCriteriaList": [], "Groups": []}
            ]
        },
        "ConceptSets": [],
        "EndStrategy": {"DateField": "EndDate", "Offset": 0},
        "cdmVersionRange": ">=5.0.0",
        "includeAllDescendants": True,
        "includedCovariateConceptIds": [],
        "CensoringCriteria": [],
        "InclusionRules": [],
        "CollapseSettings": {"CollapseType": "ERA", "EraPad": 0}
    }
    
    # Criteria 처리 함수
    def process_criteria(criteria):
        result_criteria = {
            key: value for key, value in criteria.items() 
            if not key.startswith('_')
        }
        
        # ObservationPeriod 타입인 경우 특별 처리
        if criteria.get("CriteriaType") == "ObservationPeriod":
            if "AgeAtStart" in criteria:
                result_criteria["AgeAtStart"] = criteria["AgeAtStart"]
            if "AgeAtEnd" in criteria:
                result_criteria["AgeAtEnd"] = criteria["AgeAtEnd"]
            result_criteria["ObservationPeriod"] = {}
        # Measurement 타입인 경우 ValueAsNumber 처리
        elif "ValueAsNumber" in criteria:
            result_criteria["ValueAsNumber"] = criteria["ValueAsNumber"]
            result_criteria["Measurement"] = {}
        
        # 각 CriteriaType에 맞는 빈 객체 추가
        criteria_type = criteria.get("CriteriaType")
        if criteria_type:
            result_criteria[criteria_type] = {}
        
        return result_criteria
    
    # PrimaryCriteria 처리
    if "PrimaryCriteria" in cohort_json and "CriteriaList" in cohort_json["PrimaryCriteria"]:
        for criteria in cohort_json["PrimaryCriteria"]["CriteriaList"]:
            # CodesetId 유무와 관계없이 모든 criteria 포함
            result["PrimaryCriteria"]["CriteriaList"].append(process_criteria(criteria))
            
            # concept_id를 찾은 경우에만 ConceptSets에 추가
            if "_db_results" in criteria:
                for concept_id, db_name in criteria["_db_results"]:
                    result["ConceptSets"].append({
                        "id": concept_id,
                        "name": db_name,  # DB에서 가져온 정확한 이름
                        "expression": {
                            "items": [{
                                "concept": {
                                    "CONCEPT_ID": concept_id,
                                    "CONCEPT_NAME": db_name,  # DB 이름 사용
                                    "DOMAIN_ID": criteria["Domain_id"]
                                }
                            }]
                        }
                    })
    
    # AdditionalCriteria 처리
    if "AdditionalCriteria" in cohort_json and "Groups" in cohort_json["AdditionalCriteria"]:
        for group in cohort_json["AdditionalCriteria"]["Groups"]:
            if "CriteriaList" in group:
                for criteria in group["CriteriaList"]:
                    if "Criteria" in criteria:
                        # NONE 그룹은 제외 기준, 나머지는 포함 기준
                        target_group = result["AdditionalCriteria"]["Groups"][1] if group["Type"] == "NONE" else result["AdditionalCriteria"]["Groups"][0]
                        target_group["CriteriaList"].append(process_criteria(criteria["Criteria"]))
                        
                        # concept_id를 찾은 경우에만 ConceptSets에 추가
                        if "_db_results" in criteria["Criteria"]:
                            for concept_id, db_name in criteria["Criteria"]["_db_results"]:
                                result["ConceptSets"].append({
                                    "id": concept_id,
                                    "name": db_name,
                                    "expression": {
                                        "items": [{
                                            "concept": {
                                                "CONCEPT_ID": concept_id,
                                                "CONCEPT_NAME": db_name,
                                                "DOMAIN_ID": criteria["Criteria"]["Domain_id"]
                                            }
                                        }]
                                    }
                                })
    
    return result

def remove_duplicates_from_json(cohort_json: dict) -> dict:
    """
    JSON에서 중복된 criteria 제거
    """
    # PrimaryCriteria에서 중복 제거
    if "PrimaryCriteria" in cohort_json and "CriteriaList" in cohort_json["PrimaryCriteria"]:
        seen = set()
        unique_criteria = []
        for criteria in cohort_json["PrimaryCriteria"]["CriteriaList"]:
            key = (criteria.get("CriteriaType"), criteria.get("ConceptName"))
            if key not in seen:
                seen.add(key)
                unique_criteria.append(criteria)
        cohort_json["PrimaryCriteria"]["CriteriaList"] = unique_criteria

    # AdditionalCriteria Groups에서 중복 제거
    if "AdditionalCriteria" in cohort_json and "Groups" in cohort_json["AdditionalCriteria"]:
        for group in cohort_json["AdditionalCriteria"]["Groups"]:
            if "CriteriaList" in group:
                seen = set()
                unique_criteria = []
                for criteria in group["CriteriaList"]:
                    if "Criteria" in criteria:
                        key = (criteria["Criteria"].get("CriteriaType"), 
                              criteria["Criteria"].get("ConceptName"))
                        if key not in seen:
                            seen.add(key)
                            unique_criteria.append(criteria)
                    else:
                        key = (criteria.get("CriteriaType"), 
                              criteria.get("ConceptName"))
                        if key not in seen:
                            seen.add(key)
                            unique_criteria.append(criteria)
                group["CriteriaList"] = unique_criteria

    return cohort_json

def main():
    pdf_path = "pdf/Establishment of ICU Mortality Risk Prediction Models with Machine Learning Algorithm MIMIC .pdf"
    
    # 1. PDF에서 텍스트 추출
    extracted_text = extract_text_from_pdf(pdf_path)
    
    # 2. 텍스트에서 terms 추출
    terms = extract_terms_from_text(extracted_text)

    # 중복 제거
    terms = remove_duplicates_from_json(terms)
    if not terms:
        print("Failed to extract terms")
        return
    # 디버깅 - 추후 삭제
    print("extracted terms:", json.dumps(terms, indent=2, ensure_ascii=False))
    
    # 3. DB에서 concept_id 조회
    terms_with_concepts = get_concept_ids(terms)
    print("terms_with_concepts:", terms_with_concepts)
    
    # 4. OMOP CDM JSON 형식으로 변환
    cohort_json = create_omop_json(terms_with_concepts)
    print("cohort_json:", cohort_json)
    
    # 5. JSON 파일로 저장
    output_file = "cohort_criteria.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(cohort_json, f, indent=4, ensure_ascii=False)
    print(f"Cohort definition saved to {output_file}")

if __name__ == "__main__":
    main()
    