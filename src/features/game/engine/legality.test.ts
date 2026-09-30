import type { Side, SquareOccupant } from '@/types/material'
import type { Move, State, Position } from '@/types/game'
import { describe, it, expect } from 'vitest'
import { WHITE, BLACK } from '@/constants/player'
import { POPE, EMPEROR, MARSHAL, SENTINEL, HERALD, TEMPLAR, LEGIONARY } from '@/constants/piece'
import { opening } from './opening'
import { position } from './position'
import { legality } from './legality'
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