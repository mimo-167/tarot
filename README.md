# 星月塔罗（Xingyue Tarot）

沉浸式 Rider–Waite–Smith（韦特）塔罗网页应用，围绕“仪式感、自由抽牌、本地牌义与 AI 个性化辅助解读”设计。项目由原始单文件 Demo 重构为 Next.js，并通过 OpenNext 部署到 Cloudflare Workers。

> [!IMPORTANT]
> 本文档是项目维护的必读入口。任何开发者或 AI 在修改代码、内容、配置或部署前，都必须先完整阅读本文档，并根据修改范围继续阅读下方列出的业务资料。若代码、Cloudflare 配置或部署方式发生变化，必须在同一次修改中同步更新本文档。

## 项目入口

| 项目 | 地址或名称 |
| --- | --- |
| GitHub 仓库 | <https://github.com/mimo-167/tarot> |
| Git 远程 | `origin` → `https://github.com/mimo-167/tarot.git` |
| 默认分支 | `master` |
| 生产网站 | <https://tarot.zxkpg.uk/> |
| Cloudflare Worker | `xingyue-tarot` |
| 部署平台 | Cloudflare Workers（不是 Cloudflare Pages） |
| 部署适配器 | OpenNext for Cloudflare |
| 部署 CLI | Wrangler |
| 包管理器 | npm（以 `package-lock.json` 为准） |

本文档中的线上信息最后核对于 **2026-07-29**。实际部署版本请使用 `npx wrangler deployments status --name xingyue-tarot` 或 `npx wrangler versions list --name xingyue-tarot` 查询，不要把易变化的版本 ID 写死在业务代码中。

## 修改前必读

每次开始修改前：

1. 完整阅读本 README。
2. 运行 `git status --short`，识别并保留用户尚未提交的修改，不覆盖无关文件。
3. 根据任务读取对应资料：

| 修改范围 | 必须继续阅读 |
| --- | --- |
| 产品流程、页面功能、交互定位 | [`【项目定位】.txt`](./【项目定位】.txt) |
| AI 解读行为、语气、安全边界 | [`docs/AI塔罗辅助解读系统提示词.md`](./docs/AI塔罗辅助解读系统提示词.md) |
| 牌义、牌面内容、组合解释 | [`docs/RWS塔罗AI辅助解牌知识库.md`](./docs/RWS塔罗AI辅助解牌知识库.md) |
| 牌面图片、版权或素材替换 | [`ATTRIBUTION.md`](./ATTRIBUTION.md) |
| 部署、域名、绑定或环境变量 | [`wrangler.jsonc`](./wrangler.jsonc)、[`open-next.config.ts`](./open-next.config.ts)、[`.env.example`](./.env.example) |
| 依赖、构建命令或运行环境 | [`package.json`](./package.json)、[`package-lock.json`](./package-lock.json) |

资料与代码不一致时，不要静默猜测：先核对当前实现和产品目标，再同步更新代码及相关文档。`【项目定位】.txt` 中部分“未实现”项目已经在正式项目中完成，当前代码和本 README 的“已实现功能”是判断现状的主要依据。

## 已实现功能

- 23 种牌阵，按通用指引、亲密关系、事业发展、自我探索分类，并区分基础与进阶；支持问题、背景、时间范围和二选一 A/B 输入。
- 抽牌前的沉浸式静心引导页、三阶段洗牌、78 张无重复牌组、自由选牌、撤回与重选。
- 随机牌序和正逆位、按牌位逐张翻牌、不同牌阵的几何布局。
- 完整中英双语：浏览器语言自动选择、`中文 / English` 手动切换和 Cookie 持久化。
- 中英文牌阵、牌义、AI 解读、错误提示与分享图片。
- 本地结构化牌义和 DeepSeek 服务端综合解读。
- 收藏牌阵和同日固定的每日一牌。
- 游客可完成抽牌和本地解读；游客调用 AI 时，服务端只向浏览器返回前约 30%，其余正文不会进入游客响应，邮箱登录后可免费解锁本次完整解读。
- Resend 中英文邮箱验证码登录：验证码短时有效、限制尝试次数，登录态使用 `HttpOnly` Cookie；登录后会接续同一游客会话中的 AI 解读。
- 翻完牌后询问是否保存；登录用户可保存问题、牌阵、牌面快照和 AI 解读，并在“我的抽牌记录”查看或删除。
- `/admin` SaaS 管理后台：仅服务端确认的管理员可访问总览、用户状态、抽牌记录和审计日志；敏感记录详情按需读取。
- Canvas 生成缩略分享图，用户预览后下载到本地；不依赖 Windows 系统共享面板。
- 前端友好额度与 Cloudflare Rate Limiting binding 双层调用限制。
- 响应式布局、键盘焦点、状态播报和 `prefers-reduced-motion`。
- SEO 页面、站点地图、robots、Open Graph 图片和博客；当前包含 7 篇中文长文、5 个主题 Hub、FAQ 与 Article/Breadcrumb 结构化数据、相关文章和相关牌阵推荐。

