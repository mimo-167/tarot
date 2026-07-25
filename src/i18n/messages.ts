import type { Locale } from "@/i18n/config";

export type AppMessages = {
  documentTitle: string;
  brandName: string;
  brandHomeLabel: string;
  mainNavigation: string;
  navSpreads: string;
  navDaily: string;
  navFavorites: string;
  languageLabel: string;
  languageButton: string;
  favoriteAdded: string;
  favoriteRemoved: string;
  optionsRequired: string;
  aiDailyLimit: string;
  aiUnavailable: string;
  shareFailed: string;
  heroEyebrow: string;
  heroTitleLead: string;
  heroTitleEmphasis: string;
  heroTitleTail: string;
  heroLead: string;
  beginReading: string;
  drawDailyGuide: string;
  completeDeck: string;
  immersiveSpreads: string;
  layeredReading: string;
  spreadsEyebrow: string;
  spreadsTitle: string;
  spreadsLead: string;
  spreadFilterLabel: string;
  filters: Record<"all" | "general" | "love" | "career" | "self", string>;
  basicSpreads: string;
  advancedSpreads: string;
  suitableQuestions: string;
  ethicalNote: string;
  favoritesEyebrow: string;
  favoritesTitle: string;
  favoritesLead: string;
  favoritesEmptyTitle: string;
  favoritesEmptyLead: string;
  browseSpreads: string;
  settleQuestion: string;
  chooseAnotherSpread: string;
  cardsUnit: (count: number) => string;
  questionLabel: string;
  questionOptional: string;
  questionPlaceholder: string;
  contextLabel: string;
  optional: string;
  contextPlaceholder: string;
  timeframeLabel: string;
  timeframePlaceholder: string;
  optionA: string;
  optionB: string;
  firstPath: string;
  secondPath: string;
  or: string;
  positionOrder: string;
  enterTable: string;
  preparationEyebrow: string;
  preparationTitle: string;
  preparationLead: string;
  preparationSteps: string[];
  preparationWaiting: string;
  preparationReady: string;
  preparationBack: string;
  backToQuestion: string;
  chooseCards: string;
  chooseCardAria: (index: number) => string;
  nextPosition: string;
  selectionComplete: string;
  cardsReady: string;
  selectedCardsAria: string;
  shuffling: string;
  reshuffle: string;
  undo: string;
  finishSelection: string;
  cardsArrived: string;
  allRevealed: string;
  revealPrompt: (index: number, position: string) => string;
  revealAria: (position: string) => string;
  waitingReveal: string;
  revealThisCard: string;
  viewLocalMeaning: string;
  aiReading: string;
  keepCards: string;
  cardsKept: string;
  generateShare: string;
  shareReading: string;
  shareGenerating: string;
  sharePreviewTitle: string;
  sharePreviewLead: string;
  sharePreviewAlt: string;
  shareDownload: string;
  shareDownloadHint: string;
  shareClose: string;
  chooseAgain: string;
  dailyEyebrow: string;
  dailyTitle: string;
  dailyLimitNote: string;
  drawDailyAria: string;
  revealDailyAria: string;
  dailyTouchTitle: string;
  dailyTouchLead: string;
  dailyChosenTitle: string;
  dailyChosenLead: string;
  revealCard: string;
  dailyGuide: string;
  takeaway: string;
  generateDailyShare: string;
  favoriteAria: (name: string) => string;
  unfavoriteAria: (name: string) => string;
  chooseSpread: string;
  readingTitle: string;
  closeReading: string;
  localMeanings: string;
  aiAnalysis: string;
  questionReadingIntro: (question: string) => string;
  openReadingIntro: string;
  synthesisTitle: string;
  continueAi: string;
  aiLoadingMessages: string[];
  aiErrorTitle: string;
  tryAgain: string;
  backToLocal: string;
  aiReadyTitle: string;
  aiReadyLead: string;
  startAi: string;
};

