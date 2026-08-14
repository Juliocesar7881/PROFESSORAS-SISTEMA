import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { Providers } from "@/app/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800"],
  style: "normal",
});

export const metadata: Metadata = {
  title: {
    default: "Pequenos Passos",
    template: "%s | Pequenos Passos",
  },
  description: "Projetos, planejamento e registros pedagógicos para professoras da Educação Infantil.",
  applicationName: "Pequenos Passos",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Pequenos Passos",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#4f3ca6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <body className="theme">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
