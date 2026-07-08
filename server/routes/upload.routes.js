import express from "express";
import multer from "multer";
import { requireAuth } from "../middleware/requireAuth.js";
import cloudinary from "../lib/cloudinary.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, 
});

router.post("/", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "auto", folder: "chatify" },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      stream.end(req.file.buffer);
    });

    res.status(201).json({
      url: result.secure_url,
      publicId: result.public_id,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      resourceType: result.resource_type,
    });
  } catch (err) {
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
});

// Handle multer errors (e.g. file too large) cleanly
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

export default router;