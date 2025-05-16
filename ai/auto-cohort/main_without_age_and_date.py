import cohort_json_schema
from pdf_to_text import extract_cohort_definition_from_pdf
from get_omop_concept_id import get_concept_ids, FORM_INSTRUCTIONS

import os
import json
from openai import OpenAI
from dotenv import load_dotenv
from datetime import datetime, timezone, timedelta

load_dotenv()
openai_api_key = os.environ.get('OPENAI_COMPATIBLE_API_KEY')
openai_api_base = os.environ.get('OPENAI_COMPATIBLE_API_BASE')
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
   - type (must be one of: ["condition_occurrence", "death", "device_exposure", "dose_era", "drug_era", "drug_exposure", "measurement", "observation", "observation_period", "procedure_occurrence", "specimen", "visit_occurrence", "visit_detail", "location_region", "demographic"])
   - Each filter MUST have:
     - type (one of the allowed types)
     - conceptset (matching conceptset_id)
     - [CRITICAL] first: true is used ONLY when there is a condition about first visit/occurrence
       * Example: "first visit" → first: true
       * Example: "first occurrence" → first: true
       * In all other cases, do not include the first field

3. [CRITICAL] Logical Operators (AND/OR):
   - If conditions are connected with "and" in the text, use operator: "AND"
   - If conditions are connected with "or" in the text, use operator: "OR"
   - If no operator is specified, use operator: "AND" as default
   [ABSOLUTELY MANDATORY] When text says "A or B", create ONE container(B) with operator: "OR"
   - Example: "Diagnosed with sepsis-3 and ARDS" → operator: "AND"
   - ***Example: "Serum creatinine ≥ 1.5 mg/dL or increase of ≥ 0.3 mg/dL" → operator: "OR"***
   - Example: "First ICU admission" (no operator) → operator: "AND" (default)
   [CRITICAL] For complex conditions with multiple operators:
     * Example: "(A or B) and C" → First container: A, Second container: operator: "OR", Third container: operator: "AND"
     * Example: "CKD stage ≥ 4 or eGFR < 30 mL/min/1.73m2, and long-term dialysis" → 
       First container: CKD stage ≥ 4
       Second container: operator: "OR"
       Third container: operator: "AND"

4. For Measurement criteria:
   - Include "valueAsNumber" with appropriate operator ("gt", "lt", "eq", etc.)
   - For any field such as "measurementType", "drugType", "conditionType", etc., 
     do NOT invent or fabricate placeholder concept_id values
   - [CRITICAL] Do NOT include any ~Type field if its value is null
   - [CRITICAL] For negation criteria, use the opposite operator instead of "neq" when possible
     * Example: "Exclude Hemoglobin > 13 g/dL" → {{ "valueAsNumber": {{ "lte": 13 }} }} (NOT {{ conceptset: {{neq: "6"}} }})
     * Only use "neq" when the opposite operator cannot express the intended meaning

5. [CRITICAL] Exclude age and time-based conditions:
   - [MUST EXCLUDE] Age-related conditions:
     * "Patients aged 18-65"
     * "Age > 18 years"
     * "Age between 18 and 65"
     * Any other age-related criteria
   - [MUST EXCLUDE] Time-related phrases:
     * "within 48 hours"
     * "within 6 hours"
     * "for ≥ 6 h"
     * Any other time-related phrases
   - [KEEP] Medical conditions and measurements:
     * Example: "serum creatinine ≥ 1.5 mg/dL" (keep)
     * Example: "urine volume < 0.5 mL/(kg·h)" (keep)
     * Example: "increase of ≥ 0.3 mg/dL" (keep)
     * [CRITICAL] Keep ALL medical criteria even if they appear with time conditions
       - Example: "serum creatinine ≥ 1.5 mg/dL within 48 hours" → keep "serum creatinine ≥ 1.5 mg/dL"
       - Example: "urine volume < 0.5 mL/(kg·h) for ≥ 6 h" → keep "urine volume < 0.5 mL/(kg·h)"

6. [CRITICAL] Visit Type Criteria:
   - When specifying ICU or hospital-related conditions, use ONLY the following visit types:
     * Inpatient Visit
     * Observation Room
     * Ambulatory Clinic / Center
     * Ambulatory Surgical Center
     * Emergency Room - Hospital
     * Emergency Room and Inpatient Visit
   - [MUST USE] For ICU patients, ALWAYS use "Emergency Room and Inpatient Visit" as the visit type
   - Example ICU condition structure:
     {{
       "name": "Emergency Room and Inpatient Visit",
          "filters": [
              {{
                  "type": "visit_occurrence",
                  "first": true,
                  "conceptset": "0"
              }}
          ]
     }}
     
