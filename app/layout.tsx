import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";

import { Providers } from "@/app/providers";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "600", "700"],
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
      <body className={`${plusJakarta.variable} ${fraunces.variable} theme antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
