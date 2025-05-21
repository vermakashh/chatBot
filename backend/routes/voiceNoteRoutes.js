const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Set up multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "uploads/voiceNotes";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.post("/upload", upload.single("voiceNote"), (req, res) => {
  try {
    const { file } = req;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const voiceNoteURL = `/voiceNotes/${file.filename}`;
    return res.json({ message: "Uploaded successfully", url: voiceNoteURL });
  } catch (err) {
    console.error("Voice note upload error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
