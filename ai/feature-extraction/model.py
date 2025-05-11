import pandas as pd
import numpy as np
from sklearn.feature_extraction import DictVectorizer
from sklearn.preprocessing import Normalizer
from xgboost import XGBClassifier
import shap
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import NearestNeighbors
from validation import evaluate_model, cross_validate_model

try:
    import torch
    USE_GPU = torch.cuda.is_available()
except ImportError:
    USE_GPU = False

XGB_COMMON_PARAMS = {
    "n_estimators": 100,
    "learning_rate": 0.05,
    "max_depth": 6,
    "random_state": 42,
    "tree_method": "gpu_hist" if USE_GPU else "hist",
    "predictor":  "gpu_predictor" if USE_GPU else "cpu_predictor",
}


def calculate_propensity_scores(df_target, df_comparator, feature_cols):
    df_full = pd.concat(
        [df_target[feature_cols], df_comparator[feature_cols]]).reset_index(drop=True)
    df_full['age'].fillna(df_full['age'].median(), inplace=True)
    df_full['gender'].fillna(df_full['gender'].mode()[0], inplace=True)
    y_target = np.ones(len(df_target))
    y_comparator = np.zeros(len(df_comparator))
    y_full = np.concatenate([y_target, y_comparator])

    model = LogisticRegression(solver='liblinear')
    model.fit(df_full, y_full)

    propensity_scores = model.predict_proba(df_full)[:, 1]
    return propensity_scores[:len(df_target)], propensity_scores[len(df_target):]


def match_patients(df_target, df_comparator, target_scores, comp_scores, k=1):
    nn = NearestNeighbors(n_neighbors=k, algorithm='ball_tree')
    nn.fit(comp_scores.reshape(-1, 1))
    distances, indices = nn.kneighbors(target_scores.reshape(-1, 1))
    return df_comparator.iloc[indices.flatten()]


def prepare_psm_features(df_target, df_comparator, k=30, normalize=True):
    feature_cols = ['age', 'gender']
    print("start psm")
    target_scores, comp_scores = calculate_propensity_scores(
        df_target, df_comparator, feature_cols)
    print("match patients start")
    return match_patients(df_target, df_comparator, target_scores, comp_scores, k=k)


def process_ohe_dictvectorizer(df: pd.DataFrame, column_name: str, normalize: bool = False) -> pd.DataFrame:
    vec = DictVectorizer(sparse=True)
    ohe_matrix = vec.fit_transform(
        df[column_name].apply(lambda x: {val: x.count(
            val) for val in set(x)} if isinstance(x, list) else {})
    )
    if normalize:
        ohe_matrix = Normalizer(norm='l2').fit_transform(ohe_matrix)
    return pd.DataFrame.sparse.from_spmatrix(
        ohe_matrix, index=df["person_id"], columns=vec.get_feature_names_out()
    )


def prepare_features(df_target: pd.DataFrame, df_comparator: pd.DataFrame, cols_to_drop: list, normalize: bool = True) -> pd.DataFrame:
    df_full = pd.concat([df_target, df_comparator]).reset_index(drop=True)
    df_full = df_full.drop(
        columns=[c for c in ['age', 'gender'] if c in df_full.columns])

    for col in ("procedure_ids", "condition_ids"):
        if col not in df_full.columns:
            df_full[col] = [[] for _ in range(len(df_full))]

    proc_df = process_ohe_dictvectorizer(df_full, "procedure_ids", normalize)
    cond_df = process_ohe_dictvectorizer(df_full, "condition_ids", normalize)

    df_final = (
        df_full[['person_id', 'label']]
        .drop_duplicates()
        .set_index("person_id")
        .join(proc_df,   how="left")
        .join(cond_df,   how="left")
        .fillna(0)
        .astype(float)
    ).drop(columns=[c for c in cols_to_drop if c in df_final.columns])

    feature_cols = df_final.columns.drop("label")
    if len(feature_cols) > 30000:
        counts = (df_final[feature_cols] != 0).sum()
        to_drop = counts.sort_values().index[: len(counts) - 30000]
        df_final = df_final.drop(columns=to_drop)

    return df_final


def prepare_two_features(df_target: pd.DataFrame, df_comparator: pd.DataFrame, cols_to_drop: list, normalize: bool = True) -> tuple:
    common = set(df_target['person_id']) & set(df_comparator['person_id'])
    if common:
        raise ValueError(f"중복 환자 발견: {list(common)[:5]}... (총 {len(common)}명)")
    df_full = pd.concat([df_target, df_comparator]).reset_index(drop=True)
    df_full = df_full.drop(
        columns=[c for c in ['age', 'gender'] if c in df_full.columns])

    for col in ("procedure_ids", "condition_ids"):
        if col not in df_full.columns:
            df_full[col] = [[] for _ in range(len(df_full))]

    proc_df = process_ohe_dictvectorizer(df_full, "procedure_ids", normalize)
    cond_df = process_ohe_dictvectorizer(df_full, "condition_ids", normalize)

    df_idx = df_full[['person_id', 'label']
                     ].drop_duplicates().set_index("person_id")
    df_proc = df_idx.join(proc_df, how="left").fillna(0).astype(float)
    df_cond = df_idx.join(cond_df, how="left").fillna(0).astype(float)

    for df_part in (df_proc, df_cond):
        to_drop = [c for c in cols_to_drop if c in df_part.columns]
        df_part.drop(columns=to_drop, inplace=True)
        feats = df_part.columns.drop("label")
        if len(feats) > 30000:
            counts = (df_part[feats] == 1).sum()
            dropn = counts.sort_values().index[: len(counts) - 30000]
            df_part.drop(columns=dropn, inplace=True)

    return df_proc, df_cond


def train_model(X, y):
    model = XGBClassifier(**XGB_COMMON_PARAMS)
    model.fit(X, y)
    return model


def iterative_shap_train(model, X_train, y_train, X_val, y_val,
                         initial_ratio=0.1, ratio_increment=0.2,
                         improvement_threshold=0.01, max_iter=3):

    best_results  = cross_validate_model(model, X_val, y_val)
    best_features = X_train.columns.tolist()
    best_model    = model
    iteration     = 0
    current_ratio = initial_ratio
    while iteration < max_iter:
        explainer = shap.TreeExplainer(best_model)
        shap_vals = explainer.shap_values(X_train)
        if isinstance(shap_vals, list):
            shap_vals = shap_vals[1]

        abs_vals   = np.abs(shap_vals)
        total_abs  = abs_vals.sum(axis=1, keepdims=True)
        total_abs[total_abs == 0] = 1
        rel_pct    = abs_vals / total_abs * 100
        mean_pct   = rel_pct.mean(axis=0)

        fi = (
            pd.DataFrame({"feature": X_train.columns, "mean_pct": mean_pct})
            .sort_values("mean_pct", ascending=False)
        )

        top_n = int(len(fi) * current_ratio)
        top_features = fi["feature"].iloc[:top_n].tolist()

        model_top = XGBClassifier(**XGB_COMMON_PARAMS)
        model_top.fit(X_train[top_features], y_train)

        new_results = cross_validate_model(model_top, X_val[top_features], y_val)
        if new_results["f1"] - best_results["f1"] >= improvement_threshold:
            best_results, best_features, best_model = new_results, top_features, model_top
            X_train = X_train[top_features]
            X_val   = X_val[top_features]
        else:
            break

        current_ratio = min(current_ratio + ratio_increment, 1.0)
        iteration += 1
        
    return best_model, best_features, best_results["f1"], fi


def predict_cohort_probability(model, X_new):
    return model.predict_proba(X_new)[:, 1]
