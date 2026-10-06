import type { Side } from '@/types/material'
import type { Move, Save } from '@/types/game'
import { HOST, GUEST } from '@/constants/room'
import { opening } from '@/features/game/engine/opening'

export const takeResign = (
  save: Save,
  sync: (save: Save) => void,
  setPromotions: (moves: Move[]) => void,
  side: Side
): void => {
  sync({ ...save, match: { ...save.match, resigned: side } })
  setPromotions([])
}
export const takeDraw = (
  save: Save,
  sync: (save: Save) => void,
  setPromotions: (moves: Move[]) => void
): void => {
  sync({ ...save, match: { ...save.match, agreed: true } })
  setPromotions([])
}
export const takeNewGame = (
  save: Save,
  sync: (save: Save) => void,
  setPromotions: (moves: Move[]) => void,
  setKey: (next: (round: number) => number) => void
): void => {
  sync(opening(save.match.firstPlayer === HOST ? GUEST : HOST))
  setPromotions([])
  setKey(round => round + 1)
}