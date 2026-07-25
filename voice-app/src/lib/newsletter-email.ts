import "server-only";

import { siteConfig } from "@/lib/site";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendNewsletterConfirmation(email: string, token: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.SOCIAL_PACK_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Le service d’e-mail n’est pas encore configuré.");

  const confirmationUrl = `${siteConfig.url}/newsletter/confirm?token=${encodeURIComponent(token)}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Confirmez votre abonnement à Voice of Guinea",
      html: `
        <div style="max-width:620px;margin:0 auto;font-family:Arial,sans-serif;color:#172019;line-height:1.6">
          <p style="color:#137547;font-weight:700;text-transform:uppercase;letter-spacing:.08em">Voice of Guinea</p>
          <h1 style="font-size:30px;line-height:1.2">Confirmez votre abonnement</h1>
          <p>Vous avez demandé à recevoir notre sélection d’actualités guinéennes.</p>
          <p style="margin:30px 0">
            <a href="${escapeHtml(confirmationUrl)}" style="display:inline-block;background:#d52928;color:white;text-decoration:none;padding:13px 20px;border-radius:999px;font-weight:700">
              Confirmer mon abonnement
            </a>
          </p>
          <p style="font-size:13px;color:#69716b">Si vous n’avez pas demandé cet abonnement, ignorez simplement cet e-mail.</p>
        </div>
      `,
      text: `Confirmez votre abonnement à Voice of Guinea : ${confirmationUrl}`,
    }),
  });
  if (!response.ok) {
    throw new Error(`Resend a refusé l’e-mail de confirmation (${response.status}).`);
  }
}
