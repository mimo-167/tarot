import type { Locale } from "@/i18n/config";

export type AppMessages = {
  documentTitle: string;
  brandName: string;
  brandHomeLabel: string;
  mainNavigation: string;
  navSpreads: string;
  navDaily: string;
  navFavorites: string;
  ambient: string;
  soundEffects: string;
  ambientTitle: string;
  soundEffectsTitle: string;
  ambientEnable: string;
  ambientDisable: string;
  soundEffectsEnable: string;
  soundEffectsDisable: string;
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
  ritualSteps: string[];
  spreadsEyebrow: string;
  spreadsTitle: string;
  spreadsLead: string;
  spreadFilterLabel: string;
  filters: Record<"all" | "general" | "love" | "career" | "choice", string>;
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
  footerName: string;
  footerDisclaimer: string;
  cardArtwork: string;
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
  aiLoadingTitle: string;
  aiLoadingLead: string;
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
  navDaily: "每日一牌",
  navFavorites: "收藏",
  ambient: "氛围",
  soundEffects: "音效",
  ambientTitle: "环境氛围音",
  soundEffectsTitle: "交互音效",
  ambientEnable: "开启环境氛围音",
  ambientDisable: "关闭环境氛围音",
  soundEffectsEnable: "开启交互音效",
  soundEffectsDisable: "关闭交互音效",
  languageLabel: "切换到英文",
  languageButton: "EN",
  favoriteAdded: "已收藏这个牌阵",
  favoriteRemoved: "已取消收藏",
  optionsRequired: "请先写清 A、B 两个选项",
  aiDailyLimit: "今天已完成 3 次 AI 辅助解读。可以继续查看本地牌义，明天再来。",
  aiUnavailable: "AI 解读暂时没有回应",
  shareFailed: "分享图生成失败",
  heroEyebrow: "A MOMENT WITH YOURSELF",
  heroTitleLead: "向星月借一面",
  heroTitleEmphasis: "照见内心",
  heroTitleTail: "的镜子",
  heroLead: "不是仓促地得到一个答案。先放慢呼吸，亲手洗牌、选牌、逐张翻开，再让牌面陪你看见问题的不同侧面。",
  beginReading: "开始一次占卜",
  drawDailyGuide: "抽取今日指引",
  completeDeck: "张完整 RWS 牌",
  immersiveSpreads: "种沉浸式牌阵",
  layeredReading: "本地 + AI 解读",
  ritualSteps: ["选择牌阵", "默念问题", "亲手选牌", "观察与解读"],
  spreadsEyebrow: "CHOOSE YOUR SPREAD",
  spreadsTitle: "此刻，你想看见什么？",
  spreadsLead: "牌阵不是答案的模具，而是帮助你从不同角度安放问题。",
  spreadFilterLabel: "筛选牌阵",
  filters: { all: "全部", general: "通用", love: "感情", career: "事业", choice: "抉择" },
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
  enterTable: "进入塔罗牌桌",
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
  chooseAgain: "重新选择这组牌",
  dailyEyebrow: "A CARD FOR TODAY",
  dailyTitle: "今日，与你相遇的牌",
  dailyLimitNote: "一天只抽一次。它是观察的起点，不是今天的判决。",
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
  footerName: "星月塔罗 · RWS 辅助观察工具",
  footerDisclaimer: "内容仅供娱乐、自我观察与启发，不构成医疗、法律或财务建议。",
  cardArtwork: "牌面素材",
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
  aiLoadingTitle: "正在梳理牌与问题的联系",
  aiLoadingLead: "逐张读牌、检查组合，再把它们带回你的现实处境……",
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
  ambient: "Ambient",
  soundEffects: "Sound",
  ambientTitle: "Ambient sound",
  soundEffectsTitle: "Interaction sounds",
  ambientEnable: "Turn on ambient sound",
  ambientDisable: "Turn off ambient sound",
  soundEffectsEnable: "Turn on interaction sounds",
  soundEffectsDisable: "Turn off interaction sounds",
  languageLabel: "Switch to Chinese",
  languageButton: "中",
  favoriteAdded: "Spread added to favorites",
  favoriteRemoved: "Spread removed from favorites",
  optionsRequired: "Please complete both option A and option B",
  aiDailyLimit: "You have completed 3 AI-assisted readings today. Local card meanings are still available; please return tomorrow.",
  aiUnavailable: "The AI reading is temporarily unavailable",
  shareFailed: "Could not create the share image",
  heroEyebrow: "A MOMENT WITH YOURSELF",
  heroTitleLead: "Borrow a mirror",
  heroTitleEmphasis: "to see within",
  heroTitleTail: " — from the stars",
  heroLead: "There is no need to rush toward an answer. Slow your breathing, shuffle and choose the cards yourself, then turn them over one by one and notice the different sides of your question.",
  beginReading: "Begin a reading",
  drawDailyGuide: "Draw today's guidance",
  completeDeck: "complete RWS cards",
  immersiveSpreads: "immersive spreads",
  layeredReading: "local + AI insight",
  ritualSteps: ["Choose a spread", "Hold your question", "Choose your cards", "Reflect and read"],
  spreadsEyebrow: "CHOOSE YOUR SPREAD",
  spreadsTitle: "What would you like to see more clearly?",
  spreadsLead: "A spread is not a mold for an answer. It simply gives your question a few useful angles.",
  spreadFilterLabel: "Filter tarot spreads",
  filters: { all: "All", general: "General", love: "Love", career: "Career", choice: "Choices" },
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
  enterTable: "Enter the tarot table",
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
  chooseAgain: "Choose this spread again",
  dailyEyebrow: "A CARD FOR TODAY",
  dailyTitle: "The card meeting you today",
  dailyLimitNote: "One draw per day. It is a place to begin reflecting, not a verdict on your day.",
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
  footerName: "Moon & Stars Tarot · RWS reflection tool",
  footerDisclaimer: "For entertainment, reflection, and inspiration only. This is not medical, legal, or financial advice.",
  cardArtwork: "Card artwork",
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
  aiLoadingTitle: "Connecting the cards with your question",
  aiLoadingLead: "Reading each card, checking the pattern, and bringing it back to your real-life context…",
  aiErrorTitle: "The message did not arrive this time",
  tryAgain: "Try again",
  backToLocal: "Back to local meanings",
  aiReadyTitle: "Bring the cards and your question together",
  aiReadyLead: "The AI will read each position in order, explore the pattern, and offer a conditional response with practical next steps. Up to 3 readings are available each day.",
  startAi: "Start combined reading",
};

export const appMessages: Record<Locale, AppMessages> = { "zh-CN": zhCN, en };
