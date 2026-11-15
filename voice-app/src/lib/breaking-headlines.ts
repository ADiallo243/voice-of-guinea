export type TickerArticle = { slug: string; status: string; published_at: string | null };
export type TickerRow = { headline: string; external_url: string | null; articles: TickerArticle | TickerArticle[] | null };

// An embedded article can be null when deleted or hidden by public RLS.
// Never turn that absence into an /articles/undefined link.
export function publishedHeadlines(rows: TickerRow[], now = Date.now()) {
  return rows.flatMap(row => {
    if (row.external_url) {
      try {
        const url = new URL(row.external_url);
        if (url.protocol === "https:" || url.protocol === "http:") return [{ text: row.headline, href: url.href }];
      } catch { /* Invalid destinations are omitted, not published. */ }
      return [];
    }
    const article = Array.isArray(row.articles) ? row.articles[0] : row.articles;
    if (!article?.slug || article.status !== "published" || !article.published_at || !Number.isFinite(Date.parse(article.published_at)) || Date.parse(article.published_at) > now) return [];
    return [{ text: row.headline, href: `/articles/${encodeURIComponent(article.slug)}` }];
  });
}
