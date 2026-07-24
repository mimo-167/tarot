"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { localizeSpread, spreads } from "@/data/spreads";
import { appMessages } from "@/i18n/messages";
import type { Locale } from "@/i18n/config";
import type { AppView, DrawnCard, ReadingRequest, Spread, TarotCard } from "@/types/tarot";

type AudioEngine = import("@/lib/audio-engine").TarotAudioEngine;
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
  category: "general",
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

const initialQuestion: QuestionDraft = {
  question: "",
  context: "",
  timeframe: "",
  optionA: "",
  optionB: "",
};

function Icon({ name }: { name: "moon" | "spark" | "heart" | "volume" | "mute" | "arrow" | "share" }) {
  const paths = {
    moon: <path d="M20.2 15.5A8.3 8.3 0 0 1 8.5 3.8 9 9 0 1 0 20.2 15.5Z" />,
    spark: <path d="m12 2 1.7 5.3L19 9l-5.3 1.7L12 16l-1.7-5.3L5 9l5.3-1.7L12 2Zm7 13 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
    volume: <><path d="M11 5 6 9H2v6h4l5 4V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18 5a9 9 0 0 1 0 14" /></>,
    mute: <><path d="M11 5 6 9H2v6h4l5 4V5Z" /><path d="m17 9 5 5m0-5-5 5" /></>,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 10.5 6.8-4m-6.8 7 6.8 4" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="icon">{paths[name]}</svg>;
}

export function TarotExperience({ initialLocale }: { initialLocale: Locale }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const localeRef = useRef(initialLocale);
  const copy = appMessages[locale];
  const [view, setView] = useState<AppView>("home");
  const [selectedSpread, setSelectedSpread] = useState<Spread>(spreads[0]);
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
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [daily, setDaily] = useState<DailyRecord | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [ambientOn, setAmbientOn] = useState(false);
  const [sfxOn, setSfxOn] = useState(true);
  const audio = useRef<AudioEngine | null>(null);
  const tarotResources = useRef<TarotResources | null>(null);
  const [loadedCards, setLoadedCards] = useState<TarotCard[] | null>(null);
  const [tarotGame, setTarotGame] = useState<TarotGame | null>(null);

  useEffect(() => {
    localeRef.current = locale;
    document.documentElement.lang = locale;
    document.title = appMessages[locale].documentTitle;
  }, [locale]);

  const toggleLanguage = () => {
    const next: Locale = locale === "zh-CN" ? "en" : "zh-CN";
    localeRef.current = next;
    setLocale(next);
    setAiReading("");
    setAiError("");
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
        setAmbientOn(localStorage.getItem("xingyue:ambient") === "true");
        setSfxOn(localStorage.getItem("xingyue:sfx") !== "false");
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

  useEffect(() => {
    if (!ambientOn) audio.current?.stopAmbient();
  }, [ambientOn]);

  const loadAudio = async () => {
    if (audio.current) return audio.current;
    const { TarotAudioEngine } = await import("@/lib/audio-engine");
    audio.current = new TarotAudioEngine();
    return audio.current;
  };

  const ensureCardCatalog = useCallback(async () => {
    tarotResources.current ??= await loadTarotResources();
    setLoadedCards((current) => current ?? tarotResources.current?.cards ?? null);
    setTarotGame((current) => current ?? tarotResources.current?.game ?? null);
    return tarotResources.current;
  }, []);

  const play = (kind: "select" | "shuffle" | "reveal") => {
    if (!sfxOn) return;
    void loadAudio().then((engine) => engine.chime(kind));
  };

  const toggleAmbient = async () => {
    const engine = await loadAudio();
    const next = !ambientOn;
    setAmbientOn(next);
    localStorage.setItem("xingyue:ambient", String(next));
    if (next) engine.startAmbient();
    else engine.stopAmbient();
  };

  const toggleSfx = () => {
    const next = !sfxOn;
    setSfxOn(next);
    localStorage.setItem("xingyue:sfx", String(next));
  };

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
    setAiError("");
    const resources = tarotResources.current;
    if (newDeck && resources) setDeck(resources.game.createTableDeck(resources.cards));
  }, []);

  const enterTable = async () => {
    if (selectedSpread.needsOptions && (!question.optionA.trim() || !question.optionB.trim())) {
      showNotice(copy.optionsRequired, "error");
      return;
    }
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
    play("select");
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
    play("shuffle");
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
    play("reveal");
  };

  const allRevealed = picked.length > 0 && revealCursor === picked.length;

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
    const payload: ReadingRequest = {
      locale: requestLocale,
      question: question.question,
      context: question.context,
      timeframe: question.timeframe,
      spread: localizeSpread(selectedSpread, requestLocale),
      options: selectedSpread.needsOptions ? { a: question.optionA, b: question.optionB } : null,
      cards: picked.map((card, index) => ({
        id: card.id,
        position: localizeSpread(selectedSpread, requestLocale).positions[index],
        orientation: card.orientation,
      })),
    };
    try {
      const response = await fetch("/api/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tarot-client": clientId, "x-tarot-locale": requestLocale },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { reading?: string; error?: string };
      if (!response.ok || !result.reading) throw new Error(result.error || appMessages[requestLocale].aiUnavailable);
      if (localeRef.current === requestLocale) setAiReading(result.reading);
      localStorage.setItem(counterKey, JSON.stringify({ date: day, count: usage?.date === day ? usage.count + 1 : 1 }));
    } catch (error) {
      if (localeRef.current === requestLocale) {
        setAiError(error instanceof Error ? error.message : appMessages[requestLocale].aiUnavailable);
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleShare = async (shareCards: DrawnCard[], spread: Spread) => {
    try {
      const { sharePoster } = await import("@/lib/share-poster");
      const message = await sharePoster(shareCards, spread, locale);
      showNotice(message);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      showNotice(error instanceof Error ? error.message : copy.shareFailed, "error");
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
    play("select");
  };

  const revealDaily = () => {
    if (!daily || daily.revealed) return;
    const next = { ...daily, revealed: true };
    setDaily(next);
    localStorage.setItem("xingyue:daily", JSON.stringify(next));
    play("reveal");
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
          <a href="/blog">Blog</a>
        </nav>
        <div className="sound-controls">
          <button className={ambientOn ? "is-on" : ""} onClick={toggleAmbient} title={copy.ambientTitle} aria-label={ambientOn ? copy.ambientDisable : copy.ambientEnable}><Icon name={ambientOn ? "volume" : "mute"} /><span>{copy.ambient}</span></button>
          <button className={sfxOn ? "is-on" : ""} onClick={toggleSfx} title={copy.soundEffectsTitle} aria-label={sfxOn ? copy.soundEffectsDisable : copy.soundEffectsEnable}><Icon name={sfxOn ? "volume" : "mute"} /><span>{copy.soundEffects}</span></button>
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
              <span><b>78</b> {copy.completeDeck}</span><i /><span><b>9</b> {copy.immersiveSpreads}</span><i /><span><b>{locale === "en" ? "2 layers" : "双层"}</b> {copy.layeredReading}</span>
            </div>
          </div>
          <div className="hero-orbit" aria-hidden="true">
            <div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" />
            <div className="moon-disc"><span className="moon-shadow" /><span className="moon-star">✦</span></div>
            <div className="floating-card card-left"><span className="tarot-back-art">✦</span></div>
            <div className="floating-card card-right"><span className="tarot-back-art">☾</span></div>
            <span className="orbit-symbol symbol-one">☉</span><span className="orbit-symbol symbol-two">✧</span><span className="orbit-symbol symbol-three">☽</span>
          </div>
          <div className="ritual-line">
            {copy.ritualSteps.map((label, index) => (
              <div key={label}><span>{String(index + 1).padStart(2, "0")}</span><p>{label}</p></div>
            ))}
          </div>
        </section>
      )}

      {view === "spreads" && (
        <section className="content-screen screen-enter">
          <div className="section-heading"><p className="eyebrow">{copy.spreadsEyebrow}</p><h2>{copy.spreadsTitle}</h2><p>{copy.spreadsLead}</p></div>
          <div className="filter-row" role="group" aria-label={copy.spreadFilterLabel}>
            {(["all", "general", "love", "career", "choice"] as SpreadFilter[]).map((filter) => <button key={filter} className={spreadFilter === filter ? "active" : ""} onClick={() => setSpreadFilter(filter)}>{copy.filters[filter]}</button>)}
          </div>
          <SpreadGrid spreads={filteredSpreads} favorites={favorites} onChoose={chooseSpread} onFavorite={toggleFavorite} locale={locale} />
          <p className="ethical-note"><Icon name="moon" /> {copy.ethicalNote}</p>
        </section>
      )}

      {view === "favorites" && (
        <section className="content-screen favorites-screen screen-enter">
          <div className="section-heading"><p className="eyebrow">{copy.favoritesEyebrow}</p><h2>{copy.favoritesTitle}</h2><p>{copy.favoritesLead}</p></div>
          {favoriteSpreads.length ? <SpreadGrid spreads={favoriteSpreads} favorites={favorites} onChoose={chooseSpread} onFavorite={toggleFavorite} locale={locale} /> : <div className="empty-state"><span>☾</span><h3>{copy.favoritesEmptyTitle}</h3><p>{copy.favoritesEmptyLead}</p><button className="button secondary" onClick={() => setView("spreads")}>{copy.browseSpreads}</button></div>}
        </section>
      )}

      {view === "question" && (
        <section className="question-screen screen-enter">
          <div className="question-ritual" aria-hidden="true"><span>☾</span><i /><small>{copy.settleQuestion}</small></div>
          <div className="question-card panel-card">
            <button className="back-link" onClick={() => setView("spreads")}>{copy.chooseAnotherSpread}</button>
            <div className="chosen-spread"><div><small>{selectedSpreadCopy.eyebrow}</small><h2>{selectedSpreadCopy.name}</h2><p>{selectedSpreadCopy.description}</p></div><span>{selectedSpreadCopy.positions.length}<small>{copy.cardsUnit(selectedSpreadCopy.positions.length).replace(/^\d+\s*/, "")}</small></span></div>
            <form onSubmit={(event) => { event.preventDefault(); void enterTable(); }}>
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
          <div className="reveal-actions">{!allRevealed ? <button className="button primary" onClick={() => revealCard(revealCursor)}>{copy.revealThisCard} <Icon name="spark" /></button> : <><button className="button secondary" onClick={() => { setReadingTab("local"); setReadingOpen(true); }}>{copy.viewLocalMeaning}</button><button className="button primary" onClick={requestAiReading}>{copy.aiReading} <Icon name="spark" /></button><button className="button ghost" onClick={() => showNotice(copy.cardsKept)}>{copy.keepCards}</button><button className="button ghost" onClick={() => void handleShare(picked, selectedSpread)}><Icon name="share" /> {copy.generateShare}</button></>}</div>
          <button className="restart-link" onClick={() => { resetReadingState(true); setView("table"); }}>{copy.chooseAgain}</button>
        </section>
      )}

      {view === "daily" && (
        <section className="daily-screen content-screen screen-enter">
          <div className="section-heading"><p className="eyebrow">{copy.dailyEyebrow}</p><h2>{copy.dailyTitle}</h2><p>{displayDate(locale)} · {copy.dailyLimitNote}</p></div>
          <div className="daily-stage">
            <div className="daily-moon" aria-hidden="true">☾</div>
            {!dailyDrawn ? <button className="daily-card tarot-back" onClick={() => void drawDaily()} aria-label={copy.drawDailyAria}><span className="tarot-back-art">✦</span></button> : <button className={`daily-card reveal-card ${dailyDrawn.revealed ? "revealed" : ""} ${dailyDrawn.orientation === "reversed" ? "reversed" : ""}`} onClick={revealDaily} disabled={dailyDrawn.revealed} aria-label={dailyDrawn.revealed ? `${dailyCardCopy?.name} ${tarotGame?.orientationLabel(dailyDrawn.orientation, locale) ?? ""}` : copy.revealDailyAria}><span className="reveal-inner"><span className="reveal-back tarot-back"><i className="tarot-back-art">✦</i></span><span className="reveal-front"><Image src={dailyDrawn.image} alt={dailyCardCopy?.name || ""} fill sizes="230px" priority /></span></span></button>}
            {!dailyDrawn ? <><h3>{copy.dailyTouchTitle}</h3><p>{copy.dailyTouchLead}</p><button className="button primary" onClick={() => void drawDaily()}>{copy.drawDailyGuide}</button></> : !dailyDrawn.revealed ? <><h3>{copy.dailyChosenTitle}</h3><p>{copy.dailyChosenLead}</p><button className="button primary" onClick={revealDaily}>{copy.revealCard}</button></> : <div className="daily-reading"><small>{copy.dailyGuide} · {tarotGame?.orientationLabel(dailyDrawn.orientation, locale)}</small><h3>{dailyCardCopy?.name}{locale === "zh-CN" && <em>{dailyDrawn.nameEn}</em>}</h3><p>{dailyDrawn.orientation === "reversed" ? dailyCardCopy?.reversed : dailyCardCopy?.upright}</p><p className="daily-advice"><b>{copy.takeaway}</b>{dailyCardCopy?.advice}</p><button className="button ghost" onClick={() => void handleShare([dailyDrawn], DAILY_SPREAD)}><Icon name="share" /> {copy.generateDailyShare}</button></div>}
          </div>
        </section>
      )}

      {readingOpen && tarotGame && <ReadingDialog cards={picked} spread={selectedSpread} question={question.question} tab={readingTab} setTab={setReadingTab} aiReading={aiReading} aiLoading={aiLoading} aiError={aiError} onAi={requestAiReading} onClose={() => setReadingOpen(false)} locale={locale} tarotGame={tarotGame} />}
      {notice && <div className={`toast ${notice.tone === "error" ? "error" : ""}`} role="status">{notice.text}</div>}
      {view !== "table" && <footer><span>☾</span><p>{copy.footerName}</p><small>{copy.footerDisclaimer}</small></footer>}
    </main>
  );
}

function SpreadGrid({ spreads: items, favorites, onChoose, onFavorite, locale }: { spreads: Spread[]; favorites: string[]; onChoose: (spread: Spread) => void; onFavorite: (id: string) => void; locale: Locale }) {
  const copy = appMessages[locale];
  return <div className="spread-grid">{items.map((spread, index) => {
    const displaySpread = localizeSpread(spread, locale);
    const favorite = favorites.includes(spread.id);
    return <article className="spread-card" key={spread.id} style={{ "--delay": `${index * 55}ms` } as React.CSSProperties}><button className={`favorite-button ${favorite ? "active" : ""}`} onClick={() => onFavorite(spread.id)} aria-label={favorite ? copy.unfavoriteAria(displaySpread.name) : copy.favoriteAria(displaySpread.name)}><Icon name="heart" /></button><button className="spread-main" onClick={() => onChoose(spread)}><div className="spread-glyph" data-count={displaySpread.positions.length}>{Array.from({ length: Math.min(displaySpread.positions.length, 8) }).map((_, cardIndex) => <i key={cardIndex} />)}</div><small>{displaySpread.eyebrow}</small><h3>{displaySpread.name}</h3><p>{displaySpread.description}</p><div className="spread-meta"><span>{copy.cardsUnit(displaySpread.positions.length)}</span><b>{displaySpread.category}</b></div><span className="spread-enter">{copy.chooseSpread} <Icon name="arrow" /></span></button></article>;
  })}</div>;
}

function ReadingDialog({ cards, spread, question, tab, setTab, aiReading, aiLoading, aiError, onAi, onClose, locale, tarotGame }: { cards: DrawnCard[]; spread: Spread; question: string; tab: "local" | "ai"; setTab: (tab: "local" | "ai") => void; aiReading: string; aiLoading: boolean; aiError: string; onAi: () => void; onClose: () => void; locale: Locale; tarotGame: TarotGame }) {
  const copy = appMessages[locale];
  const displaySpread = localizeSpread(spread, locale);
  const synthesis = useMemo(() => tarotGame.buildLocalSynthesis(cards, locale), [cards, locale, tarotGame]);
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="reading-dialog" role="dialog" aria-modal="true" aria-labelledby="reading-title"><header><div><small>{displaySpread.name}</small><h2 id="reading-title">{copy.readingTitle}</h2></div><button onClick={onClose} autoFocus aria-label={copy.closeReading}>×</button></header><div className="reading-tabs" role="tablist"><button role="tab" aria-selected={tab === "local"} className={tab === "local" ? "active" : ""} onClick={() => setTab("local")}>{copy.localMeanings}</button><button role="tab" aria-selected={tab === "ai"} className={tab === "ai" ? "active" : ""} onClick={() => setTab("ai")}>{copy.aiAnalysis}</button></div><div className="reading-body">{tab === "local" ? <><div className="reading-intro"><span>☾</span><p>{question ? copy.questionReadingIntro(question) : copy.openReadingIntro}</p></div>{cards.map((card, index) => {
    const displayCard = tarotGame.getCardCopy(card, locale);
    return <article className="local-card-reading" key={card.id}><Image src={card.image} alt="" width={76} height={114} className={card.orientation === "reversed" ? "image-reversed" : ""} /><div><small>{displaySpread.positions[index]}</small><h3>{displayCard.name} {locale === "zh-CN" && <em>{card.nameEn}</em>}<span>{tarotGame.orientationLabel(card.orientation, locale)}</span></h3><p>{tarotGame.localMeaningFor(card, question, locale)}</p></div></article>;
  })}<section className="local-synthesis"><h3>{copy.synthesisTitle}</h3>{synthesis.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section><button className="button primary full" onClick={onAi}>{copy.continueAi}</button></> : <div className="ai-reading">{aiLoading ? <AiLoadingState messages={copy.aiLoadingMessages} /> : aiError ? <div className="ai-error"><span>☁</span><h3>{copy.aiErrorTitle}</h3><p>{aiError}</p><button className="button secondary" onClick={onAi}>{copy.tryAgain}</button><button className="button text-button" onClick={() => setTab("local")}>{copy.backToLocal}</button></div> : aiReading ? <ReactMarkdown>{aiReading}</ReactMarkdown> : <div className="ai-ready"><span>✦</span><h3>{copy.aiReadyTitle}</h3><p>{copy.aiReadyLead}</p><button className="button primary" onClick={onAi}>{copy.startAi}</button></div>}</div>}</div></section></div>;
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
