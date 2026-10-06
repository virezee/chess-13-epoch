// oxlint-disable import/max-dependencies
import type { Metadata } from 'next'
import { Intro } from '@/features/rules/components/Intro'
import { Notice } from '@/features/rules/components/Notice'
import { Board } from '@/features/rules/components/Board'
import { CentreSquare } from '@/features/rules/components/CentreSquare'
import { Pieces } from '@/features/rules/components/Pieces'
import { Promotion } from '@/features/rules/components/Promotion'
import { PieceValues } from '@/features/rules/components/PieceValues'
import { Result } from '@/features/rules/components/Result'
import { SwapRule } from '@/features/rules/components/SwapRule'
import { Faq } from '@/features/rules/components/Faq'

const DESCRIPTION =
  'Full rules for Chess 13: Epoch. The command zone, all nine pieces, promotion, the swap rule, and how games end.'
export const metadata: Metadata = {
  title: 'Rules',
  description: DESCRIPTION,
  alternates: { canonical: '/rules' },
  openGraph: {
    type: 'article',
    siteName: 'Chess 13: Epoch',
    url: '/rules',
    title: 'Chess 13: Epoch Rules',
    description: DESCRIPTION
  }
}
export default function Rules() {
  return (
    <main className='mx-auto flex w-full max-w-220 flex-1 select-text flex-col gap-4 px-4 py-5 font-reading xl:px-5'>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Chess 13: Epoch',
                item: 'https://chess-13-epoch.vercel.app'
              },
              { '@type': 'ListItem', position: 2, name: 'Rules' }
            ]
          })
        }}
      />
      <Intro />
      <Notice />
      <Board />
      <CentreSquare />
      <Pieces />
      <Promotion />
      <PieceValues />
      <Result />
      <SwapRule />
      <Faq />
    </main>
  )
}