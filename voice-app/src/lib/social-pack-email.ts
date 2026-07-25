import "server-only";

import { siteConfig } from "@/lib/site";

type SocialPackArticle = {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  imageUrl: string | null;
  imageAlt: string;
  imageCredit: string | null;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function absoluteUrl(value: string | null) {
  if (!value) return null;
  return value.startsWith("http") ? value : `${siteConfig.url}${value}`;
}

function shortenForX(excerpt: string, articleUrl: string) {
  const suffix = `\n\n${articleUrl}\n\n#Guinee #VoiceOfGuinea`;
  const available = 280 - suffix.length;
  const cleanExcerpt = excerpt.replace(/\s+/g, " ").trim();
  const summary = cleanExcerpt.length <= available
    ? cleanExcerpt
    : `${cleanExcerpt.slice(0, Math.max(0, available - 1)).trimEnd()}…`;
  return `${summary}${suffix}`;
}

export async function sendSocialPackEmail(article: SocialPackArticle) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.SOCIAL_PACK_FROM_EMAIL;
  const to = process.env.SOCIAL_PACK_TO_EMAIL;
  if (!apiKey || !from || !to) {
    console.warn("Social pack email skipped: Resend environment variables are missing.");
    return { sent: false, reason: "missing_configuration" };
  }

  const articleUrl = `${siteConfig.url}/articles/${article.slug}`;
  const facebook = `${article.excerpt}\n\nDécouvrez l’article complet sur Voice of Guinea : ${articleUrl}\n\n#Guinee #Actualite #VoiceOfGuinea`;
  const xPost = shortenForX(article.excerpt, articleUrl);
  const imageUrl = absoluteUrl(article.imageUrl);
  const credit = article.imageCredit || "Voice of Guinea";
  const safeTitle = escapeHtml(article.title);
  const safeFacebook = escapeHtml(facebook);
  const safeXPost = escapeHtml(xPost);
  const safeArticleUrl = escapeHtml(articleUrl);
  const safeCredit = escapeHtml(credit);
  const safeAlt = escapeHtml(article.imageAlt || article.title);

  const payload = {
    from,
    to: [to],
    subject: `Pack réseaux sociaux — ${article.title}`,
    html: `
      <div style="max-width:680px;margin:0 auto;font-family:Arial,sans-serif;color:#172019;line-height:1.6">
        <p style="color:#137547;font-weight:700;text-transform:uppercase;letter-spacing:.08em">Voice of Guinea</p>
        <h1 style="font-size:28px;line-height:1.2">${safeTitle}</h1>
        ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${safeAlt}" style="display:block;width:100%;height:auto;border-radius:12px;margin:24px 0 8px">` : ""}
        <p style="font-size:13px;color:#647067">Crédit : ${safeCredit}</p>
        <h2 style="margin-top:32px">Version Facebook</h2>
        <div style="white-space:pre-wrap;background:#f5f3ed;padding:18px;border-radius:10px">${safeFacebook}</div>
        <h2 style="margin-top:32px">Version X</h2>
        <div style="white-space:pre-wrap;background:#f5f3ed;padding:18px;border-radius:10px">${safeXPost}</div>
        <p style="margin-top:32px"><a href="${safeArticleUrl}" style="color:#137547;font-weight:700">Ouvrir l’article</a></p>
        ${imageUrl ? `<p><a href="${escapeHtml(imageUrl)}" style="color:#137547;font-weight:700">Télécharger l’image</a></p>` : ""}
      </div>
    `,
    text: [
      article.title,
      "",
      "VERSION FACEBOOK",
      facebook,
      "",
      "VERSION X",
      xPost,
      "",
      `Crédit image : ${credit}`,
      imageUrl ? `Télécharger l’image : ${imageUrl}` : "Aucune image jointe.",
    ].join("\n"),
    ...(imageUrl
      ? {
          attachments: [{
            path: imageUrl,
            filename: `${article.slug}-voice-of-guinea.jpg`,
          }],
        }
      : {}),
  };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `social-pack-${article.id}`,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Resend rejected the social pack email (${response.status}): ${message}`);
  }
  return { sent: true };
}
