# validation.py
import numpy as np
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.metrics import accuracy_score, roc_auc_score, f1_score

def cross_validate_model(model, X, y, cv_splits=5):
    cv = StratifiedKFold(n_splits=cv_splits, shuffle=True, random_state=42)
    scoring = {
        'accuracy': 'accuracy',
        'roc_auc': 'roc_auc',
        'f1': 'f1'
    }
    cv_results = cross_validate(model, X, y, cv=cv, scoring=scoring)
    results = {
        "accuracy": np.mean(cv_results['test_accuracy']),
        "auc": np.mean(cv_results['test_roc_auc']),
        "f1": np.mean(cv_results['test_f1'])
    }
    return results

def evaluate_model(model, X_test, y_test):
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    results = {
        "accuracy": accuracy_score(y_test, y_pred),
        "auc": roc_auc_score(y_test, y_prob),
        "f1": f1_score(y_test, y_pred)
    }
    return results