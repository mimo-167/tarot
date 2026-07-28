import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { SiteFooter } from "@/components/SiteFooter";
import {
  blogArticles,
  categoryDetails,
  estimateReadingTime,
  getArticleHeadings,
  getBlogArticle,
  headingToId,
} from "@/content/blog-articles";
import { getSpread } from "@/data/spreads";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return blogArticles.map((article) => ({ slug: article.slug }));
}
export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getBlogArticle(slug);
  if (!article) return {};

  const articlePath = `/blog/${article.slug}`;

  return {
    metadataBase: SITE_URL,
    title: article.metaTitle,
    description: article.metaDescription,
    authors: [{ name: article.author }],
    category: article.category,
    keywords: article.tags,
    alternates: { canonical: articlePath },
    openGraph: {
      type: "article",
      url: articlePath,
      siteName: SITE_NAME,
      title: article.metaTitle,
      description: article.metaDescription,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.author],
      tags: article.tags,
      images: [
        {
          url: article.heroImage,
          width: 1600,
          height: 900,
          alt: article.heroAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.metaTitle,
      description: article.metaDescription,
      images: [article.heroImage],
    },
  };
}

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Shanghai",
  }).format(new Date(`${date}T00:00:00+08:00`));

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getBlogArticle(slug);
  if (!article) notFound();

  const category = categoryDetails[article.category];
  const headings = getArticleHeadings(article.content);
  const readingTime = estimateReadingTime(article.content);
  const relatedArticles = article.relatedArticleSlugs
    .map((relatedSlug) => getBlogArticle(relatedSlug))
    .filter((item) => item !== undefined);
  const relatedSpreads = article.relatedSpreadIds
    .map((spreadId) => getSpread(spreadId))
    .filter((item) => item !== undefined);
  const articleUrl = new URL(`/blog/${article.slug}`, SITE_URL).href;
  const categoryUrl = new URL(category.path, SITE_URL).href;
  const imageUrl = new URL(article.heroImage, SITE_URL).href;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${articleUrl}#article`,
        headline: article.title,
        description: article.metaDescription,
        image: [imageUrl],
        datePublished: article.publishedAt,
        dateModified: article.updatedAt,
        mainEntityOfPage: articleUrl,
        articleSection: article.category,
        keywords: article.tags.join(", "),
        author: {
          "@type": "Person",
          name: article.author,
        },
        publisher: {
          "@type": "Organization",
          "@id": `${SITE_URL.href}#organization`,
          name: SITE_NAME,
          url: SITE_URL.href,
        },
        inLanguage: "zh-CN",
      },
      {
        "@type": "FAQPage",
        "@id": `${articleUrl}#faq`,
        mainEntity: article.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${articleUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: SITE_URL.href,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Blog",
            item: new URL("/blog", SITE_URL).href,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: article.category,
            item: categoryUrl,
          },
          {
            "@type": "ListItem",
            position: 4,
            name: article.title,
            item: articleUrl,
          },
        ],
      },
    ],
  };
  const serializedStructuredData = JSON.stringify(structuredData).replace(/</g, "\\u003c");

  return (
    <main className="site blog-site article-site">
      <div className="sky" aria-hidden="true">
        <span className="shooting-star" />
        <span className="shooting-star second" />
      </div>

      <header className="nav-shell">
        <Link className="brand" href="/" aria-label="返回首页">
          <span className="brand-mark" aria-hidden="true">☾</span>
          <span><strong>星月塔罗</strong><small>RWS TAROT</small></span>
        </Link>
        <nav aria-label="文章导航">
          <Link href="/">首页</Link>
          <Link className="active" href="/blog">Blog</Link>
          <Link href="/?view=spreads">开始占卜</Link>
        </nav>
        <div className="header-controls blog-nav-spacer" aria-hidden="true" />
      </header>

      <article className="article-shell screen-enter">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link><span>→</span>
          <Link href="/blog">Blog</Link><span>→</span>
          <Link href={category.path}>{article.category}</Link><span>→</span>
          <span aria-current="page">{article.title}</span>
        </nav>

        <header className="article-header">
          <Link className="article-category" href={category.path}>{article.category}</Link>
          <h1>{article.title}</h1>
          <p>{article.metaDescription}</p>
          <div className="article-byline">
            <span>Written by {article.author}</span>
            <span>阅读约 {readingTime} 分钟</span>
            <span>Published {formatDate(article.publishedAt)}</span>
            <span>Updated {formatDate(article.updatedAt)}</span>
          </div>
          <div className="article-tags" aria-label="文章标签">
            {article.tags.map((tag) => <span key={tag}>#{tag}</span>)}
          </div>
        </header>

        <figure className="article-hero">
          <Image
            src={article.heroImage}
            alt={article.heroAlt}
            width={1600}
            height={900}
            sizes="(max-width: 900px) 100vw, 900px"
            loading="lazy"
          />
        </figure>

        <div className="article-layout">
          <aside className="article-toc">
            <strong>Table of Contents</strong>
            <ol>
              {headings.map((heading) => (
                <li key={heading}><a href={`#${headingToId(heading)}`}>{heading}</a></li>
              ))}
              <li><a href="#faq">FAQ</a></li>
            </ol>
          </aside>

          <div className="article-main">
            <div className="article-content">
              <ReactMarkdown
                components={{
                  h2: ({ children }) => {
                    const heading = String(children);
                    return <h2 id={headingToId(heading)}>{children}</h2>;
                  },
                  h3: ({ children }) => {
                    const heading = String(children);
                    return <h3 id={headingToId(heading)}>{children}</h3>;
                  },
                }}
              >
                {article.content}
              </ReactMarkdown>
            </div>

            <section className="article-faq" id="faq" aria-labelledby="faq-title">
              <p className="eyebrow">FREQUENTLY ASKED QUESTIONS</p>
              <h2 id="faq-title">FAQ</h2>
              {article.faqs.map((faq) => (
                <details key={faq.question}>
                  <summary>{faq.question}</summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </section>

            <section className="article-related" aria-labelledby="related-articles-title">
              <p className="eyebrow">KEEP READING</p>
              <h2 id="related-articles-title">Related Articles</h2>
              <div className="article-related-grid">
                {relatedArticles.map((related) => (
                  <Link href={`/blog/${related.slug}`} key={related.slug}>
                    <small>{related.category}</small>
                    <strong>{related.title}</strong>
                    <span>阅读全文 →</span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="article-related" aria-labelledby="related-spreads-title">
              <p className="eyebrow">PRACTICE WITH A SPREAD</p>
              <h2 id="related-spreads-title">Related Spreads</h2>
              <div className="related-spread-list">
                {relatedSpreads.map((spread) => (
                  <Link href={`/?spread=${spread.id}`} key={spread.id}>
                    <span>✦</span>
                    <span><strong>{spread.name}</strong><small>{spread.description}</small></span>
                    <b>开始 →</b>
                  </Link>
                ))}
              </div>
            </section>

            <section className="article-cta" aria-labelledby="article-cta-title">
              <span aria-hidden="true">☾</span>
              <p className="eyebrow">TRY A REFLECTIVE READING</p>
              <h2 id="article-cta-title">Try AI Tarot Reading</h2>
              <p>让牌面帮助你整理此刻的问题、感受和下一步行动。</p>
              <Link className="button primary large" href="/?view=spreads">Start Reading →</Link>
            </section>
          </div>
        </div>
      </article>

      <script
        id="article-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializedStructuredData }}
      />
      <SiteFooter />
    </main>
  );
}
