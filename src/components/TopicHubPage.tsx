import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import type { BlogArticle } from "@/content/blog-articles";
import { estimateReadingTime } from "@/content/blog-articles";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

type TopicHubPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  path: string;
  articles: BlogArticle[];
};

export const createTopicMetadata = (
  title: string,
  description: string,
  path: string,
): Metadata => ({
  metadataBase: SITE_URL,
  title: `${title}｜星月塔罗`,
  description,
  alternates: { canonical: path },
  openGraph: {
    type: "website",
    url: path,
    title,
    description,
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
});

export function TopicHubPage({
  eyebrow,
  title,
  description,
  path,
  articles,
}: TopicHubPageProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": new URL(path, SITE_URL).href,
    url: new URL(path, SITE_URL).href,
    name: title,
    description,
    isPartOf: { "@id": `${SITE_URL.href}#website` },
    inLanguage: "zh-CN",
  };

  return (
    <main className="site blog-site topic-site">
      <div className="sky" aria-hidden="true">
        <span className="shooting-star" />
        <span className="shooting-star second" />
      </div>
      <header className="nav-shell">
        <Link className="brand" href="/" aria-label="返回首页">
          <span className="brand-mark" aria-hidden="true">☾</span>
          <span><strong>星月塔罗</strong><small>RWS TAROT</small></span>
        </Link>
        <nav aria-label="Topic navigation">
          <Link href="/">首页</Link>
          <Link className="active" href="/blog">Blog</Link>
          <Link href="/?view=spreads">开始占卜</Link>
        </nav>
        <div className="header-controls blog-nav-spacer" aria-hidden="true" />
      </header>

      <section className="blog-screen screen-enter">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link><span>→</span>
          <Link href="/blog">Blog</Link><span>→</span>
          <span aria-current="page">{title}</span>
        </nav>
        <div className="blog-hero topic-hero">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        <div className="topic-article-list">
          {articles.map((article) => (
            <article key={article.slug}>
              <Link href={`/blog/${article.slug}`}>
                <Image
                  src={article.heroImage}
                  alt={article.heroAlt}
                  width={1600}
                  height={900}
                  sizes="(max-width: 760px) 100vw, 320px"
                  loading="lazy"
                />
              </Link>
              <div>
                <small>{article.category} · {estimateReadingTime(article.content)} 分钟阅读</small>
                <h2><Link href={`/blog/${article.slug}`}>{article.title}</Link></h2>
                <p>{article.excerpt}</p>
                <Link href={`/blog/${article.slug}`}>阅读全文 →</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <script
        id="topic-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <SiteFooter />
    </main>
  );
}
