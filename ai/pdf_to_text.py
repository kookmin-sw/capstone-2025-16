import pymupdf
from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()
openai_api_key = os.environ.get('OPENAI_API_KEY')
openai_api_base = os.environ.get('OPENAI_API_BASE')
model_name = os.environ.get('LLM_MODEL')
client = OpenAI(
    api_key=openai_api_key,
    base_url=openai_api_base,
)

# 1. PDF에서 텍스트 추출
def extract_text_from_pdf(pdf_path) -> str:
    doc = pymupdf.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text() + "\n"
    return text

# PDF에서 코호트 정의를 추출하여 text로 반환합니다.
def extract_cohort_definition_from_pdf(pdf_path):
    # PDF에서 텍스트 추출
    text = extract_text_from_pdf(pdf_path)
    
    # 코호트 추출 프롬프트 생성
    formatted_input = f"""
    Input Text:
    {text}
    """
    
    # 코호트 추출을 위한 프롬프트
    cohort_prompt = f"""
    You are an expert in extracting cohort definitions (inclusion and exclusion criteria) from clinical documents and mapping them to OMOP CDM compatible format.
    Please identify and organize the patient inclusion criteria and exclusion criteria from the given text.

    IMPORTANT: Cohort criteria (inclusion and exclusion) are typically grouped together in specific sections or paragraphs. Look for sections labeled with terms like "Eligibility Criteria", "Selection Criteria", "Inclusion/Exclusion Criteria", etc. Focus on these complete sections rather than trying to piece together criteria from separate parts of the document.

    CRITICAL: Each criterion must be listed separately on its own line. If a single line contains multiple conditions (e.g., "Patients diagnosed with sepsis-3 and ARDS"), split it into separate criteria (e.g., "Patients diagnosed with sepsis-3" and "Patients diagnosed with ARDS"). Never combine multiple medical conditions in a single criterion.

    Based on the OMOP CDM schema, you should categorize the criteria into two groups:
    1. Criteria that can be implemented in OMOP CDM
    2. Criteria that cannot be directly implemented in OMOP CDM

    The following types of criteria CAN be implemented in OMOP CDM:
    - Demographics (age, gender, race, ethnicity)
    - Diagnoses/conditions (using condition_occurrence, condition_era)
    - Medications/drugs (using drug_exposure, drug_era, dose_era)
    - Procedures (using procedure_occurrence)
    - Lab measurements with specific values (using measurement)
    - Visits/encounters (using visit_occurrence)
    - Observations (using observation)
    - Death (using death)
    - Device exposures (using device_exposure)
    - Specific time periods or durations that can be calculated

    The following types of criteria CANNOT be directly implemented in OMOP CDM:
    - Subjective assessments without clear definitions
    - Criteria based on unstructured data (e.g., physician notes interpretation)
    - Free text descriptions that cannot be mapped to standard concepts
    - Patient-reported outcomes not captured in structured data
    - Complex temporal relationships that cannot be expressed in the CDM

    When handling medical terminology:
    1. Preserve the original medical terms as written in the document.
    2. [CRITICAL] If abbreviations are used, you MUST expand them to their full medical terms.
       This is the MOST IMPORTANT rule - always expand all medical abbreviations.
       Examples:
       * "ESA" → "Erythropoiesis Stimulating Agent "
       * "CKD" → "Chronic Kidney Disease"
       * "HTN" → "Hypertension"
       * "DM" → "Diabetes Mellitus"
       * "CHF" → "Congestive Heart Failure"
       * "MI" → "Myocardial Infarction"
       * "ESRD" → "End Stage Renal Disease"
       * "CAD" → "Coronary Artery Disease"
       * "T2DM" → "Type 2 Diabetes Mellitus"
       * "COPD" → "Chronic Obstructive Pulmonary Disease"
       * "AKI" → "Acute Kidney Injury"
    3. Keep specific measurements and thresholds exactly as stated (e.g., "Hemoglobin value more than 13 g/dL").
    4. Maintain the original context of each criterion.
    5. For vague or overly specific medical terms, consider using standard medical terminology while preserving the original meaning.
       Example: "Sodium bicarbonate therapy" → "Sodium bicarbonate"

    Your response MUST follow this format:

    Implementable Criteria
    Inclusion Criteria
    1. [First implementable inclusion criterion]
    2. [Second implementable inclusion criterion]
    ...
    
    Exclusion Criteria
    1. [First implementable exclusion criterion]
    2. [Second implementable exclusion criterion]
    ...
    
    Non-implementable Criteria
    Inclusion Criteria
    1. [First non-implementable inclusion criterion]
    2. [Second non-implementable inclusion criterion]
    ...
    
    Exclusion Criteria
    1. [First non-implementable exclusion criterion]
    2. [Second non-implementable exclusion criterion]
    ...

    If there are no criteria in any section, write "None identified." in that section.

    Here's an example of what your output might look like:

    Implementable Criteria
    Inclusion Criteria
    1. Patients who are 20 years old or older.
    2. Patients with hemodialysis (HD).
    3. Patients using Erythropoiesis Stimulating Agent therapy for at least three months.
    4. Patients with iron deficiency anemia.

    Exclusion Criteria
    1. Patients in intensive care unit.
    2. Patients with hemoglobin value more than 13 g/dL.
    3. Kidney transplant patients.
    
    Non-implementable Criteria
    Inclusion Criteria
    1. First intensive care unit admission.
    
    Exclusion Criteria
    1. Patients with sepsis or active infections. (Requires specific definition of "active infections")
    2. An ICU stay duration of less than 24 hours.

    Here is the text to analyze:
    {formatted_input}
    """
    
    response = client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": "You are an expert in extracting cohort definitions (inclusion and exclusion criteria) from clinical documents. Focus on finding complete sections of criteria rather than isolated mentions."},
            {"role": "user", "content": cohort_prompt}
        ]
    )
    
    content = response.choices[0].message.content
    
    # "Non-implementable Criteria"를 기준으로 텍스트 분리
    parts = content.split("Non-implementable Criteria")
    implementable_text = parts[0].strip() if len(parts) > 0 else ""
    non_implementable_text = ("Non-implementable Criteria" + parts[1].strip()) if len(parts) > 1 else ""
    
    return implementable_text, non_implementable_text

