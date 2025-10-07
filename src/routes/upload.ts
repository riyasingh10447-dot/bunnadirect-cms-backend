import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure storage for multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// POST /upload — handle file upload
router.post("/", upload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    const filePath = path.join(uploadDir, req.file.filename);
    const resizedFilePath = path.join(
      uploadDir,
      "resized-" + req.file.filename
    );

    // Resize image to max width of 800px
    await sharp(filePath)
      .resize({ width: 300, withoutEnlargement: true })
      .toFile(resizedFilePath);

    // Delete original file safely after resizing
    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting original file:", err);
    });

    const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
    const fileUrl = `${backendUrl}/uploads/resized-${req.file.filename}`;

    return res.json({ url: fileUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error processing image" });
  }
});

export default router;
