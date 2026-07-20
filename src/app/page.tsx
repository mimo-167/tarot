import { TarotExperience } from "@/components/TarotExperience";
import { getRequestLocale } from "@/i18n/server";

export default async function Home() {
  const locale = await getRequestLocale();
  return <TarotExperience initialLocale={locale} />;
}
