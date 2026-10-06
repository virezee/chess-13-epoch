import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://chess-13-epoch.vercel.app',
      lastModified: new Date('2026-10-06')
    },
    {
      url: 'https://chess-13-epoch.vercel.app/rules',
      lastModified: new Date('2026-10-06'),
      images: [
        'https://chess-13-epoch.vercel.app/white/pope.png',
        'https://chess-13-epoch.vercel.app/white/emperor.png',
        'https://chess-13-epoch.vercel.app/white/marshal.png',
        'https://chess-13-epoch.vercel.app/white/assassin.png',
        'https://chess-13-epoch.vercel.app/white/sentinel.png',
        'https://chess-13-epoch.vercel.app/white/mage.png',
        'https://chess-13-epoch.vercel.app/white/herald.png',
        'https://chess-13-epoch.vercel.app/white/templar.png',
        'https://chess-13-epoch.vercel.app/white/legionary.png'
      ]
    }
  ]
}