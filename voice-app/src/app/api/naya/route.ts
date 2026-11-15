import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { getPublicArticle } from "@/lib/content";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { parseChat, sourceText } from "@/lib/naya/core";
import {
  aiClient,
  nayaInstructions,
  nayaModel,
  publicNaya,
} from "@/lib/naya/service";
export const runtime = "nodejs";
export const maxDuration = 30;
const reply = (body: object, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
export async function POST(request: Request) {
  if (
    process.env.NAYA_CHAT_ENABLED !== "true" ||
    !process.env.GROQ_API_KEY ||
    !process.env.NAYA_RATE_LIMIT_SECRET
  )
    return reply({ error: "Naya est momentanément indisponible." }, 503);
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return reply({ error: "Requête refusée." }, 403);
  try {
    // Bound the stream itself: Content-Length may be missing or dishonest.
    const reader = request.body?.getReader();
    if (!reader) return reply({ error: "Requête invalide." }, 400);
    let bytes = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > 16_000) {
        await reader.cancel();
        return reply({ error: "Requête trop longue." }, 413);
      }
      chunks.push(chunk.value);
    }
    let payload: unknown;
    try {
      payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      return reply({ error: "Requête invalide." }, 400);
    }
    const input = parseChat(payload);
    if (!input) return reply({ error: "Question invalide." }, 400);
    const article = await getPublicArticle(input.slug);
    if (!article?.id || !(await publicNaya(article))?.chat)
      return reply({ error: "Article indisponible." }, 404);
    const text = sourceText(article);
    if (text.length > 60_000)
      return reply(
        { error: "Naya n’est pas disponible pour cet article." },
        422,
      );
    // Use only the deployment's trusted proxy header; no raw IP is persisted.
    const ip =
      request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    const key = createHmac("sha256", process.env.NAYA_RATE_LIMIT_SECRET!)
      .update(`${new Date().toISOString().slice(0, 10)}:${ip}`)
      .digest("hex");
    const db = createSupabaseAdminClient();
    const limit = Math.min(
      20,
      Math.max(1, Number(process.env.NAYA_DAILY_LIMIT) || 5),
    );
    const { data, error } = await db.rpc("consume_naya_quota", {
      fingerprint: key,
      daily_limit: limit,
      global_limit: Math.min(
        10000,
        Math.max(1, Number(process.env.NAYA_GLOBAL_DAILY_LIMIT) || 1000),
      ),
    });
    if (error) throw error;
    if (!data)
      return reply(
        {
          error:
            "Vous avez atteint la limite de questions pour aujourd’hui. Revenez demain.",
        },
        429,
      );
    const result = await aiClient().responses.create({
      model: nayaModel(),
      max_output_tokens: 1400,
      reasoning: { effort: "low" },
      instructions: nayaInstructions,
      input: JSON.stringify({
        article: text,
        history: input.history,
        question: input.question,
      }),
      text: {
        format: {
          type: "json_schema",
          name: "answer",
          strict: true,
          schema: {
            type: "object",
            properties: { answer: { type: "string" } },
            required: ["answer"],
            additionalProperties: false,
          },
        },
      },
    });
    if (result.status !== "completed") throw new Error("incomplete");
    const answer = JSON.parse(result.output_text).answer;
    if (typeof answer !== "string" || !answer.trim() || answer.length > 2500)
      throw new Error("invalid");
    return reply({ answer, source: `/articles/${article.slug}` });
  } catch (error) {
    // Log only provider status, never credentials, article text or questions.
    const status = error && typeof error === "object" && "status" in error
      ? Number(error.status)
      : undefined;
    console.error("Naya provider request failed", { status });
    if (status === 429)
      return reply({ error: "Naya a atteint sa limite gratuite. Réessaie un peu plus tard." }, 429);
    return reply(
      {
        error:
          "Je rencontre un petit problème technique. Réessaie dans un instant.",
      },
      503,
    );
  }
}
