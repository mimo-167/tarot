import type { Locale } from "@/i18n/config";

export const SITE_URL = new URL("https://tarot.zxkpg.uk");
export const SITE_NAME = "星月塔罗";
export const SITE_NAME_EN = "Moon & Stars Tarot";
export const SOCIAL_IMAGE_PATH = "/opengraph-image";

export const seoByLocale: Record<
  Locale,
  { title: string; description: string; keywords: string[]; ogLocale: string }
> = {
  "zh-CN": {
    title: "星月塔罗｜免费在线 RWS 塔罗牌与 AI 辅助解读",
    description:
      "免费体验 78 张 RWS 韦特塔罗牌、9 种沉浸式牌阵与每日一牌，结合本地牌义和可选 AI 辅助解读，帮助你进行自我观察与反思。",
    keywords: ["塔罗", "在线塔罗", "免费塔罗", "RWS 塔罗", "韦特塔罗", "塔罗牌阵", "每日一牌", "AI 塔罗解读"],
    ogLocale: "zh_CN",
  },
  en: {
    title: "Moon & Stars Tarot | Free Online RWS Tarot Reading",
    description:
      "Explore all 78 Rider–Waite–Smith cards, nine immersive spreads, and a daily card with local meanings and optional AI-assisted reflection.",
    keywords: ["tarot", "online tarot", "free tarot reading", "RWS tarot", "Rider-Waite-Smith", "tarot spreads", "daily tarot card", "AI tarot reading"],
    ogLocale: "en_US",
  },
};

export const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL.href}#website`,
      url: SITE_URL.href,
      name: SITE_NAME,
      alternateName: SITE_NAME_EN,
      description: seoByLocale["zh-CN"].description,
      inLanguage: ["zh-CN", "en"],
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL.href}#application`,
      url: SITE_URL.href,
      name: SITE_NAME,
      alternateName: SITE_NAME_EN,
      description: seoByLocale["zh-CN"].description,
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript",
      inLanguage: ["zh-CN", "en"],
      isAccessibleForFree: true,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "CNY",
      },
    },
  ],
};

export const serializedStructuredData = JSON.stringify(structuredData).replace(/</g, "\\u003c");
