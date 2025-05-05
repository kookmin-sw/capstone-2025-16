import cohort_json_schema
from pdf_to_text import extract_cohort_definition_from_pdf
from get_omop_concept_id import get_concept_ids

import os
import json
from openai import OpenAI
from dotenv import load_dotenv
from datetime import datetime, timezone, timedelta
import re

load_dotenv()
openai_api_key = os.environ.get('OPENROUTER_API_KEY')
openai_api_base = os.environ.get('OPENROUTER_API_BASE')
model_name = os.environ.get('LLM_MODEL')

client = OpenAI(
    api_key=openai_api_key,
    base_url=openai_api_base,
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

2. Each container in cohort MUST have:
   - name (ONLY the medical term, NO additional words)
   - type (must be one of: ["condition_era", "condition_occurrence", "death", "device_exposure", "dose_era", "drug_era", "drug_exposure", "measurement", "observation", "observation_period", "procedure_occurrence", "specimen", "visit_occurrence", "visit_detail", "location_region", "demographic"])
   - Each filter MUST have:
     - type (one of the allowed types)
     - conceptset (matching conceptset_id)
     - [CRITICAL] first: true is used ONLY when there is a condition about first visit/occurrence
       * Example: "first visit" → first: true
       * Example: "first occurrence" → first: true
       * In all other cases, do not include the first field

3. For Measurement criteria:
   - Include "valueAsNumber" with appropriate operator ("gt", "lt", "eq", etc.)
   - For any field such as "measurementType", "drugType", "conditionType", etc., 
     do NOT invent or fabricate placeholder concept_id values
   - If a concept_id is not available, explicitly set the value to null
   - [CRITICAL] For negation criteria, use the opposite operator instead of "neq" when possible
     * Example: "Hemoglobin > 13 g/dL를 제외" → {{ "valueAsNumber": {{ "lte": 13 }} }} (NOT {{ conceptset: {{neq: "6"}} }})
     * Only use "neq" when the opposite operator cannot express the intended meaning

4. For age criteria:
   - For dose_era, drug_era, condition_era types:
     * Include "startAge" and "endAge" with appropriate values
     * Example: "Patients aged 18-65" → {{ "startAge": 18, "endAge": 65 }}
   - For all other types (except demographic):
     * Include "age" with appropriate operator
     * Example: "Age > 18" → "age": {{ "gt": 18 }}
   - Demographic type MUST NOT use age field
     * [CRITICAL] If the cohort has an age criterion, ALL filters MUST include the appropriate age property

5. For time-based conditions:
   - Use the appropriate date fields based on the domain type:
     * drug_exposure: startDate, endDate
     * condition_occurrence: startDate, endDate
     * procedure_occurrence: startDate, endDate
     * measurement: date
     * observation: date
   - Date format: "YYYY-MM-DD HH:MM:SS"
   - For relative time conditions, calculate the appropriate start and end dates based on the current time:
     * "within the previous 24 hours" → 24시간 이내
     * "within the last 3 months" → 3개월 이내
   - Examples:
     1. "Treatment with piperacillin-tazobactam within the previous 24 hours":
       {{
         "type": "drug_exposure",
         "first": true,
         "conceptset": "0",
         "startDate": {{
           "gte": "2024-03-20 10:00:00",  // 24 hours before current time
           "lte": "2024-03-21 10:00:00"   // current time
         }}
       }}
     2. "Diagnosis of sepsis within the last 3 months":
       {{
         "type": "condition_occurrence",
         "first": true,
         "conceptset": "1",
         "startDate": {{
           "gte": "2023-12-21 10:00:00",  // 3 months before current time
           "lte": "2024-03-21 10:00:00"   // current time
         }}
       }}

6. NEVER include:
   - Complex logic
   - Non-implementable criteria
   - Criteria without clear OMOP CDM mappings
   - Additional words like "diagnosis", "treatment", "therapy", etc.
   - [CRITICAL] ANY text that describes what you're doing or why
"""

STRICT_REQUIREMENT_SCHEMA = f"""
7. The final JSON **must strictly conform** to the OMOP CDM cohort JSON schema below:
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

8. Output format:
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

# 코호트 json 뽑기 - system
COHORT_EXTRACTION_SYSTEM_PROMPT = f"""
Role:  
Act as a **medical cohort definition expert** specialized in converting clinical trial eligibility criteria into OMOP CDM JSON format.

Context:  
You are given a clinical trial's eligibility criteria section. Your job is to convert these criteria into a structured JSON format that follows the OMOP CDM specification.

Instructions:  
1. Extract ONLY the implementable criteria (those that can be directly converted to OMOP CDM concepts)
2. Ignore criteria that require complex logic or cannot be directly mapped to OMOP concepts
3. Return the criteria in the following JSON format:

{STRICT_REQUIREMENT}
{STRICT_REQUIREMENT_SCHEMA}
"""

# 코호트 json 뽑기 - user
COHORT_EXTRACTION_PROMPT = """
You are an AI assistant specialized in processing medical cohort selection criteria.
Your task is to extract medical conditions, treatments, medications, and procedures mentioned explicitly in the provided text
and classify them into appropriate OMOP CDM domains.

Current time: {current_datetime}
Extract the cohort selection criteria from the following text and return ONLY the JSON response:
{text}
"""
########################################################################################


########################################################################################

# 텍스트에서 코호트 정의를 추출
def extract_terms_from_text(text: str) -> dict:
    # KST 시간대 계산
    kst_offset = timedelta(hours=9)
    current_datetime = (datetime.now(timezone.utc) + kst_offset).strftime('%Y-%m-%d %H:%M:%S')
    
    response = client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": COHORT_EXTRACTION_SYSTEM_PROMPT},
            {"role": "user", "content": COHORT_EXTRACTION_PROMPT.format(
                current_datetime=current_datetime,
                text=text
            )}
        ],
        temperature=0.0
    )
    llm_response = response.choices[0].message.content
    
    # 디버깅을 위한 출력
    print("\n[LLM 응답 원본]:")
    print(llm_response)
    
    try:
        content = llm_response.strip()
        
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        
        cohort_json = json.loads(content)
        
        # 코호트 정의가 없을 경우 빈 배열 추가
        if "conceptsets" not in cohort_json:
            cohort_json["conceptsets"] = []

        if "initialGroup" not in cohort_json and "comparisonGroup" not in cohort_json:
            pass
        else:
            if "initialGroup" not in cohort_json:
                cohort_json["initialGroup"] = {"containers": []}
            
            if "comparisonGroup" not in cohort_json:
                cohort_json["comparisonGroup"] = {"containers": []}
        
        # conceptset의 items 필드 확인
        for conceptset in cohort_json.get("conceptsets", []):
            # items 필드가 없는 경우 빈 배열 추가
            if "items" not in conceptset:
                conceptset["items"] = []
        
        # 디버깅을 위한 출력
        print("\n[파싱된 JSON]:")
        print(json.dumps(cohort_json, indent=2, ensure_ascii=False))
        
        return cohort_json
    
    except Exception as e:
        print(f"\n[Unexpected Error]")
        print(f"Error: {e}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return {"conceptsets": [], "initialGroup": {"containers": []}, "comparisonGroup": {"containers": []}}

# 텍스트에서 코호트 정의를 추출하여 JSON 형식으로 변환
def text_to_json(implementable_text: str) -> dict:
    # 2. 텍스트에서 criteria 추출 (implementable 부분만 사용)
    cohort_json = extract_terms_from_text(implementable_text)
    print("\n[cohort_json]:")
    print(json.dumps(cohort_json, indent=2, ensure_ascii=False))
    
    if not cohort_json or (not cohort_json.get("conceptsets")):
        print("Failed to extract criteria")
        return
    
    # 3. DB에서 concept_id 조회
    cohort_json = get_concept_ids(cohort_json)
    print("\n[cohort_json with concept_ids]:")
    print(json.dumps(cohort_json, indent=2, ensure_ascii=False))
    
    return cohort_json


def main():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # PDF 파일 경로
    # pdf_path = os.path.join(current_dir, "pdf", "A novel clinical prediction model for in-hospital mortality in sepsis patients complicated by ARDS- A MIMIC IV database and external validation study.pdf")
    # pdf_path = os.path.join(current_dir, "pdf", "nejmoa2215145_appendix.pdf")
    pdf_path = os.path.join(current_dir, "pdf", "jama_dulhunty_2024_oi_240070_1723741887.30473.pdf")
    
    # 1. PDF에서 텍스트 추출
    implementable_text, non_implementable_text = extract_cohort_definition_from_pdf(pdf_path)
    
    print("\n[Implementable Criteria 부분만]:")
    print(implementable_text)
    
    # 2. 텍스트에서 COHORT JSON 추출
    cohort_json = text_to_json(implementable_text)

    # 4. JSON 파일로 저장
    output_file = os.path.join(current_dir, "cohort_criteria_sample.json")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(cohort_json, f, indent=4, ensure_ascii=False)
    print(f"\nCohort definition saved to: {output_file}")


if __name__ == "__main__":
    main()
    