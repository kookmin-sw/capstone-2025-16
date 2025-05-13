from main_without_age_and_date import text_to_json
from pdf_to_text import extract_cohort_definition_from_pdf
from flask import Flask, jsonify, request
import os
import uuid
import traceback

app = Flask(__name__)


@app.route("/pdf", methods=["POST"])
def pdf_process():
    if 'pdf' not in request.files:
        return jsonify({"error": "No pdf file provided"}), 400

    pdf_file = request.files['pdf']
    temp_filename = f"/tmp/{uuid.uuid4()}.pdf"

    try:
        # Save the uploaded PDF temporarily
        pdf_file.save(temp_filename)

        # Process the PDF
        implementable_text, non_implementable_text = extract_cohort_definition_from_pdf(
            temp_filename)

        return jsonify({
            "implementable_text": implementable_text,
            "non_implementable_text": non_implementable_text
        })
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500
    finally:
        # Clean up the temporary file
        if os.path.exists(temp_filename):
            os.remove(temp_filename)


@app.route("/text", methods=["POST"])
def text_process():
    if not request.json or 'text' not in request.json:
        return jsonify({"error": "No text provided"}), 400

    text = request.json['text']

    try:
        # Process the text
        result = text_to_json(text)
        return result
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3002, debug=False)