7. [CRITICAL] Inclusion criteria processing:
   - Split complex conditions into individual criteria
   - Each criterion should have its own conceptset_id
   - Example: AKI diagnostic criteria →
     * Create separate conceptset for "serum creatinine ≥ 1.5 mg/dL"
     * Create separate conceptset for "increase of ≥ 0.3 mg/dL"
     * Create separate conceptset for "urine volume < 0.5 mL/(kg·h)"
   - [CRITICAL] Keep ALL medical criteria even if they appear with time conditions
     * Example: "serum creatinine ≥ 1.5 mg/dL within 48 hours" → keep "serum creatinine ≥ 1.5 mg/dL"
     * Example: "urine volume < 0.5 mL/(kg·h) for ≥ 6 h" → keep "urine volume < 0.5 mL/(kg·h)"

8. {FORM_INSTRUCTIONS}

9. NEVER include:
   - Complex logic
   - Non-implementable criteria
   - Criteria without clear OMOP CDM mappings
   - Additional words like "diagnosis", "treatment", "therapy", etc.
   - [CRITICAL] ANY text that describes what you're doing or why
   - [CRITICAL] ANY age-related conditions
   - [CRITICAL] ANY time-related phrases (but keep the medical conditions)

10. [CRITICAL] ICD Code Processing:
    - When ICD code is included (e.g., I50.0, E11.9):
      * Convert ICD code to its corresponding medical term
      * Examples:
        - "I50.0 Congestive heart failure" → "Congestive heart failure"
        - "I50.9 Heart failure, unspecified" → "Heart failure, unspecified"
        - "I50.1 Left ventricular failure" → "Left ventricular failure"
        - "S06 Intracranial injury" → "Intracranial injury"
      * When only code is present (e.g., "I50.0"):
        - Convert to corresponding medical term
        - Example: "I50.0" → "Congestive heart failure"
    - For non-ICD codes:
      * Apply existing refinement logic
      * Perform medical term expansion and standardization
"""
JSON_OUTPUT_EXAMPLE = """
다음은 주어진 임상시험 텍스트를 바탕으로 OMOP CDM 규격에 맞게 구성된 최종 JSON 예시입니다:

const cohortExample: CohortDefinition = {
  conceptsets: [
    {
      conceptset_id: "0",
      name: "Hemodialysis",
      items: []
    }
    // 추가 conceptset 항목이 있으면 여기에 추가합니다.
  ],
  initialGroup: {
    // Group 1: Inclusion Criteria
    containers: [
      {
        name: "hemodialysis",
        filters: [
          {
            type: "procedure_occurrence",
            conceptset: "0",
          }
        ]
      },
      {
        operator: "AND",
        name: "ESA therapy",
        filters: [
          {
            type: "drug_exposure",
            conceptset: "1",
          }
        ]
      },
      {
        operator: "AND",
        name: "iron deficiency anemia",
        filters: [
          {
            type: "condition_occurrence",
            conceptset: "2",
          }
        ]
      }
    ],
  },
  comparisonGroup: {  
    // Group 2: Exclusion Criteria
    containers: [
      {
        name: "not intensive care unit",
        filters: [
          {
            type: "observation",
            first: true,
            conceptset: {
              neq: "3",
            },
          }
        ]
      },
      {
        operator: "AND",
        name: "not hemoglobin > 13 g/dL",
        filters: [
          {
            type: "measurement",
            measurementType: { eq: "234567" },
            valueAsNumber: { lte: 13 }, // hemoglobin > 13 g/dL를 제외해야하니 13 g/dL 이하로 설정.
            conceptset: "4"
          }
        ]
      },
      {
        operator: "AND",
        name: "not kidney transplant",
        filters: [
          {
            type: "procedure_occurrence",
            conceptset: {
              neq: "5",
            },
          }
        ]
      },
      {
        operator: "OR", // 이 부분 주의
        name: "not sepsis or active infections",
        filters: [
          {
            type: "condition_occurrence",
            conceptset: {
              neq: "6",
            },
          }
        ]
      }
    ]
  }
};
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
{JSON_OUTPUT_EXAMPLE}

