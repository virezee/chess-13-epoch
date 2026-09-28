import type { PieceName, Side } from '@/types/material'
import type { Zone, Castling, CastlingSide } from '@/types/game'
import { SIZE } from './board'
import { WHITE, BLACK } from './player'
import { LEAP_3_2, LEAP_2_1 } from './direction'
import { ENHANCED, RESTRICTED } from './zone'

export const POPE = 'pope'
export const EMPEROR = 'emperor'
export const MARSHAL = 'marshal'
export const ASSASSIN = 'assassin'
export const SENTINEL = 'sentinel'
export const MAGE = 'mage'
export const HERALD = 'herald'
export const TEMPLAR = 'templar'
export const LEGIONARY = 'legionary'
export const REACH = {
  [ASSASSIN]: {
    [ENHANCED]: { reach: SIZE },
    [RESTRICTED]: { reach: 6 }
  },
  [SENTINEL]: {
    [ENHANCED]: { quiet: 6, capture: SIZE },
    [RESTRICTED]: { quiet: 3, capture: 6 }
  },
  [MAGE]: {
    [ENHANCED]: { quiet: 2 },
    [RESTRICTED]: { quiet: 1 }
  },
  [HERALD]: {
    [ENHANCED]: { diagonal: SIZE },
    [RESTRICTED]: { diagonal: 6 }
  },
  [LEGIONARY]: {
    [ENHANCED]: { quiet: 2 },
    [RESTRICTED]: { quiet: 1 }
  }
} as const satisfies Partial<Record<PieceName, Record<Zone, object>>>
export const LEAP = {
  [TEMPLAR]: { [ENHANCED]: [...LEAP_3_2, ...LEAP_2_1], [RESTRICTED]: LEAP_3_2 }
} as const satisfies Partial<
  Record<PieceName, Record<Zone, readonly (readonly [number, number])[]>>
>
export const CASTLING = {
  [WHITE]: {
    home: 'g1',
    left: { to: 'd1', sentinel: 'a1', sentinelTo: 'e1', between: ['b1', 'c1', 'd1', 'e1', 'f1'] },
    right: { to: 'j1', sentinel: 'm1', sentinelTo: 'i1', between: ['h1', 'i1', 'j1', 'k1', 'l1'] }
  },
  [BLACK]: {
    home: 'g13',
    left: {
      to: 'd13',
      sentinel: 'a13',
      sentinelTo: 'e13',
      between: ['b13', 'c13', 'd13', 'e13', 'f13']
    },
    right: {
      to: 'j13',
      sentinel: 'm13',
      sentinelTo: 'i13',
      between: ['h13', 'i13', 'j13', 'k13', 'l13']
    }
  }
} as const satisfies Record<Side, { home: string } & Record<keyof CastlingSide, Castling>>
export const BACK_RANK = [
  SENTINEL,
  TEMPLAR,
  HERALD,
  MAGE,
  ASSASSIN,
  EMPEROR,
  POPE,
  MARSHAL,
  ASSASSIN,
  MAGE,
  HERALD,
  TEMPLAR,
  SENTINEL
] as const satisfies readonly PieceName[]
export const LETTER = {
  [POPE]: 'P',
  [EMPEROR]: 'E',
  [MARSHAL]: 'M',
  [ASSASSIN]: 'A',
  [SENTINEL]: 'S',
  [MAGE]: 'G',
  [HERALD]: 'H',
  [TEMPLAR]: 'T',
  [LEGIONARY]: 'L'
} as const satisfies Record<PieceName, string>
export const CLASSIC_LETTER = {
  [POPE]: 'K',
  [EMPEROR]: 'Q',
  [MARSHAL]: 'M',
  [ASSASSIN]: 'A',
  [SENTINEL]: 'R',
  [MAGE]: 'G',
  [HERALD]: 'B',
  [TEMPLAR]: 'N',
  [LEGIONARY]: 'P'
} as const satisfies Record<PieceName, string>
export const CLASSIC_PLY: Record<string, string> = Object.fromEntries(
  ([LEGIONARY, ...new Set(BACK_RANK)] as const).map(
    name => [LETTER[name], CLASSIC_LETTER[name]] as const
  )
)
export const VALUE = {
  [POPE]: { enhanced: Infinity, restricted: Infinity },
  [EMPEROR]: { enhanced: 15, restricted: 15 },
  [MARSHAL]: { enhanced: 13, restricted: 13 },
  [ASSASSIN]: { enhanced: 10, restricted: 7 },
  [SENTINEL]: { enhanced: 9, restricted: 6 },
  [MAGE]: { enhanced: 8, restricted: 5 },
  [HERALD]: { enhanced: 7, restricted: 5 },
  [TEMPLAR]: { enhanced: 7, restricted: 5 },
  [LEGIONARY]: { enhanced: 2, restricted: 2 }
} as const satisfies Record<PieceName, Record<Zone, number>>