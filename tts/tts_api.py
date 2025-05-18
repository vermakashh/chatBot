from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import subprocess
import os
import boto3

# Flask setup
app = Flask(__name__)
CORS(app)

# AWS S3 Configuration
s3 = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION")
)
bucket_name = os.getenv("AWS_S3_BUCKET_NAME")  # make sure this is set in your .env or environment

@app.route("/api/tts-clone", methods=["POST"])
def tts_clone():
    try:
        data = request.json
        text = data["text"]
        username = data["username"]  # ✅ Use username now

        # Build S3 key and local paths
        ref_audio_key = f"voices/{username}.wav"
        ref_audio_path = f"ref_audio/{username}_ref.wav"
        output_path = f"output/{username}_output.wav"

        # Download the reference audio from S3
        s3.download_file(bucket_name, ref_audio_key, ref_audio_path)
        print(f"[INFO] Downloaded reference audio: {ref_audio_path}")

        # Run XTTS inference
        subprocess.run([
            "python3", "xtts_infer.py",
            "--config", "checkpoint/config.json",
            "--checkpoint", "checkpoint/",
            "--text", text,
            "--ref_audio", ref_audio_path,
            "--output", output_path
        ], check=True)

        if os.path.exists(output_path):
            print(f"[OK] Output file generated: {output_path}")
        else:
            print(f"[ERROR] Output file missing: {output_path}")
            return jsonify({"error": "Voice generation failed"}), 500

        return send_file(output_path, mimetype="audio/wav")

    except Exception as e:
        print(f"[ERROR] Exception: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    os.makedirs("ref_audio", exist_ok=True)
    os.makedirs("output", exist_ok=True)
    app.run(host="0.0.0.0", port=5050, debug=True)
