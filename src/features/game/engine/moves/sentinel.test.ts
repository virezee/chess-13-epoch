import type { SquareOccupant } from '@/types/material'
import type { Move } from '@/types/game'
import { describe, it, expect } from 'vitest'
import { FILES, RANKS } from '@/constants/board'
import { WHITE, BLACK } from '@/constants/player'
import { EMPEROR, MARSHAL, MAGE, HERALD } from '@/constants/piece'
import { parseSquare } from '../../lib/coordinate'
import { sentinel } from './sentinel'

const landings = (moves: Move[]): Set<string> => new Set(moves.map(({ to }) => to))
const take = (from: string, to: string): Move => ({ from, to, captures: [to] })
const everySquare = (): string[] => FILES.flatMap(file => RANKS.map(rank => `${file}${rank}`))
const gap = (from: string, to: string): [number, number] => {
  const origin = parseSquare(from)
  const target = parseSquare(to)
  return [Math.abs(target.file - origin.file), Math.abs(target.rank - origin.rank)]
}
const SHORT = ['g8', 'g9', 'g10', 'h7', 'i7', 'j7', 'g6', 'g5', 'g4', 'f7', 'e7', 'd7']
const WALLED: SquareOccupant = {
  e6: { side: WHITE, piece: MAGE },
  f5: { side: WHITE, piece: MAGE },
  e4: { side: WHITE, piece: MAGE },
  d5: { side: WHITE, piece: MAGE }
}
describe('sentinel quiet moves', () => {
  it('moves up to 3 tiles along each straight line when restricted', () => {
    const moves = sentinel(WHITE, {}, 'g7', null, false)
    expect(moves).toHaveLength(12)
    expect(landings(moves)).toEqual(new Set(SHORT))
  })
  it('moves up to 6 tiles when enhanced, and never further without a capture', () => {
    expect(landings(sentinel(WHITE, {}, 'a1', null, true))).toEqual(
      new Set(['a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1'])
    )
  })
  it('stops at rank 7 from rank 1, and reaches rank 13 only onto an enemy', () => {
    const enemy: SquareOccupant = { e13: { side: BLACK, piece: HERALD } }
    const squares = landings(sentinel(WHITE, {}, 'e1', null, true))
    expect(squares).toContain('e7')
    expect(squares).not.toContain('e8')
    expect(squares).not.toContain('e13')
    expect(sentinel(WHITE, enemy, 'e1', null, true)).toContainEqual(take('e1', 'e13'))
  })
  it('moves plain distances, so it crosses the centre rank from rank 5 to rank 11', () => {
    expect(landings(sentinel(WHITE, {}, 'e5', null, true))).toContain('e11')
  })
})
describe('sentinel captures', () => {
  it('captures an enemy for either side, and never its own piece', () => {
    const white: SquareOccupant = { a4: { side: BLACK, piece: HERALD } }
    const black: SquareOccupant = { a4: { side: WHITE, piece: HERALD } }
    expect(sentinel(WHITE, white, 'a1', null, false)).toContainEqual(take('a1', 'a4'))
    expect(sentinel(BLACK, black, 'a1', null, false)).toContainEqual(take('a1', 'a4'))
    expect(landings(sentinel(BLACK, white, 'a1', null, false))).not.toContain('a4')
  })
  it('captures further than it moves, 6 tiles when restricted and the whole line when enhanced', () => {
    const six: SquareOccupant = { a7: { side: BLACK, piece: HERALD } }
    const seven: SquareOccupant = { a8: { side: BLACK, piece: HERALD } }
    const far: SquareOccupant = { a13: { side: BLACK, piece: HERALD } }
    expect(landings(sentinel(WHITE, six, 'a1', null, false))).toEqual(
      new Set(['a2', 'a3', 'a4', 'a7', 'b1', 'c1', 'd1'])
    )
    expect(landings(sentinel(WHITE, seven, 'a1', null, false))).not.toContain('a8')
    expect(sentinel(WHITE, far, 'a1', null, true)).toContainEqual(take('a1', 'a13'))
  })
  it('captures only the first piece in its way', () => {
    const occupancy: SquareOccupant = {
      a4: { side: BLACK, piece: HERALD },
      a6: { side: BLACK, piece: HERALD }
    }
    const moves = sentinel(WHITE, occupancy, 'a1', null, true)
    expect(moves).toContainEqual(take('a1', 'a4'))
    expect(landings(moves)).not.toContain('a6')
  })
  it('is blocked by any piece while restricted', () => {
    const own: SquareOccupant = { a3: { side: WHITE, piece: MAGE } }
    const enemy: SquareOccupant = { a3: { side: BLACK, piece: MAGE } }
    expect(landings(sentinel(WHITE, own, 'a1', null, false))).toEqual(
      new Set(['a2', 'b1', 'c1', 'd1'])
    )
    expect(landings(sentinel(WHITE, enemy, 'a1', null, false))).toEqual(
      new Set(['a2', 'a3', 'b1', 'c1', 'd1'])
    )
  })
})
describe('sentinel passing through its own pieces', () => {
  it('passes them only in the directions that close on the marshal, as in the rules with h8', () => {
    const occupancy: SquareOccupant = { ...WALLED, h8: { side: WHITE, piece: MARSHAL } }
    expect(landings(sentinel(WHITE, occupancy, 'e5', 'h8', true))).toEqual(
      new Set(['e7', 'e8', 'e9', 'e10', 'e11', 'g5', 'h5', 'i5', 'j5', 'k5'])
    )
  })
  it('loses both vertical directions to a marshal on its rank, both horizontal to one on its file', () => {
    const rank: SquareOccupant = { ...WALLED, h5: { side: WHITE, piece: MARSHAL } }
    const file: SquareOccupant = { ...WALLED, e8: { side: WHITE, piece: MARSHAL } }
    expect(landings(sentinel(WHITE, rank, 'e5', 'h5', true))).toEqual(
      new Set(['g5', 'i5', 'j5', 'k5'])
    )
    expect(landings(sentinel(WHITE, file, 'e5', 'e8', true))).toEqual(
      new Set(['e7', 'e9', 'e10', 'e11'])
    )
  })
  it('passes any number of its own pieces, the marshal included, and goes on beyond it', () => {
    const stack: SquareOccupant = {
      e2: { side: WHITE, piece: MAGE },
      e3: { side: WHITE, piece: MAGE },
      e4: { side: WHITE, piece: MARSHAL }
    }
    const squares = landings(sentinel(WHITE, stack, 'e1', 'e4', true))
    for (const square of ['e5', 'e6', 'e7']) expect(squares).toContain(square)
    for (const square of ['e2', 'e3', 'e4', 'e8']) expect(squares).not.toContain(square)
  })
})
describe('sentinel limits on passing through', () => {
  it('never captures once it has passed through, and stops at the first enemy', () => {
    const occupancy: SquareOccupant = {
      e6: { side: WHITE, piece: MAGE },
      e8: { side: BLACK, piece: HERALD },
      h8: { side: WHITE, piece: MARSHAL }
    }
    const squares = landings(sentinel(WHITE, occupancy, 'e5', 'h8', true))
    expect(squares).toContain('e7')
    expect(squares).not.toContain('e8')
    expect(squares).not.toContain('e9')
  })
  it('never passes through while restricted, or once its marshal is captured', () => {
    const occupancy: SquareOccupant = { e6: { side: WHITE, piece: MAGE } }
    expect(landings(sentinel(WHITE, occupancy, 'e5', 'h8', false))).not.toContain('e7')
    expect(landings(sentinel(WHITE, occupancy, 'e5', null, true))).not.toContain('e7')
  })
})
describe('sentinel and the dormant emperor', () => {
  it('cannot capture a dormant emperor, which still blocks the line', () => {
    const dormant: SquareOccupant = { e8: { side: BLACK, piece: EMPEROR } }
    const awake: SquareOccupant = { e8: { side: BLACK, piece: EMPEROR, awake: true } }
    const squares = landings(sentinel(WHITE, dormant, 'e5', null, true))
    expect(squares).not.toContain('e8')
    expect(squares).not.toContain('e9')
    expect(sentinel(WHITE, awake, 'e5', null, true)).toContainEqual(take('e5', 'e8'))
  })
  it('passes its own dormant emperor like any other of its own pieces', () => {
    const occupancy: SquareOccupant = {
      e6: { side: WHITE, piece: EMPEROR },
      h8: { side: WHITE, piece: MARSHAL }
    }
    expect(landings(sentinel(WHITE, occupancy, 'e5', 'h8', true))).toContain('e7')
  })
})
describe('sentinel at the edge', () => {
  it('keeps to the board from a corner', () => {
    expect(landings(sentinel(WHITE, {}, 'm13', null, false))).toEqual(
      new Set(['m12', 'm11', 'm10', 'l13', 'k13', 'j13'])
    )
  })
  it('never wraps around to the far side of the board', () => {
    const occupancy: SquareOccupant = { m7: { side: BLACK, piece: HERALD } }
    expect(landings(sentinel(WHITE, occupancy, 'a7', null, false))).toEqual(
      new Set(['a8', 'a9', 'a10', 'a6', 'a5', 'a4', 'b7', 'c7', 'd7'])
    )
  })
})
describe('sentinel across the whole board', () => {
  it('only ever moves along a file or a rank, and never more than 3 tiles when restricted', () => {
    for (const from of everySquare())
      for (const { to } of sentinel(WHITE, {}, from, null, false)) {
        const [file, rank] = gap(from, to)
        expect(Math.min(file, rank)).toBe(0)
        expect(Math.max(file, rank)).toBeLessThanOrEqual(3)
      }
  })
  it('never moves more than 6 tiles without capturing when enhanced', () => {
    for (const from of everySquare())
      for (const { to } of sentinel(WHITE, {}, from, null, true))
        expect(Math.max(...gap(from, to))).toBeLessThanOrEqual(6)
  })
  it('moves the same for white and black', () => {
    for (const from of everySquare())
      for (const isEnhanced of [false, true])
        expect(sentinel(BLACK, {}, from, null, isEnhanced)).toEqual(
          sentinel(WHITE, {}, from, null, isEnhanced)
        )
  })
})