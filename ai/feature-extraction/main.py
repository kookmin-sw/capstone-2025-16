import asyncio
import json
import os
from dotenv import load_dotenv
import time
from sklearn.model_selection import train_test_split
from validation import evaluate_model
from model import prepare_two_features, train_model, iterative_shap_train, prepare_psm_features
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
    # Start Flask server in a separate thread
    flask_thread = threading.Thread(target=start_flask)
    flask_thread.daemon = True
    flask_thread.start()

    # Run NATS consumer in the main thread
    loop = asyncio.get_event_loop()
    loop.run_until_complete(main())
