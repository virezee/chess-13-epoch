import type { Side, Piece, SquareOccupant } from '@/types/material'
import type { Move } from '@/types/game'
import { describe, it, expect } from 'vitest'
import { FILES, RANKS } from '@/constants/board'
import { WHITE, BLACK } from '@/constants/player'
import { EMPEROR, MAGE, HERALD } from '@/constants/piece'
import { parseSquare } from '../../lib/coordinate'
import { templar } from './templar'

const landings = (moves: Move[]): Set<string> => new Set(moves.map(({ to }) => to))
const everySquare = (): string[] => FILES.flatMap(file => RANKS.map(rank => `${file}${rank}`))
const shape = (from: string, to: string): string => {
  const origin = parseSquare(from)
  const target = parseSquare(to)
  return [Math.abs(target.file - origin.file), Math.abs(target.rank - origin.rank)]
    .toSorted((a, b) => a - b)
    .join('')
}
const colour = (square: string): number => {
  const { file, rank } = parseSquare(square)
  return (file + rank) % 2
}
const crowd = (side: Side): SquareOccupant =>
  Object.fromEntries(
    ['e', 'f', 'g', 'h', 'i']
      .flatMap(file => [5, 6, 7, 8, 9].map(rank => `${file}${rank}`))
      .filter(square => square !== 'g7')
      .map((square): [string, Piece] => [square, { side, piece: MAGE }])
  )
const LONG = ['i10', 'j9', 'j5', 'i4', 'e4', 'd5', 'd9', 'e10']
const SHORT = ['h9', 'i8', 'i6', 'h5', 'f5', 'e6', 'e8', 'f9']
describe('templar leaps', () => {
  it('has the 8 long leaps of 3 and 2 when restricted', () => {
    const moves = templar(WHITE, {}, 'g7', false)
    expect(moves).toHaveLength(8)
    expect(landings(moves)).toEqual(new Set(LONG))
  })
  it('keeps the long leaps and gains the 8 short leaps of 2 and 1 when enhanced', () => {
    const moves = templar(WHITE, {}, 'g7', true)
    expect(moves).toHaveLength(16)
    expect(landings(moves)).toEqual(new Set([...LONG, ...SHORT]))
  })
})
describe('templar across the whole board', () => {
  it('only ever leaps 3 and 2, or 2 and 1 when enhanced, and always changes colour', () => {
    for (const from of everySquare()) {
      for (const { to } of templar(WHITE, {}, from, false)) {
        expect(shape(from, to)).toBe('23')
        expect(colour(to)).not.toBe(colour(from))
      }
      for (const { to } of templar(WHITE, {}, from, true)) {
        expect(['12', '23']).toContain(shape(from, to))
        expect(colour(to)).not.toBe(colour(from))
      }
    }
  })
  it('moves the same for white and black', () => {
    for (const from of everySquare())
      for (const isEnhanced of [false, true])
        expect(templar(BLACK, {}, from, isEnhanced)).toEqual(templar(WHITE, {}, from, isEnhanced))
  })
})
describe('templar jumping', () => {
  it('leaps over any crowd of its own pieces', () => {
    expect(landings(templar(WHITE, crowd(WHITE), 'g7', false))).toEqual(new Set(LONG))
  })
  it('captures nothing it jumps over', () => {
    const moves = templar(WHITE, crowd(BLACK), 'g7', false)
    expect(landings(moves)).toEqual(new Set(LONG))
    for (const move of moves) expect(move).not.toHaveProperty('captures')
  })
  it('captures only the piece on the square it lands on', () => {
    const captures = templar(WHITE, crowd(BLACK), 'g7', true).filter(
      move => move.captures !== undefined
    )
    expect(landings(captures)).toEqual(new Set(SHORT))
    for (const move of captures) expect(move.captures).toEqual([move.to])
  })
})
describe('templar landing', () => {
  it('captures an enemy on a landing square', () => {
    const occupancy: SquareOccupant = { i10: { side: BLACK, piece: HERALD } }
    const moves = templar(WHITE, occupancy, 'g7', false)
    expect(moves).toHaveLength(8)
    expect(moves).toContainEqual({ from: 'g7', to: 'i10', captures: ['i10'] })
  })
  it('cannot enter a square held by its own piece', () => {
    const occupancy: SquareOccupant = { i10: { side: WHITE, piece: HERALD } }
    const moves = templar(WHITE, occupancy, 'g7', false)
    expect(moves).toHaveLength(7)
    expect(landings(moves)).not.toContain('i10')
  })
  it('cannot capture a dormant emperor but can capture an awake one', () => {
    const dormant: SquareOccupant = { i10: { side: BLACK, piece: EMPEROR } }
    const awake: SquareOccupant = { i10: { side: BLACK, piece: EMPEROR, awake: true } }
    expect(landings(templar(WHITE, dormant, 'g7', false))).not.toContain('i10')
    expect(templar(WHITE, awake, 'g7', false)).toContainEqual({
      from: 'g7',
      to: 'i10',
      captures: ['i10']
    })
  })
})
describe('templar at the edge', () => {
  it('keeps 2 leaps restricted and 4 enhanced in a corner', () => {
    expect(landings(templar(WHITE, {}, 'a1', false))).toEqual(new Set(['c4', 'd3']))
    expect(landings(templar(WHITE, {}, 'a1', true))).toEqual(new Set(['c4', 'd3', 'b3', 'c2']))
    expect(landings(templar(WHITE, {}, 'm13', false))).toEqual(new Set(['k10', 'j11']))
  })
  it('never wraps around to the far side of the board', () => {
    expect(landings(templar(WHITE, {}, 'a7', false))).toEqual(new Set(['c10', 'd9', 'd5', 'c4']))
    expect(landings(templar(WHITE, {}, 'm7', false))).toEqual(new Set(['k10', 'j9', 'j5', 'k4']))
  })
})