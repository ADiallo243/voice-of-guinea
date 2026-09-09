import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";

export const runtime = "nodejs";

type ScheduledArticle = {
  id: string;
  slug: string;
  featured: boolean;
};

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("articles")
      .select("id, slug, featured")
      .eq("status", "scheduled")
      .lte("scheduled_for", now);

    if (error) throw error;

    const dueArticles = (data ?? []) as ScheduledArticle[];
    for (const article of dueArticles) {
      if (article.featured) {
        const { error: clearFeaturedError } = await supabase
          .from("articles")
          .update({ featured: false })
          .eq("status", "published")
          .eq("featured", true)
          .neq("id", article.id);
        if (clearFeaturedError) throw clearFeaturedError;
      }

      const { error: publishError } = await supabase
        .from("articles")
        .update({
          status: "published",
          published_at: now,
          scheduled_for: null,
        })
        .eq("id", article.id)
        .eq("status", "scheduled");
      if (publishError) throw publishError;

      revalidatePath(`/articles/${article.slug}`);
    }

    if (dueArticles.length) {
      revalidatePath("/", "layout");
      revalidatePath("/actualites");
      revalidatePath("/sitemap.xml");
      revalidatePath("/news-sitemap.xml");
    }

    return NextResponse.json({ published: dueArticles.length });
  } catch (error) {
    console.error("Scheduled publication failed.", error);
    return NextResponse.json({ error: "Unable to publish scheduled articles." }, { status: 500 });
  }
}
