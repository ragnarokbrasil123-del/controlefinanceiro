import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BottomNav } from "../components/BottomNav";
import { InstallPrompt } from "../components/InstallPrompt";

const inter = Inter({ subsets: ["latin"] });

// METADADOS NATIVOS PARA PWA (Android e Apple iOS)
export const metadata: Metadata = {
  title: "Nexa Premium",
  description: "Seu controle financeiro inteligente",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nexa",
  },
};

// TRUQUE DE MESTRE: Impedir a tela de dar "Zoom" acidental com os dedos
export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-neutral-950 text-white antialiased selection:bg-indigo-500/30 pb-24 md:pb-0`}>
        {children}
        <BottomNav />
        <InstallPrompt />
      </body>
    </html>
  );
}
