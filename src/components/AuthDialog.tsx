"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { SessionUser } from "@/types/account";

type Reason = "login" | "unlock" | "save" | "admin";

type AuthCopy = {
  titles: Record<Reason, string>;
  leads: Record<Reason, string>;
  email: string;
  emailPlaceholder: string;
  send: string;
  sending: string;
  code: string;
  codeLead: (email: string) => string;
  verify: string;
  verifying: string;
  resend: string;
  changeEmail: string;
  close: string;
  fallbackError: string;
};

const copyByLocale: Record<Locale, AuthCopy> = {
  "zh-CN": {
    titles: {
      login: "邮箱登录",
      unlock: "解锁完整 AI 解读",
      save: "登录并保存这次抽牌",
      admin: "管理员登录",
    },
    leads: {
      login: "无需密码，我们会向你的邮箱发送一个 6 位验证码。",
      unlock: "免费邮箱登录后，这一次 AI 解读会立即完整展开。",
      save: "登录后可以保存问题、牌阵、牌面和 AI 解读，并在其他设备查看。",
      admin: "使用总管理员邮箱接收验证码。",
    },
    email: "邮箱地址",
    emailPlaceholder: "you@example.com",
    send: "发送验证码",
    sending: "正在发送…",
    code: "6 位验证码",
    codeLead: (email) => `验证码已发送至 ${email}`,
    verify: "验证并登录",
    verifying: "正在验证…",
    resend: "重新发送",
    changeEmail: "修改邮箱",
    close: "关闭",
    fallbackError: "登录暂时没有完成，请稍后再试。",
  },
  en: {
    titles: {
      login: "Sign in with email",
      unlock: "Unlock your full AI reading",
      save: "Sign in and save this reading",
      admin: "Administrator sign in",
    },
    leads: {
      login: "No password is needed. We will email you a six-digit code.",
      unlock: "Sign in free and the rest of this AI reading will open immediately.",
      save: "Save your question, spread, cards, and AI reading across devices.",
      admin: "Receive a code at the super administrator email address.",
    },
    email: "Email address",
    emailPlaceholder: "you@example.com",
    send: "Send login code",
    sending: "Sending…",
    code: "Six-digit code",
    codeLead: (email) => `We sent a code to ${email}`,
    verify: "Verify and sign in",
    verifying: "Verifying…",
    resend: "Send another code",
    changeEmail: "Change email",
    close: "Close",
    fallbackError: "Sign-in could not be completed. Please try again.",
  },
};

export function AuthDialog({
  open,
  locale,
  reason = "login",
  onClose,
  onAuthenticated,
}: {
  open: boolean;
  locale: Locale;
  reason?: Reason;
  onClose: () => void;
  onAuthenticated: (user: SessionUser) => void | Promise<void>;
}) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const copy = copyByLocale[locale];

  if (!open) return null;

  const closeDialog = () => {
    setStep("email");
    setCode("");
    setError("");
    setLoading(false);
    onClose();
  };

  const requestCode = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || copy.fallbackError);
      setStep("code");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : copy.fallbackError);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, locale }),
      });
      const result = await response.json() as { user?: SessionUser; error?: string };
      if (!response.ok || !result.user) {
        throw new Error(result.error || copy.fallbackError);
      }
      await onAuthenticated(result.user);
      closeDialog();
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : copy.fallbackError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dialog-backdrop auth-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !loading) closeDialog();
    }}>
      <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="auth-close" type="button" onClick={closeDialog} disabled={loading} aria-label={copy.close}>×</button>
        <div className="auth-symbol" aria-hidden="true">☾</div>
        <h2 id="auth-title">{copy.titles[reason]}</h2>
        <p>{step === "email" ? copy.leads[reason] : copy.codeLead(email)}</p>
        {step === "email" ? (
          <form onSubmit={(event) => { event.preventDefault(); void requestCode(); }}>
            <label htmlFor="auth-email">{copy.email}</label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={copy.emailPlaceholder}
              required
              autoFocus
            />
            <button className="button primary large" type="submit" disabled={loading || !email.trim()}>
              {loading ? copy.sending : copy.send}
            </button>
          </form>
        ) : (
          <form onSubmit={(event) => { event.preventDefault(); void verifyCode(); }}>
            <label htmlFor="auth-code">{copy.code}</label>
            <input
              id="auth-code"
              className="code-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              autoFocus
            />
            <button className="button primary large" type="submit" disabled={loading || code.length !== 6}>
              {loading ? copy.verifying : copy.verify}
            </button>
            <div className="auth-secondary-actions">
              <button type="button" onClick={() => void requestCode()} disabled={loading}>{copy.resend}</button>
              <button type="button" onClick={() => { setStep("email"); setCode(""); setError(""); }} disabled={loading}>{copy.changeEmail}</button>
            </div>
          </form>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
        <small>Moon & Stars Tarot · Passwordless</small>
      </section>
    </div>
  );
}
