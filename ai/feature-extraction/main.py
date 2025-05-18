import asyncio
import json
import os
from dotenv import load_dotenv
import numpy as np
import time
from sklearn.model_selection import train_test_split
from model import prepare_two_features, train_model, iterative_shap_train, prepare_psm_features, process_boolean_mlb
from db import get_target_cohort, get_comparator_cohort, get_drop_id, insert_feature_extraction_data, db_cohort_drop
import pandas as pd
import nats
from flask import Flask, jsonify
import threading


load_dotenv()

now_running = False

# Flask app setup
app = Flask(__name__)


@app.route('/', methods=['GET'])
def get_status():
    global now_running
    if now_running:
        return jsonify({
            "status": "running",
            "cohort_id": now_running
        })
    else:
        return jsonify({
            "status": "idle",
            "cohort_id": None
        })


def start_flask():
    app.run(host='0.0.0.0', port=3001, debug=False)


async def main():
    global now_running
    nc = await nats.connect(os.getenv("NATS_URL"))
    stream_name = os.getenv("NATS_STREAM_NAME")
    subject = os.getenv("NATS_SUBJECT")
    durable_name = os.getenv("NATS_DURABLE_NAME")

    js = nc.jetstream()

    try:
        await js.stream_info(stream_name)
    except nats.js.errors.NotFoundError:
        await js.add_stream(name=stream_name, subjects=[subject])

    # ack_wait과 ack_timeout을 늘려 확인 정보가 제대로 전송될 수 있도록 함
    sub = await js.pull_subscribe(subject, durable_name)

    while True:
        try:
            [msg] = await sub.fetch(1, timeout=5)
            data = json.loads(msg.data)

            await msg.ack_sync()  # sync 방식으로 확인 정보가 서버에 전달될 때까지 대기

            print("Received message:", data)
            now_running = data["cohort_id"]
            run(data["cohort_id"], data["k"])
        except nats.errors.TimeoutError:
            pass
        except Exception as e:
            now_running = False
            print("Error:", e)


