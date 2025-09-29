export interface Article {
  id: number;
  title: string;
  body: string;
  slug: string;
  createdAt: Date;
}

export const articles: Article[] = [];  // temporary storage