## 技术栈

- Next.js 16（App Router）
- React 19
- TypeScript
- Vitest
- OpenNext for Cloudflare
- Cloudflare Workers + Wrangler
- Cloudflare D1
- Cloudflare Rate Limiting
- Resend Transactional Email
- DeepSeek 的 OpenAI-compatible Chat Completions 接口
- 原生 Canvas 与浏览器存储

精确版本始终以 [`package.json`](./package.json) 和 [`package-lock.json`](./package-lock.json) 为准，不要仅依据本文档升级依赖。

为避免 Windows 本地及资源受限的 CI 环境在静态页面生成阶段启动过多子进程，`next.config.ts` 将 Next.js 构建并发限制为 2；Cloudflare 构建脚本使用 OpenNext 的 `--noMinify` 避免 Windows 压缩阶段异常，部署时仍由 Wrangler 处理 Worker 产物。这些设置不影响生产运行时并发。

## 关键目录与文件

```text
src/
├─ app/
│  ├─ api/reading/route.ts       # AI 解读服务端接口
│  ├─ api/auth/                  # 邮箱验证码、会话和退出接口
│  ├─ api/readings/              # 用户抽牌记录接口
│  ├─ api/admin/                 # 管理后台接口
│  ├─ admin/page.tsx             # 管理后台入口
│  ├─ blog/                      # SEO 内容页
│  ├─ ai-tarot/ 等主题目录        # SEO Topic Hub 页面
│  ├─ layout.tsx                 # 全局页面结构和元数据
│  ├─ page.tsx                   # 首页入口
│  ├─ sitemap.ts                 # 站点地图
│  └─ globals.css                # 全局样式与响应式设计
├─ components/
│  ├─ TarotExperience.tsx        # 游戏主流程与主要界面
│  ├─ AuthDialog.tsx             # 邮箱验证码登录
│  ├─ ReadingHistory.tsx         # 用户抽牌记录
│  ├─ AdminDashboard.tsx         # SaaS 管理后台
│  └─ SiteFooter.tsx             # 全站页脚
├─ data/
│  ├─ spreads.ts                 # 牌阵定义
│  ├─ tarot-cards.json           # 中文结构化牌义
│  └─ tarot-cards.en.json        # 英文结构化牌义
├─ i18n/                         # 语言识别、服务端语言和双语文案
├─ lib/
│  ├─ reading-prompt.ts          # AI 系统提示词与本次牌面上下文
│  ├─ reading-validation.ts      # AI 请求校验
│  ├─ auth.ts                    # 会话、权限和访客身份
│  ├─ email.ts                   # Resend 双语登录邮件
│  ├─ saved-readings.ts          # 持久化记录序列化
│  ├─ share-poster.ts            # 分享图片生成
│  └─ game.ts                    # 抽牌核心逻辑
├─ content/blog-articles.ts      # SEO 文章、FAQ、分类、标签与相关推荐
└─ types/tarot.ts                # 塔罗业务类型

docs/                             # 产品知识、AI 提示词和内容资料
public/                           # 卡牌图片与静态资源
scripts/                          # 数据生成、构建清理和 UI 冒烟测试
migrations/                       # D1 顺序迁移，不修改已上线迁移
cloudflare-env.d.ts               # 由 Wrangler 配置生成的环境类型
wrangler.jsonc                    # Worker、域名、静态资源和限流绑定
open-next.config.ts               # OpenNext Cloudflare 适配配置
next.config.ts                    # Next.js 配置
```

原始 Demo [`塔罗牌.html`](./塔罗牌.html) 仅作为设计和交互参考，不是当前生产入口。正式功能应修改 `src/` 下的 Next.js 实现。

## 本地开发

### 环境要求

- Node.js 22 或更新版本
- npm
- 如需运行 UI 冒烟测试，需要本机安装 Chrome，或通过 `CHROME_PATH` 指定 Chromium/Chrome

### 初始化

```powershell
git clone https://github.com/mimo-167/tarot.git
cd tarot
npm install
Copy-Item .env.example .env.local
npx wrangler d1 migrations apply DB --local
npm run dev
```

