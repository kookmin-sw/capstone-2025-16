import sys
import pandas as pd
from db import get_target_cohort, get_comparator_cohort
from model import prepare_features, train_model, iterative_shap_train, shap_visualization, predict_cohort_probability
from validation import cross_validate_model, evaluate_model
from sklearn.model_selection import train_test_split, StratifiedKFold
import numpy as np
import matplotlib.pyplot as plt
import shap
import time
# gender,age 추가.
def main():
#     query = ["""
# WITH
#     all_patients AS (
#         SELECT DISTINCT 
#             p.person_id,
#             p.year_of_birth,
#             v.visit_occurrence_id,
#             v.visit_start_date,
#             v.visit_end_date,
#             (toYear(v.visit_start_date) - p.year_of_birth) AS age,  -- 나이 계산
#             p.gender_concept_id AS gender  -- 성별
#         FROM person AS p
#         JOIN visit_occurrence AS v ON p.person_id = v.person_id
#         WHERE (toYear(v.visit_start_date) - p.year_of_birth) >= 0
#           AND v.visit_concept_id = 9201
#     ),
#     delirium_patients AS (
#         SELECT DISTINCT a.person_id, a.visit_start_date
#         FROM all_patients AS a
#         JOIN condition_occurrence AS c ON a.person_id = c.person_id
#         WHERE c.condition_concept_id IN (
#               SELECT descendant_concept_id
#               FROM concept_ancestor
#               WHERE ancestor_concept_id = 373995
#         )
#         AND c.condition_start_date BETWEEN a.visit_start_date AND addDays(a.visit_start_date, 7)
#     ),
#     exclusion_antipsychotic_ICU AS (
#         SELECT DISTINCT a.person_id
#         FROM all_patients AS a
#         JOIN drug_exposure AS d ON a.person_id = d.person_id
#         WHERE d.drug_concept_id IN (
#               SELECT descendant_concept_id
#               FROM concept_ancestor
#               WHERE ancestor_concept_id = 21604490
#         )
#         AND d.drug_exposure_start_date BETWEEN a.visit_start_date AND a.visit_end_date
#     ),
#     exclusion_antipsychotic_prior AS (
#         SELECT DISTINCT a.person_id
#         FROM all_patients AS a
#         JOIN drug_exposure AS d ON a.person_id = d.person_id
#         WHERE d.drug_concept_id IN (
#               SELECT descendant_concept_id
#               FROM concept_ancestor
#               WHERE ancestor_concept_id = 21604490
#         )
#         AND d.drug_exposure_start_date < a.visit_start_date
#     ),
#     excluded_patients AS (
#         SELECT person_id FROM exclusion_antipsychotic_ICU
#         UNION DISTINCT
#         SELECT person_id FROM exclusion_antipsychotic_prior
#     ),
#     eligible_patients AS (
#         SELECT dp.person_id
#         FROM delirium_patients AS dp
#         WHERE dp.person_id NOT IN (
#               SELECT person_id FROM excluded_patients
#         )
#     )
#     """, """
#     WITH
#   pneumonia_patients AS (
#     SELECT DISTINCT
#       p.person_id AS person_id,
#       p.year_of_birth AS year_of_birth,
#       v.visit_occurrence_id AS visit_occurrence_id,
#       v.visit_start_date AS visit_start_date,
#       v.visit_end_date AS visit_end_date
#     FROM person AS p
#     JOIN visit_occurrence AS v ON p.person_id = v.person_id
#     JOIN condition_occurrence AS c ON p.person_id = c.person_id
#     WHERE (toYear(v.visit_start_date) - p.year_of_birth) >= 0
#       AND v.visit_concept_id = 9201
#       AND c.condition_start_date BETWEEN v.visit_start_date AND addDays(v.visit_start_date, 7)
#   ),
#   all_patients AS (
#     SELECT DISTINCT 
#       person_id, 
#       year_of_birth, 
#       visit_occurrence_id, 
#       visit_start_date, 
#       visit_end_date
#     FROM pneumonia_patients
#   ),
#   severe_criteria AS (
#     SELECT DISTINCT person_id, visit_occurrence_id
#     FROM (
#       SELECT person_id, visit_occurrence_id, procedure_date AS event_date
#       FROM procedure_occurrence
#       WHERE procedure_concept_id IN (37158404, 2008006, 2008007, 2008008, 2008009)
#       UNION ALL
#       SELECT person_id, visit_occurrence_id, procedure_date AS event_date
#       FROM procedure_occurrence
#       WHERE procedure_concept_id IN (
#         SELECT descendant_concept_id
#         FROM concept_ancestor
#         WHERE ancestor_concept_id = 3655950
#       )
#       UNION ALL
#       -- (d) Pneumonia Severity Index (PSI) > 130
#       SELECT person_id, visit_occurrence_id, measurement_date AS event_date
#       FROM measurement
#       WHERE measurement_concept_id = 4236139
#         AND value_as_number > 130
#     )
#   ),
#   exclusion_patients AS (
#     SELECT person_id
#     FROM all_patients ap
#     JOIN condition_occurrence c ON ap.person_id = c.person_id
#     WHERE c.condition_concept_id IN (
#       SELECT descendant_concept_id
#       FROM concept_ancestor
#       WHERE ancestor_concept_id = 3264303
#     )
#       AND c.condition_start_date BETWEEN ap.visit_start_date AND ap.visit_end_date
#     UNION DISTINCT
#     SELECT person_id
#     FROM all_patients ap
#     JOIN condition_occurrence c ON ap.person_id = c.person_id
#     WHERE c.condition_concept_id IN (
#       SELECT descendant_concept_id
#       FROM concept_ancestor
#       WHERE ancestor_concept_id = 196236
#     )
#       AND c.condition_start_date BETWEEN ap.visit_start_date AND ap.visit_end_date
#     UNION DISTINCT
#     SELECT person_id
#     FROM all_patients ap
#     JOIN observation o ON ap.person_id = o.person_id
#     WHERE o.observation_concept_id = 3172086
#       AND o.observation_date BETWEEN ap.visit_start_date AND ap.visit_end_date
#   ),
#   eligible_patients AS (
#     SELECT ap.person_id, ap.visit_occurrence_id, ap.visit_start_date, ap.visit_end_date
#     FROM all_patients ap
#     JOIN severe_criteria sc ON ap.person_id = sc.person_id
#       AND ap.visit_occurrence_id = sc.visit_occurrence_id
#     WHERE ap.person_id NOT IN (SELECT person_id FROM exclusion_patients)
#   )
  
