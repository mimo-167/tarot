import type { MetadataRoute } from "next";
import { blogArticles, categoryDetails } from "@/content/blog-articles";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const articleEntries: MetadataRoute.Sitemap = blogArticles.map((article) => ({
    url: new URL(`/blog/${article.slug}`, SITE_URL).href,
    lastModified: new Date(`${article.updatedAt}T00:00:00+08:00`),
    changeFrequency: "monthly",
    priority: 0.7,
    images: [new URL(article.heroImage, SITE_URL).href],
  }));
  const topicPaths = [
    ...Object.values(categoryDetails).map((category) => category.path),
    "/tarot-spreads",
  ];
  const topicEntries: MetadataRoute.Sitemap = topicPaths.map((path) => ({
    url: new URL(path, SITE_URL).href,
    lastModified: new Date("2026-07-27T00:00:00+08:00"),
    changeFrequency: "weekly",
    priority: 0.65,
  }));

  return [
    {
      url: SITE_URL.href,
      lastModified: new Date("2026-07-27T00:00:00+08:00"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: new URL("/blog", SITE_URL).href,
      lastModified: new Date("2026-07-27T00:00:00+08:00"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...topicEntries,
    ...articleEntries,
  ];
}
