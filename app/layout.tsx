import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// Configurações Globais do Aplicativo (PWA)
export const metadata: Metadata = {
  title: "FinApp Premium",
  description: "Controle Financeiro Inteligente",
  manifest: "/manifest.json",
  themeColor: "#ec4899", // Tom rosa/luxo na barra superior do celular
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FinApp",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Força o navegador a reconhecer a Identidade do App */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-512.png" />
      </head>
      <body className={inter.className}>
        {children}
        
        {/* Motor Offline Global: Liga em TODAS as telas (Login, Casais e Painel) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('Erro no Service Worker:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
