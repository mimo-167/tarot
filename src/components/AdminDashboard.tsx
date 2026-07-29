"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AuthDialog } from "@/components/AuthDialog";
import type { Locale } from "@/i18n/config";
import type { SavedReading, SessionUser } from "@/types/account";

type Tab = "overview" | "users" | "readings" | "audit";
type Pagination = { page: number; total: number; totalPages: number };
type DashboardData = {
  metrics: {
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    newUsers7d: number;
    totalReadings: number;
    readings7d: number;
    aiSavedReadings: number;
  };
  timeline: Array<{ day: string; registrations: number; readings: number }>;
  topSpreads: Array<{ spread_id: string; spread_name: string; total: number }>;
  recentUsers: Array<{ id: string; email: string; status: string; created_at: number; last_login_at: number }>;
  recentReadings: Array<{ id: string; user_email: string; spread_name: string; created_at: number; has_ai: number }>;
};
type AdminUser = {
  id: string;
  email: string;
  role: string;
  locale: string;
  status: "active" | "suspended";
  created_at: number;
  last_login_at: number;
  reading_count: number;
};
type AdminReading = {
  id: string;
  user_email: string;
  locale: string;
  spread_name: string;
  created_at: number;
  has_ai: number;
};
type AuditLog = {
  id: string;
  admin_email: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata_json: string | null;
  created_at: number;
};

const ui = {
  "zh-CN": {
    product: "星月塔罗",
    admin: "管理后台",
    tabs: { overview: "总览", users: "用户", readings: "抽牌记录", audit: "审计日志" },
    signIn: "使用管理员邮箱登录",
    denied: "当前登录账号没有管理员权限。",
    logout: "退出",
    site: "返回网站",
    refresh: "刷新",
    search: "搜索",
    all: "全部",
    active: "正常",
    suspended: "已暂停",
    aiAll: "全部 AI 状态",
    aiYes: "含 AI 解读",
    aiNo: "无 AI 解读",
    previous: "上一页",
    next: "下一页",
    empty: "暂无数据",
    view: "查看",
    remove: "删除",
    suspend: "暂停",
    restore: "恢复",
    confirmDelete: "确定永久删除这条用户抽牌记录吗？",
    confirmStatus: "确定修改该用户的账号状态吗？",
    loadError: "后台数据暂时无法读取。",
  },
  en: {
    product: "Moon & Stars Tarot",
    admin: "Admin",
    tabs: { overview: "Overview", users: "Users", readings: "Readings", audit: "Audit log" },
    signIn: "Sign in with the administrator email",
    denied: "The signed-in account does not have administrator access.",
    logout: "Sign out",
    site: "Back to site",
    refresh: "Refresh",
    search: "Search",
    all: "All",
    active: "Active",
    suspended: "Suspended",
    aiAll: "All AI states",
    aiYes: "Has AI reading",
    aiNo: "No AI reading",
    previous: "Previous",
    next: "Next",
    empty: "No data",
    view: "View",
    remove: "Delete",
    suspend: "Suspend",
    restore: "Restore",
    confirmDelete: "Permanently delete this user's saved reading?",
    confirmStatus: "Change this user's account status?",
    loadError: "Admin data is temporarily unavailable.",
  },
} satisfies Record<Locale, {
  product: string;
  admin: string;
  tabs: Record<Tab, string>;
  [key: string]: string | Record<Tab, string>;
}>;

const formatDate = (locale: Locale, value: number) =>
  new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(value);

async function getJson<T>(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  const result = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
  return result;
}

function Pager({
  pagination,
  text,
  onPage,
}: {
  pagination: Pagination | null;
  text: typeof ui["zh-CN"];
  onPage: (page: number) => void;
}) {
  if (!pagination || pagination.totalPages <= 1) return null;
  return <div className="admin-pager">
    <button disabled={pagination.page <= 1} onClick={() => onPage(pagination.page - 1)}>{text.previous as string}</button>
    <span>{pagination.page} / {pagination.totalPages} · {pagination.total}</span>
    <button disabled={pagination.page >= pagination.totalPages} onClick={() => onPage(pagination.page + 1)}>{text.next as string}</button>
  </div>;
}

