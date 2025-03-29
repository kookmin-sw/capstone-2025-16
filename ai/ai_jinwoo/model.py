# model.py
import pandas as pd
from sklearn.feature_extraction import DictVectorizer
from sklearn.preprocessing import Normalizer
from validation import cross_validate_model
from xgboost import XGBClassifier
import shap
import numpy as np
import pandas as pd

def process_ohe_dictvectorizer(df: pd.DataFrame, column_name: str, normalize: bool = False) -> pd.DataFrame:
    vec = DictVectorizer(sparse=True)
    ohe_matrix = vec.fit_transform(
        df[column_name].apply(lambda x: {val: 1 for val in x} if isinstance(x, list) else {})
    )
    if normalize:
        # L2 정규화를 적용 (각 행의 L2 노름이 1이 되도록)
        normalizer = Normalizer(norm='l2')
        ohe_matrix = normalizer.fit_transform(ohe_matrix)
    ohe_df = pd.DataFrame.sparse.from_spmatrix(ohe_matrix, index=df["person_id"], columns=vec.get_feature_names_out())
    return ohe_df

def prepare_features(df_target: pd.DataFrame, df_comparator: pd.DataFrame, cols_to_drop: list, normalize: bool = True) -> pd.DataFrame:
    df_full = pd.concat([df_target, df_comparator]).reset_index(drop=True)
    
    if "procedure_ids" not in df_full.columns:
        df_full["procedure_ids"] = [[] for _ in range(len(df_full))]
    if "condition_ids" not in df_full.columns:
        df_full["condition_ids"] = [[] for _ in range(len(df_full))]
    
    procedure_df = process_ohe_dictvectorizer(df_full, "procedure_ids", normalize=normalize)
    condition_df = process_ohe_dictvectorizer(df_full, "condition_ids", normalize=normalize)
    
    df_final = df_full[["person_id", "label"]].drop_duplicates().set_index("person_id")
    df_final = df_final.join(procedure_df, how="left").join(condition_df, how="left").fillna(0).astype(float)
    
    df_final = df_final.drop(columns=[col for col in cols_to_drop if col in df_final.columns])
    feature_cols = df_final.drop(columns=["label"]).columns
    if len(feature_cols) > 30000:
        feature_counts = (df_final[feature_cols] == 1).sum()
        sorted_features = feature_counts.sort_values(ascending=True)
        num_to_drop = len(sorted_features) - 30000
        features_to_drop = sorted_features.index[:num_to_drop].tolist()
        df_final = df_final.drop(columns=features_to_drop)
    
    return df_final



def train_model(X, y):
    model = XGBClassifier(n_estimators=100, learning_rate=0.05, max_depth=6, random_state=42)
    model.fit(X, y)
    return model


def shap_train_model(model, X_train, y_train, X_test, y_test, X, y, ratio=0.3):
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_train)
    if isinstance(shap_values, list):
        shap_values = shap_values[1]
    
    mean_shap = np.abs(shap_values).mean(axis=0)
    feature_importance = pd.DataFrame({
        'feature': X_train.columns,
        'mean_shap': mean_shap
    }).sort_values(by='mean_shap', ascending=False)
    
    num_top_features = int(len(feature_importance) * ratio)
    top_features = feature_importance['feature'].iloc[:num_top_features].tolist()
    print(f"상위 {ratio*100}% 피처:", len(top_features))
    
    X_train_top = X_train[top_features]
    X_test_top = X_test[top_features]

    return top_features, X_train_top, X_test_top
def iterative_shap_train(model, X_train, y_train, X_val, y_val,
                           initial_ratio=0.1, ratio_increment=0.2, improvement_threshold=0.01, max_iter=3):

    from xgboost import XGBClassifier
    best_results = cross_validate_model(model, X_val, y_val)
    best_features = X_train.columns.tolist()
    best_model = model
    iteration = 0
    current_ratio = initial_ratio
    print("Initial AUC:", best_results["auc"])
    
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
        new_results = cross_validate_model(model_top, X_val[top_features], y_val)
        print("New model f1:", new_results["f1"])
        
        # AUC 개선 확인
        if new_results["f1"] - best_results["f1"] >= improvement_threshold:
            print(f"AUC improved by {new_results['f1'] - best_results['f1']:.4f}, updating model and features.")
            best_results = new_results
            best_features = top_features
            best_model = model_top
            X_train = X_train[top_features]
            X_val = X_val[top_features]
        else:
            print(f"No significant AUC improvement ({new_results['f1'] - best_results['f1']:.4f}). Stopping SHAP iterations.")
            break
        
        current_ratio = min(current_ratio + ratio_increment, 1.0)
        iteration += 1

    return best_model, best_features, best_results


    return best_model, best_features, best_results
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