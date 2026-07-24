import type { Metadata } from "next";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import { SiteChrome } from "@/components/site-chrome";
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
  metadataBase: new URL("https://www.voiceofguinea.com"),
  title: {
    default: "Voice of Guinea — L’actualité guinéenne, autrement",
    template: "%s | Voice of Guinea",
  },
  description:
    "Actualités, culture, sport et divertissement en Guinée, racontés avec clarté et proximité.",
  icons: { icon: "/brand/favicon.png" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className={`${display.variable} ${sans.variable}`}>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
