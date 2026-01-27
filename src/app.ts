import express, { Request, Response, NextFunction } from "express";
import articleRouter from "./routes/article";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import cookieParser from "cookie-parser";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";

const app = express();

// Ensure uploads folder exists
const uploadFolder = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder);
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadFolder),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Enable CORS
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  })
);

// Serve uploaded files statically
app.use("/uploads", express.static(uploadFolder));

// Routes
app.use("/article", articleRouter);
app.use("/auth", authRoutes);
app.use("/user", userRoutes);

// File upload route
app.post("/upload", upload.single("file"), (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  res.json({
    url: `http://localhost:5000/uploads/${req.file.filename}`,
  });
});

// Root route
app.get("/", (_req: Request, res: Response) => {
  res.send("CMS Backend Running 🚀");
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});
// Mount articleRouter at /api/blogs
app.use("/api/blogs", articleRouter);


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅ CMS Backend running at http://localhost:${PORT}`)
);
