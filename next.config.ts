import type {NextConfig} from 'next';

/**
 * Política de segurança de conteúdo, em modo APENAS RELATÓRIO.
 *
 * Em modo report-only o navegador não bloqueia nada — só registra no console
 * o que seria bloqueado. É de propósito: uma CSP mal calibrada quebra o app
 * silenciosamente para o usuário final, e eu não tenho como clicar em todas as
 * telas para conferir. Rode o app, abra o console e veja se aparece violação.
 *
 * Quando estiver limpo, troque a chave para 'Content-Security-Policy' para
 * passar a bloquear de verdade.
 *
 * 'unsafe-inline' e 'unsafe-eval' em script-src são necessários enquanto o
 * Next não estiver configurado com nonce por requisição — ele injeta scripts
 * inline de hidratação. Isso enfraquece a proteção contra XSS, mas o app não
 * renderiza HTML de terceiros em lugar nenhum (nenhum dangerouslySetInnerHTML).
 */
const cspReportOnly = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  // blob: e data: são usados pela exportação de dados e pelo preview de recibo.
  "img-src 'self' data: blob: https://*.supabase.co https://picsum.photos https://*.googleusercontent.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

/**
 * Cabeçalhos aplicados a todas as rotas.
 *
 * Não havia nenhum. Para um app que guarda dado financeiro, a ausência de
 * X-Frame-Options é a mais grave: qualquer site podia embutir o Nexa num
 * iframe invisível e capturar cliques do usuário logado (clickjacking).
 */
const securityHeaders = [
  {
    // Força HTTPS por 2 anos, inclusive em subdomínios. A Vercel já serve só
    // por HTTPS, mas sem HSTS o primeiro acesso ainda pode ser interceptado.
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    // Impede o navegador de "adivinhar" o tipo de um arquivo e executá-lo
    // como script. Importante por causa do upload de comprovantes.
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    // Clickjacking: ninguém embute o app num iframe.
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    // Não vaza a URL interna (que pode conter contexto) para sites externos.
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    // Desliga APIs que o app não usa. `camera=(self)` fica liberado para o
    // próprio domínio porque a leitura de recibo por foto depende dele.
    key: 'Permissions-Policy',
    value: 'camera=(self), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  },
  {
    key: 'Content-Security-Policy-Report-Only',
    value: cspReportOnly,
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
    ],
  },
  output: 'standalone',
  transpilePackages: ['motion'],

  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },

  webpack: (config, {dev}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify — file watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
