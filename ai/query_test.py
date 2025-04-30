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

#Myocardial Infarction
#diabetes mellitus
query = """
WITH limited_concepts AS
(
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
    WHERE (concept_name ILIKE '%acute Myocardial Infarction%') AND (domain_id = 'Condition') AND (invalid_reason IS NULL)
)
SELECT
    lc.concept_id,
    lc.concept_name,
    lc.domain_id,
    lc.vocabulary_id,
    lc.concept_class_id,
    lc.standard_concept,
    lc.concept_code,
    lc.valid_start_date,
    lc.valid_end_date,
    lc.invalid_reason,
    COALESCE(pc.parent_count, 0) AS parent_count,
    COALESCE(cc.child_count, 0) AS child_count
FROM limited_concepts AS lc
LEFT JOIN
(
    SELECT
        descendant_concept_id AS concept_id,
        COUNT(*) AS parent_count
    FROM concept_ancestor
    WHERE descendant_concept_id IN (
        SELECT concept_id
        FROM limited_concepts
    )
    GROUP BY descendant_concept_id
) AS pc ON lc.concept_id = pc.concept_id
LEFT JOIN
(
    SELECT
        ancestor_concept_id AS concept_id,
        COUNT(*) AS child_count
    FROM concept_ancestor
    WHERE ancestor_concept_id IN (
        SELECT concept_id
        FROM limited_concepts
    )
    GROUP BY ancestor_concept_id
) AS cc ON lc.concept_id = cc.concept_id
ORDER BY child_count DESC
"""

try:
    results = clickhouse_client.execute(query)
    if results:
        # 결과가 많으면 10개만 표시
        display_count = min(10, len(results))
        print(f"검색 결과 (전체 {len(results)}개 중 {display_count}개 표시): ")
        print(f"자식 수가 많은 순으로 정렬됨")
        print("=" * 80)
        for i in range(display_count):
            row = results[i]
            print(f"Concept ID: {row[0]}")
            print(f"Concept Name: {row[1]}")
            print(f"Domain: {row[2]}, Vocabulary: {row[3]}, Class: {row[4]}, Standard: {row[5]}")
            print(f"Code: {row[6]}")
            print(f"부모 개념 수: {row[10]} | 자식 개념 수: {row[11]}")
            print("=" * 80)
    else:
        print("검색 결과 없음")
except Exception as e:
    print(f"오류 발생: {e}")