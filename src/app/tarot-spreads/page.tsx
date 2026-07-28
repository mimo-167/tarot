import { TopicHubPage, createTopicMetadata } from "@/components/TopicHubPage";
import { blogArticles } from "@/content/blog-articles";

const path = "/tarot-spreads";
const title = "Tarot Spreads";
const description =
  "从真实问题出发，了解二选一、关系、自我探索与职业牌阵分别适合怎样的场景。";

export const metadata = createTopicMetadata(title, description, path);

export default function TarotSpreadsPage() {
  return (
    <TopicHubPage
      eyebrow="TOPIC HUB · SPREAD PRACTICE"
      title={title}
      description={description}
      path={path}
      articles={blogArticles}
    />
  );
}
