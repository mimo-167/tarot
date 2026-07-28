import { TopicHubPage, createTopicMetadata } from "@/components/TopicHubPage";
import { blogArticles, categoryDetails } from "@/content/blog-articles";

const topic = categoryDetails["Self Discovery"];

export const metadata = createTopicMetadata(topic.title, topic.description, topic.path);

export default function SelfDiscoveryPage() {
  return (
    <TopicHubPage
      eyebrow="TOPIC HUB · INNER WORK"
      title={topic.title}
      description={topic.description}
      path={topic.path}
      articles={blogArticles.filter((article) => article.category === "Self Discovery")}
    />
  );
}
