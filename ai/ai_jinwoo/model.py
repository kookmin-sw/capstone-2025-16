# model.py

import pandas as pd
import numpy as np
from sklearn.feature_extraction import DictVectorizer
from sklearn.preprocessing import Normalizer
from xgboost import XGBClassifier
import shap
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import NearestNeighbors

from validation import cross_validate_model, evaluate_model


def calculate_propensity_scores(df_target, df_comparator, feature_cols):
    df_full = pd.concat([df_target[feature_cols], df_comparator[feature_cols]]).reset_index(drop=True)
    df_full['age'].fillna(df_full['age'].median(), inplace=True)
    df_full['gender'].fillna(df_full['gender'].mode()[0], inplace=True)
    y_target = np.ones(len(df_target))
    y_comparator = np.zeros(len(df_comparator))
    y_full = np.concatenate([y_target, y_comparator])
    
    model = LogisticRegression(solver='liblinear')
    model.fit(df_full, y_full)
    
    propensity_scores = model.predict_proba(df_full)[:, 1]
    target_scores = propensity_scores[:len(df_target)]
    comp_scores = propensity_scores[len(df_target):]
    return target_scores, comp_scores

def match_patients(df_target, df_comparator, target_scores, comp_scores, k=1):
    nn = NearestNeighbors(n_neighbors=k, algorithm='ball_tree')
    nn.fit(comp_scores.reshape(-1, 1))
    distances, indices = nn.kneighbors(target_scores.reshape(-1, 1))
    matched_comparator = df_comparator.iloc[indices.flatten()]
    return matched_comparator

def prepare_psm_features(df_target, df_comparator,k=30, normalize=True):
    feature_cols = ['age', 'gender']
    print("start psm")
    target_scores, comp_scores = calculate_propensity_scores(df_target, df_comparator, feature_cols)
    print("match patients start")
    matched_comparator = match_patients(df_target, df_comparator, target_scores, comp_scores, k=k)
    return matched_comparator


def process_ohe_dictvectorizer(df: pd.DataFrame, column_name: str, normalize: bool = False) -> pd.DataFrame:
    vec = DictVectorizer(sparse=True)
    ohe_matrix = vec.fit_transform(
        df[column_name].apply(lambda x: {val: x.count(val) for val in set(x)} if isinstance(x, list) else {})
    )
    if normalize:
        normalizer = Normalizer(norm='l2')
        ohe_matrix = normalizer.fit_transform(ohe_matrix)
    ohe_df = pd.DataFrame.sparse.from_spmatrix(ohe_matrix, index=df["person_id"], columns=vec.get_feature_names_out())
    return ohe_df

def prepare_features(df_target: pd.DataFrame, df_comparator: pd.DataFrame, cols_to_drop: list, normalize: bool = True) -> pd.DataFrame:
    df_full = pd.concat([df_target, df_comparator]).reset_index(drop=True)
    df_full = df_full.drop(columns=[col for col in ['age', 'gender'] if col in df_full.columns])

    if "procedure_ids" not in df_full.columns:
        df_full["procedure_ids"] = [[] for _ in range(len(df_full))]
    if "condition_ids" not in df_full.columns:
        df_full["condition_ids"] = [[] for _ in range(len(df_full))]
    procedure_df = process_ohe_dictvectorizer(df_full, "procedure_ids", normalize=normalize)
    condition_df = process_ohe_dictvectorizer(df_full, "condition_ids", normalize=normalize)

    df_final = df_full[['person_id', 'label']].drop_duplicates().set_index("person_id")
    df_final = df_final.join(procedure_df, how="left").join(condition_df, how="left").fillna(0).astype(float)
    # df_final = df_final.astype({'age': 'int32', 'gender': 'int32'})  

    df_final = df_final.drop(columns=[col for col in cols_to_drop if col in df_final.columns])
    feature_cols = df_final.drop(columns=["label"]).columns
    if len(feature_cols) > 30000:
        feature_counts = (df_final[feature_cols] != 0).sum()
        sorted_features = feature_counts.sort_values(ascending=True)
        num_to_drop = len(sorted_features) - 30000
        features_to_drop = sorted_features.index[:num_to_drop].tolist()
        df_final = df_final.drop(columns=features_to_drop)

    return df_final

