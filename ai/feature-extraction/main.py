import pandas as pd
from db import get_target_cohort, get_comparator_cohort, get_drop_id, insert_feature_extraction_data, db_cohort_drop
from model import prepare_two_features, train_model, iterative_shap_train, prepare_psm_features
from validation import evaluate_model
from sklearn.model_selection import train_test_split
import time


def main(cohort_id="0196815f-1e2d-7db9-b630-a747f8393a2d", k=30):
    db_cohort_drop(cohort_id)
    start_time = time.time()
    df_target = get_target_cohort(cohort_id)
    print("Target size:", len(df_target))

    procedure_importances_all_runs = []
    condition_importances_all_runs = []
    cols_to_drop = get_drop_id(cohort_id)
    df_comparator_origin = get_comparator_cohort(cohort_id)
    df_comparator = prepare_psm_features(
        df_target, df_comparator_origin, k=k, normalize=True)
    procedure_importances_all_runs = []
    condition_importances_all_runs = []
    epochs = 100
    procedure_importances_list = []
    condition_importances_list = []
    for i in range(epochs):

        df_procedure, df_condition = prepare_two_features(
            df_target, df_comparator, cols_to_drop)

        X_procedure = df_procedure.drop(columns=["label"])
        y_proc = df_procedure["label"]
        X_train, X_test, y_train, y_test = train_test_split(
            X_procedure, y_proc, test_size=0.3, stratify=y_proc)
        model_procedure = train_model(X_train, y_train)
        test_results_proc = evaluate_model(model_procedure, X_test, y_test)
        model_top, top_features, best_results, feature_importance = iterative_shap_train(
            model_procedure, X_train, y_train, X_test, y_test,
            initial_ratio=0.1, improvement_threshold=0.01, max_iter=3
        )
        df_importance_proc = feature_importance.rename(
            columns={'mean_pct': 'importance'})
        procedure_importances_list.append(df_importance_proc)

        X_condition = df_condition.drop(columns=["label"])
        y_cond = df_condition["label"]
        X_train, X_test, y_train, y_test = train_test_split(
            X_condition, y_cond, test_size=0.3, random_state=i, stratify=y_cond)
        model_condition = train_model(X_train, y_train)
        test_results_cond = evaluate_model(model_condition, X_test, y_test)

        model_top, top_features, best_results, feature_importance = iterative_shap_train(
            model_condition, X_train, y_train, X_test, y_test,
            initial_ratio=0.1, improvement_threshold=0.01, max_iter=3
        )
        df_importance_cond = feature_importance.rename(
            columns={'mean_pct': 'importance'})
        condition_importances_list.append(df_importance_cond)
    all_proc_importances = pd.concat(
        procedure_importances_list, ignore_index=True)
    print(all_proc_importances)
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

    procedure_importances_all_runs.append(avg_proc_importances)
    condition_importances_all_runs.append(avg_cond_importances)

    final_proc_importances = pd.concat(
        procedure_importances_all_runs, ignore_index=True)
    final_cond_importances = pd.concat(
        condition_importances_all_runs, ignore_index=True)

    end_time = time.time()
    execution_time = end_time - start_time
    insert_feature_extraction_data(
        cohort_id, k, final_proc_importances, final_cond_importances, execution_time)


if __name__ == "__main__":
    main()
