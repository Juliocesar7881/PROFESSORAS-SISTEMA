import type { Metadata } from "next";
import { Baloo_2, Nunito } from "next/font/google";

import { Providers } from "@/app/providers";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "500", "600", "700", "800"],
});

const baloo = Baloo_2({
  subsets: ["latin"],
  variable: "--font-baloo",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Planejafácil",
    template: "%s | Planejafácil",
  },
  description: "Planejamento pedagógico leve, visual e rápido para professoras brasileiras.",
  applicationName: "Planejafácil",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${nunito.variable} ${baloo.variable} theme antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
