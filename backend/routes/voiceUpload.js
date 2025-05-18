const express = require("express");
const multer = require("multer");
const AWS = require("aws-sdk");
const router = express.Router();

// AWS S3 Configuration
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION, // e.g. 'ap-south-1'
});

const s3 = new AWS.S3();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "audio/wav") {
      return cb(new Error("Only .wav files are allowed"));
    }
    cb(null, true);
  },
  limits: { fileSize: 60 * 1024 * 1024 },
});

router.post("/upload-voice", upload.single("voice"), async (req, res) => {
  if (!req.file || !req.body.username) {
    return res.status(400).json({ error: "Missing file or username" });
  }

  const { originalname, buffer } = req.file;
  const timestamp = Date.now();
  const key = `voices/${req.body.username}.wav`;

  try {
    const s3Result = await s3
      .upload({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: "audio/wav",
      })
      .promise();

    return res.status(200).json({
      message: "Voice uploaded successfully",
      fileUrl: s3Result.Location,
      username: req.body.username,
    });
  } catch (err) {
    console.error("S3 upload error:", err);
    return res.status(500).json({ error: "Failed to upload voice to S3" });
  }
});

module.exports = router;
