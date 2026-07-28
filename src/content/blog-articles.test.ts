import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getSpread } from "@/data/spreads";
import {
  blogArticles,
  estimateReadingTime,
  getArticleHeadings,
  headingToId,
} from "./blog-articles";

describe("SEO blog articles", () => {
  it("uses unique permanent English-style slugs", () => {
    const slugs = blogArticles.map((article) => article.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    slugs.forEach((slug) => expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/));
  });

  it("includes required publishing metadata and optimized hero images", () => {
    blogArticles.forEach((article) => {
      expect(article.metaTitle).toBeTruthy();
      expect(article.metaDescription).toBeTruthy();
      expect(article.author).toBe("Momo AI Tarot");
      expect(article.publishedAt).toBe("2026-07-27");
      expect(article.updatedAt).toBe("2026-07-27");
      expect(article.tags.length).toBeGreaterThan(0);
      expect(article.heroImage).toMatch(/\.webp$/);
      expect(article.heroAlt).toBeTruthy();
      expect(existsSync(join(process.cwd(), "public", article.heroImage))).toBe(true);
      expect(estimateReadingTime(article.content)).toBeGreaterThan(0);
    });
  });

  it("provides TOC headings, FAQ, internal links, and valid spread recommendations", () => {
    blogArticles.forEach((article) => {
      const headings = getArticleHeadings(article.content);
      expect(headings.length).toBeGreaterThan(0);
      expect(new Set(headings.map(headingToId)).size).toBe(headings.length);
      expect(article.faqs).toHaveLength(3);
      expect(article.relatedArticleSlugs.length).toBeGreaterThanOrEqual(3);
      expect(article.relatedArticleSlugs.length).toBeLessThanOrEqual(5);
      article.relatedArticleSlugs.forEach((slug) => {
        expect(blogArticles.some((related) => related.slug === slug)).toBe(true);
      });
      article.relatedSpreadIds.forEach((spreadId) => {
        expect(getSpread(spreadId)).toBeDefined();
      });
    });
  });
});
