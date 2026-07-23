import Link from "next/link";
import type { Metadata } from "next";
import { getRequestLocale } from "@/i18n/server";
import { SITE_NAME_EN, SITE_URL } from "@/lib/seo";

const copy = {
  "zh-CN": {
    title: "星月塔罗 Blog",
    description: "塔罗学习、RWS 牌义、牌阵练习与自我观察笔记。文章即将更新。",
    brand: "星月塔罗",
    home: "返回首页",
    spreads: "开始占卜",
    eyebrow: "MOON & STARS JOURNAL",
    heading: "Blog",
    lead: "这里会用来整理 RWS 塔罗牌义、牌阵练习、解读边界和自我观察方法。",
    emptyTitle: "文章还在路上",
    emptyLead: "你之后写好文章后，我可以把它们整理成列表、详情页和 SEO 数据。现在这个页面先作为公开入口保留。",
    coming: "Coming soon",
    footerName: "星月塔罗 · RWS 辅助观察工具",
    footerDisclaimer: "内容仅供娱乐、自我观察与启发，不构成医疗、法律或财务建议。",
    cardArtwork: "牌面素材",
  },
  en: {
    title: "Moon & Stars Tarot Blog",
    description: "Notes on RWS tarot meanings, spreads, reading boundaries, and reflective practice. Articles are coming soon.",
    brand: SITE_NAME_EN,
    home: "Home",
    spreads: "Start Reading",
    eyebrow: "MOON & STARS JOURNAL",
    heading: "Blog",
    lead: "A future home for RWS tarot meanings, spread practice, reading boundaries, and reflective tarot notes.",
    emptyTitle: "Articles are coming soon",
    emptyLead: "When your articles are ready, I can turn them into a list, detail pages, and SEO metadata. For now, this page gives the blog a clean public home.",
    coming: "Coming soon",
    footerName: "Moon & Stars Tarot · RWS reflection tool",
    footerDisclaimer: "For entertainment, reflection, and inspiration only. This is not medical, legal, or financial advice.",
    cardArtwork: "Card artwork",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const pageCopy = copy[locale];
  return {
    metadataBase: SITE_URL,
    title: pageCopy.title,
    description: pageCopy.description,
    alternates: { canonical: "/blog" },
    openGraph: {
      type: "website",
      url: "/blog",
      title: pageCopy.title,
      description: pageCopy.description,
      siteName: locale === "zh-CN" ? copy["zh-CN"].brand : SITE_NAME_EN,
    },
    twitter: {
      card: "summary",
      title: pageCopy.title,
      description: pageCopy.description,
    },
  };
}

export default async function BlogPage() {
  const locale = await getRequestLocale();
  const pageCopy = copy[locale];

  return (
    <main className="site blog-site">
      <div className="sky" aria-hidden="true"><span className="shooting-star" /><span className="shooting-star second" /></div>
      <header className="nav-shell">
        <Link className="brand" href="/" aria-label={pageCopy.home}>
          <span className="brand-mark" aria-hidden="true">☾</span>
          <span><strong>{pageCopy.brand}</strong><small>RWS TAROT</small></span>
        </Link>
        <nav aria-label="Blog navigation">
          <Link href="/">{pageCopy.home}</Link>
          <Link href="/">{pageCopy.spreads}</Link>
          <Link className="active" href="/blog">Blog</Link>
        </nav>
        <div className="sound-controls blog-nav-spacer" aria-hidden="true" />
      </header>

      <section className="blog-screen screen-enter">
        <div className="blog-hero">
          <p className="eyebrow">{pageCopy.eyebrow}</p>
          <h1>{pageCopy.heading}</h1>
          <p>{pageCopy.lead}</p>
        </div>

        <section className="blog-empty panel-card" aria-labelledby="blog-empty-title">
          <span aria-hidden="true">✦</span>
          <small>{pageCopy.coming}</small>
          <h2 id="blog-empty-title">{pageCopy.emptyTitle}</h2>
          <p>{pageCopy.emptyLead}</p>
        </section>
      </section>

      <footer><span>☾</span><p>{pageCopy.footerName}</p><small>{pageCopy.footerDisclaimer} {pageCopy.cardArtwork} <a href="https://github.com/searge/tarot" target="_blank" rel="noreferrer">searge/tarot</a> · CC BY-SA 4.0</small></footer>
    </main>
  );
}