8. Output format:
    - Return only the JSON structure
    - Do not include any explanations or markdown
    - Ensure all required fields are present
    - DO NOT include explanations, comments, or additional text.
    - Return only raw JSON without any labels, headers, or formatting.
    - DO NOT include any Markdown formatting or explanations
    - Any usage of Markdown formatting like ```json or ``` → strictly forbidden
    - Use valueAsNumber only for measurable criteria
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

[CRITICAL] ONLY extract conditions that are explicitly mentioned in the implementable_text:
- DO NOT include any conditions from the examples
- DO NOT make up or assume any conditions
- ONLY use the exact conditions found in the implementable_text
- If a condition is not explicitly mentioned in the implementable_text, DO NOT include it

Current time: {current_datetime}
Extract the cohort selection criteria from the following text and return ONLY the JSON response:
{text}
"""
########################################################################################

# 텍스트에서 코호트 정의를 추출
def extract_terms_from_text(text: str) -> dict:
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
        temperature=0.0,
        stream=True
    )
    
    llm_response = ""
    for chunk in response:
        delta = chunk.choices[0].delta
        if delta.content is not None:
            llm_response += delta.content
    
    # print("\n[LLM 응답 원본]:")
    # print(llm_response)
    
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
        print("\n[LLM 응답 파싱된 JSON]:")
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
    
    # # PDF 파일 경로
    # pdf_path = os.path.join(current_dir, "pdf", "Association between glycemic variability and short-term mortality in patients with acute kidney injury.pdf")
    
    # # 1. PDF에서 텍스트 추출
    # implementable_text, non_implementable_text = extract_cohort_definition_from_pdf(pdf_path)
    
    # print("\n[Implementable Criteria 부분만]:")
    # print(implementable_text)

    # implementable_text = """
    # Data from both the MIMIC and external validation datasets were selected based on the same inclusion and exclusion criteria. The
    # external validation dataset was obtained from a tertiary hospital in Liaoning Province, China, between January 2016 and September
    # 2022. Adult patients who met the criteria for sepsis-3 and ARDS(Acute Respiratory Distress syndrome) were included in this study. The inclusion criteria were as follows: (1)
    # diagnosed with sepsis-3 and ARDS, (2) first intensive care unit admission, and (3) age ≥18 years. The exclusion criterion was an ICU
    # stay duration of less than 24 h.
    # # """
    
    implementable_text = """
    This study selected adult septic patients who were admitted to the ICU from the MIMIC-IV database from 2008
    to 2019. Patients with severe chronic kidney disease
    (CKD), defined as CKD stage ≥ 4 or estimated glomerular
    filtration rate (eGFR) < 30 mL/min/1.73m2, and patients
    undergoing long-term dialysis treatment were excluded.
    """

    # implementable_text = """
    # We conducted this retrospective cohort study based on a US publicdatabase: Medical Information Mart for Intensive Care IV (MIMIC-IV)Database.
    # 11–13 All sepsis patients with sepsis 3.0 criteria were in-cluded.14 Exclusion criteria were as follows: (1) Without records ofFBG and TG in 24 h after admission; (2) Age less than 18-year-old;
    # (3) Diabetes and patients with antidiabetic treatment (insulin or oralantidiabetics); (4) Died within 48 h after admission; (5) Patients withacute pancreatitis; (6) Patients with dyslipidemia and patients withreceiving lipid-lowering drugs.
    # """
    # implementable_text = """
    # Patients diagnosed with sepsis based on Sepsis-3 criteria were included.
    # Exclusion criteria were: 1) ICU length of stay <24 h due to discharge or death; 2) Age <18 years; and 3) Diagnosis of acquired immunodeficiency syndrome (AIDS).
    # For patients with multiple ICU admissions, only the first admission was analyzed.
    # Patients who received administration of calcineurin inhibitors (CNIs), including cyclosporin A (CsA) or tacrolimus (FK506), during their ICU stay were defined as the CNIs group.
    # The remaining patients who did not receive CNIs were defined as the control group.
    # """

    # 2. 텍스트에서 COHORT JSON 추출
    cohort_json = text_to_json(implementable_text)

    # 4. JSON 파일로 저장
    output_file = os.path.join(current_dir, "cohort_criteria_sample_2.json")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(cohort_json, f, indent=4, ensure_ascii=False)
    print(f"\nCohort definition saved to: {output_file}")


if __name__ == "__main__":
    main()
    