export function AdminDashboard({ initialLocale }: { initialLocale: Locale }) {
  const [locale, setLocale] = useState(initialLocale);
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [authOpen, setAuthOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [readings, setReadings] = useState<AdminReading[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [selectedReading, setSelectedReading] = useState<SavedReading | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [ai, setAi] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const text = ui[locale];

  const load = useCallback(async (requestedTab = tab, page = 1) => {
    if (user?.role !== "admin") return;
    setLoading(true);
    setError("");
    try {
      if (requestedTab === "overview") {
        setDashboard(await getJson<DashboardData>("/api/admin/dashboard"));
        setPagination(null);
      } else if (requestedTab === "users") {
        const params = new URLSearchParams({ page: String(page) });
        if (search) params.set("search", search);
        if (status) params.set("status", status);
        const result = await getJson<{ users: AdminUser[]; pagination: Pagination }>(`/api/admin/users?${params}`);
        setUsers(result.users);
        setPagination(result.pagination);
      } else if (requestedTab === "readings") {
        const params = new URLSearchParams({ page: String(page) });
        if (search) params.set("search", search);
        if (ai) params.set("ai", ai);
        const result = await getJson<{ readings: AdminReading[]; pagination: Pagination }>(`/api/admin/readings?${params}`);
        setReadings(result.readings);
        setPagination(result.pagination);
      } else {
        const result = await getJson<{ logs: AuditLog[]; pagination: Pagination }>(`/api/admin/audit-logs?page=${page}`);
        setLogs(result.logs);
        setPagination(result.pagination);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : text.loadError as string);
    } finally {
      setLoading(false);
    }
  }, [ai, search, status, tab, text.loadError, user?.role]);

  useEffect(() => {
    getJson<{ user: SessionUser | null }>("/api/auth/session")
      .then((result) => setUser(result.user))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (user?.role !== "admin") return;
    const timer = window.setTimeout(() => void load(tab, 1), 0);
    return () => window.clearTimeout(timer);
  }, [tab, user?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeTab = (next: Tab) => {
    setTab(next);
    setSearch("");
    setStatus("");
    setAi("");
    setPagination(null);
  };

  const changeUserStatus = async (target: AdminUser) => {
    if (!window.confirm(text.confirmStatus as string)) return;
    await getJson<{ ok: boolean }>(`/api/admin/users/${encodeURIComponent(target.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: target.status === "active" ? "suspended" : "active" }),
    });
    await load("users", pagination?.page || 1);
  };

  const openReading = async (id: string) => {
    const result = await getJson<{ reading: SavedReading }>(`/api/admin/readings/${encodeURIComponent(id)}`);
    setSelectedReading(result.reading);
  };

  const deleteReading = async (id: string) => {
    if (!window.confirm(text.confirmDelete as string)) return;
    await getJson<{ ok: boolean }>(`/api/admin/readings/${encodeURIComponent(id)}`, { method: "DELETE" });
    setSelectedReading(null);
    await load("readings", pagination?.page || 1);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setDashboard(null);
  };

  if (user === undefined) {
    return <main className="admin-auth-screen"><div className="admin-loader">☾</div></main>;
  }

  if (!user || user.role !== "admin") {
    return <main className="admin-auth-screen">
      <div className="admin-login-card">
        <span>☾</span><small>{text.product}</small><h1>{text.admin}</h1>
        <p>{user ? text.denied : text.signIn}</p>
        <button className="button primary large" onClick={() => setAuthOpen(true)}>{text.signIn}</button>
        {user && <button className="button ghost" onClick={() => void logout()}>{text.logout}</button>}
        <Link href="/">{text.site}</Link>
      </div>
      <AuthDialog open={authOpen} locale={locale} reason="admin" onClose={() => setAuthOpen(false)} onAuthenticated={setUser} />
    </main>;
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand"><span>☾</span><div><strong>{text.product}</strong><small>{text.admin}</small></div></div>
        <nav>{(Object.keys(text.tabs) as Tab[]).map((item) => (
          <button key={item} className={tab === item ? "active" : ""} onClick={() => changeTab(item)}>{text.tabs[item]}</button>
        ))}</nav>
        <div className="admin-account"><small>{user.role}</small><b>{user.email}</b><button onClick={() => void logout()}>{text.logout}</button></div>
      </aside>
      <section className="admin-main">
        <header><div><p>SAAS CONTROL CENTER</p><h1>{text.tabs[tab]}</h1></div><div><button onClick={() => setLocale(locale === "zh-CN" ? "en" : "zh-CN")}>{locale === "zh-CN" ? "English" : "中文"}</button><button onClick={() => void load(tab, pagination?.page || 1)}>{text.refresh}</button><Link href="/">{text.site}</Link></div></header>
        {error && <div className="admin-alert" role="alert">{error}</div>}
        {tab === "overview" && dashboard && <AdminOverview data={dashboard} locale={locale} />}
        {tab === "users" && <>
          <div className="admin-toolbar"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`${text.search} email`} /><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">{text.all}</option><option value="active">{text.active}</option><option value="suspended">{text.suspended}</option></select><button onClick={() => void load("users", 1)}>{text.search}</button></div>
          <div className="admin-table-wrap"><table><thead><tr><th>Email</th><th>Role</th><th>Locale</th><th>Status</th><th>Readings</th><th>Created</th><th /></tr></thead><tbody>{users.map((item) => <tr key={item.id}><td>{item.email}</td><td>{item.role}</td><td>{item.locale}</td><td><span className={`status-pill ${item.status}`}>{item.status}</span></td><td>{item.reading_count}</td><td>{formatDate(locale, item.created_at)}</td><td>{item.role !== "admin" && <button onClick={() => void changeUserStatus(item)}>{item.status === "active" ? text.suspend : text.restore}</button>}</td></tr>)}</tbody></table>{!users.length && <p className="admin-empty">{text.empty}</p>}</div>
          <Pager pagination={pagination} text={text} onPage={(page) => void load("users", page)} />
        </>}
        {tab === "readings" && <>
          <div className="admin-toolbar"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`${text.search} email / spread`} /><select value={ai} onChange={(event) => setAi(event.target.value)}><option value="">{text.aiAll}</option><option value="yes">{text.aiYes}</option><option value="no">{text.aiNo}</option></select><button onClick={() => void load("readings", 1)}>{text.search}</button></div>
          <div className="admin-table-wrap"><table><thead><tr><th>User</th><th>Spread</th><th>AI</th><th>Created</th><th /></tr></thead><tbody>{readings.map((item) => <tr key={item.id}><td>{item.user_email}</td><td>{item.spread_name}</td><td>{item.has_ai ? "✓" : "—"}</td><td>{formatDate(locale, item.created_at)}</td><td><button onClick={() => void openReading(item.id)}>{text.view}</button></td></tr>)}</tbody></table>{!readings.length && <p className="admin-empty">{text.empty}</p>}</div>
          <Pager pagination={pagination} text={text} onPage={(page) => void load("readings", page)} />
        </>}
        {tab === "audit" && <><div className="admin-table-wrap"><table><thead><tr><th>Admin</th><th>Action</th><th>Target</th><th>Metadata</th><th>Created</th></tr></thead><tbody>{logs.map((item) => <tr key={item.id}><td>{item.admin_email}</td><td>{item.action}</td><td>{item.target_type}:{item.target_id.slice(0, 8)}</td><td>{item.metadata_json || "—"}</td><td>{formatDate(locale, item.created_at)}</td></tr>)}</tbody></table>{!logs.length && <p className="admin-empty">{text.empty}</p>}</div><Pager pagination={pagination} text={text} onPage={(page) => void load("audit", page)} /></>}
        {loading && <div className="admin-loading">☾</div>}
      </section>
      {selectedReading && <div className="admin-reading-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedReading(null); }}><section><button className="admin-modal-close" onClick={() => setSelectedReading(null)}>×</button><small>{selectedReading.userEmail}</small><h2>{selectedReading.spread.name}</h2><p className="admin-modal-question">{selectedReading.question || selectedReading.spread.description}</p><div className="admin-modal-cards">{selectedReading.cards.map((card) => <span key={card.id}><b>{card.position}</b>{locale === "zh-CN" ? card.nameZh : card.nameEn} · {card.orientation}</span>)}</div><h3>AI</h3><pre>{selectedReading.aiReading || "—"}</pre><button className="button ghost danger-button" onClick={() => void deleteReading(selectedReading.id)}>{text.remove}</button></section></div>}
    </main>
  );
}

function AdminOverview({ data, locale }: { data: DashboardData; locale: Locale }) {
  const cards = [
    ["Total users", data.metrics.totalUsers, `+${data.metrics.newUsers7d} / 7d`],
    ["Active users", data.metrics.activeUsers, `${data.metrics.suspendedUsers} suspended`],
    ["Saved readings", data.metrics.totalReadings, `+${data.metrics.readings7d} / 7d`],
    ["With AI", data.metrics.aiSavedReadings, `${data.metrics.totalReadings ? Math.round(data.metrics.aiSavedReadings / data.metrics.totalReadings * 100) : 0}%`],
  ];
  const maximum = Math.max(1, ...data.timeline.map((item) => item.readings + item.registrations));
  return <>
    <div className="admin-metrics">{cards.map(([label, value, meta]) => <article key={String(label)}><small>{label}</small><strong>{value}</strong><span>{meta}</span></article>)}</div>
    <div className="admin-overview-grid">
      <section className="admin-panel"><header><h2>14-day activity</h2></header><div className="admin-chart">{data.timeline.map((item) => <div key={item.day} title={`${item.day}: ${item.readings} readings, ${item.registrations} users`}><i style={{ height: `${Math.max(3, item.readings / maximum * 100)}%` }} /><b style={{ height: `${Math.max(3, item.registrations / maximum * 100)}%` }} /><small>{item.day.slice(5)}</small></div>)}</div></section>
      <section className="admin-panel"><header><h2>Top spreads</h2></header><ol className="admin-top-list">{data.topSpreads.map((item) => <li key={item.spread_id}><span>{item.spread_name}</span><b>{item.total}</b></li>)}</ol></section>
      <section className="admin-panel"><header><h2>Recent users</h2></header><ul className="admin-recent-list">{data.recentUsers.map((item) => <li key={item.id}><span><b>{item.email}</b><small>{formatDate(locale, item.created_at)}</small></span><em className={`status-pill ${item.status}`}>{item.status}</em></li>)}</ul></section>
      <section className="admin-panel"><header><h2>Recent readings</h2></header><ul className="admin-recent-list">{data.recentReadings.map((item) => <li key={item.id}><span><b>{item.spread_name}</b><small>{item.user_email} · {formatDate(locale, item.created_at)}</small></span><em>{item.has_ai ? "AI" : "Local"}</em></li>)}</ul></section>
    </div>
  </>;
}
