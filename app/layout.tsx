import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FRANCE MONITOR — Tableau de bord de veille nationale",
  description: "Dashboard de surveillance en temps réel centré sur la France. Carte interactive, flux RSS, webcams et insights IA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full" suppressHydrationWarning>
      <body className="h-full overflow-hidden" suppressHydrationWarning>{children}</body>
    </html>
  );
}