访问 <http://localhost:3000>。

只有当知识库内容或数据生成逻辑发生变化时，才需要运行：

```bash
npm run generate:data
```

生成后必须检查中文和英文 JSON 是否仍然一一对应，不要误覆盖人工修订的英文内容。

## 环境变量与密钥

本地开发使用 `.env.local`，示例见 [`.env.example`](./.env.example)：

```env
DEEPSEEK_API_KEY=你的密钥
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_API_URL=https://api.deepseek.com/chat/completions
RESEND_API_KEY=你的密钥
AUTH_SECRET=至少32字节的随机密钥
ADMIN_EMAIL=zhumo0110@gmail.com
RESEND_FROM_EMAIL=星月塔罗 <login@mail.tarot.zxkpg.uk>
```

规则：

- `DEEPSEEK_API_KEY`、`RESEND_API_KEY` 和 `AUTH_SECRET` 只能由服务端读取。
- `AUTH_SECRET` 用于验证码 HMAC，生产环境必须使用独立高熵值，不得与第三方 API Key 复用。
- Resend 发件域名需先完成验证；中英文邮件由用户本次界面语言决定。
- `ADMIN_EMAIL` 只标识超级管理员账号，管理员权限仍在服务端校验，前端参数不能授予角色。
- 不得使用 `NEXT_PUBLIC_` 前缀，否则密钥可能进入浏览器代码。
- 不得把真实密钥写进 README、源码、Git 提交、日志或截图。
- `.env.local`、`.dev.vars` 等本地密钥文件已被 `.gitignore` 忽略。
- 没有密钥时，本地牌义和非 AI 功能仍可使用，AI 接口会返回未配置提示。
- 如果密钥曾出现在聊天、工单或公开位置，应在服务商后台轮换，再更新本地和 Cloudflare Secret。

生产环境使用 Cloudflare Secret，并通过交互式命令录入：

```bash
npx wrangler secret put DEEPSEEK_API_KEY --name xingyue-tarot
npx wrangler secret put RESEND_API_KEY --name xingyue-tarot
npx wrangler secret put AUTH_SECRET --name xingyue-tarot
```

不要把密钥直接放在命令参数中。可用以下只读命令确认 Secret 名称是否存在，命令不会显示密钥值：

```bash
npx wrangler secret list --name xingyue-tarot
```

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动 Next.js 本地开发服务器 |
| `npm run lint` | ESLint 静态检查 |
| `npm test` | 运行 Vitest 测试 |
| `npm run build` | 构建标准 Next.js 产物 |
| `npm run cf:build` | 构建 Cloudflare/OpenNext 产物 |
| `npm run preview` | 构建并预览 Cloudflare 版本 |
| `npm run smoke:ui` | 使用本机 Chrome 运行主流程冒烟测试 |
| `npm run deploy` | 构建并部署到生产 Worker |
| `npm run cf:typegen` | 根据 Wrangler 配置生成 Cloudflare 类型 |
| `npm run generate:data` | 从知识库重新生成结构化牌义 |

D1 迁移命令：

```bash
npx wrangler d1 migrations apply DB --local
npx wrangler d1 migrations apply DB --remote
```

远程迁移会修改生产数据库；先在本地应用和验证，再执行 `--remote`。已应用迁移不可原地改写，后续结构调整应新增编号迁移。

远程运行 UI 冒烟测试时可以指定：

```powershell
$env:SMOKE_BASE_URL = "https://tarot.zxkpg.uk"
npm run smoke:ui
```

## 修改与验证流程

推荐的完整流程：

1. 阅读“修改前必读”并检查 `git status --short`。
2. 只修改任务范围内的文件，保留现有未提交内容。
3. 至少运行与改动相关的测试。
4. 提交或部署前运行完整验证：

```bash
npm run lint
npm test
npm run build
npm run cf:build
```

涉及主交互、语言切换、移动端、分享图片或抽牌流程时，再运行：

```bash
npm run smoke:ui
```

5. 检查 `git diff --check` 和 `git diff`，确认没有密钥、调试日志、构建产物或无关改动。
6. 如果本次修改改变了架构、命令、环境变量、域名、部署配置或关键行为，同步更新 README。

## Cloudflare 部署

生产部署链路：

```text
Next.js 源码
  → @opennextjs/cloudflare 构建
  → .open-next/worker.js 和静态资源
  → Wrangler
  → Cloudflare Worker: xingyue-tarot
  → https://tarot.zxkpg.uk/
```

[`wrangler.jsonc`](./wrangler.jsonc) 是 Worker 配置的事实来源，当前包括：

