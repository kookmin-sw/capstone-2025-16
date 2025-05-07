import cohort_json_schema  
import fitz  # pymupdf
import os
from clickhouse_driver import Client
from dotenv import load_dotenv
from langchain.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain

load_dotenv()
openai_api_key = os.environ.get('OPENAI_API_KEY')
openai_api_base = "https://api.lambdalabs.com/v1"
model_name = os.environ.get('LLM_MODEL')
clickhouse_host = os.environ.get('CLICKHOUSE_HOST')
clickhouse_database = os.environ.get('CLICKHOUSE_DATABASE')
clickhouse_user = os.environ.get('CLICKHOUSE_USER')
clickhouse_password = os.environ.get('CLICKHOUSE_PASSWORD')

# 1. PDF 텍스트 추출 함수
def extract_text_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text() + "\n"
    return text

# 2. ClickHouse 검색 함수
def search_concept_ids(keywords):
    clickhouse = Client(
        host=clickhouse_host,
        database=clickhouse_database,
        user=clickhouse_user, 
        password=clickhouse_password
    )
    concept_list = []

    for keyword in keywords:
        query = """
        SELECT concept_id, concept_name, domain_id
        FROM concept
        WHERE lower(concept_name) LIKE lower(%(keyword)s)
        LIMIT 10
        """
        res = clickhouse.execute(query, {'keyword': f'%{keyword.strip().replace("%", "%%")}%'})
        if res:
            concept_list.append({
                "keyword": keyword,
                "concept_id": res[0][0],
                "concept_name": res[0][1],
                "domain_id": res[0][2]
            })
        else:
            concept_list.append({
                "keyword": keyword,
                "concept_id": None,
                "concept_name": None,
                "domain_id": None
            })
    return concept_list

# 3. LLM 설정 (lambda labs 기반 llama3.1 사용)
llm = ChatOpenAI(
    openai_api_key=openai_api_key,
    openai_api_base=openai_api_base,
    model_name=model_name
)

# 0. [추가] Atlas 기반 코호트 관련성 필터 체인
prompt_atlas_filter = PromptTemplate(
    input_variables=["pdf_text"],
    template="""
Role: Medical Cohort Extraction Expert

Instructions:
Review the clinical trial research paper excerpt provided below.
Extract and return only the sections that contain measurable and observable eligibility criteria suitable for Atlas-based cohort composition (in OMOP CDM format).  
Omit any sections that do not provide such criteria.  
If no relevant criteria are found, return an empty string.

Text:
{pdf_text}

Output:
Return only the relevant sections that include observable, measurable eligibility criteria.
"""
)
atlas_filter_chain = LLMChain(llm=llm, prompt=prompt_atlas_filter)

# 4. 프롬프트 + 체인 구성

# (1) Inclusion/Exclusion 조건 추출
prompt_criteria = PromptTemplate(
    input_variables=["pdf_text"],
    template="""
Role:
You are a clinical trial cohort modeling expert specializing in identifying eligibility criteria from medical literature.

Context:
You are given an excerpt from a clinical trial research paper that describes the eligibility criteria of a cohort. Some descriptions may include qualitative or non-observable conditions. Your task is to apply chain-of-thought reasoning to extract **only valid observable inclusion and exclusion criteria** from the provided text.

Instructions:
Read the input clinical text and return:

Part 1: A bullet-point list of all **Inclusion** criteria  
Part 2: A bullet-point list of all **Exclusion** criteria  

Omit any vague, qualitative, or subjective criteria such as:
- “poor prognosis”
- “not expected to survive ICU stay”
- “clinician judgment required”

Text:
{pdf_text}

Output Format Example:
Inclusion:
- ...
- ...

Exclusion:
- ...
- ...
"""
)
criteria_chain = LLMChain(llm=llm, prompt=prompt_criteria)

