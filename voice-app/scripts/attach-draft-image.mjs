import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnv(contents) {
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function mimeType(filePath) {
  const extension = extname(filePath).toLowerCase();
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  throw new Error("Le fichier doit être une image JPEG, PNG ou WebP.");
}

async function main() {
  await loadEnv(await readFile(new URL("../.env.local", import.meta.url), "utf8"));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("Configuration Supabase manquante.");

  const [articleId, filePath, alt, credit, sourceUrl] = process.argv.slice(2);
  if (!articleId || !filePath || !alt || !credit || !sourceUrl) {
    throw new Error(
      "Usage: node scripts/attach-draft-image.mjs <article-id> <image> <texte-alt> <crédit> <source>",
    );
  }
  const parsedSource = new URL(sourceUrl);
  if (!["http:", "https:"].includes(parsedSource.protocol)) {
    throw new Error("L’adresse de la source de l’image est invalide.");
  }

  const supabase = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: article, error: articleError } = await supabase
    .from("articles")
    .select("id, slug, status, content")
    .eq("id", articleId)
    .single();
  if (articleError) throw articleError;
  if (article.status !== "draft") {
    throw new Error("Seuls les brouillons peuvent recevoir une image avec ce script.");
  }

  const image = await readFile(filePath);
  if (image.byteLength > 10 * 1024 * 1024) throw new Error("L’image dépasse 10 Mo.");
  const extension = extname(filePath).toLowerCase().replace(".jpeg", ".jpg");
  const storagePath = `sourced-drafts/${article.id}-${Date.now()}${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("article-images")
    .upload(storagePath, image, { contentType: mimeType(filePath), upsert: false });
  if (uploadError) throw uploadError;

  const publicUrl = supabase.storage.from("article-images").getPublicUrl(storagePath).data.publicUrl;
  const sourceText = `Source de l’image : ${sourceUrl}`;
  const content = Array.isArray(article.content) ? article.content : [];
  const sourcedContent = content.some((block) => block?.text === sourceText)
    ? content
    : [...content, { type: "paragraph", text: sourceText }];
  const { error: updateError } = await supabase
    .from("articles")
    .update({
      hero_image_url: publicUrl,
      hero_image_alt: alt,
      image_credit: credit,
      content: sourcedContent,
    })
    .eq("id", article.id)
    .eq("status", "draft");
  if (updateError) throw updateError;

  process.stdout.write(`${JSON.stringify({ id: article.id, slug: article.slug, publicUrl })}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
