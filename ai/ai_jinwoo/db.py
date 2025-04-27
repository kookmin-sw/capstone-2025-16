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

def generate_cohort_queries_v1(base_cohort_cte: str) -> tuple[str, str]:
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
    ),
    patient_details AS (
       SELECT p.person_id, 
              (toYear(v.visit_start_date) - p.year_of_birth) AS age,  -- 나이 계산
              CASE 
                  WHEN p.gender_concept_id = 8532 THEN 1
                  WHEN p.gender_concept_id = 8507 THEN 2
                  ELSE 0 
              END AS gender  -- 성별 계산 (M=1, F=2, 나머지=0)
       FROM person AS p
       JOIN visit_occurrence AS v ON p.person_id = v.person_id
       WHERE v.visit_concept_id = 9201  -- 입원 방문만 선택
     )
    
SELECT ep.person_id, 
       proc_agg.procedure_ids, 
       cond_agg.condition_ids
       , pd.age, 
        pd.gender
FROM eligible_patients AS ep
LEFT JOIN proc_agg ON ep.person_id = proc_agg.person_id
LEFT JOIN cond_agg ON ep.person_id = cond_agg.person_id
LEFT JOIN patient_details AS pd ON ep.person_id = pd.person_id;
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
    ), 
    patient_details AS (
         SELECT p.person_id, 
                (toYear(v.visit_start_date) - p.year_of_birth) AS age,  
                CASE 
                    WHEN p.gender_concept_id = 8532 THEN 1
                    WHEN p.gender_concept_id = 8507 THEN 2
                    ELSE 0 
                END AS gender  
         FROM person AS p
         JOIN visit_occurrence AS v ON p.person_id = v.person_id
     )
SELECT 
    rp.person_id, 
    proc_agg.procedure_ids, 
    cond_agg.condition_ids, 
    pd.age, 
    pd.gender
FROM random_patients AS rp
LEFT JOIN proc_agg ON rp.person_id = proc_agg.person_id
LEFT JOIN cond_agg ON rp.person_id = cond_agg.person_id
LEFT JOIN patient_details AS pd ON rp.person_id = pd.person_id;
"""
    
    return target_query, comparator_query

def generate_cohort_queries(base_cohort_cte: str) -> tuple[str, str]:
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
    ),
    patient_details AS (
       SELECT p.person_id, 
              (toYear(v.visit_start_date) - p.year_of_birth) AS age,  -- 나이 계산
              CASE 
                  WHEN p.gender_concept_id = 8532 THEN 1
                  WHEN p.gender_concept_id = 8507 THEN 2
                  ELSE 0 
              END AS gender  -- 성별 계산 (M=1, F=2, 나머지=0)
       FROM person AS p
       JOIN visit_occurrence AS v ON p.person_id = v.person_id
       WHERE v.visit_concept_id = 9201  -- 입원 방문만 선택
     )
    
SELECT ep.person_id, 
       proc_agg.procedure_ids, 
       cond_agg.condition_ids
       , pd.age, 
        pd.gender
FROM eligible_patients AS ep
LEFT JOIN proc_agg ON ep.person_id = proc_agg.person_id
LEFT JOIN cond_agg ON ep.person_id = cond_agg.person_id
LEFT JOIN patient_details AS pd ON ep.person_id = pd.person_id;
"""
    
    comparator_query = f"""
WITH
    target_cohort AS (
         WITH
             {base_cte_clean}
         SELECT person_id FROM eligible_patients
    ),
    non_target_patients AS (
         SELECT p.person_id
         FROM person p
         WHERE p.person_id NOT IN (SELECT person_id FROM target_cohort)
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
    ), 
    patient_details AS (
         SELECT p.person_id, 
                (toYear(v.visit_start_date) - p.year_of_birth) AS age,  
                CASE 
                    WHEN p.gender_concept_id = 8532 THEN 1
                    WHEN p.gender_concept_id = 8507 THEN 2
                    ELSE 0 
                END AS gender  
         FROM person AS p
         JOIN visit_occurrence AS v ON p.person_id = v.person_id
     )
SELECT 
    rp.person_id, 
    proc_agg.procedure_ids, 
    cond_agg.condition_ids
    , pd.age, 
     pd.gender
FROM non_target_patients AS rp
LEFT JOIN proc_agg ON rp.person_id = proc_agg.person_id
LEFT JOIN cond_agg ON rp.person_id = cond_agg.person_id
LEFT JOIN patient_details AS pd ON rp.person_id = pd.person_id
"""

    return target_query, comparator_query
def get_target_cohort(base_cohort_query: str) -> pd.DataFrame:
    target_query, _ = generate_cohort_queries(base_cohort_query)
    df = execute_query(target_query)
    df.rename(columns={
    0: "person_id",
    1: "procedure_ids",
    2: "condition_ids",
    3: "age",
    4: "gender"
    }, inplace=True)
    df['label'] = 1
    return df

def get_comparator_cohort(base_cohort_query: str) -> pd.DataFrame:
    _, comparator_query = generate_cohort_queries(base_cohort_query)
    df = execute_query(comparator_query)
    df.rename(columns={
    0: "person_id",
    1: "procedure_ids",
    2: "condition_ids",
    3: "age",
    4: "gender"
}, inplace=True)
    df['label'] = 0
    return df
