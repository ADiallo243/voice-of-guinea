import { ImageResponse } from "next/og";
import { getPublicArticle } from "@/lib/content";
import { siteConfig } from "@/lib/site";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const isHome = slug === "home";
  const article = isHome ? undefined : await getPublicArticle(slug);
  if (!isHome && !article) return new Response("Not found", { status: 404 });

  const title = article?.title ?? "La Guinée en images et en voix";
  const category = article?.category ?? "VOICE OF GUINEA";
  const titleSize = title.length > 130 ? 42 : title.length > 105 ? 48 : title.length > 75 ? 55 : 65;

  return new ImageResponse(
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      justifyContent: "space-between", padding: "72px 78px", color: "#fff",
      background: "linear-gradient(135deg, #102e2d 0%, #0b3f37 57%, #134c3b 100%)",
      fontFamily: "sans-serif", position: "relative",
    }}>
      <div style={{ position: "absolute", right: -100, top: -140, width: 520, height: 520, borderRadius: 520, border: "56px solid rgba(237, 190, 83, .16)" }} />
      <div style={{ position: "absolute", right: 90, bottom: -240, width: 570, height: 570, borderRadius: 570, border: "2px solid rgba(255,255,255,.15)" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28, fontWeight: 700, letterSpacing: 3 }}>
        <span style={{ width: 28, height: 28, borderRadius: 28, background: "#f3c65b" }} />
        {siteConfig.name.toUpperCase()}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1020, zIndex: 1 }}>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 3, color: "#f3c65b", textTransform: "uppercase" }}>{category}</div>
        <div style={{ fontSize: titleSize, fontWeight: 750, lineHeight: 1.12, letterSpacing: -1.5 }}>{title}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: "#d5e5df", zIndex: 1 }}>
        <span>{isHome ? "Actualités · Culture · Talents" : "Illustration éditoriale"}</span>
        <span>voiceofguinea.com</span>
      </div>
    </div>,
    { width: 1200, height: 630, headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}
