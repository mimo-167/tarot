"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import cardsJson from "@/data/tarot-cards.json";
import { spreads } from "@/data/spreads";
import { TarotAudioEngine } from "@/lib/audio-engine";
import {
  buildLocalSynthesis,
  createTableDeck,
  localMeaningFor,
  orientationLabel,
  type TableCard,
} from "@/lib/game";
import { sharePoster } from "@/lib/share-poster";
import type { AppView, DrawnCard, ReadingRequest, Spread, TarotCard } from "@/types/tarot";

const cards = cardsJson as TarotCard[];
const DAILY_SPREAD: Spread = {
  id: "daily",
  name: "每日一牌",
  eyebrow: "今日指引",
  description: "用一张牌观察今天值得留意的主题。",
  positions: ["今日指引"],
  category: "通用",
};
const todayKey = () => new Intl.DateTimeFormat("zh-CN", { dateStyle: "short" }).format(new Date());
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

export function TarotExperience() {
  const [view, setView] = useState<AppView>("home");
  const [selectedSpread, setSelectedSpread] = useState<Spread>(spreads[0]);
  const [question, setQuestion] = useState<QuestionDraft>(initialQuestion);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [spreadFilter, setSpreadFilter] = useState("全部");
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
  const audio = useRef<TarotAudioEngine | null>(null);

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
        if (storedDaily?.date === todayKey()) setDaily(storedDaily);
      } catch {
        // A privacy mode may make localStorage unavailable; the core ritual still works.
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ambientOn) audio.current?.stopAmbient();
  }, [ambientOn]);

  const play = (kind: "select" | "shuffle" | "reveal") => {
    if (!sfxOn) return;
    audio.current ??= new TarotAudioEngine();
    audio.current.chime(kind);
  };

  const toggleAmbient = () => {
    audio.current ??= new TarotAudioEngine();
    const next = !ambientOn;
    setAmbientOn(next);
    localStorage.setItem("xingyue:ambient", String(next));
    if (next) audio.current.startAmbient();
    else audio.current.stopAmbient();
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
    showNotice(next.includes(id) ? "已收藏这个牌阵" : "已取消收藏");
  };

  const resetReadingState = useCallback((newDeck = true) => {
    pickedRef.current = [];
    setPicked([]);
    setRevealCursor(0);
    setReadingOpen(false);
    setAiReading("");
    setAiError("");
    if (newDeck) setDeck(createTableDeck(cards));
  }, []);

  const enterTable = () => {
    if (selectedSpread.needsOptions && (!question.optionA.trim() || !question.optionB.trim())) {
      showNotice("请先写清 A、B 两个选项", "error");
      return;
    }
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
    setDeck(createTableDeck(cards));
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
    const day = new Date().toISOString().slice(0, 10);
    const counterKey = "xingyue:ai-usage";
    const usage = JSON.parse(localStorage.getItem(counterKey) || "null") as { date: string; count: number } | null;
    if (usage?.date === day && usage.count >= 3) {
      setAiError("今天已完成 3 次 AI 辅助解读。可以继续查看本地牌义，明天再来。 ");
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
      question: question.question,
      context: question.context,
      timeframe: question.timeframe,
      spread: selectedSpread,
      options: selectedSpread.needsOptions ? { a: question.optionA, b: question.optionB } : null,
      cards: picked.map((card, index) => ({
        id: card.id,
        position: selectedSpread.positions[index],
        orientation: card.orientation,
      })),
    };
    try {
      const response = await fetch("/api/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tarot-client": clientId },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { reading?: string; error?: string };
      if (!response.ok || !result.reading) throw new Error(result.error || "AI 解读暂时没有回应");
      setAiReading(result.reading);
      localStorage.setItem(counterKey, JSON.stringify({ date: day, count: usage?.date === day ? usage.count + 1 : 1 }));
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "AI 解读暂时没有回应");
    } finally {
      setAiLoading(false);
    }
  };

  const handleShare = async (shareCards: DrawnCard[], spread: Spread) => {
    try {
      const message = await sharePoster(shareCards, spread);
      showNotice(message);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      showNotice(error instanceof Error ? error.message : "分享图生成失败", "error");
    }
  };

  const drawDaily = () => {
    if (daily) return;
    const card = cards[Math.floor(secureRandom() * cards.length)];
    const record: DailyRecord = {
      date: todayKey(),
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

  const dailyCard = daily ? cards.find((card) => card.id === daily.cardId) : null;
  const dailyDrawn: DrawnCard | null = daily && dailyCard
    ? { ...dailyCard, orientation: daily.orientation, revealed: daily.revealed }
    : null;
  const favoriteSpreads = spreads.filter((spread) => favorites.includes(spread.id));
  const filteredSpreads = spreads.filter((spread) => spreadFilter === "全部" || spread.category === spreadFilter);

  return (
    <main className={`site view-${view}`}>
      <div className="sky" aria-hidden="true"><span className="shooting-star" /><span className="shooting-star second" /></div>
      <header className="nav-shell">
        <button className="brand" onClick={() => setView("home")} aria-label="返回星月塔罗首页">
          <span className="brand-mark"><Icon name="moon" /></span>
          <span><strong>星月塔罗</strong><small>RWS TAROT</small></span>
        </button>
        <nav aria-label="主导航">
          <button className={view === "spreads" ? "active" : ""} onClick={() => setView("spreads")}>牌阵</button>
          <button className={view === "daily" ? "active" : ""} onClick={() => setView("daily")}>每日一牌</button>
          <button className={view === "favorites" ? "active" : ""} onClick={() => setView("favorites")}>收藏</button>
        </nav>
        <div className="sound-controls">
          <button className={ambientOn ? "is-on" : ""} onClick={toggleAmbient} title="环境氛围音" aria-label={ambientOn ? "关闭环境氛围音" : "开启环境氛围音"}><Icon name={ambientOn ? "volume" : "mute"} /><span>氛围</span></button>
          <button className={sfxOn ? "is-on" : ""} onClick={toggleSfx} title="交互音效" aria-label={sfxOn ? "关闭交互音效" : "开启交互音效"}><Icon name={sfxOn ? "volume" : "mute"} /><span>音效</span></button>
        </div>
      </header>

      {view === "home" && (
        <section className="home-screen screen-enter">
          <div className="hero-copy">
            <p className="eyebrow"><span /> A MOMENT WITH YOURSELF <span /></p>
            <h1>向星月借一面<br /><em>照见内心</em>的镜子</h1>
            <p className="hero-lead">不是仓促地得到一个答案。先放慢呼吸，亲手洗牌、选牌、逐张翻开，再让牌面陪你看见问题的不同侧面。</p>
            <div className="hero-actions">
              <button className="button primary large" onClick={() => setView("spreads")}>开始一次占卜 <Icon name="arrow" /></button>
              <button className="button text-button" onClick={() => setView("daily")}><Icon name="spark" /> 抽取今日指引</button>
            </div>
            <div className="trust-row">
              <span><b>78</b> 张完整 RWS 牌</span><i /><span><b>9</b> 种沉浸式牌阵</span><i /><span><b>双层</b> 本地 + AI 解读</span>
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
            {[["01", "选择牌阵"], ["02", "默念问题"], ["03", "亲手选牌"], ["04", "观察与解读"]].map(([number, label]) => (
              <div key={number}><span>{number}</span><p>{label}</p></div>
            ))}
          </div>
        </section>
      )}

      {view === "spreads" && (
        <section className="content-screen screen-enter">
          <div className="section-heading"><p className="eyebrow">CHOOSE YOUR SPREAD</p><h2>此刻，你想看见什么？</h2><p>牌阵不是答案的模具，而是帮助你从不同角度安放问题。</p></div>
          <div className="filter-row" role="group" aria-label="筛选牌阵">
            {["全部", "通用", "感情", "事业", "抉择"].map((filter) => <button key={filter} className={spreadFilter === filter ? "active" : ""} onClick={() => setSpreadFilter(filter)}>{filter}</button>)}
          </div>
          <SpreadGrid spreads={filteredSpreads} favorites={favorites} onChoose={chooseSpread} onFavorite={toggleFavorite} />
          <p className="ethical-note"><Icon name="moon" /> 塔罗用于娱乐、自我观察与启发；它不会替你读取他人内心，也不会替你作重大决定。</p>
        </section>
      )}

      {view === "favorites" && (
        <section className="content-screen favorites-screen screen-enter">
          <div className="section-heading"><p className="eyebrow">YOUR COLLECTION</p><h2>收藏的牌阵</h2><p>把常用的观察方式留在手边，下次更快进入仪式。</p></div>
          {favoriteSpreads.length ? <SpreadGrid spreads={favoriteSpreads} favorites={favorites} onChoose={chooseSpread} onFavorite={toggleFavorite} /> : <div className="empty-state"><span>☾</span><h3>收藏夹还是空的</h3><p>在牌阵右上角点亮心形，就能把它留在这里。</p><button className="button secondary" onClick={() => setView("spreads")}>去看看牌阵</button></div>}
        </section>
      )}

      {view === "question" && (
        <section className="question-screen screen-enter">
          <div className="question-ritual" aria-hidden="true"><span>☾</span><i /><small>让问题先沉静下来</small></div>
          <div className="question-card panel-card">
            <button className="back-link" onClick={() => setView("spreads")}>← 重新选择牌阵</button>
            <div className="chosen-spread"><div><small>{selectedSpread.eyebrow}</small><h2>{selectedSpread.name}</h2><p>{selectedSpread.description}</p></div><span>{selectedSpread.positions.length}<small>张牌</small></span></div>
            <form onSubmit={(event) => { event.preventDefault(); enterTable(); }}>
              <label className="field"><span>你想问的问题 <small>可以留空，让牌面自由呈现</small></span><textarea maxLength={300} value={question.question} onChange={(event) => setQuestion({ ...question, question: event.target.value })} placeholder="例如：未来三个月，我在工作中最值得关注的方向是什么？" /><b>{question.question.length}/300</b></label>
              <div className="two-fields">
                <label className="field"><span>补充背景 <small>选填</small></span><input maxLength={800} value={question.context} onChange={(event) => setQuestion({ ...question, context: event.target.value })} placeholder="只写与问题有关的事实" /></label>
                <label className="field"><span>时间范围 <small>选填</small></span><input maxLength={100} value={question.timeframe} onChange={(event) => setQuestion({ ...question, timeframe: event.target.value })} placeholder="如：未来三个月" /></label>
              </div>
              {selectedSpread.needsOptions && <div className="choice-fields"><label className="field"><span>选项 A</span><input required maxLength={100} value={question.optionA} onChange={(event) => setQuestion({ ...question, optionA: event.target.value })} placeholder="第一条道路" /></label><span className="versus">或</span><label className="field"><span>选项 B</span><input required maxLength={100} value={question.optionB} onChange={(event) => setQuestion({ ...question, optionB: event.target.value })} placeholder="第二条道路" /></label></div>}
              <div className="position-preview"><small>牌位顺序</small><div>{selectedSpread.positions.map((position, index) => <span key={position}><b>{index + 1}</b>{position}</span>)}</div></div>
              <button className="button primary full" type="submit">进入塔罗牌桌 <Icon name="arrow" /></button>
            </form>
          </div>
        </section>
      )}

      {view === "table" && (
        <section className="table-screen screen-enter">
          <div className="table-heading"><button className="back-link" onClick={() => !shuffling && setView("question")}>← 返回问题</button><div><small>{selectedSpread.name}</small><h2>请凭直觉选择卡牌</h2></div><span className="pick-count"><b>{picked.length}</b> / {selectedSpread.positions.length}</span></div>
          <div className={`tarot-table shuffle-${shufflePhase}`}>
            <div className="table-rings" aria-hidden="true"><span>☾</span><i /><b>✦</b></div>
            {deck.map((card, index) => <button key={card.id} type="button" className={`table-card tarot-back ${card.selected ? "is-picked" : ""}`} style={{ left: `${card.x}%`, top: `${card.y}%`, "--rotation": `${card.rotate}deg`, "--order": index } as React.CSSProperties} onClick={() => selectCard(card)} disabled={shuffling || card.selected || picked.length >= selectedSpread.positions.length} aria-label={`选择第 ${picked.length + 1} 张牌`}><span className="tarot-back-art">✦</span></button>)}
            <div className="table-decor candle candle-left" aria-hidden="true"><i /><span /></div><div className="table-decor candle candle-right" aria-hidden="true"><i /><span /></div><div className="crystals" aria-hidden="true"><span /><span /><span /></div>
          </div>
          <div className="table-dock">
            <div className="next-position" aria-live="polite"><small>{picked.length < selectedSpread.positions.length ? "下一张牌位" : "选择完成"}</small><strong>{picked.length < selectedSpread.positions.length ? selectedSpread.positions[picked.length] : "牌已齐，请确认"}</strong></div>
            <div className="picked-tray" aria-label="已经选择的牌">{selectedSpread.positions.map((position, index) => <span key={position} className={index < picked.length ? "filled" : ""}><i>{index + 1}</i><small>{position}</small></span>)}</div>
            <div className="table-actions"><button className="button ghost" onClick={shuffleCards} disabled={shuffling}>⌁ {shuffling ? "洗牌中" : "重新洗牌"}</button><button className="button ghost" onClick={undoPick} disabled={!picked.length || shuffling}>↶ 撤回</button><button className="button primary" onClick={finishPick} disabled={picked.length !== selectedSpread.positions.length || shuffling}>完成选牌</button></div>
          </div>
        </section>
      )}

      {view === "reveal" && (
        <section className="reveal-screen screen-enter">
          <div className="reveal-heading"><p className="eyebrow">THE CARDS HAVE ARRIVED</p><h2>{selectedSpread.name}</h2><p aria-live="polite">{allRevealed ? "所有牌已经展开。先看看它们带给你的第一感受。" : `请翻开第 ${revealCursor + 1} 张：${selectedSpread.positions[revealCursor]}`}</p></div>
          <div className={`spread-board layout-${selectedSpread.id}`} data-count={picked.length}>
            {picked.map((card, index) => <div className={`reveal-slot slot-${index + 1}`} key={card.id}><p><b>{index + 1}</b>{selectedSpread.positions[index]}</p><button className={`reveal-card ${card.revealed ? "revealed" : ""} ${card.orientation === "reversed" ? "reversed" : ""} ${index === revealCursor ? "next" : ""}`} onClick={() => revealCard(index)} disabled={index !== revealCursor || card.revealed} aria-label={card.revealed ? `${card.nameZh}，${orientationLabel(card.orientation)}` : `翻开${selectedSpread.positions[index]}`}><span className="reveal-inner"><span className="reveal-back tarot-back"><i className="tarot-back-art">✦</i></span><span className="reveal-front"><Image src={card.image} alt={`${card.nameZh} ${card.nameEn}`} fill sizes="(max-width: 600px) 30vw, 150px" priority={index < 4} /></span></span></button><div className="card-caption">{card.revealed ? <><strong>{card.nameZh}</strong><span>{card.nameEn} · {orientationLabel(card.orientation)}</span></> : <span>等待翻牌</span>}</div></div>)}
          </div>
          <div className="reveal-actions">{!allRevealed ? <button className="button primary" onClick={() => revealCard(revealCursor)}>翻开这一张 <Icon name="spark" /></button> : <><button className="button secondary" onClick={() => { setReadingTab("local"); setReadingOpen(true); }}>查看本地牌义</button><button className="button primary" onClick={requestAiReading}>AI 综合解读 <Icon name="spark" /></button><button className="button ghost" onClick={() => showNotice("已保留牌面，你可以慢慢观察")}>暂不解读</button><button className="button ghost" onClick={() => void handleShare(picked, selectedSpread)}><Icon name="share" /> 生成分享图</button></>}</div>
          <button className="restart-link" onClick={() => { resetReadingState(true); setView("table"); }}>重新选择这组牌</button>
        </section>
      )}

      {view === "daily" && (
        <section className="daily-screen content-screen screen-enter">
          <div className="section-heading"><p className="eyebrow">A CARD FOR TODAY</p><h2>今日，与你相遇的牌</h2><p>{todayKey()} · 一天只抽一次。它是观察的起点，不是今天的判决。</p></div>
          <div className="daily-stage">
            <div className="daily-moon" aria-hidden="true">☾</div>
            {!dailyDrawn ? <button className="daily-card tarot-back" onClick={drawDaily} aria-label="抽取今日一牌"><span className="tarot-back-art">✦</span></button> : <button className={`daily-card reveal-card ${dailyDrawn.revealed ? "revealed" : ""} ${dailyDrawn.orientation === "reversed" ? "reversed" : ""}`} onClick={revealDaily} disabled={dailyDrawn.revealed} aria-label={dailyDrawn.revealed ? `${dailyDrawn.nameZh} ${orientationLabel(dailyDrawn.orientation)}` : "翻开今日一牌"}><span className="reveal-inner"><span className="reveal-back tarot-back"><i className="tarot-back-art">✦</i></span><span className="reveal-front"><Image src={dailyDrawn.image} alt={dailyDrawn.nameZh} fill sizes="230px" priority /></span></span></button>}
            {!dailyDrawn ? <><h3>把手放在牌背上</h3><p>停一秒，想想今天你希望带着怎样的状态生活。</p><button className="button primary" onClick={drawDaily}>抽取今日指引</button></> : !dailyDrawn.revealed ? <><h3>这张牌已经选定</h3><p>准备好时，亲手把它翻开。</p><button className="button primary" onClick={revealDaily}>翻开卡牌</button></> : <div className="daily-reading"><small>今日指引 · {orientationLabel(dailyDrawn.orientation)}</small><h3>{dailyDrawn.nameZh}<em>{dailyDrawn.nameEn}</em></h3><p>{dailyDrawn.orientation === "reversed" ? dailyDrawn.reversed : dailyDrawn.upright}</p><p className="daily-advice"><b>可以带走的提醒</b>{dailyDrawn.advice}</p><button className="button ghost" onClick={() => void handleShare([dailyDrawn], DAILY_SPREAD)}><Icon name="share" /> 生成今日牌分享图</button></div>}
          </div>
        </section>
      )}

      {readingOpen && <ReadingDialog cards={picked} spread={selectedSpread} question={question.question} tab={readingTab} setTab={setReadingTab} aiReading={aiReading} aiLoading={aiLoading} aiError={aiError} onAi={requestAiReading} onClose={() => setReadingOpen(false)} />}
      {notice && <div className={`toast ${notice.tone === "error" ? "error" : ""}`} role="status">{notice.text}</div>}
      {view !== "table" && <footer><span>☾</span><p>星月塔罗 · RWS 辅助观察工具</p><small>内容仅供娱乐、自我观察与启发，不构成医疗、法律或财务建议。牌面素材 <a href="https://github.com/searge/tarot" target="_blank" rel="noreferrer">searge/tarot</a> · CC BY-SA 4.0</small></footer>}
    </main>
  );
}

function SpreadGrid({ spreads: items, favorites, onChoose, onFavorite }: { spreads: Spread[]; favorites: string[]; onChoose: (spread: Spread) => void; onFavorite: (id: string) => void }) {
  return <div className="spread-grid">{items.map((spread, index) => <article className="spread-card" key={spread.id} style={{ "--delay": `${index * 55}ms` } as React.CSSProperties}><button className={`favorite-button ${favorites.includes(spread.id) ? "active" : ""}`} onClick={() => onFavorite(spread.id)} aria-label={favorites.includes(spread.id) ? `取消收藏${spread.name}` : `收藏${spread.name}`}><Icon name="heart" /></button><button className="spread-main" onClick={() => onChoose(spread)}><div className="spread-glyph" data-count={spread.positions.length}>{Array.from({ length: Math.min(spread.positions.length, 8) }).map((_, cardIndex) => <i key={cardIndex} />)}</div><small>{spread.eyebrow}</small><h3>{spread.name}</h3><p>{spread.description}</p><div className="spread-meta"><span>{spread.positions.length} 张牌</span><b>{spread.category}</b></div><span className="spread-enter">选择此牌阵 <Icon name="arrow" /></span></button></article>)}</div>;
}

function ReadingDialog({ cards, spread, question, tab, setTab, aiReading, aiLoading, aiError, onAi, onClose }: { cards: DrawnCard[]; spread: Spread; question: string; tab: "local" | "ai"; setTab: (tab: "local" | "ai") => void; aiReading: string; aiLoading: boolean; aiError: string; onAi: () => void; onClose: () => void }) {
  const synthesis = useMemo(() => buildLocalSynthesis(cards), [cards]);
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="reading-dialog" role="dialog" aria-modal="true" aria-labelledby="reading-title"><header><div><small>{spread.name}</small><h2 id="reading-title">辅助解读</h2></div><button onClick={onClose} autoFocus aria-label="关闭解读">×</button></header><div className="reading-tabs" role="tablist"><button role="tab" aria-selected={tab === "local"} className={tab === "local" ? "active" : ""} onClick={() => setTab("local")}>本地牌义</button><button role="tab" aria-selected={tab === "ai"} className={tab === "ai" ? "active" : ""} onClick={() => setTab("ai")}>AI 综合分析</button></div><div className="reading-body">{tab === "local" ? <><div className="reading-intro"><span>☾</span><p>{question ? <>围绕“{question}”，先逐张看牌，再观察它们之间的呼应。</> : <>你没有限定问题，可以把注意力放在牌面此刻最触动你的部分。</>}</p></div>{cards.map((card, index) => <article className="local-card-reading" key={card.id}><Image src={card.image} alt="" width={76} height={114} className={card.orientation === "reversed" ? "image-reversed" : ""} /><div><small>{spread.positions[index]}</small><h3>{card.nameZh} <em>{card.nameEn}</em><span>{orientationLabel(card.orientation)}</span></h3><p>{localMeaningFor(card, question)}</p></div></article>)}<section className="local-synthesis"><h3>这组牌连起来看</h3>{synthesis.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section><button className="button primary full" onClick={onAi}>继续请求 AI 综合解读</button></> : <div className="ai-reading">{aiLoading ? <div className="oracle-loading"><div className="loading-orbit"><span>☾</span></div><h3>正在梳理牌与问题的联系</h3><p>逐张读牌、检查组合，再把它们带回你的现实处境……</p></div> : aiError ? <div className="ai-error"><span>☁</span><h3>这一次，星光没有顺利抵达</h3><p>{aiError}</p><button className="button secondary" onClick={onAi}>稍后再试</button><button className="button text-button" onClick={() => setTab("local")}>返回本地牌义</button></div> : aiReading ? <ReactMarkdown>{aiReading}</ReactMarkdown> : <div className="ai-ready"><span>✦</span><h3>让牌面与问题连成一条线</h3><p>AI 会按顺序逐张解释、分析组合，再给出有条件的回应和现实建议。每日可完成 3 次。</p><button className="button primary" onClick={onAi}>开始综合解读</button></div>}</div>}</div></section></div>;
}
