import type { Side, SquareOccupant } from '@/types/material'
import type { State, Save } from '@/types/game'
import type { Role } from '@/types/network'
import { SIZE, FILES } from '@/constants/board'
import { WHITE, BLACK } from '@/constants/player'
import { HOST } from '@/constants/room'
import { EMPEROR, LEGIONARY, BACK_RANK } from '@/constants/piece'
import { PLIES_PER_MOVE, NO_PROGRESS_BASE } from '@/constants/outcome'
import { repetitionKey } from './result'

const setup = (side: Side, back: number, legionaries: number): SquareOccupant => {
  const squares: SquareOccupant = {}
  BACK_RANK.forEach((piece, file) => {
    squares[`${FILES[file]}${back}`] =
      piece === EMPEROR ? { side, piece, awake: false } : { side, piece }
    squares[`${FILES[file]}${legionaries}`] = { side, piece: LEGIONARY }
  })
  return squares
}
export const opening = (firstPlayer: Role = HOST): Save => {
  const occupancy = { ...setup(WHITE, 1, 3), ...setup(BLACK, SIZE, SIZE - 2) }
  const state: State = {
    awake: { [WHITE]: false, [BLACK]: false },
    riposte: false,
    castlingSide: {
      [WHITE]: { left: true, right: true },
      [BLACK]: { left: true, right: true }
    },
    promotions: { [WHITE]: [], [BLACK]: [] },
    enPassant: null,
    noProgress: { count: 0, limit: NO_PROGRESS_BASE * PLIES_PER_MOVE }
  }
  return {
    side: WHITE,
    occupancy,
    state,
    match: {
      swap: true,
      firstPlayer,
      whitePlayer: firstPlayer,
      lastMove: null,
      history: [repetitionKey(WHITE, occupancy, state)],
      pgn: '',
      resigned: null,
      abandoned: null,
      agreed: false
    }
  }
}