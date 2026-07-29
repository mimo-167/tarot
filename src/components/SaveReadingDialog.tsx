"use client";

import type { Locale } from "@/i18n/config";

const copy = {
  "zh-CN": {
    eyebrow: "KEEP THIS MOMENT",
    title: "要保留这次抽牌吗？",
    memberLead: "保存问题、牌阵与牌面。如果稍后生成 AI 解读，它也会自动补充到这条记录。",
    guestLead: "邮箱登录后，可以保存问题、牌阵、牌面和完整 AI 解读。",
    save: "保存这次抽牌",
    loginSave: "邮箱登录并保存",
    skip: "暂不保存",
  },
  en: {
    eyebrow: "KEEP THIS MOMENT",
    title: "Would you like to keep this reading?",
    memberLead: "Save the question, spread, and cards. Any AI reading generated next will be added to the same record.",
    guestLead: "Sign in with email to save the question, spread, cards, and full AI reading.",
    save: "Save this reading",
    loginSave: "Sign in and save",
    skip: "Not now",
  },
} satisfies Record<Locale, Record<string, string>>;

export function SaveReadingDialog({
  open,
  locale,
  authenticated,
  saving,
  onSave,
  onLogin,
  onSkip,
}: {
  open: boolean;
  locale: Locale;
  authenticated: boolean;
  saving: boolean;
  onSave: () => void;
  onLogin: () => void;
  onSkip: () => void;
}) {
  if (!open) return null;
  const text = copy[locale];
  return (
    <div className="dialog-backdrop save-reading-backdrop" role="presentation">
      <section className="save-reading-dialog" role="dialog" aria-modal="true" aria-labelledby="save-reading-title">
        <p className="eyebrow">{text.eyebrow}</p>
        <div aria-hidden="true">✦</div>
        <h2 id="save-reading-title">{text.title}</h2>
        <p>{authenticated ? text.memberLead : text.guestLead}</p>
        <button className="button primary large" type="button" disabled={saving} onClick={authenticated ? onSave : onLogin}>
          {authenticated ? text.save : text.loginSave}
        </button>
        <button className="button text-button" type="button" disabled={saving} onClick={onSkip}>{text.skip}</button>
      </section>
    </div>
  );
}
