import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import slugify from "slugify";
import cors from "cors";
import { authenticateJWT, AuthRequest } from "../middleware/auth"; // ← add middleware import

const router = express.Router();
const prisma = new PrismaClient();

// Enable CORS for your frontend domains
router.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"], // cms frontend & public website
    credentials: true,
  })
);

// ✅ Apply JWT middleware to protect all article routes
//router.use(authenticateJWT);

// POST /article — create an article
{/*
router.post("/", async (req: AuthRequest, res: Response) => {
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
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});
*/}


// PROTECTED — POST /article — create an article
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
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});
// PUBLIC — GET /article — get all articles
router.get("/", async (req: Request, res: Response) => {
  try {
    const articles = await prisma.article.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json(articles);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PUBLIC — GET /article/:slug — get article by slug
router.get("/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const article = await prisma.article.findUnique({
      where: { slug },
    });

    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    return res.json(article);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:slug", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { slug } = req.params;
    const {
      title,
      metaKeyword,
      metaDescription,
      body,
      imageUrl,
      category,
      contentType,
    } = req.body;

    const article = await prisma.article.findUnique({
      where: { slug },
    });

    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    if (req.user.role !== "admin" && req.user.role !== "editor") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updatedSlug = title ? slugify(title, { lower: true, strict: true }) : article.slug;

    const updatedArticle = await prisma.article.update({
      where: { slug },
      data: {
        title: title || article.title,
        slug: updatedSlug,
        metaKeyword: metaKeyword || article.metaKeyword,
        metaDescription: metaDescription || article.metaDescription,
        body: body || article.body,
        imageUrl: imageUrl || article.imageUrl,
        category: category || article.category,
        contentType: contentType || article.contentType,
      },
    });

    return res.json(updatedArticle);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:slug", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { slug } = req.params;

    const article = await prisma.article.delete({
      where: { slug },
    });

    return res.json({ message: "Article deleted", article });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

{/*
// GET /article — get all articles
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const articles = await prisma.article.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json(articles);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /article/:slug — get article by slug
router.get("/:slug", async (req: AuthRequest, res: Response) => {
  try {
    const { slug } = req.params;
    const article = await prisma.article.findUnique({
      where: { slug },
    });

    console.log("Article fetched:", article); // ✅ Log article

    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    return res.json(article);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});
*/}
export default router;


{/*--og
import { Router } from "express";
import { createArticle, getArticles, getArticleBySlug } from "../controllers/articleController";

const router = Router();

router.post("/", createArticle);       // Add new article
router.get("/", getArticles);          // List all articles
router.get("/:slug", getArticleBySlug); // Get article by slug

export default router;
*/}