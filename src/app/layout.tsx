import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { getRequestLocale } from "@/i18n/server";
import {
  serializedStructuredData,
  SITE_NAME,
  SITE_NAME_EN,
  SITE_URL,
  SOCIAL_IMAGE_PATH,
  seoByLocale,
} from "@/lib/seo";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const seo = seoByLocale[locale];
  return {
    metadataBase: SITE_URL,
    title: seo.title,
    description: seo.description,
    applicationName: locale === "zh-CN" ? SITE_NAME : SITE_NAME_EN,
    keywords: seo.keywords,
    alternates: { canonical: "/" },
    icons: [{ rel: "icon", url: "/favicon.svg", type: "image/svg+xml" }],
    openGraph: {
      type: "website",
      url: "/",
      siteName: locale === "zh-CN" ? SITE_NAME : SITE_NAME_EN,
      title: seo.title,
      description: seo.description,
      locale: seo.ogLocale,
      images: [{ url: SOCIAL_IMAGE_PATH, width: 1200, height: 630, alt: seo.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [SOCIAL_IMAGE_PATH],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#09060f",
  colorScheme: "dark",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getRequestLocale();
  return (
    <html lang={locale}>
      <body>
        <script
          id="website-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializedStructuredData }}
        />
        {children}
        <Script
          id="google-analytics"
          src="https://www.googletagmanager.com/gtag/js?id=G-MQ2VLF2X8F"
          strategy="afterInteractive"
        />
        <Script id="google-analytics-config" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag("js", new Date());
          gtag("config", "G-MQ2VLF2X8F");`}
        </Script>
      </body>
    </html>
  );
}
