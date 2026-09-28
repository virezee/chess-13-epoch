'use client'

import type { Move, Save } from '@/types/game'
import type { Offer } from '@/types/network'
import { use, useState, useMemo } from 'react'
import { WHITE, BLACK } from '@/constants/player'
import { HOST, DRAW } from '@/constants/room'
import { canSwap } from '@/features/game/engine/apply'
import { opening } from '@/features/game/engine/opening'
import { turn } from '@/features/game/engine/turn'
import { useRoom } from '@/features/game/lib/room'
import { Board } from '@/features/game/components/Board'
import { Panel } from '@/features/game/components/Panel'
import { Invite } from '@/features/game/components/Invite'
import { takeResign, takeDraw, takeNewGame } from '@/lib/action'

const useGame = (code: string | undefined) => {
  const [path, setPath] = useState(code)
  const [save, setSave] = useState<Save>(opening)
  const [promotions, setPromotions] = useState<Move[]>([])
  const [pending, setPending] = useState<'resign' | 'draw' | 'new' | null>(null)
  const [key, setKey] = useState(0)
  const room = useRoom(path, setSave, setPromotions, setKey)
  const { position, moves, result } = useMemo(() => turn(save, null), [save])
  const sync = (next: Save) => {
    setSave(next)
    room.connection.current?.send(next, turn(next, null).result !== null)
  }
  const playMove = (move: Move) => {
    setPromotions([])
    room.setOffer(null)
    sync(turn(save, move).save)
  }
  const reply = (isAccepted: boolean) => {
    if (room.offer === null) return
    room.setOffer(null)
    if (!isAccepted) room.connection.current?.decline(room.offer.kind)
    else if (room.offer.kind === DRAW) takeDraw(save, sync, setPromotions)
    else takeNewGame(save, sync, setPromotions, setKey)
  }
  const mySide = room.role === null ? null : room.role === save.match.whitePlayer ? WHITE : BLACK
  return {
    path,
    setPath,
    save,
    sync,
    promotions,
    setPromotions,
    pending,
    setPending,
    key,
    room,
    position,
    moves,
    result,
    mySide,
    playMove,
    reply
  }
}
const boardProps = (game: ReturnType<typeof useGame>) => {
  const { save, room, position, result, mySide } = game
  return {
    position,
    lastMove: save.match.lastMove,
    isFlipped: mySide === BLACK,
    locked:
      position.side !== mySide ||
      room.players < 2 ||
      canSwap(position, save.match) ||
      result !== null ||
      game.pending !== null,
    moves: game.moves,
    result,
    onMove: game.playMove,
    onPromotions: game.setPromotions
  }
}
const panelProps = (game: ReturnType<typeof useGame>) => {
  const { path, setPath, save, sync, room, position, setPromotions } = game
  return {
    role: room.role ?? HOST,
    players: room.players,
    seconds: room.seconds,
    save,
    sync,
    position,
    promotions: game.promotions,
    pending: game.pending,
    setPending: game.setPending,
    offer: room.offer,
    result: game.result,
    onHost:
      path === undefined
        ? () => {
            setPath('create')
          }
        : null,
    onMove: game.playMove,
    onResign: () => {
      takeResign(save, sync, setPromotions, position)
    },
    onOffer: (kind: Offer) => {
      room.setOffer({ kind, isMine: true })
      room.connection.current?.offer(kind)
    },
    onReply: game.reply
  }
}
export default function Home({ params }: { params: Promise<{ code?: string }> }) {
  const game = useGame(use(params).code)
  const { room } = game
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