const zhCN: AppMessages = {
  documentTitle: "星月塔罗｜沉浸式 RWS 塔罗",
  brandName: "星月塔罗",
  brandHomeLabel: "返回星月塔罗首页",
  mainNavigation: "主导航",
  navSpreads: "牌阵",
  navDaily: "日运牌",
  navFavorites: "收藏",
  languageLabel: "切换到英文",
  languageButton: "English",
  favoriteAdded: "已收藏这个牌阵",
  favoriteRemoved: "已取消收藏",
  optionsRequired: "请先写清 A、B 两个选项",
  aiDailyLimit: "今天已完成 3 次 AI 辅助解读。可以继续查看本地牌义，明天再来。",
  aiUnavailable: "AI 解读暂时没有回应",
  shareFailed: "分享图生成失败",
  heroEyebrow: "A MOMENT WITH YOURSELF",
  heroTitleLead: "每一张牌，都是一次",
  heroTitleEmphasis: "与自己",
  heroTitleTail: "的对话。",
  heroLead: "选择牌阵，专注于你的问题，让 AI 帮助你探索每张牌背后的意义。",
  beginReading: "进入牌阵选择",
  drawDailyGuide: "日运牌",
  completeDeck: "张完整 RWS 牌",
  immersiveSpreads: "种沉浸式牌阵",
  layeredReading: "本地 + AI 解读",
  spreadsEyebrow: "CHOOSE YOUR SPREAD",
  spreadsTitle: "选择你的牌阵",
  spreadsLead: "每一种牌阵，都适合不同的问题。",
  spreadFilterLabel: "筛选牌阵",
  filters: { all: "全部", general: "通用", love: "感情", career: "事业", self: "自我探索" },
  basicSpreads: "基础牌阵",
  advancedSpreads: "进阶牌阵",
  suitableQuestions: "适合提问",
  ethicalNote: "塔罗用于娱乐、自我观察与启发；它不会替你读取他人内心，也不会替你作重大决定。",
  favoritesEyebrow: "YOUR COLLECTION",
  favoritesTitle: "收藏的牌阵",
  favoritesLead: "把常用的观察方式留在手边，下次更快进入仪式。",
  favoritesEmptyTitle: "收藏夹还是空的",
  favoritesEmptyLead: "在牌阵右上角点亮心形，就能把它留在这里。",
  browseSpreads: "去看看牌阵",
  settleQuestion: "让问题先沉静下来",
  chooseAnotherSpread: "← 重新选择牌阵",
  cardsUnit: (count) => `${count} 张牌`,
  questionLabel: "你想问的问题",
  questionOptional: "可以留空，让牌面自由呈现",
  questionPlaceholder: "例如：未来三个月，我在工作中最值得关注的方向是什么？",
  contextLabel: "补充背景",
  optional: "选填",
  contextPlaceholder: "只写与问题有关的事实",
  timeframeLabel: "时间范围",
  timeframePlaceholder: "如：未来三个月",
  optionA: "选项 A",
  optionB: "选项 B",
  firstPath: "第一条道路",
  secondPath: "第二条道路",
  or: "或",
  positionOrder: "牌位顺序",
  enterTable: "进入静心引导",
  preparationEyebrow: "BEFORE THE DRAW",
  preparationTitle: "先让问题安静地留在心里",
  preparationLead: "如果方便，轻轻闭上眼睛。这里没有需要立刻得到的答案，只需要给自己几秒钟，听见真正想问的是什么。",
  preparationSteps: ["放松肩膀，做一次缓慢的呼吸", "在心里默念你最想看清的问题", "不追逐答案，只留意此刻最真实的感受"],
  preparationWaiting: "让这一刻再停留几秒…",
  preparationReady: "我准备好了，开始选牌",
  preparationBack: "← 返回修改问题",
  backToQuestion: "← 返回问题",
  chooseCards: "请凭直觉选择卡牌",
  chooseCardAria: (index) => `选择第 ${index} 张牌`,
  nextPosition: "下一张牌位",
  selectionComplete: "选择完成",
  cardsReady: "牌已齐，请确认",
  selectedCardsAria: "已经选择的牌",
  shuffling: "洗牌中",
  reshuffle: "重新洗牌",
  undo: "撤回",
  finishSelection: "完成选牌",
  cardsArrived: "THE CARDS HAVE ARRIVED",
  allRevealed: "所有牌已经展开。先看看它们带给你的第一感受。",
  revealPrompt: (index, position) => `请翻开第 ${index} 张：${position}`,
  revealAria: (position) => `翻开${position}`,
  waitingReveal: "等待翻牌",
  revealThisCard: "翻开这一张",
  viewLocalMeaning: "查看本地牌义",
  aiReading: "AI 综合解读",
  keepCards: "暂不解读",
  cardsKept: "已保留牌面，你可以慢慢观察",
  generateShare: "生成分享图",
  shareReading: "生成解读分享图",
  shareGenerating: "正在生成分享图…",
  sharePreviewTitle: "分享图已经准备好",
  sharePreviewLead: "先查看缩略预览，确认后再下载高清图片到本地。",
  sharePreviewAlt: "塔罗分享图缩略预览",
  shareDownload: "下载高清图片",
  shareDownloadHint: "图片不会自动打开系统共享窗口；点击下载后会保存到浏览器的默认下载位置。",
  shareClose: "关闭分享图预览",
  chooseAgain: "重新选择这组牌",
  dailyEyebrow: "A CARD FOR TODAY",
  dailyTitle: "日运牌",
  dailyLimitNote: "来自宇宙的小小提醒。",
  drawDailyAria: "抽取今日一牌",
  revealDailyAria: "翻开今日一牌",
  dailyTouchTitle: "把手放在牌背上",
  dailyTouchLead: "停一秒，想想今天你希望带着怎样的状态生活。",
  dailyChosenTitle: "这张牌已经选定",
  dailyChosenLead: "准备好时，亲手把它翻开。",
  revealCard: "翻开卡牌",
  dailyGuide: "今日指引",
  takeaway: "可以带走的提醒",
  generateDailyShare: "生成今日牌分享图",
  favoriteAria: (name) => `收藏${name}`,
  unfavoriteAria: (name) => `取消收藏${name}`,
  chooseSpread: "选择此牌阵",
  readingTitle: "辅助解读",
  closeReading: "关闭解读",
  localMeanings: "本地牌义",
  aiAnalysis: "AI 综合分析",
  questionReadingIntro: (question) => `围绕“${question}”，先逐张看牌，再观察它们之间的呼应。`,
  openReadingIntro: "你没有限定问题，可以把注意力放在牌面此刻最触动你的部分。",
  synthesisTitle: "这组牌连起来看",
  continueAi: "继续请求 AI 综合解读",
  aiLoadingMessages: [
    "正在理解牌与牌之间的联系……",
    "正在分析牌面的象征意义……",
    "正在结合你的问题……",
    "正在生成属于你的解读……",
  ],
  aiErrorTitle: "这一次，星光没有顺利抵达",
  tryAgain: "稍后再试",
  backToLocal: "返回本地牌义",
  aiReadyTitle: "让牌面与问题连成一条线",
  aiReadyLead: "AI 会按顺序逐张解释、分析组合，再给出有条件的回应和现实建议。每日可完成 3 次。",
  startAi: "开始综合解读",
};

