import type { Metadata } from "next";
import { Nunito } from "next/font/google";

import { Providers } from "@/app/providers";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "Planejei",
    template: "%s | Planejei",
  },
  description: "Planejamento pedagógico leve, visual e rápido para professoras brasileiras.",
  applicationName: "Planejei",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${nunito.variable} theme antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
