import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BottomNav } from "../components/BottomNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FinApp Premium",
  description: "Seu controle financeiro inteligente",
};

// TRUQUE DE MESTRE: Impedir a tela de dar "Zoom"
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
      <body className={`${inter.className} bg-neutral-950 text-white antialiased selection:bg-indigo-500/30 pb-24`}>
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
