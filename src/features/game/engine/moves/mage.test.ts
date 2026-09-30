import type { Side, Piece, SquareOccupant } from '@/types/material'
import type { Move } from '@/types/game'
import { describe, it, expect } from 'vitest'
import { FILES, RANKS } from '@/constants/board'
import { WHITE, BLACK } from '@/constants/player'
import { POPE, EMPEROR, MAGE, HERALD, LEGIONARY } from '@/constants/piece'
import { parseSquare } from '../../lib/coordinate'
import { mage } from './mage'

const landings = (moves: Move[]): Set<string> =>
  new Set(moves.filter(({ from, to }) => from !== to).map(({ to }) => to))
const blasts = (moves: Move[]): Set<string>[] =>
  moves.filter(({ from, to }) => from === to).map(({ captures }) => new Set(captures))
const everySquare = (): string[] => FILES.flatMap(file => RANKS.map(rank => `${file}${rank}`))
const gap = (from: string, to: string): [number, number] => {
  const origin = parseSquare(from)
  const target = parseSquare(to)
  return [Math.abs(target.file - origin.file), Math.abs(target.rank - origin.rank)]
}
const RING = ['f6', 'f7', 'f8', 'g6', 'g8', 'h6', 'h7', 'h8']
const LEAPS = ['e5', 'e7', 'e9', 'g5', 'g9', 'i5', 'i7', 'i9']
const crowd = (side: Side, squares: string[] = RING): SquareOccupant =>
  Object.fromEntries(squares.map((square): [string, Piece] => [square, { side, piece: HERALD }]))
