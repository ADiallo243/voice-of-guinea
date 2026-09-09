import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { sendSocialPackEmail } from "@/lib/social-pack-email";

export const runtime = "nodejs";

type ScheduledArticle = {
  id: string;
  slug: string;
  featured: boolean;
  title: string;
  excerpt: string;
  hero_image_url: string | null;
  hero_image_alt: string;
  image_credit: string | null;
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
      .select("id, slug, featured, title, excerpt, hero_image_url, hero_image_alt, image_credit")
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
        console.error("Scheduled article was published, but its social pack email failed.", error);
      }

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
