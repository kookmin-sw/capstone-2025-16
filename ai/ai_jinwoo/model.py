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

# --- PSM 관련 함수 --- #

def calculate_propensity_scores(df_target, df_comparator, feature_cols):
    df_full = pd.concat([df_target[feature_cols], df_comparator[feature_cols]]).reset_index(drop=True)
    y_target = np.ones(len(df_target))
    y_comparator = np.zeros(len(df_comparator))
    y_full = np.concatenate([y_target, y_comparator])
    
    model = LogisticRegression(solver='liblinear')
    model.fit(df_full, y_full)
    
    propensity_scores = model.predict_proba(df_full)[:, 1]
    # target 군과 comparator 군의 propensity score 분리
    target_scores = propensity_scores[:len(df_target)]
    comp_scores = propensity_scores[len(df_target):]
    return target_scores, comp_scores

def match_patients(df_target, df_comparator, target_scores, comp_scores, k=1):
    nn = NearestNeighbors(n_neighbors=k, algorithm='ball_tree')
    nn.fit(comp_scores.reshape(-1, 1))
    distances, indices = nn.kneighbors(target_scores.reshape(-1, 1))
    matched_comparator = df_comparator.iloc[indices.flatten()]
    return matched_comparator

def prepare_psm_features(df_target, df_comparator, normalize=True):
    feature_cols = ['age', 'gender']
    print("start psm")
    target_scores, comp_scores = calculate_propensity_scores(df_target, df_comparator, feature_cols)
    print("match patients start")
    matched_comparator = match_patients(df_target, df_comparator, target_scores, comp_scores, k=1)
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

# --- Feature 전처리 함수 --- #

def prepare_features(df_target: pd.DataFrame, df_comparator: pd.DataFrame, cols_to_drop: list, normalize: bool = True) -> pd.DataFrame:
    df_full = pd.concat([df_target, df_comparator]).reset_index(drop=True)
    df_full = df_full.drop(columns=[col for col in ['age', 'gender'] if col in df_full.columns])
    
    # procedure_ids와 condition_ids 컬럼이 없으면 빈 리스트로 초기화
    if "procedure_ids" not in df_full.columns:
        df_full["procedure_ids"] = [[] for _ in range(len(df_full))]
    if "condition_ids" not in df_full.columns:
        df_full["condition_ids"] = [[] for _ in range(len(df_full))]
    
    # One-Hot Encoding 처리
    procedure_df = process_ohe_dictvectorizer(df_full, "procedure_ids", normalize=normalize)
    condition_df = process_ohe_dictvectorizer(df_full, "condition_ids", normalize=normalize)

    # 기본 정보: person_id와 label만 남김
    df_final = df_full[['person_id', 'label']].drop_duplicates().set_index("person_id")
    
    print("merge")
    df_final = df_final.merge(procedure_df, how="left", left_index=True, right_index=True)
    df_final = df_final.merge(condition_df, how="left", left_index=True, right_index=True)
    
    # cols_to_drop에 명시된 컬럼 제거
    df_final = df_final.drop(columns=[col for col in cols_to_drop if col in df_final.columns])
    
    # 결측값 채우고, int 타입으로 변환c
    df_final = df_final.fillna(0).astype(int)
    return df_final

def prepare_two_features(df_target: pd.DataFrame, df_comparator: pd.DataFrame, cols_to_drop: list, normalize: bool = True) -> tuple:
    df_full = pd.concat([df_target, df_comparator]).reset_index(drop=True)
    df_full = df_full.drop(columns=[col for col in ['age', 'gender'] if col in df_full.columns])
    if "procedure_ids" not in df_full.columns:
        df_full["procedure_ids"] = [[] for _ in range(len(df_full))]
    if "condition_ids" not in df_full.columns:
        df_full["condition_ids"] = [[] for _ in range(len(df_full))]
    
    procedure_df = process_ohe_dictvectorizer(df_full, "procedure_ids", normalize=normalize)
    condition_df = process_ohe_dictvectorizer(df_full, "condition_ids", normalize=normalize)
    
    df_final = df_full[['person_id', 'label']].drop_duplicates().set_index("person_id")
    
    df_procedure = df_final.merge(procedure_df, how="left", left_index=True, right_index=True)
    df_condition = df_final.merge(condition_df, how="left", left_index=True, right_index=True)
    
    # 불필요한 컬럼 제거
    df_procedure = df_procedure.drop(columns=[col for col in cols_to_drop if col in df_procedure.columns])
    df_condition = df_condition.drop(columns=[col for col in cols_to_drop if col in df_condition.columns])
    print(df_procedure.head())
    print(df_condition.head())
    # 결측값 채우고, int 타입으로 변환
    df_procedure = df_procedure.fillna(0).astype(int)
    df_condition = df_condition.fillna(0).astype(int)
    
    return df_procedure, df_condition



def train_model(X, y):
    model = XGBClassifier(n_estimators=100, learning_rate=0.05, max_depth=6, random_state=42)
    model.fit(X, y)
    return model

def iterative_shap_train(model, X_train, y_train, X_val, y_val,
                           initial_ratio=0.1, ratio_increment=0.2, improvement_threshold=0.01, max_iter=3):
    best_results = evaluate_model(model, X_val, y_val)
    best_features = X_train.columns.tolist()
    best_model = model
    iteration = 0
    current_ratio = initial_ratio
    print("Initial f1:", best_results["f1"])
    
    while iteration < max_iter:
        print(f"\n--- SHAP Iteration {iteration+1} ---")
        print(f"Using top {current_ratio*100:.0f}% features")
        explainer = shap.TreeExplainer(best_model)
        shap_values = explainer.shap_values(X_train)
        if isinstance(shap_values, list):
            shap_values = shap_values[1]
        mean_shap = np.abs(shap_values).mean(axis=0)
        feature_importance = pd.DataFrame({
            'feature': X_train.columns,
            'mean_shap': mean_shap
        }).sort_values(by='mean_shap', ascending=False)
        
        num_top_features = int(len(feature_importance) * current_ratio)
        top_features = feature_importance['feature'].iloc[:num_top_features].tolist()
        print(f"Selected top {num_top_features} features")
        
        model_top = XGBClassifier(n_estimators=100, learning_rate=0.05, max_depth=6, random_state=42)
        model_top.fit(X_train[top_features], y_train)
        new_results = evaluate_model(model_top, X_val[top_features], y_val)
        print("New model f1:", new_results["f1"])
        
        if new_results["f1"] - best_results["f1"] >= improvement_threshold:
            print(f"f1 improved by {new_results['f1'] - best_results['f1']:.4f}, updating model and features.")
            best_results = new_results
            best_features = top_features
            best_model = model_top
            X_train = X_train[top_features]
            X_val = X_val[top_features]
        else:
            print(f"No significant f1 improvement ({new_results['f1'] - best_results['f1']:.4f}). Stopping SHAP iterations.")
            break
        
        current_ratio = min(current_ratio + ratio_increment, 1.0)
        iteration += 1

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
    shap.summary_plot(shap_values, X_train)

def predict_cohort_probability(model, X_new):
    probabilities = model.predict_proba(X_new)[:, 1]
    return probabilities
