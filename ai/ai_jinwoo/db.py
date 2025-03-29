# db.py
from clickhouse_driver import Client
import pandas as pd

def get_client():
    client = Client(
        host='localhost',
        user='clickhouse',
        password='clickhouse',
        database='default',
        port=9000
    )
    return client

def execute_query(query: str) -> pd.DataFrame:
    client = get_client()
    data = client.execute(query)
    df = pd.DataFrame(data)
    return df

def generate_cohort_queries(base_cohort_cte: str) -> tuple[str, str]:
    # 기본 쿼리의 끝에 있는 세미콜론을 제거하고, 맨 앞의 "WITH" (대소문자 무시)를 제거합니다.
    base_cte_clean = base_cohort_cte.strip().rstrip(';')
    if base_cte_clean[:4].upper() == "WITH":
        base_cte_clean = base_cte_clean[4:].strip()
    
    target_query = f"""
WITH
    {base_cte_clean},
    proc_agg AS (
      SELECT person_id, groupArrayDistinct(procedure_concept_id) AS procedure_ids
      FROM procedure_occurrence
      GROUP BY person_id
    ),
    cond_agg AS (
      SELECT person_id, groupArrayDistinct(condition_concept_id) AS condition_ids
      FROM condition_occurrence
      GROUP BY person_id
    )
SELECT ep.person_id, proc_agg.procedure_ids, cond_agg.condition_ids
FROM eligible_patients AS ep
LEFT JOIN proc_agg ON ep.person_id = proc_agg.person_id
LEFT JOIN cond_agg ON ep.person_id = cond_agg.person_id;
"""

    comparator_query = f"""
WITH
    target_count AS (
        SELECT count(*) AS cnt
        FROM (
            WITH
                {base_cte_clean}
            SELECT person_id FROM eligible_patients
        ) AS ep
    ),
    random_patients AS (
        SELECT person_id
        FROM person
        ORDER BY rand()
        LIMIT (SELECT cnt FROM target_count)
    ),
    proc_agg AS (
        SELECT person_id, groupArrayDistinct(procedure_concept_id) AS procedure_ids
        FROM procedure_occurrence
        GROUP BY person_id
    ),
    cond_agg AS (
        SELECT person_id, groupArrayDistinct(condition_concept_id) AS condition_ids
        FROM condition_occurrence
        GROUP BY person_id
    )
SELECT 
    rp.person_id, 
    proc_agg.procedure_ids, 
    cond_agg.condition_ids
FROM random_patients AS rp
LEFT JOIN proc_agg ON rp.person_id = proc_agg.person_id
LEFT JOIN cond_agg ON rp.person_id = cond_agg.person_id;
"""
    return target_query, comparator_query


def get_target_cohort(base_cohort_query: str) -> pd.DataFrame:
    target_query, _ = generate_cohort_queries(base_cohort_query)
    df = execute_query(target_query)
    df.rename(columns={
    0: "person_id",
    1: "procedure_ids",
    2: "condition_ids"
    }, inplace=True)
    df['label'] = 1
    return df

def get_comparator_cohort(base_cohort_query: str) -> pd.DataFrame:
    _, comparator_query = generate_cohort_queries(base_cohort_query)
    df = execute_query(comparator_query)
    df.rename(columns={
    0: "person_id",
    1: "procedure_ids",
    2: "condition_ids"
}, inplace=True)
    df['label'] = 0
    return df
