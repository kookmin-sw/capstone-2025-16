from clickhouse_driver import Client

clickhouse_client = Client(
    host='localhost', 
    database='default',
    user='clickhouse', 
    password='clickhouse'
)

# 단어 검색 쿼리
# query = """
# SELECT concept_id, concept_name, domain_id
# FROM concept 
# WHERE concept_name ILIKE '%sepsis%'
# AND domain_id = 'Condition'
# AND invalid_reason IS NULL
# LIMIT 20;
# """
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
WHERE concept_name ILIKE 'sepsis'
AND domain_id = 'Condition'
AND invalid_reason IS NULL
LIMIT 20;
"""

try:
    results = clickhouse_client.execute(query)
    if results:
        print("검색 결과 : ")
        for row in results:
            print(f"Concept ID: {row[0]}, Concept Name: {row[1]}, Domain: {row[2]}")
    else:
        print("검색 결과 없음")
except Exception as e:
    print(f"오류 발생: {e}")