#     """, ]
    base_query = """
WITH
    all_patients AS (
        SELECT DISTINCT 
            p.person_id,
            p.year_of_birth,
            v.visit_occurrence_id,
            v.visit_start_date,
            v.visit_end_date,
            (toYear(v.visit_start_date) - p.year_of_birth) AS age,  -- 나이 계산
            p.gender_concept_id AS gender  -- 성별
        FROM person AS p
        JOIN visit_occurrence AS v ON p.person_id = v.person_id
        WHERE (toYear(v.visit_start_date) - p.year_of_birth) >= 0
          AND v.visit_concept_id = 9201
    ),
    delirium_patients AS (
        SELECT DISTINCT a.person_id, a.visit_start_date
        FROM all_patients AS a
        JOIN condition_occurrence AS c ON a.person_id = c.person_id
        WHERE c.condition_concept_id IN (
              SELECT descendant_concept_id
              FROM concept_ancestor
              WHERE ancestor_concept_id = 373995
        )
        AND c.condition_start_date BETWEEN a.visit_start_date AND addDays(a.visit_start_date, 7)
    ),
    exclusion_antipsychotic_ICU AS (
        SELECT DISTINCT a.person_id
        FROM all_patients AS a
        JOIN drug_exposure AS d ON a.person_id = d.person_id
        WHERE d.drug_concept_id IN (
              SELECT descendant_concept_id
              FROM concept_ancestor
              WHERE ancestor_concept_id = 21604490
        )
        AND d.drug_exposure_start_date BETWEEN a.visit_start_date AND a.visit_end_date
    ),
    exclusion_antipsychotic_prior AS (
        SELECT DISTINCT a.person_id
        FROM all_patients AS a
        JOIN drug_exposure AS d ON a.person_id = d.person_id
        WHERE d.drug_concept_id IN (
              SELECT descendant_concept_id
              FROM concept_ancestor
              WHERE ancestor_concept_id = 21604490
        )
        AND d.drug_exposure_start_date < a.visit_start_date
    ),
    excluded_patients AS (
        SELECT person_id FROM exclusion_antipsychotic_ICU
        UNION DISTINCT
        SELECT person_id FROM exclusion_antipsychotic_prior
    ),
    eligible_patients AS (
        SELECT dp.person_id
        FROM delirium_patients AS dp
        WHERE dp.person_id NOT IN (
              SELECT person_id FROM excluded_patients
        )
    )
    """
    base_query = """
    WITH
  pneumonia_patients AS (
    SELECT DISTINCT
      p.person_id AS person_id,
      p.year_of_birth AS year_of_birth,
      v.visit_occurrence_id AS visit_occurrence_id,
      v.visit_start_date AS visit_start_date,
      v.visit_end_date AS visit_end_date
    FROM person AS p
    JOIN visit_occurrence AS v ON p.person_id = v.person_id
    JOIN condition_occurrence AS c ON p.person_id = c.person_id
    WHERE (toYear(v.visit_start_date) - p.year_of_birth) >= 0
      AND v.visit_concept_id = 9201
      AND c.condition_start_date BETWEEN v.visit_start_date AND addDays(v.visit_start_date, 7)
  ),
  all_patients AS (
    SELECT DISTINCT 
      person_id, 
      year_of_birth, 
      visit_occurrence_id, 
      visit_start_date, 
      visit_end_date
    FROM pneumonia_patients
  ),
  severe_criteria AS (
    SELECT DISTINCT person_id, visit_occurrence_id
    FROM (
      SELECT person_id, visit_occurrence_id, procedure_date AS event_date
      FROM procedure_occurrence
      WHERE procedure_concept_id IN (37158404, 2008006, 2008007, 2008008, 2008009)
      UNION ALL
      SELECT person_id, visit_occurrence_id, procedure_date AS event_date
      FROM procedure_occurrence
      WHERE procedure_concept_id IN (
        SELECT descendant_concept_id
        FROM concept_ancestor
        WHERE ancestor_concept_id = 3655950
      )
      UNION ALL
      -- (d) Pneumonia Severity Index (PSI) > 130
      SELECT person_id, visit_occurrence_id, measurement_date AS event_date
      FROM measurement
      WHERE measurement_concept_id = 4236139
        AND value_as_number > 130
    )
  ),
  exclusion_patients AS (
    SELECT person_id
    FROM all_patients ap
    JOIN condition_occurrence c ON ap.person_id = c.person_id
    WHERE c.condition_concept_id IN (
      SELECT descendant_concept_id
      FROM concept_ancestor
      WHERE ancestor_concept_id = 3264303
    )
      AND c.condition_start_date BETWEEN ap.visit_start_date AND ap.visit_end_date
    UNION DISTINCT
    SELECT person_id
    FROM all_patients ap
    JOIN condition_occurrence c ON ap.person_id = c.person_id
    WHERE c.condition_concept_id IN (
      SELECT descendant_concept_id
      FROM concept_ancestor
      WHERE ancestor_concept_id = 196236
    )
      AND c.condition_start_date BETWEEN ap.visit_start_date AND ap.visit_end_date
    UNION DISTINCT
    SELECT person_id
    FROM all_patients ap
    JOIN observation o ON ap.person_id = o.person_id
    WHERE o.observation_concept_id = 3172086
      AND o.observation_date BETWEEN ap.visit_start_date AND ap.visit_end_date
  ),
  eligible_patients AS (
    SELECT ap.person_id, ap.visit_occurrence_id, ap.visit_start_date, ap.visit_end_date
    FROM all_patients ap 

    JOIN severe_criteria sc ON ap.person_id = sc.person_id
      AND ap.visit_occurrence_id = sc.visit_occurrence_id
    WHERE ap.person_id NOT IN (SELECT person_id FROM exclusion_patients)
  )
  
    """
