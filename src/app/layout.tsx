import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Ops RH — Le cockpit de la freelance RH",
  description:
    "Ops RH aide les freelances RH à piloter leurs clients, leurs dossiers, leurs documents, leurs relances et leur pré-facturation depuis une seule web app.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
