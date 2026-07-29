"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { SavedReading } from "@/types/account";

const copy = {
  "zh-CN": {
    eyebrow: "YOUR READING JOURNAL",
    title: "我的抽牌记录",
    lead: "回看当时的问题、牌阵、牌面与完整 AI 解读。",
    empty: "还没有保存过抽牌。下一次翻完牌后，可以选择把它留在这里。",
    ai: "AI 综合解读",
    noAi: "这条记录没有 AI 解读",
    context: "补充背景",
    timeframe: "时间范围",
    delete: "删除",
    deleteConfirm: "确定永久删除这条抽牌记录吗？",
    loadError: "记录暂时无法读取。",
  },
  en: {
    eyebrow: "YOUR READING JOURNAL",
    title: "My reading history",
    lead: "Return to your question, spread, cards, and complete AI interpretation.",
    empty: "You have not saved a reading yet. After revealing your next spread, choose to keep it here.",
    ai: "AI combined reading",
    noAi: "No AI interpretation was saved",
    context: "Background",
    timeframe: "Timeframe",
    delete: "Delete",
    deleteConfirm: "Permanently delete this saved reading?",
    loadError: "Your reading history is temporarily unavailable.",
  },
} satisfies Record<Locale, Record<string, string>>;

export function ReadingHistory({
  locale,
  refreshKey,
}: {
  locale: Locale;
  refreshKey: number;
}) {
  const [readings, setReadings] = useState<SavedReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const text = copy[locale];

  useEffect(() => {
    let active = true;
    fetch("/api/readings")
      .then(async (response) => {
        const result = await response.json() as { readings?: SavedReading[]; error?: string };
        if (!response.ok) throw new Error(result.error || text.loadError);
        if (active) setReadings(result.readings || []);
      })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : text.loadError);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [refreshKey, text.loadError]);

  const remove = async (id: string) => {
    if (!window.confirm(text.deleteConfirm)) return;
    const response = await fetch(`/api/readings/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (response.ok) setReadings((current) => current.filter((reading) => reading.id !== id));
  };

  return (
    <section className="content-screen history-screen screen-enter">
      <div className="section-heading">
        <p className="eyebrow">{text.eyebrow}</p>
        <h2>{text.title}</h2>
        <p>{text.lead}</p>
      </div>
      {loading ? <div className="history-empty"><span>☾</span><p>…</p></div>
        : error ? <div className="history-empty"><p role="alert">{error}</p></div>
          : readings.length === 0 ? <div className="history-empty"><span>☾</span><p>{text.empty}</p></div>
            : <div className="history-list">{readings.map((reading) => (
              <details className="history-item" key={reading.id}>
                <summary>
                  <div><small>{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(reading.createdAt)}</small><h3>{reading.spread.name}</h3><p>{reading.question || reading.spread.description}</p></div>
                  <span>{reading.cards.length}</span>
                </summary>
                <div className="history-detail">
                  {(reading.context || reading.timeframe) && <div className="history-meta">
                    {reading.context && <p><b>{text.context}</b>{reading.context}</p>}
                    {reading.timeframe && <p><b>{text.timeframe}</b>{reading.timeframe}</p>}
                  </div>}
                  <div className="history-cards">{reading.cards.map((card) => (
                    <article key={`${reading.id}:${card.id}`}>
                      <Image src={card.image} alt="" width={70} height={105} className={card.orientation === "reversed" ? "image-reversed" : ""} />
                      <div><small>{card.position}</small><strong>{locale === "zh-CN" ? card.nameZh : card.nameEn}</strong><span>{card.orientation === "upright" ? (locale === "zh-CN" ? "正位" : "Upright") : (locale === "zh-CN" ? "逆位" : "Reversed")}</span></div>
                    </article>
                  ))}</div>
                  <section className="history-ai">
                    <h4>{text.ai}</h4>
                    <div>{reading.aiReading || text.noAi}</div>
                  </section>
                  <button className="button ghost danger-button" type="button" onClick={() => void remove(reading.id)}>{text.delete}</button>
                </div>
              </details>
            ))}</div>}
    </section>
  );
}
