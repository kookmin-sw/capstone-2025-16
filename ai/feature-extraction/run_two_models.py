import pandas as pd
import time
from db import get_target_cohort, get_comparator_cohort
from model import prepare_two_features, train_model, iterative_shap_train
from validation import evaluate_model
from sklearn.model_selection import train_test_split


def main():
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
    df_target = get_target_cohort(base_query)
    run_importances_list = []
    run_times_list = []
    procedure_importances_all_runs = []
    condition_importances_all_runs = []
    epochs = 100  # 100번 반복
    cols_to_drop = ['37158404', '2008006', '2008007', '2008008', '2008009',
                    '3655950', '4236139', 'descendant_id_1', 'descendant_id_2']

    for run in range(2):
        procedure_importances_list = []
        condition_importances_list = []
        start_time = time.time()

        for i in range(epochs):
            df_comparator = get_comparator_cohort(base_query)
            df_procedure, df_condition = prepare_two_features(
                df_target, df_comparator, cols_to_drop)

            X_procedure = df_procedure.drop(columns=["label"])
            y_proc = df_procedure["label"]
            X_train, X_test, y_train, y_test = train_test_split(
                X_procedure, y_proc, test_size=0.2, random_state=i)
            print("Model start (Procedure features)")
            model_procedure = train_model(X_train, y_train)
            print("Model Done (Procedure features)!")
            test_results_proc = evaluate_model(model_procedure, X_test, y_test)
            print(
                f"Iteration {i} - Test Results (Procedure features):", test_results_proc)

            model_top, top_features, best_results, feature_importance = iterative_shap_train(
                model_procedure, X_train, y_train, X_test, y_test,
                initial_ratio=0.1, improvement_threshold=0.01, max_iter=3
            )
            df_importance_proc = feature_importance.rename(
                columns={'mean_shap': 'importance'})
            procedure_importances_list.append(df_importance_proc)

            X_condition = df_condition.drop(columns=["label"])
            y_cond = df_condition["label"]
            X_train, X_test, y_train, y_test = train_test_split(
                X_condition, y_cond, test_size=0.2, random_state=i)
            print("Model start (Condition features)")
            model_condition = train_model(X_train, y_train)
            print("Model Done (Condition features)!")
            test_results_cond = evaluate_model(model_condition, X_test, y_test)
            print(
                f"Iteration {i} - Test Results (Condition features):", test_results_cond)

            model_top, top_features, best_results, feature_importance = iterative_shap_train(
                model_condition, X_train, y_train, X_test, y_test,
                initial_ratio=0.1, improvement_threshold=0.01, max_iter=3
            )
            df_importance_cond = feature_importance.rename(
                columns={'mean_shap': 'importance'})
            condition_importances_list.append(df_importance_cond)

        all_proc_importances = pd.concat(
            procedure_importances_list, ignore_index=True)
        avg_proc_importances = all_proc_importances.groupby(
            'feature')['importance'].mean().reset_index()
        avg_proc_importances = avg_proc_importances.sort_values(
            by='importance', ascending=False)

        all_cond_importances = pd.concat(
            condition_importances_list, ignore_index=True)
        avg_cond_importances = all_cond_importances.groupby(
            'feature')['importance'].mean().reset_index()
        avg_cond_importances = avg_cond_importances.sort_values(
            by='importance', ascending=False)

        end_time = time.time()
        execution_time = end_time - start_time
        print(f"\n=== Run {run+1} Summary ===")
        print("Top 5 Averaged SHAP Feature Importances (Procedure):")
        print(avg_proc_importances.head(5))
        print("Top 5 Averaged SHAP Feature Importances (Condition):")
        print(avg_cond_importances.head(5))
        print(f"Execution Time for Run {run+1}: {execution_time:.2f} seconds")

        # 각 run의 결과에 run 번호와 실행시간 추가
        avg_proc_importances["run"] = run + 1
        avg_proc_importances["execution_time"] = execution_time

        avg_cond_importances["run"] = run + 1
        avg_cond_importances["execution_time"] = execution_time

        procedure_importances_all_runs.append(avg_proc_importances)
        condition_importances_all_runs.append(avg_cond_importances)
        run_times_list.append(pd.DataFrame(
            {"run": [run+1], "execution_time": [execution_time]}))

    final_proc_importances = pd.concat(
        procedure_importances_all_runs, ignore_index=True)
    final_cond_importances = pd.concat(
        condition_importances_all_runs, ignore_index=True)
    final_times = pd.concat(run_times_list, ignore_index=True)

    final_proc_importances.to_csv(
        "final_avg_importances_procedure.csv", index=False)
    final_cond_importances.to_csv(
        "final_avg_importances_condition.csv", index=False)
    final_times.to_csv("final_execution_times.csv", index=False)

    print("\nFinal averaged procedure feature importances saved to 'final_avg_importances_procedure.csv'")
    print("Final averaged condition feature importances saved to 'final_avg_importances_condition.csv'")
    print("Final execution times saved to 'final_execution_times.csv'")


if __name__ == "__main__":
    main()
