import type { Move, Save, Position } from '@/types/game'
import { HOST, GUEST } from '@/constants/room'
import { opening } from '@/features/game/engine/opening'

export const takeResign = (
  save: Save,
  sync: (save: Save) => void,
  setPromotions: (moves: Move[]) => void,
  position: Position
): void => {
  sync({ ...save, match: { ...save.match, resigned: position.side } })
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