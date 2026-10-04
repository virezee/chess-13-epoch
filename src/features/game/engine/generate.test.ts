import type { SquareOccupant } from '@/types/material'
import type { Move } from '@/types/game'
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
import { isEnhanced, generate } from './generate'

const destinations = (moves: Move[]): string[] => moves.map(({ to }) => to)
const templarFrom = (square: string, marshal: string | null): string[] => {
  const occupancy: SquareOccupant = { [square]: { side: WHITE, piece: TEMPLAR } }
  const castling = { left: false, right: false }
  return destinations(generate(WHITE, TEMPLAR, occupancy, marshal, square, castling, [], null))
}
const legionaryFrom = (square: string, marshal: string | null): string[] => {
  const occupancy: SquareOccupant = { [square]: { side: WHITE, piece: LEGIONARY } }
  const castling = { left: false, right: false }
  return destinations(generate(WHITE, LEGIONARY, occupancy, marshal, square, castling, [], null))
}
const heraldFrom = (
  square: string,
  marshal: string | null,
  occupancy: SquareOccupant = {}
): string[] => {
  const board: SquareOccupant = { ...occupancy, [square]: { side: WHITE, piece: HERALD } }
  const castling = { left: false, right: false }
  return destinations(generate(WHITE, HERALD, board, marshal, square, castling, [], null))
}
const mageFrom = (
  square: string,
  marshal: string | null,
  occupancy: SquareOccupant = {}
): Move[] => {
  const board: SquareOccupant = { ...occupancy, [square]: { side: WHITE, piece: MAGE } }
  const castling = { left: false, right: false }
  return generate(WHITE, MAGE, board, marshal, square, castling, [], null)
}
const blasts = (moves: Move[]): Set<string>[] =>
  moves.filter(({ from, to }) => from === to).map(({ captures }) => new Set(captures))
