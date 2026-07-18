import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "星月塔罗｜沉浸式 RWS 塔罗",
  description: "以仪式感、自由抽牌与 AI 辅助解读，陪你安静看见问题的不同侧面。",
  applicationName: "星月塔罗",
  keywords: ["塔罗", "RWS", "韦特塔罗", "AI 解读", "每日抽牌"],
  icons: [{ rel: "icon", url: "/favicon.svg", type: "image/svg+xml" }],
};

export const viewport: Viewport = {
  themeColor: "#09060f",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