# (2) OMOP 키워드 추출
prompt_keywords = PromptTemplate(
    input_variables=["criteria_text"],
    template="""
Role: Medical Cohort Extraction Expert (LLM Prompt Engineer)

Context:
You are an AI assistant specializing in translating clinical trial eligibility criteria into structured OMOP CDM-compatible JSON format.

Instructions:
You are given a list of inclusion and exclusion criteria previously extracted from a clinical trial paper.  
Your task is to **transform each valid observable clinical criterion** into OMOP CDM JSON format.

Follow these rules:
- Use appropriate OMOP domain types: ["condition_era", "drug_exposure", "procedure_occurrence", "observation", "measurement"]
- You must use the concept_id values provided in the input concept list. Do not make up or fabricate any concept_id. If no concept_id is provided for a keyword, omit it from the output.
- For measurement criteria like “Hemoglobin > 13”, use:
  - concept_name
  - valueAsNumber with proper operator ("gt", "lt", etc.)
  - measurementType with placeholder concept_id
- Do NOT fabricate concept names or concept IDs
- Omit any unobservable or qualitative criteria
- Do NOT include Markdown formatting, backticks, or explanations

Input:
{criteria_text}

Output Format:
A valid OMOP CDM JSON structure including "entry", "inclusion" with "and"/"not" filters, and "exit"
"""
)
keyword_chain = LLMChain(llm=llm, prompt=prompt_keywords)

# (3) 최종 JSON 생성
# cohort_json_schema.py 파일에 정의된 OMOP CDM JSON 스키마를 변수에 할당 (문자열 또는 dict 형태)
omop_cdm_schema = cohort_json_schema.JSON_SCHEMA

prompt_json = PromptTemplate(
    input_variables=["criteria", "concept_list", "schema"],
    template="""
Role: Medical Cohort Extraction Expert

Instructions:
You must strictly follow the OMOP CDM JSON schema provided below when generating your output.

Schema:
{schema}

Input Criteria:
{criteria}

Matched Concepts:
{concept_list}

Output:
Return a single valid OMOP CDM JSON object matching the above schema.
Only include observable, measurable, or database-extractable criteria.
"""
)
json_chain = LLMChain(llm=llm, prompt=prompt_json)

# 5. 실행 함수 (한 번에 실행)
def run_pipeline(pdf_path):
    # PDF에서 전체 텍스트 추출
    pdf_text = extract_text_from_pdf(pdf_path)

    # [추가] 아틀라스 기반 코호트 구성이 가능한 논문 내용만 선별
    filtered_text = atlas_filter_chain.invoke({"pdf_text": pdf_text})
    if not filtered_text.strip():
        print("해당 논문은 아틀라스 기반 코호트 구성이 불가능합니다.")
        return None

    # 필터링된 텍스트를 기준으로 조건 추출
    criteria_text = criteria_chain.invoke({"pdf_text": filtered_text})
    print("\n[조건 추출 결과]")
    print(criteria_text)

    # 조건 텍스트를 기준으로 OMOP 키워드 추출
    keyword_text = keyword_chain.invoke({"criteria_text": criteria_text})
    print("\n[키워드 추출 결과]")
    print(keyword_text)
    
    # 추출된 키워드를 쉼표로 구분하여 리스트로 변환
    keywords = [k.strip() for k in keyword_text.split(",") if k.strip()]

    # ClickHouse에서 해당 키워드에 해당하는 concept_id 검색
    concept_list = search_concept_ids(keywords)
    print("\n[ClickHouse 검색 결과]")
    for c in concept_list:
        print(c)

    # 최종 OMOP CDM JSON 생성
    json_result = json_chain.invoke({
        "criteria": criteria_text,
        "concept_list": concept_list,
        "schema": omop_cdm_schema
    })

    print("\n[최종 JSON 결과]")
    print(json_result)
    return json_result

if __name__ == "__main__":
    run_pipeline("pdf/1-s2.0-S0140673618310808-main.pdf")
