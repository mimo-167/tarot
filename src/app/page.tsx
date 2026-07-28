import { TarotExperience } from "@/components/TarotExperience";
import { getSpread } from "@/data/spreads";
import { getRequestLocale } from "@/i18n/server";

type HomeProps = {
  searchParams: Promise<{ spread?: string; view?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const locale = await getRequestLocale();
  const { spread: spreadId, view } = await searchParams;
  const requestedSpread = spreadId ? getSpread(spreadId) : undefined;
  const initialView = requestedSpread ? "question" : view === "spreads" ? "spreads" : "home";

  return (
    <TarotExperience
      initialLocale={locale}
      initialSpreadId={requestedSpread?.id}
      initialView={initialView}
    />
  );
}
