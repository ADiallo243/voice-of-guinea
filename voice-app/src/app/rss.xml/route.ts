import { getPublishedArticles } from "@/lib/content";
import { siteConfig } from "@/lib/site";

function xml(value: string) {
  return value.replace(/[<>&'"]/g, (char) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;",
  })[char]!);
}

export async function GET() {
  const articles = await getPublishedArticles();
  const items = articles.slice(0, 50).map((article) => `
    <item>
      <title>${xml(article.title)}</title>
      <link>${siteConfig.url}/articles/${xml(article.slug)}</link>
      <guid isPermaLink="true">${siteConfig.url}/articles/${xml(article.slug)}</guid>
      <description>${xml(article.summary)}</description>
      <category>${xml(article.category)}</category>
      <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>
    </item>`).join("");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${siteConfig.name}</title><link>${siteConfig.url}</link><description>${xml(siteConfig.description)}</description><language>fr</language>${items}\n</channel></rss>`,
    { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } },
  );
}
