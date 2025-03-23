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
     - "CriteriaType" (determines the type of criteria)
     - "Domain" (must be one of: ["Drug", "Device", "Measurement", "Observation", "Note", "Procedure", "Meas Value", "Condition", "Provider", "Unit", "Type Concept", "Metadata", "Spec Anatomic Site", "Specimen", "Race", "Language", "Relationship", "Route", "Plan", "Sponsor", "Payer", "Plan Stop Reason", "Gender", "Visit", "Cost", "Episode", "Revenue Code", "Condition Status", "Condition/Meas", "Condition/Device", "Geography", "Obs/Procedure", "Drug/Procedure", "Condition/Obs", "Condition/Procedure", "Regimen", "Ethnicity", "Meas/Procedure", "Currency", "Device/Procedure", "Device/Drug", "Place of Service", "Meas Value Operator"])
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
   - Use PascalCase for all keys (e.g., "ValueAsNumber" not "valueAsNumber")
   - Avoid creating entirely new diseases or medications unrelated to the input.
   - Avoid adding extra qualifiers, descriptions, or text that didn't exist in the original term.
   - **Do NOT fabricate or hallucinate any concept_id, domain_id, or type values.**
   - If any required value is missing or uncertain, omit that item from the output.

4. The final JSON **must strictly conform** to the OMOP CDM cohort JSON schema below:
OMOP CDM cohort JSON schema:
{cohort_json_schema.JSON_SCHEMA}

Important Restriction!!!:
Only extract cohort criteria from the provided clinical study text.
DO NOT include or use any example data, JSON schema, or instructions shown above.
Your output must strictly reflect criteria that appear in the original text below.

Input Text Example:
3.1. Inclusion criteria  
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
    - Do NOT include any formatting headers such as "Output:", "Composite:", "Result:", "Instructions:", or any Markdown syntax.
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
Your task is to extract **only** the medical conditions, treatments, medications, and procedures mentioned **explicitly** in the provided text
and classify them into appropriate OMOP CDM domains.

## Rules
2. DO NOT generate `concept_id`.** That will be retrieved separately.
3. **DO NOT include any Markdown formatting (e.g., ` ```json `, ` ``` `).**
4. DO NOT include explanations or additional text.
5. **Only return the JSON output in the correct format.**

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

def map_domain_to_cdm_domain(domain_type):
    """
    입력된 도메인 타입을 OMOP CDM의 표준 도메인으로 매핑합니다.
    """
    domain_mapping = {
        "condition_era": "Condition",
        "condition_occurrence": "Condition",
        "death": "Death",
        "device_exposure": "Device",
        "dose_era": "Drug",
        "drug_era": "Drug",
        "drug_exposure": "Drug",
        "measurement": "Measurement",
        "observation": "Observation",
        "observation_period": "Observation",
        "procedure_occurrence": "Procedure",
        "specimen": "Specimen",
        "visit_occurrence": "Visit"
    }
    
    return domain_mapping.get(domain_type, None)

# 1. PDF에서 텍스트 추출
def extract_text_from_pdf(pdf_path):
    doc = pymupdf.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text() + "\n"
    return text

# 2. 키워드 검색어 + type 자동 추출
def extract_cohort_terms(text):
    response = client.chat.completions.create(
        model=model_name,
        messages=[{"role": "system", "content": COHORT_EXTRACTION_SYSTEM_PROMPT},
                  {"role": "user", "content": COHORT_EXTRACTION_PROMPT.format(text=text)}]
    )
    # 디버깅 - 추후 삭제
    print("LLM Response:", response.choices[0].message.content)

    try:
        cohort_json = json.loads(response.choices[0].message.content)
        
        # PrimaryCriteria의 CriteriaList 처리
        if "PrimaryCriteria" in cohort_json and "CriteriaList" in cohort_json["PrimaryCriteria"]:
            for criteria in cohort_json["PrimaryCriteria"]["CriteriaList"]:
                if "CriteriaType" in criteria:
                    criteria["Domain"] = map_domain_to_cdm_domain(criteria["CriteriaType"].lower())

        # AdditionalCriteria의 Groups 처리
        if "AdditionalCriteria" in cohort_json and "Groups" in cohort_json["AdditionalCriteria"]:
            for group in cohort_json["AdditionalCriteria"]["Groups"]:
                if "CriteriaList" in group:
                    for criteria in group["CriteriaList"]:
                        if "Criteria" in criteria and "CriteriaType" in criteria["Criteria"]:
                            criteria["Criteria"]["Domain"] = map_domain_to_cdm_domain(
                                criteria["Criteria"]["CriteriaType"].lower()
                            )

        return cohort_json

    except json.JSONDecodeError:
        print("JSONDecodeError: 응답이 유효한 JSON 형식이 아님")
        return None  # 에러 발생 시 None 반환

    except Exception as e:
        print(f"Unexpected Error: {e}")
        return None

# 불필요한 정보가 추가된 문구를 제거하는 함수 
def clean_term(term):
    return re.sub(r"\s*\(.*?\)", "", term).strip() 

# 3. ClickHouse에서 `concept_id` 조회
def get_omop_concept_id(term, domain_id):
    cleaned_term = clean_term(term).replace('%', '%%')
    query = """
    SELECT concept_id FROM concept 
    WHERE concept_name ILIKE %(term)s 
    AND domain_id = %(domain_id)s 
    AND invalid_reason IS NULL
    """
    result = clickhouse_client.execute(query, {'term': f'%{cleaned_term}%', 'domain_id': domain_id})

    return result[0][0] if result else None

# 4. 검색어 변경하여 재검색
def refine_search_query(term):
    response = client.chat.completions.create(
        model=model_name,
        messages=[{"role": "system", "content": COHORT_JSON_SYSTEM_PROMPT},
                  {"role": "user", "content": SEARCH_QUERY_REFINEMENT_PROMPT.format(term=term)}]
    )

    return response.choices[0].message.content.strip()


if __name__ == "__main__":
    pdf_path = "pdf/1-s2.0-S0140673618310808-main.pdf"
    extracted_text = extract_text_from_pdf(pdf_path)
    cohort_terms = extract_cohort_terms(extracted_text)
    
    if cohort_terms:
        output_file = "cohort_keyword.json"
        try:
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(cohort_terms, f, indent=4)
            print(f"Cohort JSON saved to {output_file}")

        except Exception as e:
            print(f"Unexpected Error: {e}")

    else:  
        print("Failed to extract cohort terms")
    