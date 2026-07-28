import { TopicHubPage, createTopicMetadata } from "@/components/TopicHubPage";
import { blogArticles, categoryDetails } from "@/content/blog-articles";

const topic = categoryDetails["AI Tarot"];

export const metadata = createTopicMetadata(topic.title, topic.description, topic.path);

export default function AiTarotPage() {
  return (
    <TopicHubPage
      eyebrow="TOPIC HUB · AI-ASSISTED TAROT"
      title={topic.title}
      description={topic.description}
      path={topic.path}
      articles={blogArticles.filter((article) => article.category === "AI Tarot")}
    />
  );
}
