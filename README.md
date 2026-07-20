# 星月塔罗

沉浸式 Rider–Waite–Smith 塔罗网页应用。项目由原始单文件 Demo 重构为 Next.js 16，并通过 OpenNext 部署到 Cloudflare Workers。

线上地址：<https://tarot.zxkpg.uk>

## 已实现

- 9 种产品牌阵，以及问题、背景、时间范围和二选一 A/B 输入。
- 完整 78 张无重复牌组、随机牌序与正逆位、自由选牌、撤回、三阶段洗牌。
- 按牌位顺序翻牌、逆位牌面、不同牌阵的几何布局。
- 由项目知识库自动生成的 78 张结构化本地牌义与基础组合观察。
- DeepSeek 服务端综合解读：输入校验、提示词注入隔离、安全边界、超时/错误降级。
- 收藏牌阵、同日固定的每日一牌、Canvas 分享海报。
- Web Audio 环境氛围音和操作音效，偏好本地保存。
- 前端每日 3 次友好额度 + Cloudflare Rate Limiting binding 每分钟防刷。
- 桌面与移动端响应式、键盘焦点、状态播报和 `prefers-reduced-motion`。
- 完整中英双语：浏览器语言自动识别、页面内即时切换、偏好 Cookie 持久化，以及双语牌阵、本地牌义、AI 解读、错误提示和分享海报。

## 技术结构

- `src/components/TarotExperience.tsx`：完整仪式与运营功能界面。
- `src/data/spreads.ts`：牌阵定义。
- `src/data/tarot-cards.json`：从 RWS 知识库生成的 78 张牌数据。
- `src/data/tarot-cards.en.json`：与 78 张中文牌逐一对应的英文牌义。
- `src/i18n/`：双语界面文案、浏览器语言解析与服务端首屏语言选择。
- `src/app/api/reading/route.ts`：Cloudflare Worker 中运行的 DeepSeek 接口。
- `src/middleware.ts`：自定义域名 HTTP 请求跳转到 HTTPS。
- `src/lib/reading-prompt.ts`：服务端系统提示词与本次牌面上下文。
- `scripts/generate-tarot-data.mjs`：知识库到结构化数据的可重复生成脚本。
- `wrangler.jsonc` / `open-next.config.ts`：Cloudflare Workers 部署配置。

## 本地开发

需要 Node.js 22 或更新版本。

```bash
npm install
npm run generate:data
npm run dev
```

创建 `.env.local`（不要提交）：

```env
DEEPSEEK_API_KEY=你的密钥
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_API_URL=https://api.deepseek.com/chat/completions
```

没有密钥时，所有前端功能和本地牌义仍可使用；AI 面板会明确提示尚未配置。

## 验证

```bash
npm run lint
npm test
npm run build
npm run cf:build
```

已提供 `npm run smoke:ui`，它使用本机 Chrome 自动走通：9 个牌阵 → 问题 → 78 张牌桌 → 选择三张 → 逐张翻牌 → 本地解读，同时检查移动端每日牌页。

## Cloudflare 部署

当前 Worker 名为 `xingyue-tarot`。首次启用 AI 时，把密钥放入 Cloudflare Secret：

```bash
npx wrangler secret put DEEPSEEK_API_KEY --name xingyue-tarot
npm run deploy
```

密钥只在 Worker 运行时读取，不使用 `NEXT_PUBLIC_` 前缀，也不会进入浏览器包。生产接口还使用 `AI_RATE_LIMITER` binding 限制突发调用。

## 内容现状

项目提供的知识库确实包含 78 张独立牌义，但每张正文目前约 207～278 个中文字符，并非产品定位中规划的每张 1000～2000 字长资料。本版完整使用了现有语料，不虚构缺失内容；后续扩写知识库后运行 `npm run generate:data` 即可更新前端与 AI 上下文。

## 素材许可

牌面素材来源和许可见 [ATTRIBUTION.md](./ATTRIBUTION.md)。
