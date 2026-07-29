"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { localizeSpread, spreads } from "@/data/spreads";
import { appMessages } from "@/i18n/messages";
import { AuthDialog } from "@/components/AuthDialog";
import { ReadingHistory } from "@/components/ReadingHistory";
import { SaveReadingDialog } from "@/components/SaveReadingDialog";
import { SiteFooter } from "@/components/SiteFooter";
import type { Locale } from "@/i18n/config";
import type { SessionUser } from "@/types/account";
import type { AppView, DrawnCard, ReadingRequest, Spread, TarotCard } from "@/types/tarot";

type TarotGame = typeof import("@/lib/game");
type TableCard = import("@/lib/game").TableCard;
type TarotResources = { cards: TarotCard[]; game: TarotGame };

const ReactMarkdown = dynamic(() => import("react-markdown"), {
  loading: () => <p aria-live="polite">…</p>,
});
let tarotResourcesPromise: Promise<TarotResources> | undefined;
const loadTarotResources = () => {
  tarotResourcesPromise ??= Promise.all([
    import("@/data/tarot-cards.json"),
    import("@/lib/game"),
  ]).then(([cardsModule, game]) => ({ cards: cardsModule.default as TarotCard[], game }));
  return tarotResourcesPromise;
};
const DAILY_SPREAD: Spread = {
  id: "daily",
  name: "每日一牌",
  nameEn: "Daily Card",
  eyebrow: "今日指引",
  eyebrowEn: "Today's Guidance",
  description: "用一张牌观察今天值得留意的主题。",
  descriptionEn: "Use one card to notice a theme worth carrying through today.",
  positions: ["今日指引"],
  positionsEn: ["Today's guidance"],
  questions: ["今天最值得留意的主题是什么？"],
  questionsEn: ["What theme deserves my attention today?"],
  category: "general",
  difficulty: "basic",
};
const localDayKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const displayDate = (locale: Locale, date = new Date()) =>
  new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" }).format(date);
const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));
const secureRandom = () => {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    return crypto.getRandomValues(new Uint32Array(1))[0] / 4_294_967_296;
  }
  return Math.random();
};

type QuestionDraft = { question: string; context: string; timeframe: string; optionA: string; optionB: string };
type DailyRecord = { date: string; cardId: string; orientation: "upright" | "reversed"; revealed: boolean };
type Notice = { text: string; tone?: "default" | "error" } | null;
type SpreadFilter = "all" | Spread["category"];
type SharePreviewState = { url: string; fileName: string; locale: Locale } | null;
type AuthReason = "login" | "unlock" | "save";

const initialQuestion: QuestionDraft = {
  question: "",
  context: "",
  timeframe: "",
  optionA: "",
  optionB: "",
};

