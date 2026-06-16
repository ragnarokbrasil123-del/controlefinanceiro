import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FinApp Premium',
    short_name: 'FinApp',
    description: 'Sua Inteligência Financeira de Bolso',
    start_url: '/',
    display: 'standalone', // A MÁGICA: Isso esconde a barra do navegador!
    background_color: '#0a0a0a',
    theme_color: '#000000',
    icons: [
      {
        // Eu coloquei um ícone de carteira neon provisório para o app!
        src: 'https://cdn-icons-png.flaticon.com/512/3592/3592881.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
