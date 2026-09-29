'use client'
import { use } from 'react'
import { notFound } from 'next/navigation'
import { Board } from '@/features/game/components/Board'
import { Panel } from '@/features/game/components/Panel'
import { Invite } from '@/features/game/components/Invite'
import { useGame, boardProps, panelProps } from '@/features/game/lib/play'

export default function Home({ params }: { params: Promise<{ code?: string }> }) {
  const game = useGame(use(params).code)
  const { room } = game
  if (room.rejected) notFound()
  return (
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
  )
}