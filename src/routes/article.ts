import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import slugify from "slugify";
import { authenticateJWT, AuthRequest } from "../middleware/auth";

const router = express.Router();
const prisma = new PrismaClient();

// CREATE ARTICLE (protected)
router.post("/", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      metaKeyword,
      metaDescription,
      body,
      imageUrl,
      category,
      contentType,
    } = req.body;

    if (!title || !category || !contentType) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const slug = slugify(title, { lower: true, strict: true });

    const article = await prisma.article.create({
      data: {
        title,
        slug,
        metaKeyword,
        metaDescription,
        body,
        imageUrl,
        category,
        contentType,
      },
    });

    return res.status(201).json(article);
  } catch (err) {
    console.error("POST /article error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET ALL ARTICLES (public)
router.get("/", async (_req: Request, res: Response) => {
  try {
    const articles = await prisma.article.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json(articles);
  } catch (err) {
    console.error("GET /article error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET ARTICLE BY SLUG
router.get("/:slug", async (req: Request, res: Response) => {
  try {
    const article = await prisma.article.findUnique({
      where: { slug: req.params.slug },
    });

    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    return res.json(article);
  } catch (err) {
    console.error("GET /article/:slug error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
