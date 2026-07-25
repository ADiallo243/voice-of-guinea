import { readFile } from "node:fs/promises";
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

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function validateDraft(draft) {
  if (!draft.title?.trim() || !draft.excerpt?.trim()) {
    throw new Error("Chaque brouillon doit avoir un titre et un résumé.");
  }
  if (!Array.isArray(draft.content) || draft.content.length < 3) {
    throw new Error(`Le brouillon « ${draft.title} » doit contenir au moins trois blocs.`);
  }
  if (!Array.isArray(draft.sources) || draft.sources.length < 2) {
    throw new Error(`Le brouillon « ${draft.title} » doit avoir au moins deux sources.`);
  }
  for (const source of draft.sources) {
    const url = new URL(source.url);
    if (!["http:", "https:"].includes(url.protocol) || !source.name?.trim()) {
      throw new Error(`Source invalide dans « ${draft.title} ».`);
    }
  }
}

async function main() {
  await loadEnv(await readFile(new URL("../.env.local", import.meta.url), "utf8"));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("Configuration Supabase manquante.");

  const inputText = process.argv[2]
    ? Buffer.from(process.argv[2], "base64").toString("utf8")
    : await new Promise((resolve, reject) => {
        let data = "";
        process.stdin.setEncoding("utf8");
        process.stdin.on("data", (chunk) => { data += chunk; });
        process.stdin.on("end", () => resolve(data));
        process.stdin.on("error", reject);
      });
  const input = JSON.parse(inputText);
  if (!Array.isArray(input.drafts) || input.drafts.length === 0 || input.drafts.length > 2) {
    throw new Error("Fournissez un ou deux brouillons.");
  }
  input.drafts.forEach(validateDraft);

  const supabase = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const [{ data: owners, error: ownerError }, { data: categories, error: categoryError }] =
    await Promise.all([
      supabase.from("profiles").select("id").eq("role", "owner").eq("active", true).limit(1),
      supabase.from("categories").select("id, name").eq("active", true),
    ]);
  if (ownerError) throw ownerError;
  if (categoryError) throw categoryError;
  const ownerId = owners?.[0]?.id;
  if (!ownerId) throw new Error("Aucun compte propriétaire actif trouvé.");

  const categoryIds = new Map((categories ?? []).map((category) => [category.name, category.id]));
  const results = [];

  for (const draft of input.drafts) {
    const slug = slugify(draft.slug || draft.title);
    const { data: existing, error: existingError } = await supabase
      .from("articles")
      .select("id, status")
      .eq("slug", slug)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) {
      results.push({ title: draft.title, status: "skipped", reason: "duplicate", id: existing.id });
      continue;
    }

    const sourceBlocks = [
      { type: "heading", text: "Sources" },
      ...draft.sources.map((source) => ({
        type: "paragraph",
        text: `${source.name}${source.publishedAt ? ` — ${source.publishedAt}` : ""} : ${source.url}`,
      })),
    ];
    const payload = {
      title: draft.title.trim(),
      slug,
      excerpt: draft.excerpt.trim(),
      content: [...draft.content, ...sourceBlocks],
      hero_image_url: null,
      hero_image_alt: draft.imageAlt?.trim() || "",
      image_credit: null,
      category_id: categoryIds.get(draft.category) ?? null,
      author_id: ownerId,
      status: "draft",
      featured: false,
      published_at: null,
      scheduled_for: null,
    };
    const { data, error } = await supabase.from("articles").insert(payload).select("id").single();
    if (error) throw error;
    results.push({ title: draft.title, status: "created", id: data.id, slug });
  }

  process.stdout.write(`${JSON.stringify({ results })}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
