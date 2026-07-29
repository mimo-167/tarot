import type { Metadata } from "next";
import { AdminDashboard } from "@/components/AdminDashboard";
import { getRequestLocale } from "@/i18n/server";

export const metadata: Metadata = {
  title: "Admin | Moon & Stars Tarot",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  return <AdminDashboard initialLocale={await getRequestLocale()} />;
}
