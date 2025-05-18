from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import subprocess
import os
import boto3
from dotenv import load_dotenv

load_dotenv()
print("BUCKET:", os.getenv("AWS_S3_BUCKET_NAME"))

# Flask setup
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# AWS S3 Configuration
s3 = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION")
)
bucket_name = os.getenv("AWS_S3_BUCKET_NAME")

@app.route("/api/tts-clone", methods=["POST"])
def tts_clone():
    try:
        data = request.json
        text = data.get("text")
        username = data.get("user_id")

        if not username or not text:
            return jsonify({"error": "Missing 'text' or 'user_id'"}), 400

        # Define paths
        ref_audio_key = f"voices/{username}.wav"
        ref_audio_path = f"ref_audio/{username}_ref.wav"
        output_path = f"output/{username}_output.wav"

        print(f"[INFO] Requested TTS for user: {username}")
        print(f"[INFO] S3 key: {ref_audio_key}")

        # Download user's reference audio from S3
        try:
            s3.download_file(bucket_name, ref_audio_key, ref_audio_path)
            print(f"[INFO] Downloaded reference audio to: {ref_audio_path}")
        except Exception as s3_err:
            print(f"[ERROR] Failed to download audio from S3: {s3_err}")
            return jsonify({"error": "Reference audio not found in S3"}), 404

        # Run inference
        result = subprocess.run([
            "python3", "xtts_infer.py",
            "--config", "checkpoint/config.json",
            "--checkpoint", "checkpoint/",
            "--text", text,
            "--ref_audio", ref_audio_path,
            "--output", output_path
        ], capture_output=True, text=True)

        if result.returncode != 0:
            print("[ERROR] XTTS Inference Failed:", result.stderr)
            return jsonify({"error": "XTTS processing failed"}), 500

        if not os.path.exists(output_path):
            return jsonify({"error": "TTS output not generated"}), 500

        print(f"[OK] Voice synthesis successful: {output_path}")
        return send_file(output_path, mimetype="audio/wav")

    except Exception as e:
        print(f"[ERROR] Exception occurred: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    os.makedirs("ref_audio", exist_ok=True)
    os.makedirs("output", exist_ok=True)
    app.run(host="0.0.0.0", port=5050, debug=True)