const en: AppMessages = {
  documentTitle: "Moon & Stars Tarot | Immersive RWS Tarot",
  brandName: "Moon & Stars Tarot",
  brandHomeLabel: "Return to the Moon & Stars Tarot home page",
  mainNavigation: "Main navigation",
  navSpreads: "Spreads",
  navDaily: "Daily Card",
  navFavorites: "Favorites",
  languageLabel: "Switch to Chinese",
  languageButton: "中文",
  favoriteAdded: "Spread added to favorites",
  favoriteRemoved: "Spread removed from favorites",
  optionsRequired: "Please complete both option A and option B",
  aiDailyLimit: "You have completed 3 AI-assisted readings today. Local card meanings are still available; please return tomorrow.",
  aiUnavailable: "The AI reading is temporarily unavailable",
  shareFailed: "Could not create the share image",
  heroEyebrow: "A MOMENT WITH YOURSELF",
  heroTitleLead: "Every Card Holds a",
  heroTitleEmphasis: "Conversation",
  heroTitleTail: " With Yourself.",
  heroLead: "Choose a spread, focus on your question, and let AI help you explore the deeper meaning behind every card.",
  beginReading: "Choose a spread",
  drawDailyGuide: "Daily Card",
  completeDeck: "complete RWS cards",
  immersiveSpreads: "immersive spreads",
  layeredReading: "local + AI insight",
  spreadsEyebrow: "CHOOSE YOUR SPREAD",
  spreadsTitle: "Choose Your Spread",
  spreadsLead: "Every spread tells a different story.",
  spreadFilterLabel: "Filter tarot spreads",
  filters: { all: "All", general: "General", love: "Love", career: "Career", self: "Self-Discovery" },
  basicSpreads: "Essential spreads",
  advancedSpreads: "Advanced spreads",
  suitableQuestions: "Questions to ask",
  ethicalNote: "Tarot is for entertainment, reflection, and inspiration. It cannot read another person's mind or make major decisions for you.",
  favoritesEyebrow: "YOUR COLLECTION",
  favoritesTitle: "Favorite spreads",
  favoritesLead: "Keep the perspectives you return to close at hand, ready for your next quiet moment.",
  favoritesEmptyTitle: "Your favorites are empty",
  favoritesEmptyLead: "Select the heart on any spread to keep it here.",
  browseSpreads: "Browse spreads",
  settleQuestion: "Let the question grow quiet",
  chooseAnotherSpread: "← Choose another spread",
  cardsUnit: (count) => `${count} ${count === 1 ? "card" : "cards"}`,
  questionLabel: "What would you like to ask?",
  questionOptional: "Optional — let the cards speak freely",
  questionPlaceholder: "For example: What direction deserves my attention at work over the next three months?",
  contextLabel: "Background",
  optional: "Optional",
  contextPlaceholder: "Include only facts related to your question",
  timeframeLabel: "Timeframe",
  timeframePlaceholder: "For example: the next three months",
  optionA: "Option A",
  optionB: "Option B",
  firstPath: "The first path",
  secondPath: "The second path",
  or: "or",
  positionOrder: "Position order",
  enterTable: "Continue to a quiet moment",
  preparationEyebrow: "BEFORE THE DRAW",
  preparationTitle: "Let the question settle within you",
  preparationLead: "If it feels comfortable, gently close your eyes. There is no answer to chase right away—just give yourself a few seconds to hear what you truly want to ask.",
  preparationSteps: ["Relax your shoulders and take one slow breath", "Silently repeat the question you most want to understand", "Let go of forcing an answer and notice what feels most honest"],
  preparationWaiting: "Stay with this moment for a few more seconds…",
  preparationReady: "I’m ready to choose my cards",
  preparationBack: "← Back to edit the question",
  backToQuestion: "← Back to question",
  chooseCards: "Choose your cards by intuition",
  chooseCardAria: (index) => `Choose card ${index}`,
  nextPosition: "Next position",
  selectionComplete: "Selection complete",
  cardsReady: "All cards selected — confirm when ready",
  selectedCardsAria: "Selected cards",
  shuffling: "Shuffling",
  reshuffle: "Shuffle again",
  undo: "Undo",
  finishSelection: "Finish selection",
  cardsArrived: "THE CARDS HAVE ARRIVED",
  allRevealed: "All cards are open. Pause and notice your first response to them.",
  revealPrompt: (index, position) => `Reveal card ${index}: ${position}`,
  revealAria: (position) => `Reveal ${position}`,
  waitingReveal: "Waiting to be revealed",
  revealThisCard: "Reveal this card",
  viewLocalMeaning: "View local meanings",
  aiReading: "AI combined reading",
  keepCards: "Reflect for now",
  cardsKept: "Your cards are staying open so you can take your time",
  generateShare: "Create share image",
  shareReading: "Create a reading image",
  shareGenerating: "Creating your share image…",
  sharePreviewTitle: "Your share image is ready",
  sharePreviewLead: "Review the smaller preview first, then download the full-resolution image to your device.",
  sharePreviewAlt: "Preview of the tarot share image",
  shareDownload: "Download full-resolution image",
  shareDownloadHint: "No system share window will open. The image will be saved to your browser’s default download location.",
  shareClose: "Close share image preview",
  chooseAgain: "Choose this spread again",
  dailyEyebrow: "A CARD FOR TODAY",
  dailyTitle: "Daily Card",
  dailyLimitNote: "A small reminder from the universe.",
  drawDailyAria: "Draw today's card",
  revealDailyAria: "Reveal today's card",
  dailyTouchTitle: "Rest your hand on the card",
  dailyTouchLead: "Pause for a moment and consider how you would like to move through today.",
  dailyChosenTitle: "Your card has been chosen",
  dailyChosenLead: "Turn it over yourself when you feel ready.",
  revealCard: "Reveal card",
  dailyGuide: "Today's guidance",
  takeaway: "A reminder to carry with you",
  generateDailyShare: "Create today's share image",
  favoriteAria: (name) => `Add ${name} to favorites`,
  unfavoriteAria: (name) => `Remove ${name} from favorites`,
  chooseSpread: "Choose this spread",
  readingTitle: "Guided reading",
  closeReading: "Close reading",
  localMeanings: "Local meanings",
  aiAnalysis: "AI combined analysis",
  questionReadingIntro: (question) => `With “${question}” in mind, begin with each card, then notice how they respond to one another.`,
  openReadingIntro: "You left the question open. Notice which part of the cards draws your attention most strongly right now.",
  synthesisTitle: "Reading the cards together",
  continueAi: "Continue to the AI combined reading",
  aiLoadingMessages: [
    "Reading the relationships between the cards...",
    "Interpreting the symbolism...",
    "Connecting your question with the spread...",
    "Preparing your personalized reading...",
  ],
  aiErrorTitle: "The message did not arrive this time",
  tryAgain: "Try again",
  backToLocal: "Back to local meanings",
  aiReadyTitle: "Bring the cards and your question together",
  aiReadyLead: "The AI will read each position in order, explore the pattern, and offer a conditional response with practical next steps. Up to 3 readings are available each day.",
  startAi: "Start combined reading",
};

export const appMessages: Record<Locale, AppMessages> = { "zh-CN": zhCN, en };
