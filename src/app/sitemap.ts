import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://chess-13-epoch.vercel.app',
      lastModified: new Date('2026-09-30')
    },
    {
      url: 'https://chess-13-epoch.vercel.app/rules',
      lastModified: new Date('2026-09-30')
    }
  ]
}