function Icon({ name }: { name: "moon" | "spark" | "heart" | "arrow" | "share" }) {
  const paths = {
    moon: <path d="M20.2 15.5A8.3 8.3 0 0 1 8.5 3.8 9 9 0 1 0 20.2 15.5Z" />,
    spark: <path d="m12 2 1.7 5.3L19 9l-5.3 1.7L12 16l-1.7-5.3L5 9l5.3-1.7L12 2Zm7 13 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 10.5 6.8-4m-6.8 7 6.8 4" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="icon">{paths[name]}</svg>;
}

export function TarotExperience({
  initialLocale,
  initialSpreadId,
  initialView = "home",
}: {
  initialLocale: Locale;
  initialSpreadId?: string;
  initialView?: AppView;
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const localeRef = useRef(initialLocale);
  const copy = appMessages[locale];
  const [view, setView] = useState<AppView>(initialView);
  const [selectedSpread, setSelectedSpread] = useState<Spread>(
    spreads.find((spread) => spread.id === initialSpreadId) ?? spreads[0],
  );
  const [question, setQuestion] = useState<QuestionDraft>(initialQuestion);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [spreadFilter, setSpreadFilter] = useState<SpreadFilter>("all");
  const [deck, setDeck] = useState<TableCard[]>([]);
  const [picked, setPicked] = useState<DrawnCard[]>([]);
  const pickedRef = useRef<DrawnCard[]>([]);
  const [shuffling, setShuffling] = useState(false);
  const busyRef = useRef(false);
  const [shufflePhase, setShufflePhase] = useState<"idle" | "gather" | "weave" | "scatter">("idle");
  const [revealCursor, setRevealCursor] = useState(0);
  const [readingOpen, setReadingOpen] = useState(false);
  const [readingTab, setReadingTab] = useState<"local" | "ai">("local");
  const [aiReading, setAiReading] = useState("");
  const [aiPreview, setAiPreview] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [preparationStep, setPreparationStep] = useState(0);
  const [preparationReady, setPreparationReady] = useState(false);
  const [sharePreview, setSharePreview] = useState<SharePreviewState>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [daily, setDaily] = useState<DailyRecord | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authReason, setAuthReason] = useState<AuthReason>("login");
  const [savePromptOpen, setSavePromptOpen] = useState(false);
  const [saveAfterLogin, setSaveAfterLogin] = useState(false);
  const [savingReading, setSavingReading] = useState(false);
  const [savedReadingId, setSavedReadingId] = useState<string | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const tarotResources = useRef<TarotResources | null>(null);
  const sharePreviewUrl = useRef<string | null>(null);
  const [loadedCards, setLoadedCards] = useState<TarotCard[] | null>(null);
  const [tarotGame, setTarotGame] = useState<TarotGame | null>(null);

  useEffect(() => {
    localeRef.current = locale;
    document.documentElement.lang = locale;
    document.title = appMessages[locale].documentTitle;
  }, [locale]);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session")
      .then((response) => response.json())
      .then((result: { user?: SessionUser | null }) => {
        if (active) setUser(result.user || null);
      })
      .catch(() => {
        // Guest mode remains fully usable if session lookup is temporarily unavailable.
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (view !== "preparation") return;
    const timers = [
      window.setTimeout(() => setPreparationStep(1), 800),
      window.setTimeout(() => setPreparationStep(2), 1_600),
      window.setTimeout(() => setPreparationReady(true), 2_400),
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [view]);

  useEffect(() => () => {
    if (sharePreviewUrl.current) URL.revokeObjectURL(sharePreviewUrl.current);
  }, []);

  const closeSharePreview = useCallback(() => {
    if (sharePreviewUrl.current) URL.revokeObjectURL(sharePreviewUrl.current);
    sharePreviewUrl.current = null;
    setSharePreview(null);
  }, []);

  const toggleLanguage = () => {
    const next: Locale = locale === "zh-CN" ? "en" : "zh-CN";
    localeRef.current = next;
    setLocale(next);
    setAiReading("");
    setAiError("");
    closeSharePreview();
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `tarot_locale=${encodeURIComponent(next)}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`;
  };

  const showNotice = useCallback((text: string, tone: NonNullable<Notice>["tone"] = "default") => {
    setNotice({ text, tone });
    window.setTimeout(() => setNotice(null), 2800);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setFavorites(JSON.parse(localStorage.getItem("xingyue:favorites") || "[]"));
        const storedDaily = JSON.parse(localStorage.getItem("xingyue:daily") || "null") as DailyRecord | null;
        const today = localDayKey();
        const legacyToday = new Intl.DateTimeFormat("zh-CN", { dateStyle: "short" }).format(new Date());
        if (storedDaily?.date === today) setDaily(storedDaily);
        else if (storedDaily?.date === legacyToday) {
          const migrated = { ...storedDaily, date: today };
          setDaily(migrated);
          localStorage.setItem("xingyue:daily", JSON.stringify(migrated));
        }
      } catch {
        // A privacy mode may make localStorage unavailable; the core ritual still works.
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const ensureCardCatalog = useCallback(async () => {
    tarotResources.current ??= await loadTarotResources();
    setLoadedCards((current) => current ?? tarotResources.current?.cards ?? null);
    setTarotGame((current) => current ?? tarotResources.current?.game ?? null);
    return tarotResources.current;
  }, []);

  const chooseSpread = (spread: Spread) => {
    setSelectedSpread(spread);
    setView("question");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleFavorite = (id: string) => {
    const next = favorites.includes(id) ? favorites.filter((item) => item !== id) : [...favorites, id];
    setFavorites(next);
    localStorage.setItem("xingyue:favorites", JSON.stringify(next));
    showNotice(next.includes(id) ? copy.favoriteAdded : copy.favoriteRemoved);
  };

  const resetReadingState = useCallback((newDeck = true) => {
    pickedRef.current = [];
    setPicked([]);
    setRevealCursor(0);
    setReadingOpen(false);
    setAiReading("");
    setAiPreview(false);
    setPreviewId(null);
    setAiError("");
    setSavePromptOpen(false);
    setSaveAfterLogin(false);
    setSavedReadingId(null);
    const resources = tarotResources.current;
    if (newDeck && resources) setDeck(resources.game.createTableDeck(resources.cards));
  }, []);

  const enterPreparation = () => {
    if (selectedSpread.needsOptions && (!question.optionA.trim() || !question.optionB.trim())) {
      showNotice(copy.optionsRequired, "error");
      return;
    }
    setPreparationStep(0);
    setPreparationReady(false);
    setView("preparation");
    window.scrollTo({ top: 0, behavior: "smooth" });
    void ensureCardCatalog();
  };

  const enterTable = async () => {
    await ensureCardCatalog();
    resetReadingState(true);
    setView("table");
  };

  const selectCard = (card: TableCard) => {
    if (busyRef.current || card.selected || pickedRef.current.length >= selectedSpread.positions.length) return;
    const drawn: DrawnCard = { ...card };
    const next = [...pickedRef.current, drawn];
    pickedRef.current = next;
    setPicked(next);
    setDeck((current) => current.map((item) => (item.id === card.id ? { ...item, selected: true } : item)));
  };

  const undoPick = () => {
    if (busyRef.current || !pickedRef.current.length) return;
    const last = pickedRef.current.at(-1)!;
    const next = pickedRef.current.slice(0, -1);
    pickedRef.current = next;
    setPicked(next);
    setDeck((current) => current.map((item) => (item.id === last.id ? { ...item, selected: false } : item)));
  };

  const shuffleCards = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setShuffling(true);
    pickedRef.current = [];
    setPicked([]);
    setDeck((current) => current.map((card) => ({ ...card, selected: false })));
    setShufflePhase("gather");
    await wait(720);
    setShufflePhase("weave");
    await wait(780);
    setShufflePhase("scatter");
    const resources = tarotResources.current;
    if (resources) setDeck(resources.game.createTableDeck(resources.cards));
    await wait(760);
    setShufflePhase("idle");
    setShuffling(false);
    busyRef.current = false;
  };

  const finishPick = () => {
    if (pickedRef.current.length !== selectedSpread.positions.length) return;
    const ready = pickedRef.current.map((card) => ({ ...card, revealed: false }));
    pickedRef.current = ready;
    setPicked(ready);
    setRevealCursor(0);
    setView("reveal");
  };

  const revealCard = (index: number) => {
    if (index !== revealCursor) return;
    const next = pickedRef.current.map((card, cardIndex) =>
      cardIndex === index ? { ...card, revealed: true } : card,
    );
    pickedRef.current = next;
    setPicked(next);
    setRevealCursor(index + 1);
    if (user && index === pickedRef.current.length - 1) {
      window.setTimeout(() => setSavePromptOpen(true), 450);
    }
  };

  const allRevealed = picked.length > 0 && revealCursor === picked.length;

  const createReadingRequest = useCallback((requestLocale: Locale): ReadingRequest => ({
    locale: requestLocale,
    question: question.question,
    context: question.context,
    timeframe: question.timeframe,
    spread: localizeSpread(selectedSpread, requestLocale),
    options: selectedSpread.needsOptions ? { a: question.optionA, b: question.optionB } : null,
    cards: pickedRef.current.map((card, index) => ({
      id: card.id,
      position: localizeSpread(selectedSpread, requestLocale).positions[index],
      orientation: card.orientation,
    })),
  }), [question, selectedSpread]);

  const persistReading = useCallback(async (reading = "") => {
    if (savingReading) return savedReadingId;
    setSavingReading(true);
    try {
      if (savedReadingId) {
        if (reading) {
          const response = await fetch(`/api/readings/${encodeURIComponent(savedReadingId)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ aiReading: reading }),
          });
          if (!response.ok) {
            const result = await response.json() as { error?: string };
            throw new Error(result.error || copy.aiUnavailable);
          }
        }
        return savedReadingId;
      }
      const response = await fetch("/api/readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: createReadingRequest(localeRef.current),
          aiReading: reading,
        }),
      });
      const result = await response.json() as { id?: string; error?: string };
      if (!response.ok || !result.id) throw new Error(result.error || copy.aiUnavailable);
      setSavedReadingId(result.id);
      setHistoryRefreshKey((current) => current + 1);
      showNotice(localeRef.current === "zh-CN" ? "这次抽牌已经保存" : "This reading has been saved");
      return result.id;
    } catch (error) {
      showNotice(error instanceof Error ? error.message : copy.aiUnavailable, "error");
      return null;
    } finally {
      setSavingReading(false);
    }
  }, [copy.aiUnavailable, createReadingRequest, savedReadingId, savingReading, showNotice]);

  const openAuth = (reason: AuthReason) => {
    setAuthReason(reason);
    setAuthOpen(true);
  };

  const unlockPreview = useCallback(async (id: string) => {
    const response = await fetch(`/api/reading-preview/${encodeURIComponent(id)}`);
    const result = await response.json() as { reading?: string; error?: string };
    if (!response.ok || !result.reading) {
      throw new Error(result.error || appMessages[localeRef.current].aiUnavailable);
    }
    setAiReading(result.reading);
    setAiPreview(false);
    setPreviewId(null);
    return result.reading;
  }, []);

  const handleAuthenticated = useCallback(async (authenticatedUser: SessionUser) => {
    setUser(authenticatedUser);
    let completeReading = aiReading;
    let unlocked = false;
    if (aiPreview && previewId) {
      try {
        completeReading = await unlockPreview(previewId);
        unlocked = true;
      } catch (error) {
        completeReading = "";
        showNotice(
          error instanceof Error ? error.message : appMessages[localeRef.current].aiUnavailable,
          "error",
        );
      }
    }
    if (saveAfterLogin) {
      await persistReading(completeReading);
      setSaveAfterLogin(false);
    } else if (unlocked) {
      setSavePromptOpen(true);
    }
  }, [aiPreview, aiReading, persistReading, previewId, saveAfterLogin, showNotice, unlockPreview]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setAiReading("");
    setAiPreview(false);
    setPreviewId(null);
    setSavedReadingId(null);
    if (view === "history") setView("home");
  };

  const requestAiReading = async () => {
    if (!allRevealed || aiLoading) return;
    const requestLocale = locale;
    const day = localDayKey();
    const counterKey = "xingyue:ai-usage";
    const usage = JSON.parse(localStorage.getItem(counterKey) || "null") as { date: string; count: number } | null;
    if (usage?.date === day && usage.count >= 3) {
      setAiError(copy.aiDailyLimit);
      return;
    }
    setAiLoading(true);
    setAiError("");
    setReadingOpen(true);
    setReadingTab("ai");
    let clientId = localStorage.getItem("xingyue:client-id");
    if (!clientId) {
      clientId = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
      localStorage.setItem("xingyue:client-id", clientId);
    }
    const payload = createReadingRequest(requestLocale);
    try {
      const response = await fetch("/api/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tarot-client": clientId, "x-tarot-locale": requestLocale },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as {
        reading?: string;
        error?: string;
        isPreview?: boolean;
        previewId?: string;
      };
      if (!response.ok || !result.reading) throw new Error(result.error || appMessages[requestLocale].aiUnavailable);
      if (localeRef.current === requestLocale) {
        setAiReading(result.reading);
        setAiPreview(Boolean(result.isPreview));
        setPreviewId(result.previewId || null);
      }
      if (!result.isPreview && savedReadingId) {
        await persistReading(result.reading);
      }
      localStorage.setItem(counterKey, JSON.stringify({ date: day, count: usage?.date === day ? usage.count + 1 : 1 }));
    } catch (error) {
      if (localeRef.current === requestLocale) {
        setAiError(error instanceof Error ? error.message : appMessages[requestLocale].aiUnavailable);
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleShare = async (shareCards: DrawnCard[], spread: Spread, reading = "") => {
    if (shareLoading) return;
    const requestLocale = locale;
    setShareLoading(true);
    try {
      const { createSharePoster, getShareFileName } = await import("@/lib/share-poster");
      const blob = await createSharePoster(shareCards, spread, requestLocale, reading);
      if (sharePreviewUrl.current) URL.revokeObjectURL(sharePreviewUrl.current);
      const url = URL.createObjectURL(blob);
      sharePreviewUrl.current = url;
      setSharePreview({ url, fileName: getShareFileName(spread, requestLocale), locale: requestLocale });
    } catch (error) {
      showNotice(error instanceof Error ? error.message : copy.shareFailed, "error");
    } finally {
      setShareLoading(false);
    }
  };

  const openDaily = async () => {
    await ensureCardCatalog();
    setView("daily");
  };

  const drawDaily = async () => {
    if (daily) return;
    const { cards } = await ensureCardCatalog();
    const card = cards[Math.floor(secureRandom() * cards.length)];
    const record: DailyRecord = {
      date: localDayKey(),
      cardId: card.id,
      orientation: secureRandom() < 0.5 ? "upright" : "reversed",
      revealed: false,
    };
    setDaily(record);
    localStorage.setItem("xingyue:daily", JSON.stringify(record));
  };

  const revealDaily = () => {
    if (!daily || daily.revealed) return;
    const next = { ...daily, revealed: true };
    setDaily(next);
    localStorage.setItem("xingyue:daily", JSON.stringify(next));
  };

  const dailyCard = daily ? loadedCards?.find((card) => card.id === daily.cardId) : null;
  const dailyDrawn: DrawnCard | null = daily && dailyCard
    ? { ...dailyCard, orientation: daily.orientation, revealed: daily.revealed }
    : null;
  const favoriteSpreads = spreads.filter((spread) => favorites.includes(spread.id));
  const filteredSpreads = spreads.filter((spread) => spreadFilter === "all" || spread.category === spreadFilter);
  const selectedSpreadCopy = localizeSpread(selectedSpread, locale);
  const dailyCardCopy = dailyDrawn && tarotGame ? tarotGame.getCardCopy(dailyDrawn, locale) : null;

  return (
    <main className={`site view-${view}`}>
      <div className="sky" aria-hidden="true"><span className="shooting-star" /><span className="shooting-star second" /></div>
      <header className="nav-shell">
        <button className="brand" onClick={() => setView("home")} aria-label={copy.brandHomeLabel}>
          <span className="brand-mark"><Icon name="moon" /></span>
          <span><strong>{copy.brandName}</strong><small>RWS TAROT</small></span>
        </button>
        <nav aria-label={copy.mainNavigation}>
          <button className={view === "spreads" ? "active" : ""} onClick={() => setView("spreads")}>{copy.navSpreads}</button>
          <button className={view === "daily" ? "active" : ""} onClick={() => void openDaily()}>{copy.navDaily}</button>
          <button className={view === "favorites" ? "active" : ""} onClick={() => setView("favorites")}>{copy.navFavorites}</button>
          <Link href="/blog">Blog</Link>
        </nav>
        <div className="header-controls">
          {user ? <>
            <button className="account-button" onClick={() => setView("history")} title={user.email}>
              <span aria-hidden="true">✦</span><b>{user.email}</b>
            </button>
            <button className="logout-button" onClick={() => void logout()} title={locale === "zh-CN" ? "退出登录" : "Sign out"} aria-label={locale === "zh-CN" ? "退出登录" : "Sign out"}>↗</button>
          </> : <button className="account-button guest" onClick={() => openAuth("login")}>
            <span aria-hidden="true">✦</span><b>{locale === "zh-CN" ? "邮箱登录" : "Sign in"}</b>
          </button>}
          <button className="language-switch" onClick={toggleLanguage} title={copy.languageLabel} aria-label={copy.languageLabel}><span>{copy.languageButton}</span></button>
        </div>
      </header>

      {view === "home" && (
        <section className="home-screen screen-enter">
          <div className="hero-copy">
            <p className="eyebrow"><span /> {copy.heroEyebrow} <span /></p>
            <h1>{copy.heroTitleLead}<br /><em>{copy.heroTitleEmphasis}</em>{copy.heroTitleTail}</h1>
            <p className="hero-lead">{copy.heroLead}</p>
            <div className="hero-actions">
              <button className="button primary large" onClick={() => setView("spreads")}>{copy.beginReading} <Icon name="arrow" /></button>
              <button className="button text-button" onClick={() => void openDaily()}><Icon name="spark" /> {copy.drawDailyGuide}</button>
            </div>
            <div className="trust-row">
              <span><b>78</b> {copy.completeDeck}</span><i /><span><b>{spreads.length}</b> {copy.immersiveSpreads}</span><i /><span><b>{locale === "en" ? "2 layers" : "双层"}</b> {copy.layeredReading}</span>
            </div>
          </div>
          <div className="hero-orbit" aria-hidden="true">
            <div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" />
            <div className="moon-disc"><span className="moon-shadow" /><span className="moon-star">✦</span></div>
            <div className="floating-card card-left"><span className="tarot-back-art">✦</span></div>
            <div className="floating-card card-right"><span className="tarot-back-art">☾</span></div>
            <span className="orbit-symbol symbol-one">☉</span><span className="orbit-symbol symbol-two">✧</span><span className="orbit-symbol symbol-three">☽</span>
          </div>
        </section>
      )}

      {view === "spreads" && (
        <section className="content-screen screen-enter">
          <div className="section-heading"><p className="eyebrow">{copy.spreadsEyebrow}</p><h2>{copy.spreadsTitle}</h2><p>{copy.spreadsLead}</p></div>
          <div className="filter-row" role="group" aria-label={copy.spreadFilterLabel}>
            {(["all", "general", "love", "career", "self"] as SpreadFilter[]).map((filter) => <button key={filter} className={spreadFilter === filter ? "active" : ""} onClick={() => setSpreadFilter(filter)}>{copy.filters[filter]}</button>)}
          </div>
          <SpreadCollection spreads={filteredSpreads} favorites={favorites} onChoose={chooseSpread} onFavorite={toggleFavorite} locale={locale} />
          <p className="ethical-note"><Icon name="moon" /> {copy.ethicalNote}</p>
        </section>
      )}

      {view === "favorites" && (
        <section className="content-screen favorites-screen screen-enter">
          <div className="section-heading"><p className="eyebrow">{copy.favoritesEyebrow}</p><h2>{copy.favoritesTitle}</h2><p>{copy.favoritesLead}</p></div>
          {favoriteSpreads.length ? <SpreadCollection spreads={favoriteSpreads} favorites={favorites} onChoose={chooseSpread} onFavorite={toggleFavorite} locale={locale} /> : <div className="empty-state"><span>☾</span><h3>{copy.favoritesEmptyTitle}</h3><p>{copy.favoritesEmptyLead}</p><button className="button secondary" onClick={() => setView("spreads")}>{copy.browseSpreads}</button></div>}
        </section>
      )}

      {view === "question" && (
        <section className="question-screen screen-enter">
          <div className="question-ritual" aria-hidden="true"><span>☾</span><i /><small>{copy.settleQuestion}</small></div>
          <div className="question-card panel-card">
            <button className="back-link" onClick={() => setView("spreads")}>{copy.chooseAnotherSpread}</button>
            <div className="chosen-spread"><div><small>{selectedSpreadCopy.eyebrow}</small><h2>{selectedSpreadCopy.name}</h2><p>{selectedSpreadCopy.description}</p></div><span>{selectedSpreadCopy.positions.length}<small>{copy.cardsUnit(selectedSpreadCopy.positions.length).replace(/^\d+\s*/, "")}</small></span></div>
            <form onSubmit={(event) => { event.preventDefault(); enterPreparation(); }}>
              <label className="field"><span>{copy.questionLabel} <small>{copy.questionOptional}</small></span><textarea maxLength={300} value={question.question} onChange={(event) => setQuestion({ ...question, question: event.target.value })} placeholder={copy.questionPlaceholder} /><b>{question.question.length}/300</b></label>
              <div className="two-fields">
                <label className="field"><span>{copy.contextLabel} <small>{copy.optional}</small></span><input maxLength={800} value={question.context} onChange={(event) => setQuestion({ ...question, context: event.target.value })} placeholder={copy.contextPlaceholder} /></label>
                <label className="field"><span>{copy.timeframeLabel} <small>{copy.optional}</small></span><input maxLength={100} value={question.timeframe} onChange={(event) => setQuestion({ ...question, timeframe: event.target.value })} placeholder={copy.timeframePlaceholder} /></label>
              </div>
              {selectedSpread.needsOptions && <div className="choice-fields"><label className="field"><span>{copy.optionA}</span><input required maxLength={100} value={question.optionA} onChange={(event) => setQuestion({ ...question, optionA: event.target.value })} placeholder={copy.firstPath} /></label><span className="versus">{copy.or}</span><label className="field"><span>{copy.optionB}</span><input required maxLength={100} value={question.optionB} onChange={(event) => setQuestion({ ...question, optionB: event.target.value })} placeholder={copy.secondPath} /></label></div>}
              <div className="position-preview"><small>{copy.positionOrder}</small><div>{selectedSpreadCopy.positions.map((position, index) => <span key={position}><b>{index + 1}</b>{position}</span>)}</div></div>
              <button className="button primary full" type="submit">{copy.enterTable} <Icon name="arrow" /></button>
            </form>
          </div>
        </section>
      )}

      {view === "preparation" && (
        <section className="preparation-screen screen-enter">
          <div className="preparation-card panel-card">
            <p className="eyebrow">{copy.preparationEyebrow}</p>
            <div className="preparation-orbit" aria-hidden="true"><span>☾</span><i /><b>✦</b></div>
            <h2>{copy.preparationTitle}</h2>
            <p className="preparation-lead">{copy.preparationLead}</p>
            <ol className="preparation-steps" aria-live="polite">
              {copy.preparationSteps.map((step, index) => (
                <li key={step} className={index === preparationStep ? "active" : index < preparationStep ? "done" : ""}>
                  <span>{index + 1}</span><p>{step}</p>
                </li>
              ))}
            </ol>
            <div className="preparation-actions">
              <button className="button primary large" type="button" onClick={() => void enterTable()} disabled={!preparationReady}>
                {preparationReady ? copy.preparationReady : copy.preparationWaiting} <Icon name="spark" />
              </button>
              <button className="button text-button" type="button" onClick={() => setView("question")}>{copy.preparationBack}</button>
            </div>
          </div>
        </section>
      )}

      {view === "table" && (
        <section className="table-screen screen-enter">
          <div className="table-heading"><button className="back-link" onClick={() => !shuffling && setView("question")}>{copy.backToQuestion}</button><div><small>{selectedSpreadCopy.name}</small><h2>{copy.chooseCards}</h2></div><span className="pick-count"><b>{picked.length}</b> / {selectedSpreadCopy.positions.length}</span></div>
          <div className={`tarot-table shuffle-${shufflePhase}`}>
            <div className="table-rings" aria-hidden="true"><span>☾</span><i /><b>✦</b></div>
            {deck.map((card, index) => <button key={card.id} type="button" className={`table-card tarot-back ${card.selected ? "is-picked" : ""}`} style={{ left: `${card.x}%`, top: `${card.y}%`, "--rotation": `${card.rotate}deg`, "--order": index } as React.CSSProperties} onClick={() => selectCard(card)} disabled={shuffling || card.selected || picked.length >= selectedSpreadCopy.positions.length} aria-label={copy.chooseCardAria(picked.length + 1)}><span className="tarot-back-art">✦</span></button>)}
            <div className="table-decor candle candle-left" aria-hidden="true"><i /><span /></div><div className="table-decor candle candle-right" aria-hidden="true"><i /><span /></div><div className="crystals" aria-hidden="true"><span /><span /><span /></div>
          </div>
          <div className="table-dock">
            <div className="next-position" aria-live="polite"><small>{picked.length < selectedSpreadCopy.positions.length ? copy.nextPosition : copy.selectionComplete}</small><strong>{picked.length < selectedSpreadCopy.positions.length ? selectedSpreadCopy.positions[picked.length] : copy.cardsReady}</strong></div>
            <div className="picked-tray" aria-label={copy.selectedCardsAria}>{selectedSpreadCopy.positions.map((position, index) => <span key={position} className={index < picked.length ? "filled" : ""}><i>{index + 1}</i><small>{position}</small></span>)}</div>
            <div className="table-actions"><button className="button ghost" onClick={shuffleCards} disabled={shuffling}>⌁ {shuffling ? copy.shuffling : copy.reshuffle}</button><button className="button ghost" onClick={undoPick} disabled={!picked.length || shuffling}>↶ {copy.undo}</button><button className="button primary" onClick={finishPick} disabled={picked.length !== selectedSpreadCopy.positions.length || shuffling}>{copy.finishSelection}</button></div>
          </div>
        </section>
      )}

      {view === "reveal" && (
        <section className="reveal-screen screen-enter">
          <div className="reveal-heading"><p className="eyebrow">{copy.cardsArrived}</p><h2>{selectedSpreadCopy.name}</h2><p aria-live="polite">{allRevealed ? copy.allRevealed : copy.revealPrompt(revealCursor + 1, selectedSpreadCopy.positions[revealCursor])}</p></div>
          <div className={`spread-board layout-${selectedSpread.id}`} data-count={picked.length}>
            {picked.map((card, index) => <div className={`reveal-slot slot-${index + 1}`} key={card.id}><p><b>{index + 1}</b>{selectedSpreadCopy.positions[index]}</p><button className={`reveal-card ${card.revealed ? "revealed" : ""} ${card.orientation === "reversed" ? "reversed" : ""} ${index === revealCursor ? "next" : ""}`} onClick={() => revealCard(index)} disabled={index !== revealCursor || card.revealed} aria-label={card.revealed ? `${tarotGame!.getCardCopy(card, locale).name}, ${tarotGame!.orientationLabel(card.orientation, locale)}` : copy.revealAria(selectedSpreadCopy.positions[index])}><span className="reveal-inner"><span className="reveal-back tarot-back"><i className="tarot-back-art">✦</i></span><span className="reveal-front"><Image src={card.image} alt={tarotGame!.getCardCopy(card, locale).name} fill sizes="(max-width: 600px) 30vw, 150px" priority={index < 4} /></span></span></button><div className="card-caption">{card.revealed ? <><strong>{tarotGame!.getCardCopy(card, locale).name}</strong><span>{locale === "zh-CN" ? `${card.nameEn} · ` : ""}{tarotGame!.orientationLabel(card.orientation, locale)}</span></> : <span>{copy.waitingReveal}</span>}</div></div>)}
          </div>
          <div className="reveal-actions">{!allRevealed ? <button className="button primary" onClick={() => revealCard(revealCursor)}>{copy.revealThisCard} <Icon name="spark" /></button> : <><button className="button secondary" onClick={() => { setReadingTab("local"); setReadingOpen(true); }}>{copy.viewLocalMeaning}</button><button className="button primary" onClick={requestAiReading}>{copy.aiReading} <Icon name="spark" /></button><button className="button ghost" onClick={() => showNotice(copy.cardsKept)}>{copy.keepCards}</button><button className="button ghost" onClick={() => void handleShare(picked, selectedSpread)} disabled={shareLoading}><Icon name="share" /> {shareLoading ? copy.shareGenerating : copy.generateShare}</button></>}</div>
          <button className="restart-link" onClick={() => { resetReadingState(true); setView("table"); }}>{copy.chooseAgain}</button>
        </section>
      )}

      {view === "daily" && (
        <section className="daily-screen content-screen screen-enter">
          <div className="section-heading"><p className="eyebrow">{copy.dailyEyebrow}</p><h2>{copy.dailyTitle}</h2><p>{displayDate(locale)} · {copy.dailyLimitNote}</p></div>
          <div className="daily-stage">
            <div className="daily-moon" aria-hidden="true">☾</div>
            {!dailyDrawn ? <button className="daily-card tarot-back" onClick={() => void drawDaily()} aria-label={copy.drawDailyAria}><span className="tarot-back-art">✦</span></button> : <button className={`daily-card reveal-card ${dailyDrawn.revealed ? "revealed" : ""} ${dailyDrawn.orientation === "reversed" ? "reversed" : ""}`} onClick={revealDaily} disabled={dailyDrawn.revealed} aria-label={dailyDrawn.revealed ? `${dailyCardCopy?.name} ${tarotGame?.orientationLabel(dailyDrawn.orientation, locale) ?? ""}` : copy.revealDailyAria}><span className="reveal-inner"><span className="reveal-back tarot-back"><i className="tarot-back-art">✦</i></span><span className="reveal-front"><Image src={dailyDrawn.image} alt={dailyCardCopy?.name || ""} fill sizes="230px" priority /></span></span></button>}
            {!dailyDrawn ? <><h3>{copy.dailyTouchTitle}</h3><p>{copy.dailyTouchLead}</p><button className="button primary" onClick={() => void drawDaily()}>{copy.drawDailyGuide}</button></> : !dailyDrawn.revealed ? <><h3>{copy.dailyChosenTitle}</h3><p>{copy.dailyChosenLead}</p><button className="button primary" onClick={revealDaily}>{copy.revealCard}</button></> : <div className="daily-reading"><small>{copy.dailyGuide} · {tarotGame?.orientationLabel(dailyDrawn.orientation, locale)}</small><h3>{dailyCardCopy?.name}{locale === "zh-CN" && <em>{dailyDrawn.nameEn}</em>}</h3><p>{dailyDrawn.orientation === "reversed" ? dailyCardCopy?.reversed : dailyCardCopy?.upright}</p><p className="daily-advice"><b>{copy.takeaway}</b>{dailyCardCopy?.advice}</p><button className="button ghost" onClick={() => void handleShare([dailyDrawn], DAILY_SPREAD)} disabled={shareLoading}><Icon name="share" /> {shareLoading ? copy.shareGenerating : copy.generateDailyShare}</button></div>}
          </div>
        </section>
      )}

      {view === "history" && user && <ReadingHistory locale={locale} refreshKey={historyRefreshKey} />}

      {readingOpen && tarotGame && <ReadingDialog cards={picked} spread={selectedSpread} question={question.question} tab={readingTab} setTab={setReadingTab} aiReading={aiReading} aiPreview={aiPreview} aiLoading={aiLoading} aiError={aiError} onAi={requestAiReading} onUnlock={() => openAuth("unlock")} onShare={(reading) => void handleShare(picked, selectedSpread, reading)} shareLoading={shareLoading} onClose={() => setReadingOpen(false)} locale={locale} tarotGame={tarotGame} />}
      {sharePreview && <SharePreviewDialog preview={sharePreview} onClose={closeSharePreview} />}
      <SaveReadingDialog
        open={savePromptOpen && Boolean(user)}
        locale={locale}
        authenticated={Boolean(user)}
        saving={savingReading}
        onSave={() => { void persistReading(aiPreview ? "" : aiReading).then((id) => { if (id) setSavePromptOpen(false); }); }}
        onLogin={() => {
          setSaveAfterLogin(true);
          setSavePromptOpen(false);
          openAuth("save");
        }}
        onSkip={() => setSavePromptOpen(false)}
      />
      <AuthDialog
        open={authOpen}
        locale={locale}
        reason={authReason}
        onClose={() => setAuthOpen(false)}
        onAuthenticated={handleAuthenticated}
      />
      {notice && <div className={`toast ${notice.tone === "error" ? "error" : ""}`} role="status">{notice.text}</div>}
      {view !== "table" && <SiteFooter />}
    </main>
  );
}

function SpreadCollection({ spreads: items, favorites, onChoose, onFavorite, locale }: { spreads: Spread[]; favorites: string[]; onChoose: (spread: Spread) => void; onFavorite: (id: string) => void; locale: Locale }) {
  const copy = appMessages[locale];
  return <div className="spread-collection">
    {(["basic", "advanced"] as const).map((difficulty) => {
      const group = items.filter((spread) => spread.difficulty === difficulty);
      if (!group.length) return null;
      return <section className="spread-level" key={difficulty}>
        <h3><span aria-hidden="true">✦</span>{difficulty === "basic" ? copy.basicSpreads : copy.advancedSpreads}<span aria-hidden="true">✦</span></h3>
        <SpreadGrid spreads={group} favorites={favorites} onChoose={onChoose} onFavorite={onFavorite} locale={locale} />
      </section>;
    })}
  </div>;
}

function SpreadGrid({ spreads: items, favorites, onChoose, onFavorite, locale }: { spreads: Spread[]; favorites: string[]; onChoose: (spread: Spread) => void; onFavorite: (id: string) => void; locale: Locale }) {
  const copy = appMessages[locale];
  return <div className="spread-grid">{items.map((spread, index) => {
    const displaySpread = localizeSpread(spread, locale);
    const favorite = favorites.includes(spread.id);
    return <article className="spread-card" data-spread-id={spread.id} key={spread.id} style={{ "--delay": `${index * 55}ms` } as React.CSSProperties}><button className={`favorite-button ${favorite ? "active" : ""}`} onClick={() => onFavorite(spread.id)} aria-label={favorite ? copy.unfavoriteAria(displaySpread.name) : copy.favoriteAria(displaySpread.name)}><Icon name="heart" /></button><button className="spread-main" onClick={() => onChoose(spread)}><div className="spread-glyph" data-count={displaySpread.positions.length}>{Array.from({ length: Math.min(displaySpread.positions.length, 8) }).map((_, cardIndex) => <i key={cardIndex} />)}</div><span className="spread-category-pill">✦ {displaySpread.category} · {displaySpread.difficulty} ✦</span><h3>{displaySpread.name}</h3><span className="spread-ornament" aria-hidden="true">— ✦ —</span><p>{displaySpread.description}</p><div className="spread-questions"><small>{copy.suitableQuestions}</small><div>{displaySpread.questions.slice(0, 3).map((item) => <span key={item}>?<b>{item}</b></span>)}</div></div><div className="spread-meta"><span>{copy.cardsUnit(displaySpread.positions.length)}</span></div><span className="spread-enter">{copy.chooseSpread} <Icon name="arrow" /></span></button></article>;
  })}</div>;
}

function ReadingDialog({ cards, spread, question, tab, setTab, aiReading, aiPreview, aiLoading, aiError, onAi, onUnlock, onShare, shareLoading, onClose, locale, tarotGame }: { cards: DrawnCard[]; spread: Spread; question: string; tab: "local" | "ai"; setTab: (tab: "local" | "ai") => void; aiReading: string; aiPreview: boolean; aiLoading: boolean; aiError: string; onAi: () => void; onUnlock: () => void; onShare: (reading: string) => void; shareLoading: boolean; onClose: () => void; locale: Locale; tarotGame: TarotGame }) {
  const copy = appMessages[locale];
  const displaySpread = localizeSpread(spread, locale);
  const synthesis = useMemo(() => tarotGame.buildLocalSynthesis(cards, locale), [cards, locale, tarotGame]);
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="reading-dialog" role="dialog" aria-modal="true" aria-labelledby="reading-title"><header><div><small>{displaySpread.name}</small><h2 id="reading-title">{copy.readingTitle}</h2></div><button onClick={onClose} autoFocus aria-label={copy.closeReading}>×</button></header><div className="reading-tabs" role="tablist"><button role="tab" aria-selected={tab === "local"} className={tab === "local" ? "active" : ""} onClick={() => setTab("local")}>{copy.localMeanings}</button><button role="tab" aria-selected={tab === "ai"} className={tab === "ai" ? "active" : ""} onClick={() => setTab("ai")}>{copy.aiAnalysis}</button></div><div className="reading-body">{tab === "local" ? <><div className="reading-intro"><span>☾</span><p>{question ? copy.questionReadingIntro(question) : copy.openReadingIntro}</p></div>{cards.map((card, index) => {
    const displayCard = tarotGame.getCardCopy(card, locale);
    return <article className="local-card-reading" key={card.id}><Image src={card.image} alt="" width={76} height={114} className={card.orientation === "reversed" ? "image-reversed" : ""} /><div><small>{displaySpread.positions[index]}</small><h3>{displayCard.name} {locale === "zh-CN" && <em>{card.nameEn}</em>}<span>{tarotGame.orientationLabel(card.orientation, locale)}</span></h3><p>{tarotGame.localMeaningFor(card, question, locale)}</p></div></article>;
  })}<section className="local-synthesis"><h3>{copy.synthesisTitle}</h3>{synthesis.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section><div className="reading-actions"><button className="button secondary" onClick={() => onShare(synthesis.join("\n\n"))} disabled={shareLoading}><Icon name="share" /> {shareLoading ? copy.shareGenerating : copy.shareReading}</button><button className="button primary" onClick={onAi}>{copy.continueAi}</button></div></> : <div className="ai-reading">{aiLoading ? <AiLoadingState messages={copy.aiLoadingMessages} /> : aiError ? <div className="ai-error"><span>☁</span><h3>{copy.aiErrorTitle}</h3><p>{aiError}</p><button className="button secondary" onClick={onAi}>{copy.tryAgain}</button><button className="button text-button" onClick={() => setTab("local")}>{copy.backToLocal}</button></div> : aiReading ? <>{aiPreview ? <div className="guest-ai-preview"><div className="guest-ai-visible"><ReactMarkdown>{aiReading}</ReactMarkdown></div><div className="guest-ai-locked" aria-hidden="true"><p /><p /><p /><p /><p /><p /></div><div className="guest-ai-unlock"><span>✦</span><h3>{locale === "zh-CN" ? "还有 50% 的完整解读" : "50% of your reading is still waiting"}</h3><p>{locale === "zh-CN" ? "邮箱验证码免费登录，即刻展开剩余内容，不需要重新抽牌。" : "Sign in free with an email code to reveal the rest—no need to draw again."}</p><button className="button primary large" onClick={onUnlock}>{locale === "zh-CN" ? "邮箱登录，免费解锁" : "Sign in free to unlock"}</button></div></div> : <><ReactMarkdown>{aiReading}</ReactMarkdown><div className="reading-actions"><button className="button secondary" onClick={() => onShare(aiReading)} disabled={shareLoading}><Icon name="share" /> {shareLoading ? copy.shareGenerating : copy.shareReading}</button></div></>}</> : <div className="ai-ready"><span>✦</span><h3>{copy.aiReadyTitle}</h3><p>{copy.aiReadyLead}</p><button className="button primary" onClick={onAi}>{copy.startAi}</button></div>}</div>}</div></section></div>;
}

function AiLoadingState({ messages }: { messages: string[] }) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % messages.length);
    }, 2400);
    return () => window.clearInterval(timer);
  }, [messages.length]);

  return <div className="oracle-loading"><div className="loading-orbit"><span>☾</span></div><h3>{messages[messageIndex]}</h3></div>;
}

function SharePreviewDialog({ preview, onClose }: { preview: NonNullable<SharePreviewState>; onClose: () => void }) {
  const copy = appMessages[preview.locale];
  return <div className="dialog-backdrop share-preview-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="share-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="share-preview-title"><button className="share-preview-close" onClick={onClose} aria-label={copy.shareClose}>×</button><div><p className="eyebrow">SHARE YOUR READING</p><h2 id="share-preview-title">{copy.sharePreviewTitle}</h2><p>{copy.sharePreviewLead}</p></div><figure><Image src={preview.url} alt={copy.sharePreviewAlt} width={324} height={405} unoptimized /><figcaption>{copy.shareDownloadHint}</figcaption></figure><div className="share-preview-actions"><a className="button primary large" href={preview.url} download={preview.fileName}>{copy.shareDownload}</a><button className="button ghost" onClick={onClose}>{copy.shareClose}</button></div></section></div>;
}
