"use client";

import { useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ArticleView({ articleId }: { articleId?: string }) {
  useEffect(() => {
    if (!articleId) return;
    const key = `vog-viewed-${articleId}`;
    if (sessionStorage.getItem(key)) return;
    void (async () => {
      const { error } = await createSupabaseBrowserClient().rpc(
        "increment_article_view",
        { target_article: articleId },
      );
      if (!error) sessionStorage.setItem(key, "1");
    })();
  }, [articleId]);

  return null;
}
