import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import slugify from "slugify";
import { authenticateJWT, AuthRequest } from "../middleware/auth";

const router = express.Router();
const prisma = new PrismaClient();

// 1. CREATE ARTICLE (protected)
router.post("/", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { title, metaKeyword, metaDescription, body, imageUrl, category, contentType } = req.body;

    if (!title || !category || !contentType) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const slug = slugify(title, { lower: true, strict: true });

    const article = await prisma.article.create({
      data: { title, slug, metaKeyword, metaDescription, body, imageUrl, category, contentType },
    });

    return res.status(201).json(article);
  } catch (err) {
    console.error("POST /article error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// 2. GET ALL ARTICLES (public)
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

// 3. GET ARTICLE BY SLUG (Public - Used for fetching data in Edit Page)
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

// 4. UPDATE ARTICLE BY SLUG (protected) - ✅ ADDED THIS
router.put("/:slug", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { slug } = req.params;
    const { title, metaKeyword, metaDescription, body, imageUrl, category, contentType } = req.body;

    const existingArticle = await prisma.article.findUnique({ where: { slug } });
    if (!existingArticle) {
      return res.status(404).json({ message: "Article not found" });
    }

    // Title change hone par slug bhi update hoga
    const newSlug = title ? slugify(title, { lower: true, strict: true }) : slug;

    const updatedArticle = await prisma.article.update({
      where: { slug },
      data: { title, slug: newSlug, metaKeyword, metaDescription, body, imageUrl, category, contentType },
    });

    return res.json(updatedArticle);
  } catch (err) {
    console.error("PUT /article/:slug error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;