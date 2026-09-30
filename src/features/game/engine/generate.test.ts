import type { SquareOccupant } from '@/types/material'
import type { Move } from '@/types/game'
import { describe, it, expect } from 'vitest'
import { WHITE, BLACK } from '@/constants/player'
import { POPE, MARSHAL, MAGE, HERALD, TEMPLAR, LEGIONARY } from '@/constants/piece'
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