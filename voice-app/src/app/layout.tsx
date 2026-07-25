import type { Metadata } from "next";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import { SiteChrome } from "@/components/site-chrome";
import { getBreakingHeadlines } from "@/lib/content";
import { siteConfig } from "@/lib/site";
import "./globals.css";

const display = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
});

const sans = Source_Sans_3({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Voice of Guinea — L’actualité guinéenne, autrement",
    template: "%s | Voice of Guinea",
  },
  description: siteConfig.description,
  icons: { icon: "/brand/favicon.png" },
  alternates: {
    types: { "application/rss+xml": `${siteConfig.url}/rss.xml` },
  },
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.publisher, url: siteConfig.url }],
  creator: siteConfig.publisher,
  publisher: siteConfig.publisher,
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: "Voice of Guinea — L’actualité guinéenne, autrement",
    description: siteConfig.description,
    images: [{ url: siteConfig.socialImage, alt: siteConfig.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Voice of Guinea — L’actualité guinéenne, autrement",
    description: siteConfig.description,
    images: [siteConfig.socialImage],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const headlines = await getBreakingHeadlines();
  return (
    <html lang="fr">
      <body className={`${display.variable} ${sans.variable}`}>
        <SiteChrome headlines={headlines}>{children}</SiteChrome>
      </body>
    </html>
  );
}
