import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/blog/", "/spreads/", "/cards/", "/categories/"],
      disallow: ["/admin/", "/dashboard/", "/api/"],
    },
    sitemap: new URL("/sitemap.xml", SITE_URL).href,
    host: SITE_URL.origin,
  };
}
