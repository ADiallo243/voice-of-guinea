import type { Metadata } from "next";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import { AnalyticsConsent } from "@/components/analytics-consent";
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
  icons: {
    icon: [
      { url: "/brand/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/brand/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/brand/icon-192.png",
    apple: "/brand/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.publisher, url: siteConfig.url }],
  creator: siteConfig.publisher,
  publisher: siteConfig.publisher,
  verification: {
    google: "wcod8hDc5J5eCXLCnjL8R2QKLfdj4mhEX3GLkRQVsqY",
  },
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
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}${siteConfig.logo}`,
    email: siteConfig.email,
    address: { "@type": "PostalAddress", addressLocality: "Conakry", addressCountry: "GN" },
    sameAs: [siteConfig.instagram],
    ethicsPolicy: `${siteConfig.url}/normes-editoriales`,
    correctionsPolicy: `${siteConfig.url}/corrections`,
  };
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    inLanguage: siteConfig.language,
    publisher: { "@type": "NewsMediaOrganization", name: siteConfig.publisher },
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.url}/recherche?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
  return (
    <html lang="fr">
      <body className={`${display.variable} ${sans.variable}`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
        <SiteChrome headlines={headlines}>{children}</SiteChrome>
        <AnalyticsConsent measurementId={siteConfig.gaMeasurementId} />
      </body>
    </html>
  );
}