- Worker 名称：`xingyue-tarot`
- 自定义域名：`tarot.zxkpg.uk`
- Node.js 兼容标志：`nodejs_compat`
- 静态资源绑定：`ASSETS`
- AI 限流绑定：`AI_RATE_LIMITER`，当前为每个键每分钟 5 次
- 登录限流绑定：`AUTH_RATE_LIMITER`，当前为每个键每分钟 5 次；D1 同时限制同一邮箱的发送频率和小时额度
- D1 绑定：`DB` → `xingyue-tarot-db`，迁移目录为 `migrations/`
- 非密钥变量：`ADMIN_EMAIL`、`RESEND_FROM_EMAIL`
- 必需 Secrets：`DEEPSEEK_API_KEY`、`RESEND_API_KEY`、`AUTH_SECRET`
- Workers Observability：已启用

### 部署前

```bash
npx wrangler whoami
npm run lint
npm test
npm run cf:build
npx wrangler d1 migrations apply DB --remote
```

`npm run deploy` 会直接修改生产环境，只有在确认要发布时执行：

```bash
npm run deploy
```

部署脚本使用 `--keep-vars`，避免覆盖 Cloudflare Dashboard 中已有的变量，但仍应在部署后确认 Secret 和绑定存在。

### 部署后

```bash
npx wrangler deployments status --name xingyue-tarot
npx wrangler versions list --name xingyue-tarot
```

随后至少检查：

- <https://tarot.zxkpg.uk/> 能正常打开且使用 HTTPS。
- 中文和 English 切换正常，刷新后语言偏好仍保留。
- 抽牌、翻牌、本地解读和 AI 解读正常。
- 游客 AI 响应只包含约 30% 预览，登录后能够解锁同一次完整解读。
- 翻完牌后的保存询问、登录用户的记录查看与删除正常。
- `/admin` 只允许管理员进入，用户状态、记录管理和审计日志正常。
- 分享图可以预览并下载。
- 手机端页面没有横向溢出或按钮遮挡。

需要查看线上日志时：

```bash
npx wrangler tail xingyue-tarot
```

如新版本出现严重问题，先查询版本，再按确认过的目标版本回滚：

```bash
npx wrangler versions list --name xingyue-tarot
npx wrangler rollback <VERSION_ID> --name xingyue-tarot
```

回滚会改变生产流量，执行前必须确认目标版本 ID。

## Git 与发布约定

- GitHub 仓库是代码协作和版本记录平台；Cloudflare Workers 是实际运行平台。
- 不要提交 `.env.local`、`.dev.vars`、`.next/`、`.open-next/`、日志或测试产物。
- 不要使用会丢失用户修改的命令，例如 `git reset --hard`。
- 提交前检查 `git status`、`git diff` 和验证结果。
- 推送代码到 GitHub 不等于部署生产；当前生产发布由 `npm run deploy` 完成。
- 如果未来改为 GitHub Actions 自动部署，必须在此处记录工作流文件、触发分支和所需 Secrets。

## 业务与安全边界

- 产品用于娱乐、自我观察与启发，不宣称确定预测未来。
- AI 不得制造恐惧，不替用户做医疗、法律、财务或其他重大决定。
- AI 不应声称知道第三方的真实想法。
- 用户问题属于敏感输入，不应写入持久日志或前端分析事件。
- 用户问题、牌面与 AI 解读只在用户主动选择保存后进入 `readings`；游客完整 AI 解读暂存 24 小时用于登录解锁，并按游客 Cookie 哈希隔离。
- 管理员列表不对问题正文做全文搜索；读取详情、删除记录和修改用户状态必须通过服务端角色校验并写入审计日志。
- 登录验证码仅保存加盐 HMAC，5 分钟过期且限制尝试次数；会话令牌只保存 SHA-256 哈希。
- 修改提示词时必须同时检查提示注入隔离、输出边界和中英文行为。
- 修改牌义时要保持 78 张牌、正逆位、牌名和中英文数据的映射稳定。

## 内容现状

项目知识库包含 78 张独立牌义，但每张正文目前约为 207～278 个中文字符，尚未达到产品定位中规划的每张 1000～2000 字长资料。当前版本完整使用现有语料，不应虚构缺失内容。后续扩写知识库后，可运行 `npm run generate:data` 更新前端牌义与 AI 上下文。

## 素材许可

牌面素材来源和许可见 [`ATTRIBUTION.md`](./ATTRIBUTION.md)。新增或替换素材时，必须确认其商用与再分发许可，并同步更新署名文件。
