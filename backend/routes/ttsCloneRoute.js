const express = require("express");
const router = express.Router();
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const https = require("https");

// Utility to download reference audio from AWS
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on("finish", () => file.close(resolve));
    }).on("error", (err) => reject(err));
  });
}

router.post("/", async (req, res) => {
  try {
    const { text, userId } = req.body;

    const refAudioUrl = `https://your-bucket.s3.amazonaws.com/${userId}/reference.wav`;
    const refAudioPath = `./tts/tmp/${userId}_ref.wav`;
    const outputPath = `./tts/tmp/${userId}_output.wav`;

    // Ensure tmp folder exists
    fs.mkdirSync("./tts/tmp", { recursive: true });

    // Download the reference audio
    await downloadFile(refAudioUrl, refAudioPath);

    // Spawn XTTS process
    const pyProcess = spawn("python3", [
      "tts/xtts_infer.py",
      "--config", "tts/checkpoint/config.json",
      "--checkpoint", "tts/checkpoint/",
      "--text", text,
      "--ref_audio", refAudioPath,
      "--output", outputPath
    ]);

    pyProcess.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    pyProcess.on("close", (code) => {
      if (code !== 0) {
        return res.status(500).json({ error: "TTS generation failed." });
      }

      res.sendFile(path.resolve(outputPath), () => {
        // Optional: clean up after sending
        fs.unlinkSync(refAudioPath);
        fs.unlinkSync(outputPath);
      });
    });
  } catch (err) {
    console.error("TTS Clone Error:", err);
    res.status(500).json({ error: "TTS clone internal error." });
  }
});

module.exports = router;
