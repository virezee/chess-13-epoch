'use client'
import { use } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Board } from '@/features/game/components/Board'
import { Panel } from '@/features/game/components/Panel'
import { Invite } from '@/features/game/components/Invite'
import { useGame, boardProps, panelProps } from '@/features/game/lib/play'

function Summary() {
  return (
    <section className='mx-auto w-full max-w-220 select-text px-4 pb-6 font-reading text-[15px] leading-relaxed text-ink-dim xl:px-5'>
      <p>
        Chess 13: Epoch is a free chess variant on a 13 by 13 board. Only the king and the queen
        move the way you already know. Every other piece is new, and each one is enhanced or
        restricted depending on where it stands. Host a game, send the link, and play a friend
        straight in your browser, with no account and no install.{' '}
        <Link href='/rules' className='text-ink underline underline-offset-2'>
          Read the rules
        </Link>
        .
      </p>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'VideoGame',
            name: 'Chess 13: Epoch',
            url: 'https://chess-13-epoch.vercel.app',
            description: 'A free chess variant on a 13×13 board, played online in the browser.',
            gamePlatform: 'Web browser',
            playMode: 'MultiPlayer',
            isAccessibleForFree: true,
            offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD' }
          })
        }}
      />
    </section>
  )
}
export default function Home({ params }: { params: Promise<{ code?: string }> }) {
  const { code } = use(params)
  const game = useGame(code)
  const { room } = game
  if (room.rejected) notFound()
  if (code !== undefined && room.role === null) return null
  return (
    <>
      <main className='mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-2 xl:grid-cols-[18.5rem_minmax(0,1fr)_20rem] xl:gap-5 xl:px-5 xl:py-5'>
        <h1 className='sr-only'>Chess 13: Epoch</h1>
        <Board key={game.key} {...boardProps(game)} />
        <Panel {...panelProps(game)} />
        {room.link !== null && room.players < 2 && (
          <Invite
            link={room.link}
            onClose={() => {
              room.setLink(null)
            }}
          />
        )}
      </main>
      {code === undefined && <Summary />}
    </>
  )
}