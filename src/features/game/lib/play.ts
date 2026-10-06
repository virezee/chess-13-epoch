import type { Move, Save } from '@/types/game'
import type { Game, BoardProps, PanelProps } from '../types/props'
import { useState, useMemo } from 'react'
import { WHITE, BLACK } from '@/constants/player'
import { CREATE, HOST, RESIGN, DRAW, NEW } from '@/constants/room'
import { canSwap } from '@/features/game/engine/apply'
import { opening } from '@/features/game/engine/opening'
import { turn } from '@/features/game/engine/turn'
import { useRoom } from '@/features/game/lib/session'
import { takeResign, takeDraw, takeNewGame } from '@/lib/action'

export const useGame = (code: string | undefined): Game => {
  const [path, setPath] = useState(code)
  const [save, setSave] = useState<Save>(opening)
  const [promotions, setPromotions] = useState<Move[]>([])
  const [pending, setPending] = useState<typeof RESIGN | typeof DRAW | typeof NEW | null>(null)
  const [key, setKey] = useState(0)
  const room = useRoom(
    save.match.abandoned === null ? path : undefined,
    setSave,
    setPromotions,
    setKey
  )
  const { position, moves, result } = useMemo(() => turn(save, null), [save])
  const sync = (next: Save): void => {
    setSave(next)
    room.connection.current?.send(next, turn(next, null).result !== null)
  }
  const playMove = (move: Move): void => {
    setPromotions([])
    room.setOffer(null)
    sync(turn(save, move).save)
  }
  const reply = (isAccepted: boolean): void => {
    if (room.offer === null) return
    room.setOffer(null)
    if (!isAccepted) room.connection.current?.decline(room.offer.offer)
    else if (room.offer.offer === DRAW) takeDraw(save, sync, setPromotions)
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
export const boardProps = (game: ReturnType<typeof useGame>): BoardProps => {
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
export const panelProps = (game: ReturnType<typeof useGame>): PanelProps => {
  const { path, setPath, save, sync, room, position, setPromotions, mySide } = game
  const onOffer: PanelProps['onOffer'] = offer => {
    room.setOffer({ offer, outgoing: true })
    room.connection.current?.offer(offer)
  }
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
      path === undefined || save.match.abandoned !== null
        ? () => {
            sync(opening())
            setPath(CREATE)
          }
        : null,
    onMove: game.playMove,
    onResign: () => {
      if (mySide !== null) takeResign(save, sync, setPromotions, mySide)
    },
    onOffer,
    onReply: game.reply
  }
}