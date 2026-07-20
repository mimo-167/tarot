import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "星月塔罗｜Moon & Stars Tarot",
    short_name: "星月塔罗",
    description: "免费在线 RWS 塔罗牌、沉浸式牌阵与 AI 辅助解读。",
    start_url: "/",
    display: "standalone",
    background_color: "#09060f",
    theme_color: "#09060f",
    lang: "zh-CN",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
