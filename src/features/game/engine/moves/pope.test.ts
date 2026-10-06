import type { SquareOccupant } from '@/types/material'
import type { Move, CastlingSide } from '@/types/game'
import { describe, it, expect } from 'vitest'
import { FILES, RANKS } from '@/constants/board'
import { WHITE, BLACK } from '@/constants/player'
import { EMPEROR, SENTINEL, HERALD, TEMPLAR } from '@/constants/piece'
import { parseSquare } from '../../lib/coordinate'
import { pope } from './pope'

const landings = (moves: Move[]): Set<string> => new Set(moves.map(({ to }) => to))
const castlings = (moves: Move[]): Move[] => moves.filter(({ sentinel }) => sentinel !== undefined)
const take = (from: string, to: string): Move => ({ from, to, captures: [to] })
const everySquare = (): string[] => FILES.flatMap(file => RANKS.map(rank => `${file}${rank}`))
const gap = (from: string, to: string): [number, number] => {
  const origin = parseSquare(from)
  const target = parseSquare(to)
  return [Math.abs(target.file - origin.file), Math.abs(target.rank - origin.rank)]
}
const NONE: CastlingSide = { left: false, right: false }
const BOTH: CastlingSide = { left: true, right: true }
const RING = ['f6', 'f7', 'f8', 'g6', 'g8', 'h6', 'h7', 'h8']
const LEFT: Move = { from: 'g1', to: 'd1', sentinel: { from: 'a1', to: 'e1' } }
const RIGHT: Move = { from: 'g1', to: 'j1', sentinel: { from: 'm1', to: 'i1' } }
const WINGS: SquareOccupant = {
  a1: { side: WHITE, piece: SENTINEL },
  m1: { side: WHITE, piece: SENTINEL }
}
describe('pope steps', () => {
  it('steps one tile in each of the 8 directions', () => {
    const moves = pope(WHITE, {}, 'g7', NONE)
    expect(moves).toHaveLength(8)
    expect(landings(moves)).toEqual(new Set(RING))
  })
  it('captures an enemy for either side, and never its own piece', () => {
    const white: SquareOccupant = { h8: { side: BLACK, piece: HERALD } }
    const black: SquareOccupant = { h8: { side: WHITE, piece: HERALD } }
    expect(pope(WHITE, white, 'g7', NONE)).toContainEqual(take('g7', 'h8'))
    expect(pope(BLACK, black, 'g7', NONE)).toContainEqual(take('g7', 'h8'))
    expect(landings(pope(BLACK, white, 'g7', NONE))).not.toContain('h8')
  })
  it('cannot capture a dormant emperor but can capture an awake one', () => {
    const dormant: SquareOccupant = { h8: { side: BLACK, piece: EMPEROR } }
    const awake: SquareOccupant = { h8: { side: BLACK, piece: EMPEROR, awake: true } }
    expect(landings(pope(WHITE, dormant, 'g7', NONE))).not.toContain('h8')
    expect(pope(WHITE, awake, 'g7', NONE)).toContainEqual(take('g7', 'h8'))
  })
})
describe('pope castling', () => {
  it('castles from g1 to d1 with the sentinel from a1 to e1, or to j1 with it from m1 to i1', () => {
    expect(castlings(pope(WHITE, WINGS, 'g1', BOTH))).toEqual([LEFT, RIGHT])
  })
  it('castles for black from g13 to d13 or j13', () => {
    const wings: SquareOccupant = {
      a13: { side: BLACK, piece: SENTINEL },
      m13: { side: BLACK, piece: SENTINEL }
    }
    expect(castlings(pope(BLACK, wings, 'g13', BOTH))).toEqual([
      { from: 'g13', to: 'd13', sentinel: { from: 'a13', to: 'e13' } },
      { from: 'g13', to: 'j13', sentinel: { from: 'm13', to: 'i13' } }
    ])
  })
  it('castles only on a wing whose right it still holds', () => {
    expect(castlings(pope(WHITE, WINGS, 'g1', { left: true, right: false }))).toEqual([LEFT])
    expect(castlings(pope(WHITE, WINGS, 'g1', { left: false, right: true }))).toEqual([RIGHT])
    expect(castlings(pope(WHITE, WINGS, 'g1', NONE))).toEqual([])
  })
})
describe('pope castling limits', () => {
  it('castles only from its own home square', () => {
    const away: SquareOccupant = {
      a13: { side: WHITE, piece: SENTINEL },
      m13: { side: WHITE, piece: SENTINEL }
    }
    expect(castlings(pope(WHITE, WINGS, 'f1', BOTH))).toEqual([])
    expect(castlings(pope(WHITE, away, 'g13', BOTH))).toEqual([])
  })
  it('castles only with its own sentinel standing on the corner', () => {
    const templar: SquareOccupant = { ...WINGS, a1: { side: WHITE, piece: TEMPLAR } }
    const enemy: SquareOccupant = { ...WINGS, m1: { side: BLACK, piece: SENTINEL } }
    expect(castlings(pope(WHITE, templar, 'g1', BOTH))).toEqual([RIGHT])
    expect(castlings(pope(WHITE, enemy, 'g1', BOTH))).toEqual([LEFT])
  })
  it('needs every square between the pope and the sentinel empty, even those it never crosses', () => {
    const left: SquareOccupant = { ...WINGS, b1: { side: WHITE, piece: HERALD } }
    const right: SquareOccupant = { ...WINGS, l1: { side: BLACK, piece: HERALD } }
    expect(castlings(pope(WHITE, left, 'g1', BOTH))).toEqual([RIGHT])
    expect(castlings(pope(WHITE, right, 'g1', BOTH))).toEqual([LEFT])
  })
})
describe('pope at the edge', () => {
  it('keeps to the board from a corner', () => {
    expect(landings(pope(WHITE, {}, 'a1', NONE))).toEqual(new Set(['a2', 'b1', 'b2']))
    expect(landings(pope(WHITE, {}, 'm13', NONE))).toEqual(new Set(['l13', 'l12', 'm12']))
  })
  it('never wraps around to the far side of the board', () => {
    expect(landings(pope(WHITE, {}, 'a7', NONE))).toEqual(new Set(['a6', 'a8', 'b6', 'b7', 'b8']))
  })
})
describe('pope across the whole board', () => {
  it('only ever moves 1 tile', () => {
    for (const from of everySquare())
      for (const { to } of pope(WHITE, {}, from, NONE)) expect(Math.max(...gap(from, to))).toBe(1)
  })
  it('moves the same for white and black', () => {
    for (const from of everySquare())
      expect(pope(BLACK, {}, from, NONE)).toEqual(pope(WHITE, {}, from, NONE))
  })
})