import type { Side } from './material'
import type { Promotion, Counter } from './game'
import type { DORMANT, AWAKE } from '@/constants/piece'
import type { FULL, PARTIAL, NONE } from '@/constants/zone'

export interface ArmyState {
  player: string
  side: Side
  emperor: typeof DORMANT | typeof AWAKE | null
  marshalSquare: string | null
  commandZone: typeof FULL | typeof PARTIAL | typeof NONE
  pieceCount: number
  enhancedCount: number
  captured: { id: string; letter: string }[]
  promotions: Promotion[]
  material: number
}
export interface FullMove {
  white: string
  black: string | null
  number: number
}
export interface GameCounters {
  repetition: Counter
  noProgress: Counter
}