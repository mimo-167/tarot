import { TopicHubPage, createTopicMetadata } from "@/components/TopicHubPage";
import { blogArticles, categoryDetails } from "@/content/blog-articles";

const topic = categoryDetails.Love;

export const metadata = createTopicMetadata(topic.title, topic.description, topic.path);

export default function LoveTarotPage() {
  return (
    <TopicHubPage
      eyebrow="TOPIC HUB · RELATIONSHIPS"
      title={topic.title}
      description={topic.description}
      path={topic.path}
      articles={blogArticles.filter((article) => article.category === "Love")}
    />
  );
}
