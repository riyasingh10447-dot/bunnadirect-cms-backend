{/*import { Request, Response } from "express";
import { articles, Article } from "../models/article";
import { slugify } from "../utils/slugify";

let idCounter = 1;

export const createArticle = (req: Request, res: Response) => {
  const { title, body } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: "Title and body are required" });
  }

  const slug = slugify(title);

  const newArticle: Article = {
    id: idCounter++,
    title,
    body,
    slug,
    createdAt: new Date()
  };

  articles.push(newArticle);

  res.status(201).json(newArticle);
};

export const getArticles = (_req: Request, res: Response) => {
  res.json(articles);
};

export const getArticleBySlug = (req: Request, res: Response) => {
  const { slug } = req.params;
  const article = articles.find(a => a.slug === slug);

  if (!article) {
    return res.status(404).json({ error: "Article not found" });
  }

  res.json(article);
};
*/}