import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL.href,
      lastModified: new Date("2026-07-20"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: new URL("/blog", SITE_URL).href,
      lastModified: new Date("2026-07-23"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
