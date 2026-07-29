import "server-only";

import type { Locale } from "@/i18n/config";
import { getRuntimeEnv } from "@/lib/runtime-env";

type EmailCopy = {
  subject: string;
  preheader: string;
  title: string;
  lead: string;
  codeLabel: string;
  expiry: string;
  ignore: string;
};

const emailCopy: Record<Locale, EmailCopy> = {
  "zh-CN": {
    subject: "你的星月塔罗登录验证码",
    preheader: "使用验证码登录并解锁完整 AI 解读",
    title: "欢迎回到星月塔罗",
    lead: "请输入下面的验证码完成登录。登录后可以查看完整 AI 解读，并保存每一次抽牌记录。",
    codeLabel: "登录验证码",
    expiry: "验证码将在 5 分钟后失效，请勿转发给他人。",
    ignore: "如果不是你发起的登录，可以忽略这封邮件。",
  },
  en: {
    subject: "Your Moon & Stars Tarot login code",
    preheader: "Use this code to sign in and unlock your full AI reading",
    title: "Welcome back to Moon & Stars Tarot",
    lead: "Enter the code below to finish signing in. You can then unlock your full AI reading and save your reading history.",
    codeLabel: "Your login code",
    expiry: "This code expires in 5 minutes. Do not share it with anyone.",
    ignore: "If you did not request this sign-in, you can ignore this email.",
  },
};

export async function sendLoginCode(email: string, code: string, locale: Locale) {
  const env = getRuntimeEnv();
  const copy = emailCopy[locale];
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL,
      to: [email],
      subject: copy.subject,
      text: `${copy.title}\n\n${copy.lead}\n\n${copy.codeLabel}: ${code}\n\n${copy.expiry}\n${copy.ignore}`,
      html: `<!doctype html>
<html lang="${locale}">
  <body style="margin:0;background:#09060f;color:#eee4f3;font-family:Arial,sans-serif">
    <div style="display:none;max-height:0;overflow:hidden">${copy.preheader}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#09060f">
      <tr><td align="center" style="padding:36px 16px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border:1px solid #6e5a38;background:#171020">
          <tr><td style="padding:38px 34px;text-align:center">
            <div style="color:#dabc75;font-size:34px">☾</div>
            <h1 style="margin:12px 0 10px;font:28px Georgia,serif">${copy.title}</h1>
            <p style="margin:0;color:#b7acbd;font-size:14px;line-height:1.8">${copy.lead}</p>
            <p style="margin:28px 0 8px;color:#dabc75;font-size:11px;letter-spacing:.16em">${copy.codeLabel}</p>
            <div style="padding:17px;border:1px solid #8c7245;background:#0d0816;color:#fff7dc;font:32px Georgia,serif;letter-spacing:.3em">${code}</div>
            <p style="margin:22px 0 0;color:#8f8397;font-size:12px;line-height:1.7">${copy.expiry}<br>${copy.ignore}</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`,
    }),
  });

  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`Resend rejected the login email (${response.status})`);
  }
}