const sentinelFrom = (
  square: string,
  marshal: string | null,
  occupancy: SquareOccupant = {}
): string[] => {
  const board: SquareOccupant = { ...occupancy, [square]: { side: WHITE, piece: SENTINEL } }
  const castling = { left: false, right: false }
  return destinations(generate(WHITE, SENTINEL, board, marshal, square, castling, [], null))
}
const assassinFrom = (
  square: string,
  marshal: string | null,
  occupancy: SquareOccupant = {}
): string[] => {
  const board: SquareOccupant = { ...occupancy, [square]: { side: WHITE, piece: ASSASSIN } }
  const castling = { left: false, right: false }
  return destinations(generate(WHITE, ASSASSIN, board, marshal, square, castling, [], null))
}
const emperorFrom = (square: string, marshal: string | null): string[] => {
  const occupancy: SquareOccupant = { [square]: { side: WHITE, piece: EMPEROR, awake: true } }
  const castling = { left: false, right: false }
  return destinations(generate(WHITE, EMPEROR, occupancy, marshal, square, castling, [], null))
}
const popeFrom = (square: string, marshal: string | null): string[] => {
  const occupancy: SquareOccupant = { [square]: { side: WHITE, piece: POPE } }
  const castling = { left: false, right: false }
  return destinations(generate(WHITE, POPE, occupancy, marshal, square, castling, [], null))
}
describe('command zone reach', () => {
  it('enhances pieces within 4 tiles of the marshal', () => {
    for (const square of ['h8', 'd8', 'h4', 'a1', 'd1', 'g7'])
      expect(isEnhanced('d4', square)).toBe(true)
  })
  it('restricts pieces 5 or more tiles away', () => {
    for (const square of ['i4', 'd9', 'i9', 'm13']) expect(isEnhanced('d4', square)).toBe(false)
  })
  it('enhances the whole army when the marshal stands on g7', () => {
    for (const square of ['a1', 'm1', 'a13', 'm13']) expect(isEnhanced('g7', square)).toBe(true)
  })
  it('restricts the whole army once the marshal is captured', () => {
    for (const square of ['a1', 'g7', 'd4']) expect(isEnhanced(null, square)).toBe(false)
  })
})
describe('command zone on the templar', () => {
  it('adds the short leap only inside the zone', () => {
    expect(templarFrom('g7', 'g8')).toHaveLength(16)
    expect(templarFrom('g7', 'g12')).toHaveLength(8)
    expect(templarFrom('g7', null)).toHaveLength(8)
  })
  it('judges the zone from the square the leap starts on', () => {
    expect(templarFrom('h8', 'd4')).toContain('j9')
    expect(templarFrom('i8', 'd4')).not.toContain('g7')
  })
})
describe('command zone on the legionary', () => {
  it('allows the two-tile step past the centre only inside the zone', () => {
    expect(legionaryFrom('e7', 'e5')).toEqual(['e8', 'e9'])
    expect(legionaryFrom('e7', 'k7')).toEqual(['e8'])
    expect(legionaryFrom('e7', null)).toEqual(['e8'])
  })
  it('judges the zone from the square the step starts on', () => {
    expect(legionaryFrom('e8', 'e4')).toEqual(['e9', 'e10'])
  })
})
describe('command zone on the herald', () => {
  const enemy: SquareOccupant = { g8: { side: BLACK, piece: MAGE } }
  it('slides past 6 tiles only inside the zone', () => {
    expect(heraldFrom('a1', 'c2')).toContain('m13')
    expect(heraldFrom('a1', 'm1')).not.toContain('h8')
    expect(heraldFrom('a1', null)).not.toContain('h8')
  })
  it('captures with the straight step only inside the zone', () => {
    expect(heraldFrom('g7', 'g5', enemy)).toContain('g8')
    expect(heraldFrom('g7', 'g12', enemy)).not.toContain('g8')
  })
  it('judges the zone from the square the move starts on', () => {
    expect(heraldFrom('e5', 'a1')).toContain('l12')
    expect(heraldFrom('f6', 'a1')).not.toContain('m13')
  })
})
describe('command zone on the mage', () => {
  const own: SquareOccupant = {
    f6: { side: WHITE, piece: LEGIONARY },
    g8: { side: BLACK, piece: MAGE }
  }
  const pope: SquareOccupant = {
    f6: { side: WHITE, piece: POPE },
    g8: { side: BLACK, piece: MAGE }
  }
  it('leaps 2 tiles only inside the zone', () => {
    expect(mageFrom('g7', 'g11')).toHaveLength(16)
    expect(mageFrom('g7', 'g12')).toHaveLength(8)
    expect(mageFrom('g7', null)).toHaveLength(8)
  })
  it('spares its own pieces and its own pope only inside the zone', () => {
    expect(blasts(mageFrom('g7', 'g11', own))).toEqual([new Set(['g8'])])
    expect(blasts(mageFrom('g7', 'g12', own))).toEqual([new Set(['f6', 'g8'])])
    expect(blasts(mageFrom('g7', 'g11', pope))).toEqual([new Set(['g8'])])
    expect(blasts(mageFrom('g7', null, pope))).toEqual([])
  })
  it('never destroys its own marshal, since a marshal in its ring puts it inside the zone', () => {
    const occupancy: SquareOccupant = {
      h8: { side: WHITE, piece: MARSHAL },
      g8: { side: BLACK, piece: MAGE }
    }
    expect(blasts(mageFrom('g7', 'h8', occupancy))).toEqual([new Set(['g8'])])
  })
  it('judges the zone from the square the move starts on', () => {
    expect(destinations(mageFrom('e5', 'a1'))).toContain('g7')
    expect(destinations(mageFrom('f6', 'a1'))).not.toContain('h8')
  })
})
describe('command zone on the sentinel', () => {
  const enemy: SquareOccupant = { a13: { side: BLACK, piece: MAGE } }
  const own: SquareOccupant = { a3: { side: WHITE, piece: MAGE } }
  it('moves 6 tiles only inside the zone', () => {
    expect(sentinelFrom('a1', 'c3')).toHaveLength(12)
    expect(sentinelFrom('a1', 'f6')).toHaveLength(6)
    expect(sentinelFrom('a1', null)).toHaveLength(6)
  })
  it('captures along the whole line only inside the zone', () => {
    expect(sentinelFrom('a1', 'c3', enemy)).toContain('a13')
    expect(sentinelFrom('a1', 'f6', enemy)).not.toContain('a13')
  })
  it('passes its own pieces toward the marshal only inside the zone', () => {
    expect(sentinelFrom('a1', 'c5', own)).toContain('a4')
    expect(sentinelFrom('a1', 'c6', own)).not.toContain('a4')
  })
  it('judges the zone from the square the move starts on', () => {
    expect(sentinelFrom('e5', 'a1')).toContain('e11')
    expect(sentinelFrom('f6', 'a1')).not.toContain('f10')
  })
})
describe('command zone on the assassin', () => {
  const victim: SquareOccupant = { a7: { side: BLACK, piece: MAGE } }
  it('slides along the whole line only inside the zone', () => {
    expect(assassinFrom('a1', 'c3')).toContain('a13')
    expect(assassinFrom('a1', 'f6')).not.toContain('a8')
    expect(assassinFrom('a1', null)).not.toContain('a8')
  })
  it('counts its landing inside the range of 6 only outside the zone', () => {
    expect(assassinFrom('a1', 'c3', victim)).toContain('a8')
    expect(assassinFrom('a1', 'f6', victim)).not.toContain('a8')
  })
  it('judges the zone from the square the move starts on', () => {
    expect(assassinFrom('e5', 'a1')).toContain('e13')
    expect(assassinFrom('f6', 'a1')).not.toContain('f13')
  })
})
describe('command zone on the emperor', () => {
  it('moves the same inside the zone, outside it, or with no marshal at all', () => {
    expect(emperorFrom('g7', 'g8')).toHaveLength(48)
    expect(emperorFrom('g7', 'a13')).toHaveLength(48)
    expect(emperorFrom('g7', null)).toHaveLength(48)
  })
})
describe('command zone on the pope', () => {
  it('moves the same inside the zone, outside it, or with no marshal at all', () => {
    expect(popeFrom('g7', 'g8')).toHaveLength(8)
    expect(popeFrom('g7', 'a13')).toHaveLength(8)
    expect(popeFrom('g7', null)).toHaveLength(8)
  })
})