import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import {
  blogArticles,
  categoryDetails,
  estimateReadingTime,
} from "@/content/blog-articles";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

const title = "塔罗文章与自我探索指南｜星月塔罗 Blog";
const description =
  "阅读关于爱情塔罗、事业方向、自我探索、选择困难与 AI 塔罗原理的实用文章，并找到适合当下问题的塔罗牌阵。";

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title,
  description,
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    url: "/blog",
    title,
    description,
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function BlogPage() {
  return (
    <main className="site blog-site">
      <div className="sky" aria-hidden="true">
        <span className="shooting-star" />
        <span className="shooting-star second" />
      </div>
      <header className="nav-shell">
        <Link className="brand" href="/" aria-label="返回首页">
          <span className="brand-mark" aria-hidden="true">☾</span>
          <span><strong>星月塔罗</strong><small>RWS TAROT</small></span>
        </Link>
        <nav aria-label="Blog navigation">
          <Link href="/">首页</Link>
          <Link href="/?view=spreads">开始占卜</Link>
          <Link className="active" href="/blog">Blog</Link>
        </nav>
        <div className="header-controls blog-nav-spacer" aria-hidden="true" />
      </header>

      <section className="blog-screen screen-enter">
        <div className="blog-hero">
          <p className="eyebrow">MOON & STARS JOURNAL</p>
          <h1>Blog</h1>
          <p>从关系、事业与选择中理解牌面，也重新理解自己。</p>
        </div>

        <nav className="topic-nav" aria-label="文章主题">
          {Object.values(categoryDetails).map((category) => (
            <Link href={category.path} key={category.path}>{category.title}</Link>
          ))}
          <Link href="/tarot-spreads">Tarot Spreads</Link>
        </nav>

        <div className="blog-grid">
          {blogArticles.map((article) => (
            <article className="blog-card" key={article.slug}>
              <Link className="blog-card-image" href={`/blog/${article.slug}`}>
                <Image
                  src={article.heroImage}
                  alt={article.heroAlt}
                  width={1600}
                  height={900}
                  sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw"
                  loading="lazy"
                />
              </Link>
              <div>
                <Link className="article-category" href={categoryDetails[article.category].path}>
                  {article.category}
                </Link>
                <h2><Link href={`/blog/${article.slug}`}>{article.title}</Link></h2>
                <p>{article.excerpt}</p>
                <footer>
                  <span>{estimateReadingTime(article.content)} 分钟阅读</span>
                  <Link href={`/blog/${article.slug}`}>阅读全文 →</Link>
                </footer>
              </div>
            </article>
          ))}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