def prepare_two_features(df_target: pd.DataFrame, df_comparator: pd.DataFrame, cols_to_drop: list, normalize: bool = True) -> tuple:
    common_ids = set(df_target['person_id']).intersection(set(df_comparator['person_id']))
    if common_ids:
        raise ValueError(f"중복 환자 발견: {list(common_ids)[:5]}... (총 {len(common_ids)}명)")
    df_full = pd.concat([df_target, df_comparator]).reset_index(drop=True)
    df_full = df_full.drop(columns=[col for col in ['age', 'gender'] if col in df_full.columns])

    if "procedure_ids" not in df_full.columns:
        df_full["procedure_ids"] = [[] for _ in range(len(df_full))]
    if "condition_ids" not in df_full.columns:
        df_full["condition_ids"] = [[] for _ in range(len(df_full))]

    procedure_df = process_ohe_dictvectorizer(df_full, "procedure_ids", normalize=normalize)
    condition_df = process_ohe_dictvectorizer(df_full, "condition_ids", normalize=normalize)

    df_final = df_full[['person_id', 'label']].drop_duplicates().set_index("person_id")
    
    df_procedure = df_final.join(procedure_df, how="left").fillna(0).astype(float)
    df_condition = df_final.join(condition_df, how="left").fillna(0).astype(float)
    
    df_procedure = df_procedure.drop(columns=[col for col in cols_to_drop if col in df_procedure.columns])
    df_condition = df_condition.drop(columns=[col for col in cols_to_drop if col in df_condition.columns])

    feature_cols_procedure = df_procedure.drop(columns=["label"]).columns
    feature_cols_condition = df_condition.drop(columns=["label"]).columns
    
    if len(feature_cols_procedure) > 30000:
        feature_counts = (df_procedure[feature_cols_procedure] == 1).sum()
        sorted_features = feature_counts.sort_values(ascending=True)
        num_to_drop = len(sorted_features) - 30000
        features_to_drop = sorted_features.index[:num_to_drop].tolist()
        df_procedure = df_procedure.drop(columns=features_to_drop)

    if len(feature_cols_condition) > 30000:
        feature_counts = (df_condition[feature_cols_condition] == 1).sum()
        sorted_features = feature_counts.sort_values(ascending=True)
        num_to_drop = len(sorted_features) - 30000
        features_to_drop = sorted_features.index[:num_to_drop].tolist()
        df_condition = df_condition.drop(columns=features_to_drop)

    return df_procedure, df_condition
def train_model(X, y):
    model = XGBClassifier(n_estimators=100, learning_rate=0.05, max_depth=6, random_state=42)
    model.fit(X, y)
    return model

def iterative_shap_train(model, X_train, y_train, X_val, y_val,
                         initial_ratio=0.1, ratio_increment=0.2,
                         improvement_threshold=0.01, max_iter=3):

    best_results  = evaluate_model(model, X_val, y_val)
    best_features = X_train.columns.tolist()
    best_model    = model
    iteration     = 0
    current_ratio = initial_ratio
    print("Initial f1:", best_results["f1"])

    while iteration < max_iter:
        print(f"\n--- SHAP Iteration {iteration+1} ---")
        print(f"Using top {current_ratio*100:.0f}% features")

        explainer = shap.TreeExplainer(best_model)
        shap_vals   = explainer.shap_values(X_train)
        if isinstance(shap_vals, list):        
            shap_vals = shap_vals[1]

        abs_vals       = np.abs(shap_vals)      
        sum_abs        = abs_vals.sum(axis=1, keepdims=True) 
        sum_abs[sum_abs == 0] = 1                            
        rel_pct_vals   = abs_vals / sum_abs * 100            
        mean_rel_pct   = rel_pct_vals.mean(axis=0)           

        feature_importance = (
            pd.DataFrame({"feature": X_train.columns,
                          "mean_pct": mean_rel_pct})         
              .sort_values("mean_pct", ascending=False)
        )

        num_top_features = int(len(feature_importance) * current_ratio)
        top_features     = feature_importance["feature"].iloc[:num_top_features].tolist()
        print(f"Selected top {num_top_features} features")

        model_top = XGBClassifier(
            n_estimators=100, learning_rate=0.05,
            max_depth=6, random_state=42
        )
        model_top.fit(X_train[top_features], y_train)
        new_results = evaluate_model(model_top, X_val[top_features], y_val)
        print("New model f1:", new_results["f1"])

        if new_results["f1"] - best_results["f1"] >= improvement_threshold:
            print(f"f1 improved by {new_results['f1'] - best_results['f1']:.4f} → update.")
            best_results, best_features, best_model = new_results, top_features, model_top
            X_train, X_val = X_train[top_features], X_val[top_features]
        else:
            print("No significant improvement → stop.")
            break

        current_ratio = min(current_ratio + ratio_increment, 1.0)
        iteration    += 1
    return best_model, best_features, best_results, feature_importance


def shap_visualization(model, X_train):
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_train)
    if isinstance(shap_values, list):
        shap_values = shap_values[1]
    mean_shap = np.abs(shap_values).mean(axis=0)
    feature_importance = pd.DataFrame({
        'feature': X_train.columns,
        'mean_shap': mean_shap
    }).sort_values(by='mean_shap', ascending=False)
    
    print("SHAP 기반 Feature Importance:")
    print(feature_importance)

def predict_cohort_probability(model, X_new):
    probabilities = model.predict_proba(X_new)[:, 1]
    return probabilities



