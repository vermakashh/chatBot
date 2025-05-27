from flask import Flask, request, jsonify, send_file
from flask_cors import CORS, cross_origin
from langdetect import detect
import subprocess
import os
import boto3
from dotenv import load_dotenv
from translator import translate_to_hindi_devnagri

# Load environment variables
load_dotenv()
bucket_name = os.getenv("AWS_S3_BUCKET_NAME")

# AWS S3 Configuration
s3 = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION")
)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

@app.route("/api/tts-clone", methods=["POST", "OPTIONS"])
@cross_origin(origins="http://localhost:3000")
def tts_clone():
    if request.method == "OPTIONS":
        response = app.make_default_options_response()
        headers = response.headers
        headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
        headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        headers["Access-Control-Allow-Headers"] = "Content-Type"
        return response

    try:
        data = request.get_json(force=True)
        text = data.get("text")
        username = data.get("user_id")

        if not username or not text:
            return jsonify({"error": "Missing 'text' or 'user_id'"}), 400

        # Language detection
        try:
            lang = detect(text)
        except:
            lang = "en"

        # Hinglish patch
        if lang == "tl" or any(word in text.lower() for word in ["Maine", "bta", "kaisa", "hai", "tum", "mera", "kya", "aur", "nahi", "haan"]):
            lang = "hi"

        print(f"[INFO] Text: {text}")
        print(f"[INFO] Language Detected: {lang}")

        if lang == "hi":
            text = translate_to_hindi_devnagri(text)
            print(f"[INFO] Translated to Devanagari: {text}")
            model_dir = "tts_hin"
            script = "xtts_hin.py"
            python_path = "./tts_hin/envtts_hin/bin/python3"
            print("[INFO] Hindi Detected - Called tts_hin")
        else:
            model_dir = "tts_eng"
            script = "xtts_eng.py"
            python_path = "./tts_eng/envtts_eng/bin/python3"
            print("[INFO] English Detected - Called tts_eng")

        # Paths
        ref_audio_key = f"voices/{username}.wav"
        ref_audio_path = f"ref_audio/{username}_ref.wav"
        output_path = f"output/{username}_output.wav"

        print(f"[INFO] S3 key: {ref_audio_key}")

        try:
            s3.download_file(bucket_name, ref_audio_key, ref_audio_path)
            print(f"[INFO] Downloaded reference audio to: {ref_audio_path}")
        except Exception as s3_err:
            return jsonify({"error": f"Reference audio not found: {str(s3_err)}"}), 404

        # Run XTTS inference
        result = subprocess.run([
        python_path,
        f"{model_dir}/{script}",
        "--checkpoint", f"{model_dir}/checkpoint",
        "--config", f"{model_dir}/checkpoint/config.json",
        "--ref_audio", ref_audio_path,
        "--text", text,
        "--language", lang,
        "--output", output_path
        ], capture_output=True, text=True)


        if result.returncode != 0:
            print("[ERROR] XTTS Inference Failed:\n", result.stderr)
            return jsonify({"error": "XTTS processing failed"}), 500

        if not os.path.exists(output_path):
            return jsonify({"error": "Output not generated"}), 500

        print(f"[✅] Voice synthesis successful: {output_path}")
        return send_file(output_path, mimetype="audio/wav")

    except Exception as e:
        print(f"[FATAL ERROR] {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    os.makedirs("ref_audio", exist_ok=True)
    os.makedirs("output", exist_ok=True)
    app.run(host="0.0.0.0", port=5050, debug=True)
