from clickhouse_driver import Client
import pandas as pd
import os


def get_client():
    client = Client(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASS"),
        database=os.getenv("DB_NAME"),
        port=os.getenv("DB_PORT"),
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


def generate_cohort_queries(cohort_id: str) -> tuple[str, str]:
    cohort_id = f"toUUID('{cohort_id}')"
    target_query = f"""
WITH
    target_cohort AS (
        SELECT person_id
        FROM   cohort_detail
        WHERE  cohort_id = {cohort_id}
    ),

    proc_agg AS (
        SELECT person_id,
               groupArrayDistinct(procedure_concept_id)  AS procedure_ids
        FROM   procedure_occurrence
        GROUP  BY person_id
    ),
    cond_agg AS (
        SELECT person_id,
               groupArrayDistinct(condition_concept_id)  AS condition_ids
        FROM   condition_occurrence
        GROUP  BY person_id
    ),

    patient_details AS (
        SELECT  p.person_id,
                (toYear(v.visit_start_date) - p.year_of_birth)          AS age,
                CASE
                    WHEN p.gender_concept_id = 8532 THEN 1     -- Female
                    WHEN p.gender_concept_id = 8507 THEN 2     -- Male
                    ELSE 0
                END                                            AS gender
        FROM person            AS p
        JOIN visit_occurrence  AS v ON v.person_id = p.person_id
    )

SELECT  tc.person_id,
        pa.procedure_ids,
        ca.condition_ids,
        pd.age,
        pd.gender
FROM target_cohort    AS tc
LEFT JOIN proc_agg    AS pa ON tc.person_id = pa.person_id
LEFT JOIN cond_agg    AS ca ON tc.person_id = ca.person_id
LEFT JOIN patient_details AS pd ON tc.person_id = pd.person_id;
"""

    comparator_query = f"""
WITH
    target_cohort AS (
        SELECT person_id
        FROM   cohort_detail
        WHERE  cohort_id = {cohort_id}
    ),

    non_target_patients AS (
        SELECT person_id
        FROM   person
        WHERE  person_id NOT IN (SELECT person_id FROM target_cohort)
    ),

    proc_agg AS (
        SELECT person_id,
               groupArrayDistinct(procedure_concept_id)  AS procedure_ids
        FROM   procedure_occurrence
        GROUP  BY person_id
    ),
    cond_agg AS (
        SELECT person_id,
               groupArrayDistinct(condition_concept_id)  AS condition_ids
        FROM   condition_occurrence
        GROUP  BY person_id
    ),

    patient_details AS (
        SELECT  p.person_id,
                (toYear(v.visit_start_date) - p.year_of_birth)          AS age,
                CASE
                    WHEN p.gender_concept_id = 8532 THEN 1
                    WHEN p.gender_concept_id = 8507 THEN 2
                    ELSE 0
                END                                            AS gender
        FROM person            AS p
        JOIN visit_occurrence  AS v ON v.person_id = p.person_id
    )

SELECT  ntp.person_id,
        pa.procedure_ids,
        ca.condition_ids,
        pd.age,
        pd.gender
FROM non_target_patients AS ntp
LEFT JOIN proc_agg        AS pa ON ntp.person_id = pa.person_id
LEFT JOIN cond_agg        AS ca ON ntp.person_id = ca.person_id
LEFT JOIN patient_details AS pd ON ntp.person_id = pd.person_id;
"""

    return target_query, comparator_query


def get_drop_id(cohort_id: str) -> tuple[str, str]:
    cohort_id = f"toUUID('{cohort_id}')"

    client = get_client()
    cols_to_drop = f"""
    SELECT toString(concept_id)
    FROM   cohort_concept
    WHERE  cohort_id = {cohort_id}
"""
    data = client.execute(cols_to_drop)
    cols_to_drop = [row[0] for row in data]
    return cols_to_drop


def get_target_cohort(cohort_id: str) -> pd.DataFrame:
    target_query, _ = generate_cohort_queries(cohort_id)
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


def get_comparator_cohort(cohort_id: str) -> pd.DataFrame:
    _, comparator_query = generate_cohort_queries(cohort_id)
    df = execute_query(comparator_query)
    df.rename(columns={
        0: "person_id",
        1: "procedure_ids",
        2: "condition_ids",
        3: "age",
        4: "gender"}, inplace=True)
    df['label'] = 0
    return df


def insert_feature_extraction_data(cohort_id, k, final_proc_importances, final_cond_importances, execution_time):
    client = get_client()

    top_proc_importances = final_proc_importances.head(10)
    top_cond_importances = final_cond_importances.head(10)

    rows = []
    for i in range(10):
        proc_row = top_proc_importances.iloc[i]
        rank_proc = i + 1
        concept_id_proc = int(proc_row['feature'])
        influence_proc = proc_row['importance']

        cond_row = top_cond_importances.iloc[i]
        rank_cond = i + 1
        concept_id_cond = int(cond_row['feature'])
        influence_cond = cond_row['importance']

        rows.append((cohort_id, k, 'procedure', rank_proc,
                    concept_id_proc, influence_proc, int(execution_time)))
        rows.append((cohort_id, k, 'condition', rank_cond,
                    concept_id_cond, influence_cond, int(execution_time)))

    client.execute("""
        INSERT INTO feature_extraction (cohort_id, multiple, domain_name, rank, concept_id, influence, execution_time)
        VALUES
    """, rows)


def db_cohort_drop(cohort_id):
    cohort_id = f"toUUID('{cohort_id}')"
    client = get_client()
    client.execute(f"""
   ALTER TABLE feature_extraction
   DELETE WHERE cohort_id = {cohort_id}; 
"""
                   )
