# run.py

import sys
import pandas as pd
from db import get_target_cohort, get_comparator_cohort
from model import prepare_features, prepare_two_features, train_model, iterative_shap_train, shap_visualization, predict_cohort_probability, prepare_psm_features
from validation import cross_validate_model, evaluate_model
from sklearn.model_selection import train_test_split, StratifiedKFold
import numpy as np
import matplotlib.pyplot as plt
import shap
import time

def main():
    base_query = """
    WITH
        sepsis_patients AS (
            SELECT DISTINCT p.person_id AS pid
            FROM person AS p
            JOIN visit_occurrence AS v ON p.person_id = v.person_id
            JOIN condition_occurrence AS c ON p.person_id = c.person_id
                AND v.visit_occurrence_id = c.visit_occurrence_id
            WHERE (toYear(v.visit_start_date) - p.year_of_birth) >= -168
              AND v.visit_start_date >= toDate('2116-06-01') 
              AND v.visit_start_date < toDate('2123-04-01')
              AND c.condition_concept_id IN (
                  SELECT descendant_concept_id
                  FROM concept_ancestor
                  WHERE ancestor_concept_id = 132797
              )
        ),
        eligible_patients AS (
            SELECT pid AS person_id FROM sepsis_patients
        )
    """
    
    df_target = get_target_cohort(base_query)
    print("Target size:", len(df_target))
    
    # PSM을 통한 comparator 생성(필요하면 아래 함수 사용)
    # df_comparator = prepare_psm_features(df_target, get_comparator_cohort(base_query), normalize=True)
    # 만약 PSM을 적용하지 않고 기본 comparator를 사용할 경우:
    # df_comparator = prepare_psm_features(df_target, get_comparator_cohort(base_query), normalize=True)
    procedure_importances_all_runs = []
    condition_importances_all_runs = []
    # cols_to_drop: 제거할 컬럼 목록
    cols_to_drop = ['37158404', '2008006', '2008007', '2008008', '2008009', '3655950', '4236139', 'descendant_id_1', 'descendant_id_2']
    
    run_importances_list = []
    run_times_list = []
    procedure_importances_all_runs = []
    condition_importances_all_runs = []
    epochs = 5  # 100 iteration per run
    for run in range(2):
        procedure_importances_list = []
        condition_importances_list = []
        start_time = time.time()

        for i in range(epochs):
            df_comparator = prepare_psm_features(df_target, get_comparator_cohort(base_query), normalize=True)
            df_procedure, df_condition = prepare_two_features(df_target, df_comparator, cols_to_drop)
            
            X_procedure = df_procedure.drop(columns=["label"])
            y_proc = df_procedure["label"]
            X_train, X_test, y_train, y_test = train_test_split(X_procedure, y_proc, test_size=0.3, random_state=i, stratify=y_proc)
            print("Model start (Procedure features)")
            model_procedure = train_model(X_train, y_train)
            print("Model Done (Procedure features)!")
            test_results_proc = evaluate_model(model_procedure, X_test, y_test)
            print(f"Iteration {i} - Test Results (Procedure features):", test_results_proc)
            
            model_top, top_features, best_results, feature_importance = iterative_shap_train(
                model_procedure, X_train, y_train, X_test, y_test, 
                initial_ratio=0.1, improvement_threshold=0.01, max_iter=3
            )
            df_importance_proc = feature_importance.rename(columns={'mean_shap': 'importance'})
            procedure_importances_list.append(df_importance_proc)
            
            X_condition = df_condition.drop(columns=["label"])
            y_cond = df_condition["label"]
            X_train, X_test, y_train, y_test = train_test_split(X_condition, y_cond, test_size=0.3, random_state=i, stratify=y_cond)
            print("Model start (Condition features)")
            model_condition = train_model(X_train, y_train)
            print("Model Done (Condition features)!")
            test_results_cond = evaluate_model(model_condition, X_test, y_test)
            print(f"Iteration {i} - Test Results (Condition features):", test_results_cond)
            
            model_top, top_features, best_results, feature_importance = iterative_shap_train(
                model_condition, X_train, y_train, X_test, y_test,
                initial_ratio=0.1, improvement_threshold=0.01, max_iter=3
            )
            df_importance_cond = feature_importance.rename(columns={'mean_shap': 'importance'})
            condition_importances_list.append(df_importance_cond)
          
        all_proc_importances = pd.concat(procedure_importances_list, ignore_index=True)
        avg_proc_importances = all_proc_importances.groupby('feature')['importance'].mean().reset_index()
        avg_proc_importances = avg_proc_importances.sort_values(by='importance', ascending=False)
        
        all_cond_importances = pd.concat(condition_importances_list, ignore_index=True)
        avg_cond_importances = all_cond_importances.groupby('feature')['importance'].mean().reset_index()
        avg_cond_importances = avg_cond_importances.sort_values(by='importance', ascending=False)
        
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
        run_times_list.append(pd.DataFrame({"run": [run+1], "execution_time": [execution_time]}))

    final_proc_importances = pd.concat(procedure_importances_all_runs, ignore_index=True)
    final_cond_importances = pd.concat(condition_importances_all_runs, ignore_index=True)
    final_times = pd.concat(run_times_list, ignore_index=True)

    final_proc_importances.to_csv("final_avg_importances_procedure.csv", index=False)
    final_cond_importances.to_csv("final_avg_importances_condition.csv", index=False)
    final_times.to_csv("final_execution_times.csv", index=False)

    print("\nFinal averaged procedure feature importances saved to 'final_avg_importances_procedure.csv'")
    print("Final averaged condition feature importances saved to 'final_avg_importances_condition.csv'")
    print("Final execution times saved to 'final_execution_times.csv'")
    # for run in range(2):  # 총 2회 run (예시)
    #     importances_list = []
    #     start_time = time.time()
        
    #     for i in range(epochs):
    #         # 각 iteration마다 comparator 매칭 (여기서 선택은 동일한 방법 또는 PSM 적용)
    #         # 예시: df_comparator을 그대로 사용하는 경우
    #         df_final = prepare_features(df_target, df_comparator, cols_to_drop)
            
    #         X = df_final.drop(columns=["label"])
    #         y = df_final["label"]
            
    #         X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=i)
    #         print("Model start")
    #         model = train_model(X_train, y_train)
    #         print("Model Done!")
    #         test_results = evaluate_model(model, X_test, y_test)
    #         print(f"Iteration {i} - Test Results:", test_results)
            
    #         model_top, top_features, best_results, feature_importance = iterative_shap_train(
    #             model, X_train, y_train, X_test, y_test, initial_ratio=0.1, improvement_threshold=0.01, max_iter=3
    #         )
    #         df_importance = feature_importance.rename(columns={'mean_shap': 'importance'})
    #         print(df_importance.head())
    #         importances_list.append(df_importance)
          
    #     all_importances = pd.concat(importances_list, ignore_index=True)
    #     avg_importances = all_importances.groupby('feature')['importance'].mean().reset_index()
    #     avg_importances = avg_importances.sort_values(by='importance', ascending=False)
        
    #     end_time = time.time()
    #     execution_time = end_time - start_time
        
    #     print(f"\n=== Run {run+1} Summary ===")
    #     print("Top 5 Averaged SHAP Feature Importances:")
    #     print(avg_importances.head(5))
    #     print(f"Execution Time for Run {run+1}: {execution_time:.2f} seconds")
        
    #     avg_importances["run"] = run + 1
    #     avg_importances["execution_time"] = execution_time
        
    #     run_importances_list.append(avg_importances)
    #     run_times_list.append(pd.DataFrame({"run": [run+1], "execution_time": [execution_time]}))

    # final_importances = pd.concat(run_importances_list, ignore_index=True)
    # final_times = pd.concat(run_times_list, ignore_index=True)

    # final_importances.to_csv("final_avg_importances_chronic_psm.csv", index=False)
    # final_times.to_csv("final_execution_times_chronic_psm.csv", index=False)

    # print("\nFinal averaged feature importances saved to 'final_avg_importances_chronic_psm.csv'")
    # print("Final execution times saved to 'final_execution_times_chronic_psm.csv'")
    
if __name__ == "__main__":
    main()
