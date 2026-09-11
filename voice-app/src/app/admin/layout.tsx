import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rédaction",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
