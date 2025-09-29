import express from "express";
import { PrismaClient } from "@prisma/client";
import slugify from "slugify";
import cors from "cors";

const router = express.Router();
const prisma = new PrismaClient();

// Enable CORS for your frontend domains
router.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"], // cms frontend & public website
    credentials: true,
  })
);

// POST /article — create an article
router.post("/", async (req, res) => {
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

// GET /article — get all articles
router.get("/", async (req, res) => {
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
router.get("/:slug", async (req, res) => {
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