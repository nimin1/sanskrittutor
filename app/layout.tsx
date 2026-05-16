import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/AppShell";
import "./globals.css";
import { ml } from "@/lib/i18n/ml";

export const metadata: Metadata = {
  title: `${ml.appName} · AI Sanskrit Tutor`,
  description: "Malayalam-first AI Sanskrit tutor — voice-first learning for exam preparation",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: ml.appName,
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#f3ece0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ml">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
