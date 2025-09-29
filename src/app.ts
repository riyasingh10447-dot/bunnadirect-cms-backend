import express from "express";
import articleRouter from "./routes/article";

const app = express();
app.use(express.json());

app.use("/article", articleRouter);

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
{/*---og
import express from "express";
import type { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import articleRoutes from "./routes/article";
import cors from "cors";
dotenv.config();

const app = express();

// Enable CORS
app.use(cors({
 origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true
}));
// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/article", articleRoutes);

// Root route
app.get("/", (_req: Request, res: Response) => {
  res.send("CMS Backend Running 🚀");
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`✅ CMS Backend running at http://localhost:${port}`));
*/}