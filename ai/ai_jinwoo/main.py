# run.py

import sys
import pandas as pd
from db import get_target_cohort, get_comparator_cohort, get_drop_id
from model import prepare_features, prepare_two_features, train_model, iterative_shap_train, shap_visualization, predict_cohort_probability, prepare_psm_features
from validation import cross_validate_model, evaluate_model
from sklearn.model_selection import train_test_split, StratifiedKFold
import numpy as np
import matplotlib.pyplot as plt
import shap
import time
def compare_comparator(df_comparator_previous, df_comparator_current):
    # 이전 epoch의 df_comparator와 현재 epoch의 df_comparator에서 다른 patient_id를 찾기
    previous_ids = set(df_comparator_previous['person_id'])
    current_ids = set(df_comparator_current['person_id'])
    
    # 차집합으로 달라진 환자 수 확인
    new_patients = current_ids - previous_ids  # 새로 뽑힌 환자
    removed_patients = previous_ids - current_ids  # 제외된 환자

    print(f"New patients in current epoch: {len(new_patients)}")
    print(f"Removed patients from previous epoch: {len(removed_patients)}")

    return len(new_patients), len(removed_patients)
def check_target_comparator_overlap(df_target, df_comparator):
    """
    Target 과 comparator 사이에 같은 사람(person_id)이 섞여 있는지 확인
    """
    dup_ids = set(df_target["person_id"]).intersection(df_comparator["person_id"])
    if dup_ids:
        print(f"⚠️  Target-Comparator 중복 환자 {len(dup_ids)}명 → 데이터 누출 위험!")
        print(list(dup_ids)[:10], "...")
    else:
        print("✔️  Target 과 Comparator 에 중복 person_id 없음")
def main(cohort_id = "0196815f-1e2d-7db9-b630-a747f8393a2d"):
    start_time = time.time()
    df_target = get_target_cohort(cohort_id)
    print("Target size:", len(df_target))
    
    # PSM을 통한 comparator 생성(필요하면 아래 함수 사용)
    # df_comparator = prepare_psm_features(df_target, get_comparator_cohort(base_query), normalize=True)
    # 만약 PSM을 적용하지 않고 기본 comparator를 사용할 경우:
    # df_comparator = prepare_psm_features(df_target, get_comparator_cohort(base_query), normalize=True)
    procedure_importances_all_runs = []
    condition_importances_all_runs = []
    cols_to_drop = get_drop_id(cohort_id)
    df_comparator_origin = get_comparator_cohort(cohort_id)
    run_importances_list = []
    df_comparator = prepare_psm_features(df_target, df_comparator_origin, normalize=True)
    run_times_list = []
    procedure_importances_all_runs = []
    condition_importances_all_runs = []
    epochs = 50
    for run in range(1):
        procedure_importances_list = []
        condition_importances_list = []
        # df_comparator_previous = None
        for i in range(epochs):

            df_procedure, df_condition = prepare_two_features(df_target, df_comparator, cols_to_drop)
            
            X_procedure = df_procedure.drop(columns=["label"])
            y_proc = df_procedure["label"]
            X_train, X_test, y_train, y_test = train_test_split(X_procedure, y_proc, test_size=0.3, stratify=y_proc)
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
        def make_cumulative_avg(importances_list):
            cum_avgs = []
            for j in range(len(importances_list)):
                cum_df = pd.concat(importances_list[:j+1], ignore_index=True)
                avg = cum_df.groupby('feature')['importance'].mean()
                cum_avgs.append(avg)
            return pd.DataFrame(cum_avgs).fillna(0)

        cum_avg_proc_df = make_cumulative_avg(procedure_importances_list)
        cum_avg_cond_df = make_cumulative_avg(condition_importances_list)

        top5_proc = cum_avg_proc_df.iloc[-1].sort_values(ascending=False).head(10).index.tolist()
        top5_cond = cum_avg_cond_df.iloc[-1].sort_values(ascending=False).head(10).index.tolist()

        epochs_range = range(1, epochs+1)

        plt.figure(figsize=(12, 5))
        # Procedure
        plt.subplot(1, 2, 1)
        for feat in top5_proc:
            plt.plot(epochs_range, cum_avg_proc_df[feat], label=str(feat))
        plt.title("Procedure Features\nCumulative Avg SHAP Importance")
        plt.xlabel("Epoch")
        plt.ylabel("Avg Importance")
        plt.legend()

        # Condition
        plt.subplot(1, 2, 2)
        for feat in top5_cond:
            plt.plot(epochs_range, cum_avg_cond_df[feat], label=str(feat))
        plt.title("Condition Features\nCumulative Avg SHAP Importance")
        plt.xlabel("Epoch")
        plt.ylabel("Avg Importance")
        plt.legend()

        plt.tight_layout()
        plt.savefig(f"./feature importance graph_{run}", dpi=300)

        plt.show()
        
          
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

    final_proc_importances.to_csv(f"final_avg_importances_procedure_test.csv", index=False)
    final_cond_importances.to_csv(f"final_avg_importances_condition_test.csv", index=False)
    final_times.to_csv(f"final_execution_times_test.csv", index=False)

    print("\nFinal averaged procedure feature importances saved to 'final_avg_importances_procedure.csv'")
    print("Final averaged condition feature importances saved to 'final_avg_importances_condition.csv'")
    print("Final execution times saved to 'final_execution_times.csv'")
    end_time = time.time()
    execution_time = end_time - start_time
    print(f"{execution_time:.2f} seconds")
    
if __name__ == "__main__":
    main()
