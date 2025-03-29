import sys
import pandas as pd
from db import get_target_cohort, get_comparator_cohort
from model import prepare_features, train_model, iterative_shap_train, shap_visualization, predict_cohort_probability
from validation import cross_validate_model, evaluate_model
from sklearn.model_selection import train_test_split, StratifiedKFold
import numpy as np
import matplotlib.pyplot as plt


# gender,age 추가.
def main():
    base_query = """
    WITH
        all_patients AS (
          SELECT DISTINCT 
                 p.person_id,
                 p.year_of_birth,
                 v.visit_occurrence_id,
                 v.visit_start_date,
                 v.visit_end_date
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

    df_target = get_target_cohort(base_query)
    epochs = 100
    feature_result = 0
    for _ in range(epochs):
      df_comparator = get_comparator_cohort(base_query)
      
      cols_to_drop = ['373995', 'descendant_id_1', 'descendant_id_2']  
      
      df_final = prepare_features(df_target, df_comparator, cols_to_drop)
      
      X = df_final.drop(columns=["label"])
      y = df_final["label"]
      
      X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
      
      model = train_model(X_train, y_train)
      
      test_results = evaluate_model(model, X_test, y_test)
      print("Test Results:", test_results)
      
      cv_results = cross_validate_model(model, X, y, cv_splits=5)
      print("Cross-Validation Results:", cv_results)

      print("\n--- SHAP Visualization ---")
      shap_visualization(model, X_train)
      
      print("\n--- Iterative SHAP-based Training ---")
      model_top, top_features, best_results = iterative_shap_train(
          model, X_train, y_train, X_test, y_test, initial_ratio=0.1, improvement_threshold=0.01, max_iter=3
      )
      print("Final Top Features:", len(top_features))
      print("Final Model Performance:", best_results)
      X_test_top = X_test[top_features]
      probabilities = predict_cohort_probability(model_top, X_test_top)
      
      for pid, prob in zip(X_test_top.index, probabilities):
          print(f"Patient {pid} - Cohort Probability: {prob:.4f}")
    
    
if __name__ == "__main__":
    main()

