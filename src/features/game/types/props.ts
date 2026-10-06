import type { MouseEvent } from 'react'
import type { Side } from '@/types/material'
import type { Move, Trace, Position, Save, Result } from '@/types/game'
import type { Role, OfferState, Room } from '@/types/network'
import type { RESIGN, DRAW, NEW } from '@/constants/room'

export type Game = {
  path: string | undefined
  setPath: (path: string) => void
  save: Save
  sync: (save: Save) => void
  promotions: Move[]
  setPromotions: (moves: Move[]) => void
  pending: typeof RESIGN | typeof DRAW | typeof NEW | null
  setPending: (pending: typeof RESIGN | typeof DRAW | typeof NEW | null) => void
  key: number
  room: Room
  position: Position
  moves: Move[]
  result: Result | null
  mySide: Side | null
  playMove: (move: Move) => void
  reply: (isAccepted: boolean) => void
}
export type BoardProps = {
  position: Position
  lastMove: Move | null
  isFlipped: boolean
  locked: boolean
  moves: Move[]
  result: Result | null
  onMove: (move: Move) => void
  onPromotions: (moves: Move[]) => void
}
export type GridProps = {
  position: Position
  lastMove: Move | null
  selected: string | null
  targets: string[]
  marks: Record<string, string>
  arrows: Record<string, string>
  trace: Trace[]
  isFlipped: boolean
  result: Result | null
  onSelect: (square: string) => void
  onMark: (square: string, event: MouseEvent<HTMLDivElement>) => void
  onArrow: (from: string, to: string, event: MouseEvent<HTMLDivElement>) => void
}
export type PanelProps = {
  role: Role
  players: number
  seconds: number | null
  save: Save
  sync: (save: Save) => void
  position: Position
  promotions: Move[]
  pending: typeof RESIGN | typeof DRAW | typeof NEW | null
  setPending: (pending: typeof RESIGN | typeof DRAW | typeof NEW | null) => void
  offer: OfferState | null
  result: Result | null
  onHost: (() => void) | null
  onMove: (move: Move) => void
  onResign: () => void
  onOffer: (offer: typeof DRAW | typeof NEW) => void
  onReply: (isAccepted: boolean) => void
}
export type ControlsProps = {
  pending: typeof RESIGN | typeof DRAW | typeof NEW | null
  setPending: (pending: typeof RESIGN | typeof DRAW | typeof NEW | null) => void
  offer: OfferState | null
  onResign: () => void
  onOffer: (offer: typeof DRAW | typeof NEW) => void
  onReply: (isAccepted: boolean) => void
}