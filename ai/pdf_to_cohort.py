import cohort_json_schema as cohort_json_schema
from pdf_to_text import extract_cohort_definition_from_pdf
from get_omop_concept_id import clean_term, get_omop_concept_id, get_concept_set_domain_id, update_concept_set_items, get_concept_ids, refine_search_query

import os
import json
from openai import OpenAI
from dotenv import load_dotenv
import re

load_dotenv()
openai_api_key = os.environ.get('OPENAI_API_KEY')
openai_api_base = os.environ.get('OPENAI_API_BASE')
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
     * not: Boolean (true for exclusion criteria)

2. Each filter MUST include:
   - type: The type of criteria (must be one of: ["condition_occurrence", "death", "device_exposure", "dose_era", "drug_era", "drug_exposure", "measurement", "observation", "observation_period", "procedure_occurrence", "specimen", "visit_occurrence", "visit_detail", "location_region", "demographic"])
   - first: true
   - conceptset: String (matching conceptset_id)

3. For Measurement criteria:
   - Include "valueAsNumber" with appropriate operator ("gt", "lt", "eq", etc.)
   - For any field such as "measurementType", "drugType", "conditionType", etc., 
     do NOT invent or fabricate placeholder concept_id values
   - If a concept_id is not available, explicitly set the value to null

4. For age criteria:
   - Use "demographic" as type
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

Required JSON Format:
{{
  "conceptsets": [
    {{
      "conceptset_id": "0",  // MUST be a string
      "name": "Sepsis",  // MUST be ONLY the medical term, NO additional words
      "items": []  // MUST be an empty array
    }}
  ],
  "cohort": [
    {{
      "containers": [
        {{
          "name": "Sepsis",  // MUST be ONLY the medical term, NO additional words
          "filters": [  // MUST be an array
            {{
              "type": "condition_occurrence",  // MUST match the conceptset type
              "first": true,  // MUST be true
              "conceptset": "0"  // MUST match the conceptset_id
            }}
          ]
        }}
      ]
    }},
    {{// Group 2: Demographic Criteria
      "containers": [
        {{
          "name": "age",
          "filters": [
            {{
              "type": "demographic",
              "first": true,
              "age": {{ "gte": 20 }}
            }}
          ]
        }}
      ]
    }},
  ]
}}

{STRICT_REQUIREMENT}
{STRICT_REQUIREMENT_SCHEMA}

CRITICAL RULES:
1. Each conceptset MUST have:
   - conceptset_id (string)
   - name (medical term)
   - items (empty array)
   - DO NOT include type field in conceptset

2. Each container in cohort MUST have:
   - name (ONLY the medical term, NO additional words)
   - type (must be one of: ["condition_occurrence", "death", "device_exposure", "dose_era", "drug_era", "drug_exposure", "measurement", "observation", "observation_period", "procedure_occurrence", "specimen", "visit_occurrence", "visit_detail", "location_region", "demographic"])
   - Each filter MUST have:
     - type (one of the allowed types)
     - first: true
     - conceptset (matching conceptset_id)

3. Important:
   - [CRITICAL] Each concept should appear only ONCE
   - [CRITICAL] For Measurement type:
     * MUST include valueAsNumber with operator and value
     * Example: "Hemoglobin > 13" → {{ "valueAsNumber": {{ "gt": 13 }} }}
   - [CRITICAL] For age criteria:
     * MUST use "demographic" as type
     * MUST include age value and operator
     * Example: "Age > 18" → {{ "type": "demographic", "name": "Age", "age": {{ "gt": 18 }} }}
     * demographic type can ONLY be used in the second or later group in the cohort array
   - For conditions:
     * Use "condition_occurrence" as type (NOT condition_era)

4. NEVER include:
   - Complex logic
   - Non-implementable criteria
   - Criteria without clear OMOP CDM mappings
   - Additional words like "diagnosis", "treatment", "therapy", etc.
   - type field in conceptset

4. ALWAYS maintain the exact structure shown above
"""

# 코호트 json 뽑기 - user
COHORT_EXTRACTION_PROMPT = """
You are an AI assistant specialized in processing medical cohort selection criteria.
Your task is to extract medical conditions, treatments, medications, and procedures mentioned explicitly in the provided text
and classify them into appropriate OMOP CDM domains.

Extract the cohort selection criteria from the following text and return ONLY the JSON response:
{text}
"""

def extract_terms_from_text(text: str) -> dict:
    """
    텍스트에서 코호트 정의를 추출합니다.
    
    Args:
        text: 코호트 정의가 포함된 텍스트
        
    Returns:
        OMOP CDM cohort JSON
    """
    response = client.chat.completions.create(
        model=model_name,
        messages=[{"role": "system", "content": COHORT_EXTRACTION_SYSTEM_PROMPT},
                 {"role": "user", "content": COHORT_EXTRACTION_PROMPT.format(text=text)}]
    )
    llm_response = response.choices[0].message.content
    
    # 디버깅을 위한 출력
    print("\n[LLM 응답 원본]:")
    print(llm_response)
    
    try:
        content = llm_response.strip()
        
        if "```" in content:
            content = content.split("```")[1].strip()
        
        cohort_json = json.loads(content)
        
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
        return {"conceptsets": [], "cohort": []}

def main():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # PDF 파일 경로
    # pdf_path = os.path.join(current_dir, "pdf", "A novel clinical prediction model for in-hospital mortality in sepsis patients complicated by ARDS- A MIMIC IV database and external validation study.pdf")
    pdf_path = os.path.join(current_dir, "pdf", "NEJMoa2211868.pdf")
    
    # 1. PDF에서 텍스트 추출
    implementable_text, non_implementable_text = extract_cohort_definition_from_pdf(pdf_path)
    
    print("\n[Implementable Criteria 부분만]:")
    print(implementable_text)
    
    # 2. 텍스트에서 criteria 추출 (implementable 부분만 사용)
    cohort_json = extract_terms_from_text(implementable_text)
    print("\n[cohort_json]:")
    print(json.dumps(cohort_json, indent=2, ensure_ascii=False))
    
    if not cohort_json or (not cohort_json.get("conceptsets") and not cohort_json.get("cohort")):
        print("Failed to extract criteria")
        return
    
    # 3. DB에서 concept_id 조회
    from get_omop_concept_id import get_concept_ids
    cohort_json = get_concept_ids(cohort_json)
    print("\n[cohort_json with concept_ids]:")
    print(json.dumps(cohort_json, indent=2, ensure_ascii=False))
    
    # 4. JSON 파일로 저장
    output_file = os.path.join(current_dir, "cohort_criteria_sample.json")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(cohort_json, f, indent=4, ensure_ascii=False)
    print(f"\nCohort definition saved to: {output_file}")

if __name__ == "__main__":
    main()
    