describe('mage steps', () => {
  it('steps one tile in each of the 8 directions when restricted', () => {
    const moves = mage(WHITE, {}, 'g7', false)
    expect(moves).toHaveLength(8)
    expect(landings(moves)).toEqual(new Set(RING))
  })
  it('adds a 2-tile leap along each of the 8 lines when enhanced', () => {
    const moves = mage(WHITE, {}, 'g7', true)
    expect(moves).toHaveLength(16)
    expect(landings(moves)).toEqual(new Set([...RING, ...LEAPS]))
  })
  it('leaps over its own pieces and enemy ones, capturing nothing on the way', () => {
    const own = mage(WHITE, crowd(WHITE), 'g7', true)
    const enemy = mage(WHITE, crowd(BLACK), 'g7', true)
    expect(landings(own)).toEqual(new Set(LEAPS))
    expect(landings(enemy)).toEqual(new Set(LEAPS))
    expect(enemy.filter(({ captures }) => captures !== undefined)).toHaveLength(1)
  })
  it('lands only on an empty square', () => {
    const occupancy: SquareOccupant = {
      g8: { side: BLACK, piece: HERALD },
      i9: { side: WHITE, piece: HERALD }
    }
    const squares = landings(mage(WHITE, occupancy, 'g7', true))
    expect(squares).not.toContain('g8')
    expect(squares).not.toContain('i9')
  })
})
describe('mage blast', () => {
  it('blasts in place for either side and stays on its square', () => {
    const white: SquareOccupant = { h8: { side: BLACK, piece: HERALD } }
    const black: SquareOccupant = { h8: { side: WHITE, piece: HERALD } }
    const blast: Move = { from: 'g7', to: 'g7', captures: ['h8'] }
    expect(mage(WHITE, white, 'g7', false)).toContainEqual(blast)
    expect(mage(BLACK, black, 'g7', false)).toContainEqual(blast)
  })
  it('blasts the 8 tiles the rules list around b2', () => {
    const ring = ['a1', 'a2', 'a3', 'b3', 'c3', 'c2', 'c1', 'b1']
    expect(blasts(mage(WHITE, crowd(BLACK, ring), 'b2', false))).toEqual([new Set(ring)])
  })
  it('destroys every enemy around it, and nothing 2 tiles away even when enhanced', () => {
    const occupancy: SquareOccupant = {
      f6: { side: BLACK, piece: HERALD },
      g8: { side: BLACK, piece: LEGIONARY },
      e5: { side: BLACK, piece: HERALD },
      g9: { side: BLACK, piece: LEGIONARY }
    }
    expect(blasts(mage(WHITE, occupancy, 'g7', false))).toEqual([new Set(['f6', 'g8'])])
    expect(blasts(mage(WHITE, occupancy, 'g7', true))).toEqual([new Set(['f6', 'g8'])])
  })
  it('destroys its own pieces as well while restricted, and spares them when enhanced', () => {
    const occupancy: SquareOccupant = {
      h8: { side: BLACK, piece: HERALD },
      f6: { side: WHITE, piece: LEGIONARY },
      g8: { side: WHITE, piece: MAGE }
    }
    expect(blasts(mage(WHITE, occupancy, 'g7', false))).toEqual([new Set(['h8', 'f6', 'g8'])])
    expect(blasts(mage(WHITE, occupancy, 'g7', true))).toEqual([new Set(['h8'])])
  })
  it('needs an enemy in the ring, so an empty ring or one of its own pieces gives no blast', () => {
    const own: SquareOccupant = { f6: { side: WHITE, piece: LEGIONARY } }
    expect(blasts(mage(WHITE, {}, 'g7', false))).toEqual([])
    expect(blasts(mage(WHITE, own, 'g7', false))).toEqual([])
    expect(blasts(mage(WHITE, own, 'g7', true))).toEqual([])
  })
  it('may not blast its own pope while restricted, and spares it when enhanced', () => {
    const occupancy: SquareOccupant = {
      h8: { side: BLACK, piece: HERALD },
      f6: { side: WHITE, piece: POPE }
    }
    expect(blasts(mage(WHITE, occupancy, 'g7', false))).toEqual([])
    expect(blasts(mage(WHITE, occupancy, 'g7', true))).toEqual([new Set(['h8'])])
  })
})
describe('mage and the dormant emperor', () => {
  it('leaves a dormant emperor standing, whichever side it belongs to', () => {
    const occupancy: SquareOccupant = {
      h8: { side: BLACK, piece: HERALD },
      f6: { side: WHITE, piece: EMPEROR },
      g8: { side: BLACK, piece: EMPEROR }
    }
    expect(blasts(mage(WHITE, occupancy, 'g7', false))).toEqual([new Set(['h8'])])
  })
  it('cannot blast a ring whose only enemy is a dormant emperor', () => {
    const dormant: SquareOccupant = { g8: { side: BLACK, piece: EMPEROR } }
    const awake: SquareOccupant = { g8: { side: BLACK, piece: EMPEROR, awake: true } }
    expect(blasts(mage(WHITE, dormant, 'g7', true))).toEqual([])
    expect(blasts(mage(WHITE, awake, 'g7', true))).toEqual([new Set(['g8'])])
  })
  it('destroys an awake emperor of its own side while restricted', () => {
    const occupancy: SquareOccupant = {
      h8: { side: BLACK, piece: HERALD },
      f6: { side: WHITE, piece: EMPEROR, awake: true }
    }
    expect(blasts(mage(WHITE, occupancy, 'g7', false))).toEqual([new Set(['h8', 'f6'])])
  })
})
describe('mage at the edge', () => {
  it('keeps to the board from a corner', () => {
    expect(landings(mage(WHITE, {}, 'a1', false))).toEqual(new Set(['a2', 'b1', 'b2']))
    expect(landings(mage(WHITE, {}, 'm13', true))).toEqual(
      new Set(['l12', 'l13', 'm12', 'k11', 'k13', 'm11'])
    )
  })
  it('never wraps around to the far side of the board', () => {
    const occupancy: SquareOccupant = {
      m6: { side: BLACK, piece: HERALD },
      m8: { side: BLACK, piece: HERALD }
    }
    const moves = mage(WHITE, occupancy, 'a7', true)
    expect(landings(moves)).toEqual(
      new Set(['a6', 'a8', 'b6', 'b7', 'b8', 'a5', 'a9', 'c5', 'c7', 'c9'])
    )
    expect(blasts(moves)).toEqual([])
  })
})
describe('mage across the whole board', () => {
  it('only ever moves 1 tile when restricted', () => {
    for (const from of everySquare())
      for (const { to } of mage(WHITE, {}, from, false)) expect(Math.max(...gap(from, to))).toBe(1)
  })
  it('only ever moves along a line, and never more than 2 tiles when enhanced', () => {
    for (const from of everySquare())
      for (const { to } of mage(WHITE, {}, from, true)) {
        const [file, rank] = gap(from, to)
        expect([0, Math.max(file, rank)]).toContain(Math.min(file, rank))
        expect(Math.max(file, rank)).toBeLessThanOrEqual(2)
      }
  })
  it('moves the same for white and black', () => {
    for (const from of everySquare())
      for (const isEnhanced of [false, true])
        expect(mage(BLACK, {}, from, isEnhanced)).toEqual(mage(WHITE, {}, from, isEnhanced))
  })
})