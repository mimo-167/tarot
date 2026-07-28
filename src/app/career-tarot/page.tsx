import { TopicHubPage, createTopicMetadata } from "@/components/TopicHubPage";
import { blogArticles, categoryDetails } from "@/content/blog-articles";

const topic = categoryDetails.Career;

export const metadata = createTopicMetadata(topic.title, topic.description, topic.path);

export default function CareerTarotPage() {
  return (
    <TopicHubPage
      eyebrow="TOPIC HUB · CAREER"
      title={topic.title}
      description={topic.description}
      path={topic.path}
      articles={blogArticles.filter((article) => article.category === "Career")}
    />
  );
}
