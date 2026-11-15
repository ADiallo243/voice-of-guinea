import { generateSummary } from "@/lib/naya/service";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { sendSocialPackEmail } from "@/lib/social-pack-email";

type ScheduledArticle = {
  scheduled_for: string | null;
  published_at: string | null;
  id: string;
  slug: string;
  featured: boolean;
  title: string;
  excerpt: string;
  hero_image_url: string | null;
  hero_image_alt: string;
  image_credit: string | null;
};

export async function runScheduledPublishing() {
  let runId: string | null = null;
  let publishedCount = 0;
  const processed: {
    slug: string;
    scheduled_for: string | null;
    published_at: string;
  }[] = [];
  try {
    const supabase = createSupabaseAdminClient();
    const now = new Date().toISOString();
    const { data: run, error: runError } = await supabase
      .from("publication_runs")
      .insert({})
      .select("id")
      .single();
    if (runError) throw runError;
    runId = run.id;
    const { data, error } = await supabase
      .from("articles")
      .select(
        "id, slug, featured, title, excerpt, hero_image_url, hero_image_alt, image_credit, scheduled_for, published_at",
      )
      .eq("status", "scheduled")
      .lte("scheduled_for", now);

    if (error) throw error;

    const dueArticles = (data ?? []) as ScheduledArticle[];
    for (const article of dueArticles) {
      const { data: published, error: publishError } = await supabase.rpc(
        "publish_due_newsroom_article",
        { article_id: article.id, due_before: now },
      );
      if (publishError) throw publishError;
      if (!published) continue;
      publishedCount += 1;
      processed.push({
        slug: article.slug,
        scheduled_for: article.scheduled_for,
        published_at: now,
      });
      after(() => generateSummary(article.id));

      try {
        await sendSocialPackEmail({
          id: article.id,
          title: article.title,
          excerpt: article.excerpt,
          slug: article.slug,
          imageUrl: article.hero_image_url,
          imageAlt: article.hero_image_alt,
          imageCredit: article.image_credit,
        });
      } catch (error) {
        console.error(
          "Scheduled article was published, but its social pack email failed.",
          error,
        );
      }

      revalidatePath(`/articles/${article.slug}`);
    }

    if (publishedCount) {
      revalidatePath("/", "layout");
      revalidatePath("/actualites");
      revalidatePath("/sitemap.xml");
      revalidatePath("/news-sitemap.xml");
    }

    // Remove short-lived anti-abuse records and abandoned unconfirmed signups.
    // Confirmed and unsubscribed contacts are left untouched for the newsroom's
    // documented retention process.
    const rateLimitCutoff = new Date(
      Date.now() - 48 * 60 * 60 * 1000,
    ).toISOString();
    const pendingCutoff = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const cleanupResults = await Promise.all([
      ...(process.env.NAYA_CHAT_ENABLED === "true"
        ? [
            supabase
              .from("naya_usage")
              .delete()
              .lt("updated_at", rateLimitCutoff),
          ]
        : []),
      supabase
        .from("login_attempt_limits")
        .delete()
        .lt("updated_at", rateLimitCutoff),
      supabase
        .from("newsletter_signup_limits")
        .delete()
        .lt("updated_at", rateLimitCutoff),
      supabase
        .from("newsletter_subscribers")
        .delete()
        .eq("status", "pending")
        .lt("confirmation_sent_at", pendingCutoff),
    ]);
    cleanupResults.forEach(({ error: cleanupError }) => {
      if (cleanupError)
        console.error("Scheduled privacy cleanup failed.", cleanupError);
    });

    const { error: logError } = await supabase
      .from("publication_runs")
      .update({
        status: "success",
        finished_at: new Date().toISOString(),
        published_count: publishedCount,
        detail: processed,
      })
      .eq("id", runId!);
    if (logError)
      console.error("Could not close publication run", logError.code);
    return { published: publishedCount };
  } catch (error) {
    console.error("Scheduled publication failed.", error);
    if (runId)
      await createSupabaseAdminClient()
        .from("publication_runs")
        .update({
          status: "failed",
          finished_at: new Date().toISOString(),
          published_count: publishedCount,
          detail: processed,
          error_note: "Publication interrompue. Consulter les logs serveur.",
        })
        .eq("id", runId);
    throw new Error(
      "La publication programmée a échoué. Consultez le journal des passages.",
    );
  }
}