def run(cohort_id="0196815f-1e2d-7db9-b630-a747f8393a2d", k=30):
    db_cohort_drop(cohort_id)
    start_time = time.time()
    
    df_target = get_target_cohort(cohort_id)
    df_target = df_target.head(3000)
    df_comp_origin = get_comparator_cohort(cohort_id)
    cols_to_drop = get_drop_id(cohort_id)
    df_comp = prepare_psm_features(df_target, df_comp_origin, k=k, normalize=True)
    
    df_full = pd.concat([df_target, df_comp]).reset_index(drop=True).drop(
        columns=[c for c in ['age','gender'] if c in df_target.columns]
    )
    
    for col in ("procedure_ids", "condition_ids"):
        if col not in df_full.columns:
            df_full[col] = [ [] for _ in range(len(df_full)) ]
    
    X_proc_csr, proc_feats = process_boolean_mlb(df_full, "procedure_ids", normalize=True)
    X_cond_csr, cond_feats = process_boolean_mlb(df_full, "condition_ids", normalize=True)
    y_all = df_full["label"].to_numpy()
    def drop_feats(X, feats):
        keep_idx = [i for i,f in enumerate(feats) if f not in cols_to_drop]
        return X[:, keep_idx], [f for i,f in enumerate(feats) if i in keep_idx]
    
    X_proc_csr, proc_feats = drop_feats(X_proc_csr, proc_feats)
    X_cond_csr, cond_feats = drop_feats(X_cond_csr, cond_feats)
    
    epochs = 100
    proc_importances, cond_importances = [], []
    proc_f1_scores, cond_f1_scores = [], []
    
    min_epochs_before_check = 10
    max_same_top_n = 8
    n_top = 10
    
    proc_importances = []
    cond_importances = []
    proc_done = cond_done = False
    
    proc_avg_ref_set = None
    proc_avg_stable_count = 0
    
    cond_avg_ref_set = None
    cond_avg_stable_count = 0
    
    for seed in range(epochs):
        current_epoch_num = seed + 1
    
        if not proc_done:
            X_tr_proc, X_te_proc, y_tr, y_te = train_test_split(
                X_proc_csr, y_all, test_size=0.3,
                stratify=y_all, random_state=seed
            )
            m_proc = train_model(X_tr_proc, y_tr)
            _, _, best_proc, imp_proc = iterative_shap_train(
                m_proc, X_tr_proc, y_tr, X_te_proc, y_te,
                feature_names=proc_feats,
                initial_ratio=0.1,
                improvement_threshold=0.01,
                max_iter=3
            )
            proc_importances.append(
                imp_proc.rename(columns={'mean_pct':'importance'})
            )
    
            avg_proc_imp = (
                pd.concat(proc_importances)
                .groupby('feature')['importance']
                .mean()
                .reset_index()
            )
    
            if current_epoch_num > min_epochs_before_check:
                top10_avg_proc = (
                    avg_proc_imp
                    .sort_values('importance', ascending=False)
                    .head(n_top)['feature']
                    .tolist()
                )
                curr_proc_avg_set = set(top10_avg_proc)
                if proc_avg_ref_set is None:
                    proc_avg_ref_set = curr_proc_avg_set
                    proc_avg_stable_count = 1
                else:
                    if curr_proc_avg_set == proc_avg_ref_set:
                        proc_avg_stable_count += 1
                    else:
                        proc_avg_ref_set = curr_proc_avg_set
                        proc_avg_stable_count = 1
    
                if proc_avg_stable_count >= max_same_top_n:
                    proc_done = True
    
        if not cond_done:
            X_tr_cond, X_te_cond, y_tr2, y_te2 = train_test_split(
                X_cond_csr, y_all, test_size=0.3,
                stratify=y_all, random_state=seed
            )
            m_cond = train_model(X_tr_cond, y_tr2)
            _, _, best_cond, imp_cond = iterative_shap_train(
                m_cond, X_tr_cond, y_tr2, X_te_cond, y_te2,
                feature_names=cond_feats,
                initial_ratio=0.1,
                improvement_threshold=0.01,
                max_iter=3
            )
            cond_importances.append(
                imp_cond.rename(columns={'mean_pct':'importance'})
            )
    
            avg_cond_imp = (
                pd.concat(cond_importances)
                .groupby('feature')['importance']
                .mean()
                .reset_index()
            )
            if current_epoch_num > min_epochs_before_check:
                top10_avg_cond = (
                    avg_cond_imp
                    .sort_values('importance', ascending=False)
                    .head(n_top)['feature']
                    .tolist()
                )
                curr_cond_avg_set = set(top10_avg_cond)
    
                if cond_avg_ref_set is None:
                    cond_avg_ref_set = curr_cond_avg_set
                    cond_avg_stable_count = 1
                else:
                    if curr_cond_avg_set == cond_avg_ref_set:
                        cond_avg_stable_count += 1
                    else:
                        cond_avg_ref_set = curr_cond_avg_set
                        cond_avg_stable_count = 1
    
                print(f"[Cond] avg top10 stable: {cond_avg_stable_count}/{max_same_top_n}")
    
                if cond_avg_stable_count >= max_same_top_n:
                    cond_done = True
    
        if proc_done and cond_done:
            break
    avg_proc_imp = avg_proc_imp.sort_values('importance', ascending=False)
    avg_cond_imp = avg_cond_imp.sort_values('importance', ascending=False)
    avg_proc_f1 = float(np.mean(proc_f1_scores))
    avg_cond_f1 = float(np.mean(cond_f1_scores))
    exec_time = time.time() - start_time
    insert_feature_extraction_data(
        cohort_id, k, avg_proc_imp, avg_cond_imp,
        execution_time=exec_time,
        avg_proc_f1=avg_proc_f1,
        avg_cond_f1=avg_cond_f1
    )

if __name__ == "__main__":
    # Start Flask server in a separate thread
    flask_thread = threading.Thread(target=start_flask)
    flask_thread.daemon = True
    flask_thread.start()

    # Run NATS consumer in the main thread
    loop = asyncio.get_event_loop()
    loop.run_until_complete(main())
