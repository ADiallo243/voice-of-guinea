import { getPublishedArticles } from "@/lib/content";
import { siteConfig } from "@/lib/site";

function xml(value: string) {
  return value.replace(/[<>&'"]/g, (char) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;",
  })[char]!);
}

export async function GET() {
  const cutoff = Date.now() - 2 * 24 * 60 * 60 * 1000;
  const articles = (await getPublishedArticles()).filter(
    (article) => new Date(article.publishedAt).getTime() >= cutoff,
  );
  const entries = articles.map((article) => `
  <url>
    <loc>${siteConfig.url}/articles/${xml(article.slug)}</loc>
    <news:news>
      <news:publication>
        <news:name>${xml(siteConfig.name)}</news:name>
        <news:language>fr</news:language>
      </news:publication>
      <news:publication_date>${new Date(article.publishedAt).toISOString()}</news:publication_date>
      <news:title>${xml(article.title)}</news:title>
    </news:news>
  </url>`).join("");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${entries}\n</urlset>`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
}