#     base_query = """
# WITH
#     chronic_disease_patients AS (
#         SELECT DISTINCT p.person_id AS pid
#         FROM person AS p
#         JOIN condition_occurrence AS c ON p.person_id = c.person_id
#         WHERE c.condition_concept_id IN (201826, 316866, 432867, 443392)
#     ),
#     eligible_patients AS (
#         SELECT pid AS person_id FROM chronic_disease_patients
#     )

# """
    base_query = """
    WITH
    sepsis_patients AS (
        SELECT DISTINCT p.person_id AS pid
        FROM person AS p
        JOIN visit_occurrence AS v 
          ON p.person_id = v.person_id
        JOIN condition_occurrence AS c
          ON p.person_id = c.person_id
          AND v.visit_occurrence_id = c.visit_occurrence_id  -- 같은 방문 내 진단 연결
        WHERE (toYear(v.visit_start_date) - p.year_of_birth) >= -168  -- 18세 이상
          AND v.visit_start_date >= toDate('2116-06-01') 
          AND v.visit_start_date < toDate('2123-04-01')
          AND c.condition_concept_id IN (
              SELECT descendant_concept_id
              FROM concept_ancestor
              WHERE ancestor_concept_id = 132797  -- "Sepsis" 상위 개념 ID
          )
        ),
    eligible_patients AS (
        SELECT pid AS person_id FROM sepsis_patients
    )

"""
    df_target = get_target_cohort(base_query)
    run_importances_list = []
    run_times_list = []
    
    epochs = 100  # 100번 반복
    # from clickhouse_driver import Client
    # client = Client(
    #     host='localhost',
    #     user='clickhouse',
    #     password='clickhouse',
    #     database='default',
    #     port=9000
    # )
    # query_descendants = """
    # SELECT toString(descendant_concept_id)
    # FROM concept_ancestor
    # WHERE ancestor_concept_id = 132797
    # """
    # data_descendants = client.execute(query_descendants)
    # descendant_ids = [row[0] for row in data_descendants]

    # 2. 제거할 컬럼 목록: '132797'와 descendant ID들을 합침
    # cols_to_drop = ['132797'] + descendant_ids
    # cols_to_drop = ['201826', '316866', '432867', '443392']

    # cols_to_drop = ['373995','descendant_id_1', 'descendant_id_2']
    cols_to_drop = ['37158404', '2008006', '2008007', '2008008', '2008009', '3655950', '4236139', 'descendant_id_1', 'descendant_id_2']
    print(len(df_target))
    for run in range(2):
        importances_list = []
        start_time = time.time()        

        for i in range(epochs):
            df_comparator = get_comparator_cohort(base_query)
            df_final = prepare_features(df_target, df_comparator, cols_to_drop)
            
            X = df_final.drop(columns=["label"])
            y = df_final["label"]
            
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=i)
            print("model start")
            model = train_model(X_train, y_train)
            print("model Done!")
            test_results = evaluate_model(model, X_test, y_test)
            print(f"Iteration {i} - Test Results:", test_results)
            
            # cv_results = cross_validate_model(model, X, y, cv_splits=5)
            # print(f"Iteration {i} - Cross-Validation Results:", cv_results)
            
            model_top, top_features, best_results, feature_importance = iterative_shap_train(
                model, X_train, y_train, X_test, y_test, initial_ratio=0.1, improvement_threshold=0.01, max_iter=3
            )
            
            df_importance = feature_importance.rename(columns={'mean_shap': 'importance'})
            print(df_importance.head())
            importances_list.append(df_importance)
          
        all_importances = pd.concat(importances_list, ignore_index=True)
        avg_importances = all_importances.groupby('feature')['importance'].mean().reset_index()
        avg_importances = avg_importances.sort_values(by='importance', ascending=False)
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        print(f"\n=== Run {run+1} Summary ===")
        print("Top 5 Averaged SHAP Feature Importances:")
        print(avg_importances.head(5))
        print(f"Execution Time for Run {run+1}: {execution_time:.2f} seconds")
        
        # 각 run의 결과에 run 번호와 실행시간 추가
        avg_importances["run"] = run + 1
        avg_importances["execution_time"] = execution_time
        
        run_importances_list.append(avg_importances)
        run_times_list.append(pd.DataFrame({"run": [run+1], "execution_time": [execution_time]}))

    # 4번의 run 결과를 하나의 DataFrame으로 결합
    final_importances = pd.concat(run_importances_list, ignore_index=True)
    final_times = pd.concat(run_times_list, ignore_index=True)

    # CSV 파일로 저장 (하나의 CSV 파일에 순차적으로 추가)
    final_importances.to_csv("final_avg_importances_chroninc.csv", index=False)
    final_times.to_csv("final_execution_times_chroinc.csv", index=False)

    print("\nFinal averaged feature importances saved to 'final_avg_importances_chronic.csv'")
    print("Final execution times saved to 'final_execution_times.csv'")
      
if __name__ == "__main__":
    main()