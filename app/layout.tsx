import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Audit France — Transparence démocratique & finances publiques",
  description: "Tableau de bord open-source de veille civique : élus, marchés publics, appels d'offres et budget par département. Données officielles en temps réel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full" suppressHydrationWarning>
      <body className="h-full overflow-hidden" suppressHydrationWarning>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
