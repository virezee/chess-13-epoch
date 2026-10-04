// oxlint-disable max-lines
import type { Side, SquareOccupant } from '@/types/material'
import type { Move, State, Position } from '@/types/game'
import { describe, it, expect } from 'vitest'
import { WHITE, BLACK } from '@/constants/player'
import {
  POPE,
  EMPEROR,
  MARSHAL,
  ASSASSIN,
  SENTINEL,
  MAGE,
  HERALD,
  TEMPLAR,
  LEGIONARY
} from '@/constants/piece'
import { legality } from './legality'
import { position } from './position'
import { opening } from './opening'
import { turn } from './turn'

const setup = (side: Side, occupancy: SquareOccupant, changes: Partial<State> = {}): Position => {
  const none = { left: false, right: false }
  const state = { ...opening().state, castlingSide: { [WHITE]: none, [BLACK]: none }, ...changes }
  return position(side, occupancy, state)
}
const destinations = (
  side: Side,
  occupancy: SquareOccupant,
  square: string,
  changes: Partial<State> = {}
): string[] =>
  legality(setup(side, occupancy, changes))
    .filter(({ from }) => from === square)
    .map(({ to }) => to)
const checkersAfter = (occupancy: SquareOccupant, move: Move): string[] => {
  const { match } = opening()
  const { state } = setup(WHITE, occupancy)
  return turn({ side: WHITE, occupancy, state, match }, move).position.checkers
}
const ON_FILE: SquareOccupant = {
  e1: { side: BLACK, piece: POPE },
  e5: { side: WHITE, piece: EMPEROR, awake: false },
  k13: { side: WHITE, piece: MARSHAL },
  m13: { side: WHITE, piece: POPE }
}
const ON_RANK: SquareOccupant = {
  a5: { side: BLACK, piece: POPE },
  e5: { side: WHITE, piece: EMPEROR, awake: false },
  k13: { side: WHITE, piece: MARSHAL },
  m13: { side: WHITE, piece: POPE }
}
const HANGING: SquareOccupant = {
  e1: { side: BLACK, piece: POPE },
  e5: { side: WHITE, piece: EMPEROR, awake: false },
  h5: { side: WHITE, piece: MARSHAL },
  m13: { side: WHITE, piece: POPE }
}
const onLines = (mover: SquareOccupant): [SquareOccupant[], SquareOccupant[]] => [
  [
    { ...ON_FILE, ...mover },
    { ...ON_RANK, ...mover }
  ],
  [
    { ...ON_FILE, e3: { side: BLACK, piece: LEGIONARY }, ...mover },
    { ...ON_RANK, c5: { side: BLACK, piece: LEGIONARY }, ...mover }
  ]
]
describe('legionary under a pin', () => {
  it('cannot step off a diagonal pin', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      c3: { side: WHITE, piece: LEGIONARY },
      f6: { side: BLACK, piece: HERALD },
      m13: { side: BLACK, piece: POPE }
    }
    expect(destinations(WHITE, occupancy, 'c3')).toEqual([])
  })
  it('may capture the piece pinning it', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      c3: { side: WHITE, piece: LEGIONARY },
      d4: { side: BLACK, piece: HERALD },
      m13: { side: BLACK, piece: POPE }
    }
    expect(destinations(WHITE, occupancy, 'c3')).toEqual(['d4'])
  })
  it('may keep advancing along a file pin', () => {
    const occupancy: SquareOccupant = {
      e1: { side: WHITE, piece: POPE },
      e4: { side: WHITE, piece: LEGIONARY },
      e7: { side: BLACK, piece: SENTINEL },
      m13: { side: BLACK, piece: POPE }
    }
    expect(destinations(WHITE, occupancy, 'e4')).toEqual(['e5', 'e6'])
  })
  it('cannot capture en passant when that opens rank 7 to its pope', () => {
    const occupancy: SquareOccupant = {
      a7: { side: WHITE, piece: POPE },
      d7: { side: WHITE, piece: LEGIONARY },
      e7: { side: BLACK, piece: LEGIONARY },
      g7: { side: BLACK, piece: SENTINEL },
      m13: { side: BLACK, piece: POPE }
    }
    const right = { enPassant: { target: 'e8', captured: 'e7' } }
    expect(destinations(WHITE, occupancy, 'd7', right)).toEqual(['d8'])
  })
})
describe('legionary in check', () => {
  it('can only capture a checker that leaps', () => {
    const occupancy: SquareOccupant = {
      e4: { side: WHITE, piece: POPE },
      f6: { side: WHITE, piece: LEGIONARY },
      g7: { side: BLACK, piece: TEMPLAR },
      m13: { side: BLACK, piece: POPE }
    }
    expect(destinations(WHITE, occupancy, 'f6')).toEqual(['g7'])
  })
  it('can only block a checker that slides', () => {
    const occupancy: SquareOccupant = {
      e4: { side: WHITE, piece: POPE },
      f4: { side: WHITE, piece: LEGIONARY },
      h7: { side: BLACK, piece: HERALD },
      m13: { side: BLACK, piece: POPE }
    }
    expect(destinations(WHITE, occupancy, 'f4')).toEqual(['f5'])
  })
  it('blocks with the 2-tile step only when enhanced', () => {
    const occupancy: SquareOccupant = {
      c9: { side: WHITE, piece: POPE },
      f7: { side: WHITE, piece: LEGIONARY },
      i9: { side: BLACK, piece: SENTINEL },
      m13: { side: BLACK, piece: POPE }
    }
    const enhanced: SquareOccupant = { ...occupancy, b5: { side: WHITE, piece: MARSHAL } }
    expect(destinations(WHITE, occupancy, 'f7')).toEqual([])
    expect(destinations(WHITE, enhanced, 'f7')).toEqual(['f9'])
  })
})
describe('templar under a pin or in check', () => {
  it('cannot leap while pinned', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      c3: { side: WHITE, piece: TEMPLAR },
      f6: { side: BLACK, piece: HERALD },
      m13: { side: BLACK, piece: POPE }
    }
    expect(destinations(WHITE, occupancy, 'c3')).toEqual([])
  })
  it('cannot leap while pinned on a file or a rank either', () => {
    const file: SquareOccupant = {
      e1: { side: WHITE, piece: POPE },
      e4: { side: WHITE, piece: TEMPLAR },
      e7: { side: BLACK, piece: SENTINEL },
      m13: { side: BLACK, piece: POPE }
    }
    const rank: SquareOccupant = {
      a5: { side: WHITE, piece: POPE },
      d5: { side: WHITE, piece: TEMPLAR },
      f5: { side: BLACK, piece: SENTINEL },
      m13: { side: BLACK, piece: POPE }
    }
    expect(destinations(WHITE, file, 'e4')).toEqual([])
    expect(destinations(WHITE, rank, 'd5')).toEqual([])
  })
  it('can only leap into the line of a sliding checker', () => {
    const occupancy: SquareOccupant = {
      e4: { side: WHITE, piece: POPE },
      d8: { side: WHITE, piece: TEMPLAR },
      h7: { side: BLACK, piece: HERALD },
      m13: { side: BLACK, piece: POPE }
    }
    expect(new Set(destinations(WHITE, occupancy, 'd8'))).toEqual(new Set(['f5', 'g6']))
  })
  it('can capture its checker', () => {
    const occupancy: SquareOccupant = {
      e4: { side: WHITE, piece: POPE },
      f10: { side: WHITE, piece: TEMPLAR },
      h7: { side: BLACK, piece: HERALD },
      m13: { side: BLACK, piece: POPE }
    }
    expect(destinations(WHITE, occupancy, 'f10')).toEqual(['h7'])
  })
})
describe('templar in check while enhanced', () => {
  it('blocks with the short leap only when enhanced', () => {
    const restricted: SquareOccupant = {
      e4: { side: WHITE, piece: POPE },
      h5: { side: WHITE, piece: TEMPLAR },
      k4: { side: BLACK, piece: SENTINEL },
      m13: { side: BLACK, piece: POPE }
    }
    const enhanced: SquareOccupant = { ...restricted, l8: { side: WHITE, piece: MARSHAL } }
    expect(destinations(WHITE, restricted, 'h5')).toEqual([])
    expect(new Set(destinations(WHITE, enhanced, 'h5'))).toEqual(new Set(['f4', 'j4']))
  })
})
describe('templar giving check', () => {
  const popes: SquareOccupant = {
    a1: { side: WHITE, piece: POPE },
    g7: { side: BLACK, piece: POPE }
  }
  it('checks with the long leap', () => {
    const occupancy: SquareOccupant = { ...popes, e4: { side: WHITE, piece: TEMPLAR } }
    expect(setup(BLACK, occupancy).checkers).toEqual(['e4'])
  })
  it('checks with the short leap only when enhanced', () => {
    const occupancy: SquareOccupant = { ...popes, f5: { side: WHITE, piece: TEMPLAR } }
    const enhanced: SquareOccupant = { ...occupancy, b3: { side: WHITE, piece: MARSHAL } }
    expect(setup(BLACK, occupancy).checkers).toEqual([])
    expect(setup(BLACK, enhanced).checkers).toEqual(['f5'])
  })
  it('gives a discovered check by leaping off a line', () => {
    const occupancy: SquareOccupant = {
      ...popes,
      c3: { side: WHITE, piece: HERALD },
      e5: { side: WHITE, piece: TEMPLAR }
    }
    expect(checkersAfter(occupancy, { from: 'e5', to: 'g8' })).toEqual(['c3'])
  })
  it('lets a legionary give a discovered check by stepping off a line', () => {
    const occupancy: SquareOccupant = {
      ...popes,
      c3: { side: WHITE, piece: HERALD },
      e5: { side: WHITE, piece: LEGIONARY }
    }
    expect(checkersAfter(occupancy, { from: 'e5', to: 'e6' })).toEqual(['c3'])
  })
})
describe('pope and attacked squares', () => {
  it('cannot step onto a square a templar or a legionary attacks', () => {
    const occupancy: SquareOccupant = {
      e4: { side: WHITE, piece: POPE },
      g8: { side: BLACK, piece: TEMPLAR },
      c6: { side: BLACK, piece: LEGIONARY },
      m13: { side: BLACK, piece: POPE }
    }
    const squares = destinations(WHITE, occupancy, 'e4')
    expect(squares).not.toContain('e5')
    expect(squares).not.toContain('d5')
    expect(squares).toContain('f3')
  })
  it('cannot castle across a square a templar or a legionary attacks', () => {
    const castle: SquareOccupant = {
      g1: { side: WHITE, piece: POPE },
      a1: { side: WHITE, piece: SENTINEL },
      m13: { side: BLACK, piece: POPE }
    }
    const left: Partial<State> = {
      castlingSide: {
        [WHITE]: { left: true, right: false },
        [BLACK]: { left: false, right: false }
      }
    }
    const templar: SquareOccupant = { ...castle, g4: { side: BLACK, piece: TEMPLAR } }
    const legionary: SquareOccupant = { ...castle, d2: { side: BLACK, piece: LEGIONARY } }
    expect(destinations(WHITE, castle, 'g1', left)).toContain('d1')
    expect(destinations(WHITE, templar, 'g1', left)).not.toContain('d1')
    expect(destinations(WHITE, legionary, 'g1', left)).not.toContain('d1')
  })
  it('cannot step onto a square an enhanced templar attacks with the short leap', () => {
    const occupancy: SquareOccupant = {
      e4: { side: WHITE, piece: POPE },
      g6: { side: BLACK, piece: TEMPLAR },
      m13: { side: BLACK, piece: POPE }
    }
    const enhanced: SquareOccupant = { ...occupancy, k8: { side: BLACK, piece: MARSHAL } }
    expect(destinations(WHITE, occupancy, 'e4')).toContain('e5')
    expect(destinations(WHITE, enhanced, 'e4')).not.toContain('e5')
  })
})
describe('command zone and the enemy emperor', () => {
  it('ignores the enemy marshal when judging the zone', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      e5: { side: WHITE, piece: TEMPLAR },
      e6: { side: BLACK, piece: MARSHAL },
      m13: { side: BLACK, piece: POPE }
    }
    expect(destinations(WHITE, occupancy, 'e5')).toHaveLength(8)
  })
  it('keeps a legionary near the enemy marshal to one tile past the centre', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      d7: { side: WHITE, piece: LEGIONARY },
      f5: { side: BLACK, piece: MARSHAL },
      m13: { side: BLACK, piece: POPE }
    }
    expect(destinations(WHITE, occupancy, 'd7')).toEqual(['d8'])
  })
  it('keeps a herald near the enemy marshal to 6 tiles', () => {
    const occupancy: SquareOccupant = {
      m1: { side: WHITE, piece: POPE },
      a1: { side: WHITE, piece: HERALD },
      c2: { side: BLACK, piece: MARSHAL },
      a13: { side: BLACK, piece: POPE }
    }
    const squares = destinations(WHITE, occupancy, 'a1')
    expect(squares).toContain('g7')
    expect(squares).not.toContain('h8')
  })
  it('forbids a templar or legionary move that wakes the enemy emperor onto its own pope', () => {
    const occupancy: SquareOccupant = {
      a1: { side: BLACK, piece: POPE },
      c3: { side: WHITE, piece: EMPEROR, awake: false },
      m12: { side: WHITE, piece: MARSHAL },
      m1: { side: WHITE, piece: POPE },
      i7: { side: BLACK, piece: TEMPLAR },
      d5: { side: BLACK, piece: LEGIONARY }
    }
    const shielded: SquareOccupant = { ...occupancy, b2: { side: BLACK, piece: SENTINEL } }
    expect(destinations(BLACK, occupancy, 'i7')).not.toContain('f5')
    expect(destinations(BLACK, occupancy, 'd5')).not.toContain('d4')
    expect(destinations(BLACK, shielded, 'i7')).toContain('f5')
    expect(destinations(BLACK, shielded, 'd5')).toContain('d4')
  })
})
describe('legionary and templar waking the enemy emperor on a file or a rank', () => {
  it('forbids a legionary move that wakes the enemy emperor on a file or a rank to its own pope', () => {
    const [open, shielded] = onLines({ f7: { side: BLACK, piece: LEGIONARY } })
    for (const board of open) expect(destinations(BLACK, board, 'f7')).not.toContain('f6')
    for (const board of shielded) expect(destinations(BLACK, board, 'f7')).toContain('f6')
  })
  it('forbids a templar move that wakes the enemy emperor on a file or a rank to its own pope', () => {
    const [open, shielded] = onLines({ j10: { side: BLACK, piece: TEMPLAR } })
    for (const board of open) expect(destinations(BLACK, board, 'j10')).not.toContain('h7')
    for (const board of shielded) expect(destinations(BLACK, board, 'j10')).toContain('h7')
  })
  it('forbids a legionary from taking the enemy marshal when the emperor it wakes would attack its own pope', () => {
    const occupancy: SquareOccupant = { ...HANGING, g6: { side: BLACK, piece: LEGIONARY } }
    const shielded: SquareOccupant = { ...occupancy, e3: { side: BLACK, piece: LEGIONARY } }
    expect(destinations(BLACK, occupancy, 'g6')).not.toContain('h5')
    expect(destinations(BLACK, shielded, 'g6')).toContain('h5')
  })
  it('forbids a templar from taking the enemy marshal when the emperor it wakes would attack its own pope', () => {
    const occupancy: SquareOccupant = { ...HANGING, k7: { side: BLACK, piece: TEMPLAR } }
    const shielded: SquareOccupant = { ...occupancy, e3: { side: BLACK, piece: LEGIONARY } }
    expect(destinations(BLACK, occupancy, 'k7')).not.toContain('h5')
    expect(destinations(BLACK, shielded, 'k7')).toContain('h5')
  })
})
describe('legionary giving check', () => {
  it('checks from one tile diagonally forward, never from behind', () => {
    const popes: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      g7: { side: BLACK, piece: POPE }
    }
    const below: SquareOccupant = { ...popes, f6: { side: WHITE, piece: LEGIONARY } }
    const above: SquareOccupant = { ...popes, f8: { side: WHITE, piece: LEGIONARY } }
    const black: SquareOccupant = {
      e4: { side: WHITE, piece: POPE },
      d5: { side: BLACK, piece: LEGIONARY },
      m13: { side: BLACK, piece: POPE }
    }
    expect(setup(BLACK, below).checkers).toEqual(['f6'])
    expect(setup(BLACK, above).checkers).toEqual([])
    expect(setup(WHITE, black).checkers).toEqual(['d5'])
  })
  it('gives check by promoting into a templar', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      e12: { side: WHITE, piece: LEGIONARY },
      h11: { side: BLACK, piece: POPE }
    }
    const promote: Move = { from: 'e12', to: 'e13', promotesTo: TEMPLAR }
    expect(checkersAfter(occupancy, promote)).toEqual(['e13'])
  })
  it('cannot promote in place while in check', () => {
    const waiting: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      e13: { side: WHITE, piece: LEGIONARY },
      m13: { side: BLACK, piece: POPE }
    }
    const checked: SquareOccupant = { ...waiting, d4: { side: BLACK, piece: HERALD } }
    const slot: Partial<State> = {
      promotions: { [WHITE]: [{ file: 4, piece: [HERALD] }], [BLACK]: [] }
    }
    expect(destinations(WHITE, waiting, 'e13', slot)).toEqual(['e13'])
    expect(destinations(WHITE, checked, 'e13', slot)).toEqual([])
  })
})
describe('double check', () => {
  it('leaves the legionary and the templar no move, even onto a checker', () => {
    const occupancy: SquareOccupant = {
      e4: { side: WHITE, piece: POPE },
      f6: { side: WHITE, piece: LEGIONARY },
      f10: { side: WHITE, piece: TEMPLAR },
      g7: { side: BLACK, piece: TEMPLAR },
      h7: { side: BLACK, piece: HERALD },
      m13: { side: BLACK, piece: POPE }
    }
    expect(setup(WHITE, occupancy).checkers).toHaveLength(2)
    expect(destinations(WHITE, occupancy, 'f6')).toEqual([])
    expect(destinations(WHITE, occupancy, 'f10')).toEqual([])
  })
})
describe('legionary pinned on a rank or taking en passant', () => {
  const burst: Partial<State> = { enPassant: { target: 'e8', captured: 'e7' } }
  it('cannot move at all while pinned along its rank', () => {
    const occupancy: SquareOccupant = {
      a5: { side: WHITE, piece: POPE },
      d5: { side: WHITE, piece: LEGIONARY },
      e6: { side: BLACK, piece: HERALD },
      f5: { side: BLACK, piece: SENTINEL },
      m13: { side: BLACK, piece: POPE }
    }
    expect(destinations(WHITE, occupancy, 'd5')).toEqual([])
  })
  it('cannot capture en passant off a diagonal pin', () => {
    const free: SquareOccupant = {
      g4: { side: WHITE, piece: POPE },
      d7: { side: WHITE, piece: LEGIONARY },
      e7: { side: BLACK, piece: LEGIONARY },
      m13: { side: BLACK, piece: POPE }
    }
    const pinned: SquareOccupant = { ...free, b9: { side: BLACK, piece: HERALD } }
    expect(destinations(WHITE, free, 'd7', burst)).toEqual(['d8', 'e8'])
    expect(destinations(WHITE, pinned, 'd7', burst)).toEqual([])
  })
  it('answers the check of a burst by taking it en passant', () => {
    const occupancy: SquareOccupant = {
      f6: { side: WHITE, piece: POPE },
      d7: { side: WHITE, piece: LEGIONARY },
      e7: { side: BLACK, piece: LEGIONARY },
      m13: { side: BLACK, piece: POPE }
    }
    expect(setup(WHITE, occupancy).checkers).toEqual(['e7'])
    expect(destinations(WHITE, occupancy, 'd7', burst)).toEqual(['e8'])
  })
})
describe('en passant and the other pieces', () => {
  const burst: Partial<State> = { enPassant: { target: 'e8', captured: 'e7' } }
  it('lets only a legionary take en passant', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      c5: { side: WHITE, piece: TEMPLAR },
      d7: { side: WHITE, piece: HERALD },
      f7: { side: WHITE, piece: MAGE },
      e10: { side: WHITE, piece: SENTINEL },
      h11: { side: WHITE, piece: ASSASSIN },
      a8: { side: WHITE, piece: MARSHAL },
      i8: { side: WHITE, piece: EMPEROR, awake: true },
      e7: { side: BLACK, piece: LEGIONARY },
      m13: { side: BLACK, piece: POPE }
    }
    const moves = legality(setup(WHITE, occupancy, burst)).filter(({ to }) => to === 'e8')
    expect(moves).toHaveLength(7)
    expect(moves).toContainEqual({ from: 'c5', to: 'e8' })
    expect(moves).toContainEqual({ from: 'd7', to: 'e8' })
    expect(moves).toContainEqual({ from: 'f7', to: 'e8' })
    expect(moves).toContainEqual({ from: 'e10', to: 'e8' })
    expect(moves).toContainEqual({ from: 'h11', to: 'e8' })
    expect(moves).toContainEqual({ from: 'a8', to: 'e8' })
    expect(moves).toContainEqual({ from: 'i8', to: 'e8' })
  })
})
describe('herald under a pin', () => {
  it('slides along a diagonal pin and may take the piece pinning it', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      c3: { side: WHITE, piece: HERALD },
      f6: { side: BLACK, piece: HERALD },
      m13: { side: BLACK, piece: POPE }
    }
    expect(new Set(destinations(WHITE, occupancy, 'c3'))).toEqual(new Set(['b2', 'd4', 'e5', 'f6']))
  })
  it('steps along a file pin', () => {
    const occupancy: SquareOccupant = {
      e1: { side: WHITE, piece: POPE },
      e4: { side: WHITE, piece: HERALD },
      e7: { side: BLACK, piece: SENTINEL },
      m13: { side: BLACK, piece: POPE }
    }
    expect(new Set(destinations(WHITE, occupancy, 'e4'))).toEqual(new Set(['e3', 'e5']))
  })
  it('steps along a rank pin', () => {
    const occupancy: SquareOccupant = {
      a5: { side: WHITE, piece: POPE },
      d5: { side: WHITE, piece: HERALD },
      f5: { side: BLACK, piece: SENTINEL },
      m13: { side: BLACK, piece: POPE }
    }
    expect(new Set(destinations(WHITE, occupancy, 'd5'))).toEqual(new Set(['c5', 'e5']))
  })
})
describe('herald in check', () => {
  it('blocks a check by sliding or stepping, or takes the checker', () => {
    const checked: SquareOccupant = {
      e4: { side: WHITE, piece: POPE },
      k4: { side: BLACK, piece: SENTINEL },
      m13: { side: BLACK, piece: POPE }
    }
    const blocking: SquareOccupant = { ...checked, h5: { side: WHITE, piece: HERALD } }
    const taking: SquareOccupant = { ...checked, j5: { side: WHITE, piece: HERALD } }
    expect(new Set(destinations(WHITE, blocking, 'h5'))).toEqual(new Set(['g4', 'h4', 'i4']))
    expect(new Set(destinations(WHITE, taking, 'j5'))).toEqual(new Set(['i4', 'j4', 'k4']))
  })
  it('has no move in a double check, even onto a checker', () => {
    const occupancy: SquareOccupant = {
      e4: { side: WHITE, piece: POPE },
      f8: { side: WHITE, piece: HERALD },
      g7: { side: BLACK, piece: TEMPLAR },
      h7: { side: BLACK, piece: HERALD },
      m13: { side: BLACK, piece: POPE }
    }
    expect(destinations(WHITE, occupancy, 'f8')).toEqual([])
  })
})
describe('herald beyond 6 tiles while enhanced', () => {
  const checked: SquareOccupant = {
    e4: { side: WHITE, piece: POPE },
    k4: { side: BLACK, piece: SENTINEL },
    m13: { side: BLACK, piece: POPE }
  }
  it('blocks a check from beyond 6 tiles only when enhanced', () => {
    const restricted: SquareOccupant = { ...checked, b11: { side: WHITE, piece: HERALD } }
    const enhanced: SquareOccupant = { ...restricted, b7: { side: WHITE, piece: MARSHAL } }
    expect(destinations(WHITE, restricted, 'b11')).toEqual([])
    expect(destinations(WHITE, enhanced, 'b11')).toEqual(['i4'])
  })
  it('takes its checker with the straight step only when enhanced', () => {
    const restricted: SquareOccupant = { ...checked, k5: { side: WHITE, piece: HERALD } }
    const enhanced: SquareOccupant = { ...restricted, m8: { side: WHITE, piece: MARSHAL } }
    expect(destinations(WHITE, restricted, 'k5')).toEqual(['j4'])
    expect(new Set(destinations(WHITE, enhanced, 'k5'))).toEqual(new Set(['j4', 'k4']))
  })
  it('keeps the pope off a square it attacks from beyond 6 tiles only when enhanced', () => {
    const occupancy: SquareOccupant = {
      g8: { side: WHITE, piece: POPE },
      a1: { side: BLACK, piece: HERALD },
      a13: { side: BLACK, piece: POPE }
    }
    const enhanced: SquareOccupant = { ...occupancy, e2: { side: BLACK, piece: MARSHAL } }
    const squares = destinations(WHITE, occupancy, 'g8')
    expect(squares).not.toContain('g7')
    expect(squares).toContain('h8')
    expect(destinations(WHITE, enhanced, 'g8')).not.toContain('h8')
  })
})
describe('herald giving check', () => {
  it('checks along a diagonal up to 6 tiles, and from 7 only when enhanced', () => {
    const popes: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      m13: { side: BLACK, piece: POPE }
    }
    const six: SquareOccupant = { ...popes, g7: { side: WHITE, piece: HERALD } }
    const seven: SquareOccupant = { ...popes, f6: { side: WHITE, piece: HERALD } }
    const enhanced: SquareOccupant = { ...seven, b5: { side: WHITE, piece: MARSHAL } }
    expect(setup(BLACK, six).checkers).toEqual(['g7'])
    expect(setup(BLACK, seven).checkers).toEqual([])
    expect(setup(BLACK, enhanced).checkers).toEqual(['f6'])
  })
  it('checks with the straight step only when enhanced', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      g6: { side: WHITE, piece: HERALD },
      g7: { side: BLACK, piece: POPE }
    }
    const enhanced: SquareOccupant = { ...occupancy, g3: { side: WHITE, piece: MARSHAL } }
    expect(setup(BLACK, occupancy).checkers).toEqual([])
    expect(setup(BLACK, enhanced).checkers).toEqual(['g6'])
  })
  it('gives a discovered check by sliding off a line', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      g1: { side: WHITE, piece: SENTINEL },
      g4: { side: WHITE, piece: HERALD },
      g7: { side: BLACK, piece: POPE }
    }
    expect(checkersAfter(occupancy, { from: 'g4', to: 'h5' })).toEqual(['g1'])
  })
})
describe('pope and herald attacks', () => {
  it('cannot step onto a square a herald attacks, but may step beside a restricted one', () => {
    const occupancy: SquareOccupant = {
      e4: { side: WHITE, piece: POPE },
      e6: { side: BLACK, piece: HERALD },
      m13: { side: BLACK, piece: POPE }
    }
    const enhanced: SquareOccupant = { ...occupancy, a10: { side: BLACK, piece: MARSHAL } }
    const squares = destinations(WHITE, occupancy, 'e4')
    expect(squares).not.toContain('d5')
    expect(squares).not.toContain('f5')
    expect(squares).toContain('e5')
    expect(destinations(WHITE, enhanced, 'e4')).not.toContain('e5')
  })
  it('cannot castle across a square a herald attacks', () => {
    const castle: SquareOccupant = {
      g1: { side: WHITE, piece: POPE },
      a1: { side: WHITE, piece: SENTINEL },
      h4: { side: BLACK, piece: HERALD },
      m13: { side: BLACK, piece: POPE }
    }
    const left: Partial<State> = {
      castlingSide: {
        [WHITE]: { left: true, right: false },
        [BLACK]: { left: false, right: false }
      }
    }
    expect(destinations(WHITE, castle, 'g1', left)).not.toContain('d1')
  })
  it('forbids Hg1-d4 from the rules, which wakes the emperor on c3 onto its own pope', () => {
    const occupancy: SquareOccupant = {
      a1: { side: BLACK, piece: POPE },
      g1: { side: BLACK, piece: HERALD },
      c3: { side: WHITE, piece: EMPEROR, awake: false },
      e5: { side: WHITE, piece: HERALD },
      l13: { side: WHITE, piece: MARSHAL },
      m13: { side: WHITE, piece: POPE }
    }
    const shielded: SquareOccupant = { ...occupancy, b2: { side: BLACK, piece: SENTINEL } }
    expect(destinations(BLACK, occupancy, 'g1')).not.toContain('d4')
    expect(destinations(BLACK, shielded, 'g1')).toContain('d4')
  })
})
describe('herald waking the enemy emperor on a file or a rank', () => {
  it('forbids a herald move that wakes the enemy emperor on a file or a rank to its own pope', () => {
    const [open, shielded] = onLines({ j4: { side: BLACK, piece: HERALD } })
    for (const board of open) expect(destinations(BLACK, board, 'j4')).not.toContain('g7')
    for (const board of shielded) expect(destinations(BLACK, board, 'j4')).toContain('g7')
  })
  it('forbids a herald from taking the enemy marshal when the emperor it wakes would attack its own pope', () => {
    const occupancy: SquareOccupant = { ...HANGING, k8: { side: BLACK, piece: HERALD } }
    const shielded: SquareOccupant = { ...occupancy, e3: { side: BLACK, piece: LEGIONARY } }
    expect(destinations(BLACK, occupancy, 'k8')).not.toContain('h5')
    expect(destinations(BLACK, shielded, 'k8')).toContain('h5')
  })
})
describe('mage under a pin', () => {
  it('steps only along a diagonal pin and still blasts, since it never leaves its square', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      c3: { side: WHITE, piece: MAGE },
      b4: { side: BLACK, piece: LEGIONARY },
      f6: { side: BLACK, piece: HERALD },
      m13: { side: BLACK, piece: POPE }
    }
    expect(new Set(destinations(WHITE, occupancy, 'c3'))).toEqual(new Set(['b2', 'd4', 'c3']))
  })
  it('blasts the piece pinning it', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      c3: { side: WHITE, piece: MAGE },
      d4: { side: BLACK, piece: HERALD },
      m13: { side: BLACK, piece: POPE }
    }
    expect(new Set(destinations(WHITE, occupancy, 'c3'))).toEqual(new Set(['b2', 'c3']))
  })
  it('steps only along a file or a rank pin', () => {
    const file: SquareOccupant = {
      e1: { side: WHITE, piece: POPE },
      e4: { side: WHITE, piece: MAGE },
      e7: { side: BLACK, piece: SENTINEL },
      m13: { side: BLACK, piece: POPE }
    }
    const rank: SquareOccupant = {
      a5: { side: WHITE, piece: POPE },
      d5: { side: WHITE, piece: MAGE },
      f5: { side: BLACK, piece: SENTINEL },
      m13: { side: BLACK, piece: POPE }
    }
    expect(new Set(destinations(WHITE, file, 'e4'))).toEqual(new Set(['e3', 'e5']))
    expect(new Set(destinations(WHITE, rank, 'd5'))).toEqual(new Set(['c5', 'e5']))
  })
})
describe('mage in check', () => {
  const checked: SquareOccupant = {
    e4: { side: WHITE, piece: POPE },
    k4: { side: BLACK, piece: SENTINEL },
    m13: { side: BLACK, piece: POPE }
  }
  it('blocks a check by stepping into the line, or blasts the checker', () => {
    const stepping: SquareOccupant = { ...checked, h5: { side: WHITE, piece: MAGE } }
    const blasting: SquareOccupant = { ...checked, j5: { side: WHITE, piece: MAGE } }
    expect(new Set(destinations(WHITE, stepping, 'h5'))).toEqual(new Set(['g4', 'h4', 'i4']))
    expect(new Set(destinations(WHITE, blasting, 'j5'))).toEqual(new Set(['i4', 'j4', 'j5']))
  })
  it('blocks with the 2-tile leap only when enhanced', () => {
    const restricted: SquareOccupant = { ...checked, h6: { side: WHITE, piece: MAGE } }
    const enhanced: SquareOccupant = { ...restricted, l8: { side: WHITE, piece: MARSHAL } }
    expect(destinations(WHITE, restricted, 'h6')).toEqual([])
    expect(new Set(destinations(WHITE, enhanced, 'h6'))).toEqual(new Set(['f4', 'h4', 'j4']))
  })
})
describe('mage check and double check', () => {
  it('answers a mage check only by taking the mage, since nothing stands between', () => {
    const occupancy: SquareOccupant = {
      e4: { side: WHITE, piece: POPE },
      e5: { side: BLACK, piece: MAGE },
      h2: { side: WHITE, piece: HERALD },
      m13: { side: BLACK, piece: POPE }
    }
    expect(destinations(WHITE, occupancy, 'h2')).toEqual(['e5'])
  })
  it('cannot blast a checking mage beside its own pope unless enhanced', () => {
    const occupancy: SquareOccupant = {
      e4: { side: WHITE, piece: POPE },
      e5: { side: BLACK, piece: MAGE },
      f5: { side: WHITE, piece: MAGE },
      m13: { side: BLACK, piece: POPE }
    }
    const enhanced: SquareOccupant = { ...occupancy, j7: { side: WHITE, piece: MARSHAL } }
    expect(destinations(WHITE, occupancy, 'f5')).toEqual([])
    expect(destinations(WHITE, enhanced, 'f5')).toEqual(['f5'])
  })
  it('answers a double check only with a blast that destroys both checkers', () => {
    const occupancy: SquareOccupant = {
      e4: { side: WHITE, piece: POPE },
      d5: { side: BLACK, piece: MAGE },
      c7: { side: BLACK, piece: TEMPLAR },
      m13: { side: BLACK, piece: POPE }
    }
    const both: SquareOccupant = { ...occupancy, d6: { side: WHITE, piece: MAGE } }
    const one: SquareOccupant = { ...occupancy, c4: { side: WHITE, piece: MAGE } }
    expect(setup(WHITE, both).checkers).toHaveLength(2)
    expect(destinations(WHITE, both, 'd6')).toEqual(['d6'])
    expect(destinations(WHITE, one, 'c4')).toEqual([])
  })
})
describe('mage giving check', () => {
  it('checks from any of the 8 tiles around the pope, never from 2 tiles away', () => {
    const popes: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      g7: { side: BLACK, piece: POPE }
    }
    const far: SquareOccupant = {
      ...popes,
      g9: { side: WHITE, piece: MAGE },
      d12: { side: WHITE, piece: MARSHAL }
    }
    for (const square of ['f6', 'f7', 'f8', 'g6', 'g8', 'h6', 'h7', 'h8']) {
      const occupancy: SquareOccupant = { ...popes, [square]: { side: WHITE, piece: MAGE } }
      expect(setup(BLACK, occupancy).checkers).toEqual([square])
    }
    expect(setup(BLACK, far).checkers).toEqual([])
  })
  it('gives no check while restricted with both popes in its ring, and checks when enhanced', () => {
    const both: SquareOccupant = {
      e6: { side: WHITE, piece: POPE },
      f7: { side: WHITE, piece: MAGE },
      g7: { side: BLACK, piece: POPE }
    }
    const enhanced: SquareOccupant = { ...both, b5: { side: WHITE, piece: MARSHAL } }
    expect(setup(BLACK, both).checkers).toEqual([])
    expect(setup(BLACK, enhanced).checkers).toEqual(['f7'])
  })
})
describe('mage giving a discovered check', () => {
  const line: SquareOccupant = {
    a1: { side: WHITE, piece: POPE },
    g1: { side: WHITE, piece: SENTINEL },
    g7: { side: BLACK, piece: POPE }
  }
  it('gives a discovered check by stepping off a line', () => {
    const occupancy: SquareOccupant = { ...line, g4: { side: WHITE, piece: MAGE } }
    expect(checkersAfter(occupancy, { from: 'g4', to: 'h4' })).toEqual(['g1'])
  })
  it('gives a discovered check by blasting away a piece in the line, even its own', () => {
    const enemy: SquareOccupant = {
      ...line,
      g4: { side: BLACK, piece: LEGIONARY },
      h4: { side: WHITE, piece: MAGE }
    }
    const own: SquareOccupant = {
      ...line,
      g4: { side: WHITE, piece: LEGIONARY },
      h4: { side: WHITE, piece: MAGE },
      i5: { side: BLACK, piece: LEGIONARY }
    }
    expect(checkersAfter(enemy, { from: 'h4', to: 'h4', captures: ['g4'] })).toEqual(['g1'])
    expect(checkersAfter(own, { from: 'h4', to: 'h4', captures: ['g4', 'i5'] })).toEqual(['g1'])
  })
})
describe('mage blasting', () => {
  it('cannot blast away its own piece that shields its pope unless enhanced', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      b2: { side: WHITE, piece: LEGIONARY },
      c2: { side: WHITE, piece: MAGE },
      d3: { side: BLACK, piece: LEGIONARY },
      f6: { side: BLACK, piece: HERALD },
      m13: { side: BLACK, piece: POPE }
    }
    const enhanced: SquareOccupant = { ...occupancy, g2: { side: WHITE, piece: MARSHAL } }
    expect(destinations(WHITE, occupancy, 'c2')).not.toContain('c2')
    expect(destinations(WHITE, enhanced, 'c2')).toContain('c2')
  })
  it('cannot blast away an enemy piece that screens its pope from an enemy line', () => {
    const screen: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      a4: { side: BLACK, piece: LEGIONARY },
      b4: { side: WHITE, piece: MAGE },
      m13: { side: BLACK, piece: POPE }
    }
    const line: SquareOccupant = { ...screen, a7: { side: BLACK, piece: SENTINEL } }
    expect(destinations(WHITE, screen, 'b4')).toContain('b4')
    expect(destinations(WHITE, line, 'b4')).not.toContain('b4')
  })
  it('blasts again on its next turn, with no cooldown', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      e5: { side: WHITE, piece: MAGE },
      d6: { side: BLACK, piece: HERALD },
      h8: { side: BLACK, piece: HERALD },
      m13: { side: BLACK, piece: POPE }
    }
    const { match } = opening()
    const { state } = setup(WHITE, occupancy)
    const blast: Move = { from: 'e5', to: 'e5', captures: ['d6'] }
    const first = turn({ side: WHITE, occupancy, state, match }, blast)
    const second = turn(first.save, { from: 'h8', to: 'f6' })
    expect(second.moves).toContainEqual({ from: 'e5', to: 'e5', captures: ['f6'] })
  })
})
describe('pope and mage attacks', () => {
  it('cannot step into the ring of a mage, nor take a piece standing in it', () => {
    const occupancy: SquareOccupant = {
      e4: { side: WHITE, piece: POPE },
      e5: { side: BLACK, piece: TEMPLAR },
      e6: { side: BLACK, piece: MAGE },
      m13: { side: BLACK, piece: POPE }
    }
    const squares = destinations(WHITE, occupancy, 'e4')
    expect(squares).not.toContain('d5')
    expect(squares).not.toContain('e5')
    expect(squares).not.toContain('f5')
    expect(squares).toContain('d4')
  })
  it('may step beside a restricted mage whose own pope stands in its ring', () => {
    const occupancy: SquareOccupant = {
      e4: { side: WHITE, piece: POPE },
      e6: { side: BLACK, piece: MAGE },
      e7: { side: BLACK, piece: POPE }
    }
    const enhanced: SquareOccupant = { ...occupancy, b9: { side: BLACK, piece: MARSHAL } }
    expect(destinations(WHITE, occupancy, 'e4')).toContain('e5')
    expect(destinations(WHITE, enhanced, 'e4')).not.toContain('e5')
  })
  it('cannot castle across the ring of a mage', () => {
    const castle: SquareOccupant = {
      g1: { side: WHITE, piece: POPE },
      a1: { side: WHITE, piece: SENTINEL },
      e2: { side: BLACK, piece: MAGE },
      m13: { side: BLACK, piece: POPE }
    }
    const left: Partial<State> = {
      castlingSide: {
        [WHITE]: { left: true, right: false },
        [BLACK]: { left: false, right: false }
      }
    }
    expect(destinations(WHITE, castle, 'g1', left)).not.toContain('d1')
  })
})
describe('mage, the command zone and the enemy emperor', () => {
  it('keeps a mage near the enemy marshal to one tile', () => {
    const occupancy: SquareOccupant = {
      m1: { side: WHITE, piece: POPE },
      d4: { side: WHITE, piece: MAGE },
      f6: { side: BLACK, piece: MARSHAL },
      a13: { side: BLACK, piece: POPE }
    }
    expect(destinations(WHITE, occupancy, 'd4')).toHaveLength(8)
  })
  it('forbids a mage step or blast that wakes the enemy emperor onto its own pope', () => {
    const occupancy: SquareOccupant = {
      a1: { side: BLACK, piece: POPE },
      c3: { side: WHITE, piece: EMPEROR, awake: false },
      j3: { side: WHITE, piece: MARSHAL },
      m13: { side: WHITE, piece: POPE },
      e5: { side: BLACK, piece: MAGE },
      k4: { side: BLACK, piece: MAGE }
    }
    const shielded: SquareOccupant = { ...occupancy, b2: { side: BLACK, piece: SENTINEL } }
    expect(destinations(BLACK, occupancy, 'e5')).not.toContain('d4')
    expect(destinations(BLACK, occupancy, 'k4')).not.toContain('k4')
    expect(destinations(BLACK, shielded, 'e5')).toContain('d4')
    expect(destinations(BLACK, shielded, 'k4')).toContain('k4')
  })
  it('forbids a mage step that wakes the enemy emperor on a file or a rank to its own pope', () => {
    const [open, shielded] = onLines({ g7: { side: BLACK, piece: MAGE } })
    for (const board of open) expect(destinations(BLACK, board, 'g7')).not.toContain('f6')
    for (const board of shielded) expect(destinations(BLACK, board, 'g7')).toContain('f6')
  })
})
describe('sentinel under a pin', () => {
  it('cannot move off a diagonal pin, since it never moves diagonally', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      c3: { side: WHITE, piece: SENTINEL },
      f6: { side: BLACK, piece: HERALD },
      m13: { side: BLACK, piece: POPE }
    }
    expect(destinations(WHITE, occupancy, 'c3')).toEqual([])
  })
  it('slides along a file or a rank pin and may take the piece pinning it', () => {
    const file: SquareOccupant = {
      e1: { side: WHITE, piece: POPE },
      e4: { side: WHITE, piece: SENTINEL },
      e7: { side: BLACK, piece: SENTINEL },
      m13: { side: BLACK, piece: POPE }
    }
    const rank: SquareOccupant = {
      a5: { side: WHITE, piece: POPE },
      d5: { side: WHITE, piece: SENTINEL },
      f5: { side: BLACK, piece: SENTINEL },
      m13: { side: BLACK, piece: POPE }
    }
    expect(new Set(destinations(WHITE, file, 'e4'))).toEqual(
      new Set(['e2', 'e3', 'e5', 'e6', 'e7'])
    )
    expect(new Set(destinations(WHITE, rank, 'd5'))).toEqual(new Set(['b5', 'c5', 'e5', 'f5']))
  })
})
describe('sentinel in check', () => {
  const checked: SquareOccupant = {
    e4: { side: WHITE, piece: POPE },
    k4: { side: BLACK, piece: SENTINEL },
    m13: { side: BLACK, piece: POPE }
  }
  it('blocks a check, or takes the checker from further than it can move quietly', () => {
    const blocking: SquareOccupant = { ...checked, h7: { side: WHITE, piece: SENTINEL } }
    const taking: SquareOccupant = { ...checked, k10: { side: WHITE, piece: SENTINEL } }
    expect(destinations(WHITE, blocking, 'h7')).toEqual(['h4'])
    expect(destinations(WHITE, taking, 'k10')).toEqual(['k4'])
  })
  it('passes its own piece toward its marshal to block, only when enhanced', () => {
    const restricted: SquareOccupant = {
      ...checked,
      h7: { side: WHITE, piece: SENTINEL },
      h6: { side: WHITE, piece: MAGE }
    }
    const enhanced: SquareOccupant = { ...restricted, l4: { side: WHITE, piece: MARSHAL } }
    expect(destinations(WHITE, restricted, 'h7')).toEqual([])
    expect(destinations(WHITE, enhanced, 'h7')).toEqual(['h4'])
  })
  it('has no move in a double check, even onto a checker', () => {
    const occupancy: SquareOccupant = {
      e4: { side: WHITE, piece: POPE },
      g10: { side: WHITE, piece: SENTINEL },
      g7: { side: BLACK, piece: TEMPLAR },
      h7: { side: BLACK, piece: HERALD },
      m13: { side: BLACK, piece: POPE }
    }
    expect(destinations(WHITE, occupancy, 'g10')).toEqual([])
  })
})
describe('sentinel beyond its restricted reach', () => {
  const checked: SquareOccupant = {
    e4: { side: WHITE, piece: POPE },
    k4: { side: BLACK, piece: SENTINEL },
    m13: { side: BLACK, piece: POPE }
  }
  it('blocks a check from 4 to 6 tiles only when enhanced', () => {
    const restricted: SquareOccupant = { ...checked, h9: { side: WHITE, piece: SENTINEL } }
    const enhanced: SquareOccupant = { ...restricted, l12: { side: WHITE, piece: MARSHAL } }
    expect(destinations(WHITE, restricted, 'h9')).toEqual([])
    expect(destinations(WHITE, enhanced, 'h9')).toEqual(['h4'])
  })
  it('takes its checker from beyond 6 tiles only when enhanced', () => {
    const restricted: SquareOccupant = { ...checked, k11: { side: WHITE, piece: SENTINEL } }
    const enhanced: SquareOccupant = { ...restricted, g11: { side: WHITE, piece: MARSHAL } }
    expect(destinations(WHITE, restricted, 'k11')).toEqual([])
    expect(destinations(WHITE, enhanced, 'k11')).toEqual(['k4'])
  })
  it('keeps the pope off a square it attacks from beyond 6 tiles only when enhanced', () => {
    const occupancy: SquareOccupant = {
      e4: { side: WHITE, piece: POPE },
      e12: { side: BLACK, piece: SENTINEL },
      m13: { side: BLACK, piece: POPE }
    }
    const enhanced: SquareOccupant = { ...occupancy, i12: { side: BLACK, piece: MARSHAL } }
    expect(destinations(WHITE, occupancy, 'e4')).toContain('e5')
    expect(destinations(WHITE, enhanced, 'e4')).not.toContain('e5')
  })
})
describe('sentinel giving check', () => {
  const popes: SquareOccupant = {
    a1: { side: WHITE, piece: POPE },
    m13: { side: BLACK, piece: POPE }
  }
  it('checks along a file or rank up to 6 tiles, and from 7 only when enhanced', () => {
    const six: SquareOccupant = { ...popes, m7: { side: WHITE, piece: SENTINEL } }
    const seven: SquareOccupant = { ...popes, m6: { side: WHITE, piece: SENTINEL } }
    const enhanced: SquareOccupant = { ...seven, j4: { side: WHITE, piece: MARSHAL } }
    expect(setup(BLACK, six).checkers).toEqual(['m7'])
    expect(setup(BLACK, seven).checkers).toEqual([])
    expect(setup(BLACK, enhanced).checkers).toEqual(['m6'])
  })
  it('never checks along a diagonal, nor through its own piece it could pass', () => {
    const diagonal: SquareOccupant = { ...popes, l12: { side: WHITE, piece: SENTINEL } }
    const passing: SquareOccupant = {
      ...popes,
      m6: { side: WHITE, piece: SENTINEL },
      m8: { side: WHITE, piece: MAGE },
      j9: { side: WHITE, piece: MARSHAL }
    }
    expect(setup(BLACK, diagonal).checkers).toEqual([])
    expect(setup(BLACK, passing).checkers).toEqual([])
  })
})
describe('sentinel giving a discovered check', () => {
  it('gives a discovered check by moving off a line', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      c3: { side: WHITE, piece: HERALD },
      e5: { side: WHITE, piece: SENTINEL },
      g7: { side: BLACK, piece: POPE }
    }
    expect(checkersAfter(occupancy, { from: 'e5', to: 'e2' })).toEqual(['c3'])
  })
  it('checks by passing its own piece onto a line to the pope', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      a4: { side: WHITE, piece: MARSHAL },
      e1: { side: WHITE, piece: SENTINEL },
      e2: { side: WHITE, piece: MAGE },
      h5: { side: BLACK, piece: POPE }
    }
    expect(destinations(WHITE, occupancy, 'e1')).toContain('e5')
    expect(checkersAfter(occupancy, { from: 'e1', to: 'e5' })).toEqual(['e5'])
  })
})
describe('pope and sentinel attacks', () => {
  const left: Partial<State> = {
    castlingSide: {
      [WHITE]: { left: true, right: false },
      [BLACK]: { left: false, right: false }
    }
  }
  it('cannot step onto or take on a square a sentinel attacks from further than it moves', () => {
    const occupancy: SquareOccupant = {
      e4: { side: WHITE, piece: POPE },
      e11: { side: BLACK, piece: SENTINEL },
      f5: { side: BLACK, piece: TEMPLAR },
      f11: { side: BLACK, piece: SENTINEL },
      m13: { side: BLACK, piece: POPE }
    }
    const squares = destinations(WHITE, occupancy, 'e4')
    expect(squares).not.toContain('e5')
    expect(squares).not.toContain('f5')
    expect(squares).toContain('d5')
  })
  it('cannot castle across a square a sentinel attacks', () => {
    const castle: SquareOccupant = {
      g1: { side: WHITE, piece: POPE },
      a1: { side: WHITE, piece: SENTINEL },
      e7: { side: BLACK, piece: SENTINEL },
      m13: { side: BLACK, piece: POPE }
    }
    expect(destinations(WHITE, castle, 'g1', left)).not.toContain('d1')
  })
  it('castles only with its own sentinel standing on the corner', () => {
    const partner: SquareOccupant = {
      g1: { side: WHITE, piece: POPE },
      a1: { side: WHITE, piece: TEMPLAR },
      m13: { side: BLACK, piece: POPE }
    }
    expect(destinations(WHITE, partner, 'g1', left)).not.toContain('d1')
  })
})
describe('sentinel castling', () => {
  const left: Partial<State> = {
    castlingSide: {
      [WHITE]: { left: true, right: false },
      [BLACK]: { left: false, right: false }
    }
  }
  it('cannot castle out of check', () => {
    const castle: SquareOccupant = {
      g1: { side: WHITE, piece: POPE },
      a1: { side: WHITE, piece: SENTINEL },
      m13: { side: BLACK, piece: POPE }
    }
    const checked: SquareOccupant = { ...castle, g5: { side: BLACK, piece: SENTINEL } }
    expect(destinations(WHITE, castle, 'g1', left)).toContain('d1')
    expect(destinations(WHITE, checked, 'g1', left)).not.toContain('d1')
  })
  it('needs every square between the pope and the sentinel empty, b1 included', () => {
    const blocked: SquareOccupant = {
      g1: { side: WHITE, piece: POPE },
      a1: { side: WHITE, piece: SENTINEL },
      b1: { side: WHITE, piece: HERALD },
      m13: { side: BLACK, piece: POPE }
    }
    expect(destinations(WHITE, blocked, 'g1', left)).not.toContain('d1')
  })
})
describe('sentinel castling on the right and for black', () => {
  it('castles from g1 to j1, never across an attacked square or past a piece', () => {
    const right: Partial<State> = {
      castlingSide: {
        [WHITE]: { left: false, right: true },
        [BLACK]: { left: false, right: false }
      }
    }
    const castle: SquareOccupant = {
      g1: { side: WHITE, piece: POPE },
      m1: { side: WHITE, piece: SENTINEL },
      a13: { side: BLACK, piece: POPE }
    }
    const attacked: SquareOccupant = { ...castle, i7: { side: BLACK, piece: SENTINEL } }
    const blocked: SquareOccupant = { ...castle, l1: { side: WHITE, piece: HERALD } }
    expect(destinations(WHITE, castle, 'g1', right)).toContain('j1')
    expect(destinations(WHITE, attacked, 'g1', right)).not.toContain('j1')
    expect(destinations(WHITE, blocked, 'g1', right)).not.toContain('j1')
  })
  it('castles for black from g13 to d13 or j13, never across an attacked square', () => {
    const both: Partial<State> = {
      castlingSide: {
        [WHITE]: { left: false, right: false },
        [BLACK]: { left: true, right: true }
      }
    }
    const castle: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      g13: { side: BLACK, piece: POPE },
      a13: { side: BLACK, piece: SENTINEL },
      m13: { side: BLACK, piece: SENTINEL }
    }
    const attacked: SquareOccupant = { ...castle, e7: { side: WHITE, piece: SENTINEL } }
    expect(destinations(BLACK, castle, 'g13', both)).toContain('d13')
    expect(destinations(BLACK, castle, 'g13', both)).toContain('j13')
    expect(destinations(BLACK, attacked, 'g13', both)).not.toContain('d13')
    expect(destinations(BLACK, attacked, 'g13', both)).toContain('j13')
  })
})
describe('sentinel, the command zone and the enemy emperor', () => {
  it('keeps a sentinel near the enemy marshal to 3 tiles, never passing through toward it', () => {
    const occupancy: SquareOccupant = {
      m1: { side: WHITE, piece: POPE },
      e5: { side: WHITE, piece: SENTINEL },
      e6: { side: WHITE, piece: MAGE },
      h8: { side: BLACK, piece: MARSHAL },
      a13: { side: BLACK, piece: POPE }
    }
    expect(destinations(WHITE, occupancy, 'e5')).toHaveLength(9)
  })
  it('forbids a sentinel move that wakes the enemy emperor onto its own pope', () => {
    const occupancy: SquareOccupant = {
      a1: { side: BLACK, piece: POPE },
      c3: { side: WHITE, piece: EMPEROR, awake: false },
      m12: { side: WHITE, piece: MARSHAL },
      m1: { side: WHITE, piece: POPE },
      f4: { side: BLACK, piece: SENTINEL }
    }
    const shielded: SquareOccupant = { ...occupancy, b2: { side: BLACK, piece: SENTINEL } }
    expect(destinations(BLACK, occupancy, 'f4')).not.toContain('f3')
    expect(destinations(BLACK, shielded, 'f4')).toContain('f3')
  })
  it('forbids a sentinel move that wakes the enemy emperor on a file or a rank to its own pope', () => {
    const [open, shielded] = onLines({ h4: { side: BLACK, piece: SENTINEL } })
    for (const board of open) expect(destinations(BLACK, board, 'h4')).not.toContain('h5')
    for (const board of shielded) expect(destinations(BLACK, board, 'h4')).toContain('h5')
  })
})
describe('assassin under a pin', () => {
  it('captures along its pin line, never off it', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      c3: { side: WHITE, piece: ASSASSIN },
      f6: { side: BLACK, piece: HERALD },
      c6: { side: BLACK, piece: LEGIONARY },
      m13: { side: BLACK, piece: POPE }
    }
    expect(new Set(destinations(WHITE, occupancy, 'c3'))).toEqual(new Set(['b2', 'd4', 'e5', 'g7']))
  })
  it('slides along a file or a rank pin and takes the piece pinning it by landing behind it', () => {
    const file: SquareOccupant = {
      e1: { side: WHITE, piece: POPE },
      e4: { side: WHITE, piece: ASSASSIN },
      e7: { side: BLACK, piece: SENTINEL },
      m13: { side: BLACK, piece: POPE }
    }
    const rank: SquareOccupant = {
      a5: { side: WHITE, piece: POPE },
      d5: { side: WHITE, piece: ASSASSIN },
      f5: { side: BLACK, piece: SENTINEL },
      m13: { side: BLACK, piece: POPE }
    }
    expect(new Set(destinations(WHITE, file, 'e4'))).toEqual(
      new Set(['e2', 'e3', 'e5', 'e6', 'e8'])
    )
    expect(new Set(destinations(WHITE, rank, 'd5'))).toEqual(new Set(['b5', 'c5', 'e5', 'g5']))
  })
})
describe('assassin in check', () => {
  const checked: SquareOccupant = {
    e4: { side: WHITE, piece: POPE },
    k4: { side: BLACK, piece: SENTINEL },
    m13: { side: BLACK, piece: POPE }
  }
  it('blocks a check by sliding into the line, or takes the checker by landing behind it', () => {
    const blocking: SquareOccupant = { ...checked, h8: { side: WHITE, piece: ASSASSIN } }
    const taking: SquareOccupant = { ...checked, m6: { side: WHITE, piece: ASSASSIN } }
    expect(destinations(WHITE, blocking, 'h8')).toEqual(['h4'])
    expect(destinations(WHITE, taking, 'm6')).toEqual(['j3'])
  })
  it('blocks from beyond 6 tiles only when enhanced', () => {
    const restricted: SquareOccupant = { ...checked, h12: { side: WHITE, piece: ASSASSIN } }
    const enhanced: SquareOccupant = { ...restricted, d12: { side: WHITE, piece: MARSHAL } }
    expect(destinations(WHITE, restricted, 'h12')).toEqual([])
    expect(destinations(WHITE, enhanced, 'h12')).toEqual(['h4'])
  })
})
describe('assassin capturing', () => {
  it('cannot land on a watched tile while enhanced either', () => {
    const occupancy: SquareOccupant = {
      m1: { side: WHITE, piece: POPE },
      a1: { side: WHITE, piece: ASSASSIN },
      c3: { side: WHITE, piece: MARSHAL },
      a10: { side: BLACK, piece: HERALD },
      m13: { side: BLACK, piece: POPE }
    }
    const watched: SquareOccupant = { ...occupancy, d11: { side: BLACK, piece: SENTINEL } }
    expect(destinations(WHITE, occupancy, 'a1')).toContain('a11')
    expect(destinations(WHITE, watched, 'a1')).not.toContain('a11')
  })
  it('lands beside a dormant emperor, which guards nothing, but not beside an awake one', () => {
    const occupancy: SquareOccupant = {
      m1: { side: WHITE, piece: POPE },
      e3: { side: WHITE, piece: EMPEROR, awake: false },
      h1: { side: WHITE, piece: MARSHAL },
      e5: { side: WHITE, piece: LEGIONARY },
      e8: { side: BLACK, piece: ASSASSIN },
      m13: { side: BLACK, piece: POPE }
    }
    const awake: SquareOccupant = { ...occupancy, e3: { side: WHITE, piece: EMPEROR, awake: true } }
    expect(destinations(BLACK, occupancy, 'e8')).toContain('e4')
    expect(destinations(BLACK, awake, 'e8')).not.toContain('e4')
  })
  it('cannot take a piece in a corner when the corner itself is watched', () => {
    const corner: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      m1: { side: WHITE, piece: HERALD },
      m7: { side: BLACK, piece: ASSASSIN },
      a13: { side: BLACK, piece: POPE }
    }
    const watched: SquareOccupant = { ...corner, g1: { side: WHITE, piece: SENTINEL } }
    expect(destinations(BLACK, corner, 'm7')).toContain('m1')
    expect(destinations(BLACK, watched, 'm7')).not.toContain('m1')
  })
})
describe('assassin and the marshal riposte from the rules', () => {
  const line: SquareOccupant = {
    m1: { side: WHITE, piece: POPE },
    e5: { side: WHITE, piece: MARSHAL },
    f6: { side: WHITE, piece: HERALD },
    m12: { side: BLACK, piece: POPE }
  }
  const diagonal: SquareOccupant = { ...line, h4: { side: BLACK, piece: ASSASSIN } }
  const rank: SquareOccupant = { ...line, a6: { side: BLACK, piece: ASSASSIN } }
  it('takes f6 onto e7 or onto g6, since the marshal watches neither', () => {
    expect(destinations(BLACK, diagonal, 'h4')).toContain('e7')
    expect(destinations(BLACK, rank, 'a6')).toContain('g6')
  })
  it('faces only the marshal riposte on e7, and no recapture at all on g6', () => {
    const { match } = opening()
    const { state } = setup(BLACK, line)
    const onLine: Move = { from: 'h4', to: 'e7', captures: ['f6'] }
    const offLine: Move = { from: 'a6', to: 'g6', captures: ['f6'] }
    const recaptured = turn({ side: BLACK, occupancy: diagonal, state, match }, onLine)
    const safe = turn({ side: BLACK, occupancy: rank, state, match }, offLine)
    expect(recaptured.moves.filter(({ to }) => to === 'e7')).toEqual([
      { from: 'e5', to: 'e7', captures: ['e7'] }
    ])
    expect(safe.moves.map(({ to }) => to)).not.toContain('g6')
  })
})
describe('assassin giving check', () => {
  const popes: SquareOccupant = {
    a1: { side: WHITE, piece: POPE },
    g7: { side: BLACK, piece: POPE }
  }
  const aiming: SquareOccupant = { ...popes, g2: { side: WHITE, piece: ASSASSIN } }
  it('checks when the tile behind the pope is empty and unwatched, the pope itself not counting', () => {
    expect(setup(BLACK, aiming).checkers).toEqual(['g2'])
  })
  it('gives no check when the tile behind the pope is occupied or watched', () => {
    const occupied: SquareOccupant = { ...aiming, g8: { side: BLACK, piece: LEGIONARY } }
    const watched: SquareOccupant = { ...aiming, h9: { side: BLACK, piece: LEGIONARY } }
    expect(setup(BLACK, occupied).checkers).toEqual([])
    expect(setup(BLACK, watched).checkers).toEqual([])
  })
  it('counts the tile behind the pope inside its range of 6 while restricted', () => {
    const far: SquareOccupant = { ...popes, g1: { side: WHITE, piece: ASSASSIN } }
    const enhanced: SquareOccupant = { ...far, c1: { side: WHITE, piece: MARSHAL } }
    expect(setup(BLACK, far).checkers).toEqual([])
    expect(setup(BLACK, enhanced).checkers).toEqual(['g1'])
  })
  it('gives no check while enhanced either when the tile behind the pope is watched', () => {
    const enhanced: SquareOccupant = {
      ...popes,
      g1: { side: WHITE, piece: ASSASSIN },
      c1: { side: WHITE, piece: MARSHAL }
    }
    const watched: SquareOccupant = { ...enhanced, h9: { side: BLACK, piece: LEGIONARY } }
    expect(setup(BLACK, enhanced).checkers).toEqual(['g1'])
    expect(setup(BLACK, watched).checkers).toEqual([])
  })
  it('checks a pope in a corner by aiming at the corner itself, unless the corner is watched', () => {
    const corner: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      m7: { side: WHITE, piece: ASSASSIN },
      m13: { side: BLACK, piece: POPE }
    }
    const watched: SquareOccupant = { ...corner, h13: { side: BLACK, piece: SENTINEL } }
    expect(setup(BLACK, corner).checkers).toEqual(['m7'])
    expect(setup(BLACK, watched).checkers).toEqual([])
  })
})
describe('assassin check judged on the board after the capture', () => {
  it('gives no check when a line opening behind it would watch the tile behind the pope', () => {
    const occupancy: SquareOccupant = {
      a3: { side: WHITE, piece: POPE },
      g2: { side: WHITE, piece: ASSASSIN },
      g1: { side: BLACK, piece: SENTINEL },
      c2: { side: BLACK, piece: MARSHAL },
      g7: { side: BLACK, piece: POPE }
    }
    expect(setup(BLACK, occupancy).checkers).toEqual([])
  })
})
describe('assassin giving a discovered check', () => {
  const line: SquareOccupant = {
    a1: { side: WHITE, piece: POPE },
    g1: { side: WHITE, piece: SENTINEL },
    g7: { side: BLACK, piece: POPE },
    g8: { side: BLACK, piece: LEGIONARY }
  }
  it('gives a discovered check by sliding off a line', () => {
    const occupancy: SquareOccupant = { ...line, g4: { side: WHITE, piece: ASSASSIN } }
    expect(checkersAfter(occupancy, { from: 'g4', to: 'h4' })).toEqual(['g1'])
  })
  it('gives a discovered check by taking a piece in the line and landing off it', () => {
    const occupancy: SquareOccupant = {
      ...line,
      g4: { side: BLACK, piece: LEGIONARY },
      e4: { side: WHITE, piece: ASSASSIN }
    }
    expect(checkersAfter(occupancy, { from: 'e4', to: 'h4', captures: ['g4'] })).toEqual(['g1'])
  })
})
describe('assassin check answered', () => {
  const checked: SquareOccupant = {
    e4: { side: WHITE, piece: POPE },
    e9: { side: BLACK, piece: ASSASSIN },
    m13: { side: BLACK, piece: POPE }
  }
  it('is answered by standing on the tile behind the pope', () => {
    const occupancy: SquareOccupant = { ...checked, e2: { side: WHITE, piece: LEGIONARY } }
    expect(destinations(WHITE, occupancy, 'e2')).toEqual(['e3'])
  })
  it('is answered by guarding the tile behind the pope', () => {
    const occupancy: SquareOccupant = { ...checked, d1: { side: WHITE, piece: LEGIONARY } }
    expect(destinations(WHITE, occupancy, 'd1')).toEqual(['d2'])
  })
})
describe('assassin in a double check', () => {
  it('answers a double check by capturing one checker and landing in the line of the other', () => {
    const occupancy: SquareOccupant = {
      e4: { side: WHITE, piece: POPE },
      a4: { side: BLACK, piece: MARSHAL },
      d5: { side: BLACK, piece: HERALD },
      d9: { side: WHITE, piece: ASSASSIN },
      m13: { side: BLACK, piece: POPE }
    }
    expect(setup(WHITE, occupancy).checkers).toHaveLength(2)
    expect(destinations(WHITE, occupancy, 'd9')).toEqual(['d4'])
  })
  it('lets one move answer both a sentinel and an assassin check', () => {
    const occupancy: SquareOccupant = {
      e4: { side: WHITE, piece: POPE },
      e9: { side: BLACK, piece: ASSASSIN },
      a4: { side: BLACK, piece: SENTINEL },
      c3: { side: WHITE, piece: HERALD },
      m13: { side: BLACK, piece: POPE }
    }
    expect(setup(WHITE, occupancy).checkers).toHaveLength(2)
    expect(destinations(WHITE, occupancy, 'c3')).toEqual(['d4'])
  })
})
describe('pope and assassin attacks', () => {
  it('cannot step where an assassin could take it, unless the tile behind is guarded', () => {
    const occupancy: SquareOccupant = {
      e4: { side: WHITE, piece: POPE },
      e10: { side: BLACK, piece: ASSASSIN },
      m13: { side: BLACK, piece: POPE }
    }
    const guarded: SquareOccupant = { ...occupancy, d3: { side: WHITE, piece: LEGIONARY } }
    expect(destinations(WHITE, occupancy, 'e4')).not.toContain('e5')
    expect(destinations(WHITE, guarded, 'e4')).toContain('e5')
  })
  it('cannot step where an enhanced assassin reaches past 6 tiles, unless the tile behind is guarded', () => {
    const restricted: SquareOccupant = {
      e4: { side: WHITE, piece: POPE },
      m5: { side: BLACK, piece: ASSASSIN },
      m13: { side: BLACK, piece: POPE }
    }
    const enhanced: SquareOccupant = { ...restricted, m9: { side: BLACK, piece: MARSHAL } }
    const guarded: SquareOccupant = { ...enhanced, c4: { side: WHITE, piece: LEGIONARY } }
    expect(destinations(WHITE, restricted, 'e4')).toContain('e5')
    expect(destinations(WHITE, enhanced, 'e4')).not.toContain('e5')
    expect(destinations(WHITE, guarded, 'e4')).toContain('e5')
  })
  it('castles past an assassin aiming at e1 from above, whose landing would be off the board', () => {
    const castle: SquareOccupant = {
      g1: { side: WHITE, piece: POPE },
      a1: { side: WHITE, piece: SENTINEL },
      e6: { side: BLACK, piece: ASSASSIN },
      m13: { side: BLACK, piece: POPE }
    }
    const left: Partial<State> = {
      castlingSide: {
        [WHITE]: { left: true, right: false },
        [BLACK]: { left: false, right: false }
      }
    }
    expect(destinations(WHITE, castle, 'g1', left)).toContain('d1')
  })
})
describe('assassin, the command zone and the enemy emperor', () => {
  it('keeps an assassin near the enemy marshal to 6 tiles', () => {
    const occupancy: SquareOccupant = {
      m1: { side: WHITE, piece: POPE },
      a1: { side: WHITE, piece: ASSASSIN },
      c2: { side: BLACK, piece: MARSHAL },
      m13: { side: BLACK, piece: POPE }
    }
    const squares = destinations(WHITE, occupancy, 'a1')
    expect(squares).toContain('a7')
    expect(squares).not.toContain('a8')
  })
  it('forbids an assassin move or capture that wakes the enemy emperor onto its own pope', () => {
    const occupancy: SquareOccupant = {
      a1: { side: BLACK, piece: POPE },
      c3: { side: WHITE, piece: EMPEROR, awake: false },
      j3: { side: WHITE, piece: MARSHAL },
      m13: { side: WHITE, piece: POPE },
      f7: { side: BLACK, piece: ASSASSIN },
      j7: { side: BLACK, piece: ASSASSIN }
    }
    const shielded: SquareOccupant = { ...occupancy, b2: { side: BLACK, piece: SENTINEL } }
    expect(destinations(BLACK, occupancy, 'f7')).not.toContain('f3')
    expect(destinations(BLACK, occupancy, 'j7')).not.toContain('j2')
    expect(destinations(BLACK, shielded, 'f7')).toContain('f3')
    expect(destinations(BLACK, shielded, 'j7')).toContain('j2')
  })
  it('forbids an assassin move that wakes the enemy emperor on a file or a rank to its own pope', () => {
    const [open, shielded] = onLines({ h12: { side: BLACK, piece: ASSASSIN } })
    for (const board of open) expect(destinations(BLACK, board, 'h12')).not.toContain('h8')
    for (const board of shielded) expect(destinations(BLACK, board, 'h12')).toContain('h8')
  })
})
describe('assassin taking an assassin', () => {
  it('lets h7 take g7 onto f7, since f8 takes e6 back on g8 and the dead g7 guards nothing', () => {
    const unguarded: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      h7: { side: BLACK, piece: ASSASSIN },
      g7: { side: WHITE, piece: ASSASSIN },
      e6: { side: WHITE, piece: ASSASSIN },
      a7: { side: BLACK, piece: POPE }
    }
    const guarded: SquareOccupant = { ...unguarded, f8: { side: BLACK, piece: ASSASSIN } }
    expect(destinations(BLACK, guarded, 'h7')).toContain('f7')
    expect(destinations(BLACK, unguarded, 'h7')).not.toContain('f7')
  })
})
describe('marshal under a pin', () => {
  it('slides along a diagonal pin, and takes the piece pinning it only with support', () => {
    const pinned: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      c3: { side: WHITE, piece: MARSHAL },
      f6: { side: BLACK, piece: HERALD },
      m13: { side: BLACK, piece: POPE }
    }
    const supported: SquareOccupant = { ...pinned, i8: { side: WHITE, piece: TEMPLAR } }
    expect(new Set(destinations(WHITE, pinned, 'c3'))).toEqual(new Set(['b2', 'd4', 'e5']))
    expect(new Set(destinations(WHITE, supported, 'c3'))).toEqual(new Set(['b2', 'd4', 'e5', 'f6']))
  })
  it('slides along a file or a rank pin, and cannot take an unsupported piece pinning it', () => {
    const file: SquareOccupant = {
      e1: { side: WHITE, piece: POPE },
      e4: { side: WHITE, piece: MARSHAL },
      e7: { side: BLACK, piece: SENTINEL },
      m13: { side: BLACK, piece: POPE }
    }
    const rank: SquareOccupant = {
      a5: { side: WHITE, piece: POPE },
      d5: { side: WHITE, piece: MARSHAL },
      f5: { side: BLACK, piece: SENTINEL },
      m13: { side: BLACK, piece: POPE }
    }
    expect(new Set(destinations(WHITE, file, 'e4'))).toEqual(new Set(['e2', 'e3', 'e5', 'e6']))
    expect(new Set(destinations(WHITE, rank, 'd5'))).toEqual(new Set(['b5', 'c5', 'e5']))
  })
})
describe('marshal in check', () => {
  const checked: SquareOccupant = {
    e4: { side: WHITE, piece: POPE },
    k4: { side: BLACK, piece: SENTINEL },
    m13: { side: BLACK, piece: POPE }
  }
  it('blocks a check by sliding into the line, and takes the checker only with support', () => {
    const occupancy: SquareOccupant = { ...checked, g8: { side: WHITE, piece: MARSHAL } }
    const supported: SquareOccupant = { ...occupancy, j3: { side: WHITE, piece: LEGIONARY } }
    expect(destinations(WHITE, occupancy, 'g8')).toEqual(['g4'])
    expect(new Set(destinations(WHITE, supported, 'g8'))).toEqual(new Set(['g4', 'k4']))
  })
  it('has no move in a double check, even onto a supported checker', () => {
    const occupancy: SquareOccupant = {
      e4: { side: WHITE, piece: POPE },
      g10: { side: WHITE, piece: MARSHAL },
      f6: { side: WHITE, piece: LEGIONARY },
      g7: { side: BLACK, piece: TEMPLAR },
      h7: { side: BLACK, piece: HERALD },
      m13: { side: BLACK, piece: POPE }
    }
    expect(setup(WHITE, occupancy).checkers).toHaveLength(2)
    expect(destinations(WHITE, occupancy, 'g10')).toEqual([])
  })
})
describe('marshal giving check', () => {
  const popes: SquareOccupant = {
    a1: { side: WHITE, piece: POPE },
    m13: { side: BLACK, piece: POPE }
  }
  it('checks along any line at any distance, with no support needed', () => {
    const file: SquareOccupant = { ...popes, m1: { side: WHITE, piece: MARSHAL } }
    const diagonal: SquareOccupant = { ...popes, b2: { side: WHITE, piece: MARSHAL } }
    expect(setup(BLACK, file).checkers).toEqual(['m1'])
    expect(setup(BLACK, diagonal).checkers).toEqual(['b2'])
  })
  it('gives no check through a piece on its line', () => {
    const blocked: SquareOccupant = {
      ...popes,
      m1: { side: WHITE, piece: MARSHAL },
      m7: { side: BLACK, piece: LEGIONARY }
    }
    expect(setup(BLACK, blocked).checkers).toEqual([])
  })
  it('checks while pinned, since a pin binds only its own moves', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      c3: { side: WHITE, piece: MARSHAL },
      f6: { side: BLACK, piece: HERALD },
      c13: { side: BLACK, piece: POPE }
    }
    expect(setup(BLACK, occupancy).checkers).toEqual(['c3'])
  })
})
describe('pope and marshal attacks', () => {
  it('cannot step onto any square on the lines of the enemy marshal, however far away', () => {
    const occupancy: SquareOccupant = {
      e4: { side: WHITE, piece: POPE },
      a5: { side: BLACK, piece: MARSHAL },
      m13: { side: BLACK, piece: POPE }
    }
    const squares = destinations(WHITE, occupancy, 'e4')
    expect(squares).not.toContain('d5')
    expect(squares).not.toContain('e5')
    expect(squares).not.toContain('f5')
    expect(squares).toContain('d4')
  })
  it('may not take a piece standing on the lines of the enemy marshal', () => {
    const occupancy: SquareOccupant = {
      e4: { side: WHITE, piece: POPE },
      d5: { side: BLACK, piece: TEMPLAR },
      e5: { side: BLACK, piece: TEMPLAR },
      e10: { side: BLACK, piece: MARSHAL },
      m13: { side: BLACK, piece: POPE }
    }
    const squares = destinations(WHITE, occupancy, 'e4')
    expect(squares).toContain('d5')
    expect(squares).not.toContain('e5')
  })
  it('cannot castle across a square on the lines of the enemy marshal', () => {
    const castle: SquareOccupant = {
      g1: { side: WHITE, piece: POPE },
      a1: { side: WHITE, piece: SENTINEL },
      e7: { side: BLACK, piece: MARSHAL },
      m13: { side: BLACK, piece: POPE }
    }
    const left: Partial<State> = {
      castlingSide: {
        [WHITE]: { left: true, right: false },
        [BLACK]: { left: false, right: false }
      }
    }
    expect(destinations(WHITE, castle, 'g1', left)).not.toContain('d1')
  })
})
describe('marshal riposte', () => {
  it('takes any enemy on its lines without support only while the riposte is armed', () => {
    const lines: SquareOccupant = {
      m1: { side: WHITE, piece: POPE },
      d4: { side: WHITE, piece: MARSHAL },
      d8: { side: BLACK, piece: HERALD },
      g4: { side: BLACK, piece: SENTINEL },
      l13: { side: BLACK, piece: POPE }
    }
    const armed: Partial<State> = { riposte: true }
    expect(destinations(WHITE, lines, 'd4')).not.toContain('d8')
    expect(destinations(WHITE, lines, 'd4')).not.toContain('g4')
    expect(destinations(WHITE, lines, 'd4', armed)).toContain('d8')
    expect(destinations(WHITE, lines, 'd4', armed)).toContain('g4')
  })
})
describe('marshal riposte in the worked example from the rules', () => {
  const board: SquareOccupant = {
    a1: { side: WHITE, piece: POPE },
    d4: { side: WHITE, piece: MARSHAL },
    d8: { side: WHITE, piece: LEGIONARY },
    m1: { side: WHITE, piece: TEMPLAR },
    g11: { side: BLACK, piece: HERALD },
    j4: { side: BLACK, piece: HERALD },
    g4: { side: BLACK, piece: SENTINEL },
    l13: { side: BLACK, piece: POPE }
  }
  const { match } = opening()
  const { state } = setup(BLACK, board)
  const onD8: Move = { from: 'g11', to: 'd8', captures: ['d8'] }
  const onM1: Move = { from: 'j4', to: 'm1', captures: ['m1'] }
  const riposte: Move = { from: 'd4', to: 'g4', captures: ['g4'] }
  it('lets the marshal take the herald on d8 or the sentinel on g4 after a capture on d8', () => {
    const armed = turn({ side: BLACK, occupancy: board, state, match }, onD8)
    expect(armed.moves).toContainEqual({ from: 'd4', to: 'd8', captures: ['d8'] })
    expect(armed.moves).toContainEqual(riposte)
  })
  it('leaves the sentinel on g4 needing support after a capture on m1', () => {
    const unarmed = turn({ side: BLACK, occupancy: board, state, match }, onM1)
    expect(unarmed.moves).not.toContainEqual(riposte)
  })
  it('loses the right unless the marshal uses it on the very next move', () => {
    const armed = turn({ side: BLACK, occupancy: board, state, match }, onD8)
    const reply = turn(armed.save, { from: 'a1', to: 'a2' })
    const waited = turn(reply.save, { from: 'l13', to: 'k13' })
    expect(waited.moves).not.toContainEqual(riposte)
  })
})
describe('marshal and the enemy emperor', () => {
  it('forbids taking the enemy marshal when the emperor it wakes would attack its own pope', () => {
    const occupancy: SquareOccupant = {
      a1: { side: BLACK, piece: POPE },
      c3: { side: WHITE, piece: EMPEROR, awake: false },
      i9: { side: WHITE, piece: MARSHAL },
      m13: { side: WHITE, piece: POPE },
      i12: { side: BLACK, piece: SENTINEL }
    }
    const shielded: SquareOccupant = { ...occupancy, b2: { side: BLACK, piece: SENTINEL } }
    expect(destinations(BLACK, occupancy, 'i12')).not.toContain('i9')
    expect(destinations(BLACK, shielded, 'i12')).toContain('i9')
  })
  it('forbids a marshal from taking the enemy marshal, even with support, when the emperor it wakes would attack its own pope', () => {
    const occupancy: SquareOccupant = {
      ...HANGING,
      h9: { side: BLACK, piece: MARSHAL },
      g6: { side: BLACK, piece: LEGIONARY }
    }
    const shielded: SquareOccupant = { ...occupancy, e3: { side: BLACK, piece: LEGIONARY } }
    expect(destinations(BLACK, occupancy, 'h9')).not.toContain('h5')
    expect(destinations(BLACK, shielded, 'h9')).toContain('h5')
  })
})
describe('emperor under a pin', () => {
  it('slides along a diagonal pin and takes the piece pinning it, needing no support', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      c3: { side: WHITE, piece: EMPEROR, awake: true },
      f6: { side: BLACK, piece: HERALD },
      m13: { side: BLACK, piece: POPE }
    }
    expect(new Set(destinations(WHITE, occupancy, 'c3'))).toEqual(new Set(['b2', 'd4', 'e5', 'f6']))
  })
  it('slides along a file or a rank pin and takes the piece pinning it', () => {
    const file: SquareOccupant = {
      e1: { side: WHITE, piece: POPE },
      e4: { side: WHITE, piece: EMPEROR, awake: true },
      e7: { side: BLACK, piece: SENTINEL },
      m13: { side: BLACK, piece: POPE }
    }
    const rank: SquareOccupant = {
      a5: { side: WHITE, piece: POPE },
      d5: { side: WHITE, piece: EMPEROR, awake: true },
      f5: { side: BLACK, piece: SENTINEL },
      m13: { side: BLACK, piece: POPE }
    }
    expect(new Set(destinations(WHITE, file, 'e4'))).toEqual(
      new Set(['e2', 'e3', 'e5', 'e6', 'e7'])
    )
    expect(new Set(destinations(WHITE, rank, 'd5'))).toEqual(new Set(['b5', 'c5', 'e5', 'f5']))
  })
})
describe('emperor in check', () => {
  const checked: SquareOccupant = {
    e4: { side: WHITE, piece: POPE },
    k4: { side: BLACK, piece: SENTINEL },
    m13: { side: BLACK, piece: POPE }
  }
  it('blocks a check or takes the checker once awake, and has no move while dormant', () => {
    const awake: SquareOccupant = { ...checked, g8: { side: WHITE, piece: EMPEROR, awake: true } }
    const dormant: SquareOccupant = {
      ...checked,
      g8: { side: WHITE, piece: EMPEROR, awake: false },
      a12: { side: WHITE, piece: MARSHAL }
    }
    expect(new Set(destinations(WHITE, awake, 'g8'))).toEqual(new Set(['g4', 'k4']))
    expect(destinations(WHITE, dormant, 'g8')).toEqual([])
  })
  it('has no move in a double check, even onto a checker', () => {
    const occupancy: SquareOccupant = {
      e4: { side: WHITE, piece: POPE },
      g10: { side: WHITE, piece: EMPEROR, awake: true },
      g7: { side: BLACK, piece: TEMPLAR },
      h7: { side: BLACK, piece: HERALD },
      m13: { side: BLACK, piece: POPE }
    }
    expect(setup(WHITE, occupancy).checkers).toHaveLength(2)
    expect(destinations(WHITE, occupancy, 'g10')).toEqual([])
  })
})
describe('emperor giving check', () => {
  const popes: SquareOccupant = {
    a1: { side: WHITE, piece: POPE },
    m13: { side: BLACK, piece: POPE }
  }
  it('checks along any line at any distance once awake, and gives no check while dormant', () => {
    const awake: SquareOccupant = { ...popes, m1: { side: WHITE, piece: EMPEROR, awake: true } }
    const dormant: SquareOccupant = { ...popes, m1: { side: WHITE, piece: EMPEROR, awake: false } }
    expect(setup(BLACK, awake).checkers).toEqual(['m1'])
    expect(setup(BLACK, dormant).checkers).toEqual([])
  })
  it('shields its own pope while dormant, since no capture can clear it', () => {
    const occupancy: SquareOccupant = {
      e1: { side: WHITE, piece: POPE },
      e2: { side: WHITE, piece: EMPEROR, awake: false },
      h1: { side: WHITE, piece: MARSHAL },
      e8: { side: BLACK, piece: SENTINEL },
      m13: { side: BLACK, piece: POPE }
    }
    expect(setup(WHITE, occupancy).checkers).toEqual([])
    expect(destinations(BLACK, occupancy, 'e8')).not.toContain('e2')
  })
})
describe('emperor capturing', () => {
  it('takes any enemy on its lines with no support needed', () => {
    const occupancy: SquareOccupant = {
      m1: { side: WHITE, piece: POPE },
      d4: { side: WHITE, piece: EMPEROR, awake: true },
      d8: { side: BLACK, piece: HERALD },
      l13: { side: BLACK, piece: POPE }
    }
    expect(destinations(WHITE, occupancy, 'd4')).toContain('d8')
  })
})
describe('pope and emperor attacks', () => {
  it('cannot step onto the lines of an awake enemy emperor, only onto those of a dormant one', () => {
    const awake: SquareOccupant = {
      e4: { side: WHITE, piece: POPE },
      a5: { side: BLACK, piece: EMPEROR, awake: true },
      m13: { side: BLACK, piece: POPE }
    }
    const dormant: SquareOccupant = {
      ...awake,
      a5: { side: BLACK, piece: EMPEROR, awake: false },
      l13: { side: BLACK, piece: MARSHAL }
    }
    expect(destinations(WHITE, awake, 'e4')).not.toContain('e5')
    expect(destinations(WHITE, dormant, 'e4')).toContain('e5')
  })
  it('may take an awake enemy emperor beside it, but never a dormant one', () => {
    const awake: SquareOccupant = {
      e4: { side: WHITE, piece: POPE },
      e5: { side: BLACK, piece: EMPEROR, awake: true },
      m13: { side: BLACK, piece: POPE }
    }
    const dormant: SquareOccupant = {
      ...awake,
      e5: { side: BLACK, piece: EMPEROR, awake: false },
      l13: { side: BLACK, piece: MARSHAL }
    }
    expect(destinations(WHITE, awake, 'e4')).toContain('e5')
    expect(destinations(WHITE, dormant, 'e4')).not.toContain('e5')
  })
})
describe('castling past an emperor', () => {
  it('cannot castle across the lines of an awake enemy emperor, but may past a dormant one', () => {
    const awake: SquareOccupant = {
      g1: { side: WHITE, piece: POPE },
      a1: { side: WHITE, piece: SENTINEL },
      e7: { side: BLACK, piece: EMPEROR, awake: true },
      m13: { side: BLACK, piece: POPE }
    }
    const dormant: SquareOccupant = {
      ...awake,
      e7: { side: BLACK, piece: EMPEROR, awake: false },
      l13: { side: BLACK, piece: MARSHAL }
    }
    const left: Partial<State> = {
      castlingSide: {
        [WHITE]: { left: true, right: false },
        [BLACK]: { left: false, right: false }
      }
    }
    expect(destinations(WHITE, awake, 'g1', left)).not.toContain('d1')
    expect(destinations(WHITE, dormant, 'g1', left)).toContain('d1')
  })
})
describe('emperor and the enemy emperor', () => {
  it('forbids an emperor move that wakes the enemy emperor onto its own pope', () => {
    const occupancy: SquareOccupant = {
      a1: { side: BLACK, piece: POPE },
      c3: { side: WHITE, piece: EMPEROR, awake: false },
      m12: { side: WHITE, piece: MARSHAL },
      m1: { side: WHITE, piece: POPE },
      i7: { side: BLACK, piece: EMPEROR, awake: true }
    }
    const shielded: SquareOccupant = { ...occupancy, b2: { side: BLACK, piece: SENTINEL } }
    expect(destinations(BLACK, occupancy, 'i7')).not.toContain('c7')
    expect(destinations(BLACK, shielded, 'i7')).toContain('c7')
  })
  it('forbids an emperor move that wakes the enemy emperor on a file or a rank to its own pope', () => {
    const [open, shielded] = onLines({ k8: { side: BLACK, piece: EMPEROR, awake: true } })
    for (const board of open) expect(destinations(BLACK, board, 'k8')).not.toContain('k5')
    for (const board of shielded) expect(destinations(BLACK, board, 'k8')).toContain('k5')
  })
  it('forbids an emperor from taking the enemy marshal when the emperor it wakes would attack its own pope', () => {
    const occupancy: SquareOccupant = {
      ...HANGING,
      k8: { side: BLACK, piece: EMPEROR, awake: true }
    }
    const shielded: SquareOccupant = { ...occupancy, e3: { side: BLACK, piece: LEGIONARY } }
    expect(destinations(BLACK, occupancy, 'k8')).not.toContain('h5')
    expect(destinations(BLACK, shielded, 'k8')).toContain('h5')
  })
})