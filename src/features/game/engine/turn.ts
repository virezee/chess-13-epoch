import type { Move, Position, Save } from '@/types/game'
import { CHECKMATE } from '@/constants/outcome'
import { legality } from './legality'
import { position } from './position'
import { apply } from './apply'
import { result } from './result'

export const clickSquares = (move: Move): string[] =>
  move.to === move.from ? (move.captures ?? []) : [...new Set([move.to, ...(move.captures ?? [])])]
export const turn = (
  save: Save,
  move: Move | null
): { save: Save; position: Position; moves: Move[]; result: ReturnType<typeof result> } => {
  const played =
    move === null ? save : apply(position(save.side, save.occupancy, save.state), move, save.match)
  const next = position(played.side, played.occupancy, played.state)
  const moves = legality(next)
  const outcome = result(next, moves, played.match)
  const mark =
    move === null ? '' : next.checkers.length === 0 ? '' : outcome?.reason === CHECKMATE ? '#' : '+'
  return {
    save:
      mark === ''
        ? played
        : { ...played, match: { ...played.match, pgn: played.match.pgn + mark } },
    position: next,
    moves,
    result: outcome
  }
}