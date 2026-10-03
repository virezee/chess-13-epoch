import type { Side, Piece, SquareOccupant } from '@/types/material'
import type { Move } from '@/types/game'
import { describe, it, expect } from 'vitest'
import { FILES, RANKS, CORNERS } from '@/constants/board'
import { WHITE, BLACK } from '@/constants/player'
import { EMPEROR, MAGE, HERALD } from '@/constants/piece'
import { parseSquare } from '../../lib/coordinate'
import { assassin } from './assassin'

const landings = (moves: Move[]): Set<string> => new Set(moves.map(({ to }) => to))
const kills = (moves: Move[]): Move[] => moves.filter(move => move.captures !== undefined)
const take = (from: string, victim: string, landing: string): Move => ({
  from,
  to: landing,
  captures: [victim]
})
const everySquare = (): string[] => FILES.flatMap(file => RANKS.map(rank => `${file}${rank}`))
const gap = (from: string, to: string): [number, number] => {
  const origin = parseSquare(from)
  const target = parseSquare(to)
  return [Math.abs(target.file - origin.file), Math.abs(target.rank - origin.rank)]
}
const crowd = (side: Side, squares: string[]): SquareOccupant =>
  Object.fromEntries(squares.map((square): [string, Piece] => [square, { side, piece: HERALD }]))
const VICTIMS = ['g9', 'i9', 'i7', 'i5', 'g5', 'e5', 'e7', 'e9']
const BEHIND = ['g10', 'j10', 'j7', 'j4', 'g4', 'd4', 'd7', 'd10']
describe('assassin quiet moves', () => {
  it('slides up to 6 tiles along each queen line when restricted', () => {
    expect(landings(assassin(WHITE, {}, 'a1', false))).toEqual(
      new Set([
        'a2',
        'a3',
        'a4',
        'a5',
        'a6',
        'a7',
        'b1',
        'c1',
        'd1',
        'e1',
        'f1',
        'g1',
        'b2',
        'c3',
        'd4',
        'e5',
        'f6',
        'g7'
      ])
    )
  })
  it('slides along the whole line when enhanced', () => {
    const squares = landings(assassin(WHITE, {}, 'a1', true))
    expect(squares.size).toBe(36)
    for (const square of ['a13', 'm1', 'm13']) expect(squares).toContain(square)
  })
  it('stops in front of its own piece, never jumping', () => {
    const occupancy: SquareOccupant = { a4: { side: WHITE, piece: MAGE } }
    const squares = landings(assassin(WHITE, occupancy, 'a1', true))
    expect(squares).toContain('a3')
    expect(squares).not.toContain('a4')
    expect(squares).not.toContain('a5')
  })
})
describe('assassin captures', () => {
  it('lands on the tile directly behind the victim, never on its square', () => {
    const occupancy: SquareOccupant = { g8: { side: BLACK, piece: HERALD } }
    const moves = assassin(WHITE, occupancy, 'g7', false)
    expect(kills(moves)).toEqual([take('g7', 'g8', 'g9')])
    expect(landings(moves)).not.toContain('g8')
  })
  it('captures along all 8 queen lines, for either side', () => {
    const white = kills(assassin(WHITE, crowd(BLACK, VICTIMS), 'g7', false))
    const black = kills(assassin(BLACK, crowd(WHITE, VICTIMS), 'g7', false))
    expect(white).toHaveLength(8)
    expect(landings(white)).toEqual(new Set(BEHIND))
    expect(black).toEqual(white)
  })
  it('needs an empty landing tile, blocked by any piece of either side', () => {
    const victim: SquareOccupant = { g9: { side: BLACK, piece: HERALD } }
    const blockers: Piece[] = [
      { side: WHITE, piece: MAGE },
      { side: BLACK, piece: MAGE },
      { side: BLACK, piece: EMPEROR }
    ]
    for (const blocker of blockers)
      expect(kills(assassin(WHITE, { ...victim, g10: blocker }, 'g7', true))).toEqual([])
  })
  it('counts the landing tile inside its range of 6 while restricted', () => {
    const five: SquareOccupant = { a6: { side: BLACK, piece: HERALD } }
    const six: SquareOccupant = { a7: { side: BLACK, piece: HERALD } }
    const far: SquareOccupant = { a12: { side: BLACK, piece: HERALD } }
    expect(kills(assassin(WHITE, five, 'a1', false))).toEqual([take('a1', 'a6', 'a7')])
    expect(kills(assassin(WHITE, six, 'a1', false))).toEqual([])
    expect(kills(assassin(WHITE, six, 'a1', true))).toEqual([take('a1', 'a7', 'a8')])
    expect(kills(assassin(WHITE, far, 'a1', true))).toEqual([take('a1', 'a12', 'a13')])
  })
  it('kills one piece a turn and goes no further along that line', () => {
    const occupancy: SquareOccupant = {
      g9: { side: BLACK, piece: HERALD },
      g11: { side: BLACK, piece: HERALD }
    }
    const moves = assassin(WHITE, occupancy, 'g7', true)
    expect(kills(moves)).toEqual([take('g7', 'g9', 'g10')])
    expect(landings(moves)).not.toContain('g11')
    expect(landings(moves)).not.toContain('g12')
  })
})
describe('assassin blocked on its line', () => {
  it('never captures its own piece', () => {
    const occupancy: SquareOccupant = { g9: { side: WHITE, piece: HERALD } }
    const squares = landings(assassin(WHITE, occupancy, 'g7', true))
    expect(squares).toContain('g8')
    expect(squares).not.toContain('g10')
  })
  it('never jumps its own piece to capture beyond it', () => {
    const victim: SquareOccupant = { a6: { side: BLACK, piece: HERALD } }
    const blocked: SquareOccupant = { ...victim, a4: { side: WHITE, piece: MAGE } }
    expect(kills(assassin(WHITE, victim, 'a1', true))).toEqual([take('a1', 'a6', 'a7')])
    expect(kills(assassin(WHITE, blocked, 'a1', true))).toEqual([])
  })
  it('cannot capture a dormant emperor, which still blocks the line, but captures an awake one', () => {
    const dormant: SquareOccupant = { g9: { side: BLACK, piece: EMPEROR } }
    const awake: SquareOccupant = { g9: { side: BLACK, piece: EMPEROR, awake: true } }
    expect(kills(assassin(WHITE, dormant, 'g7', true))).toEqual([])
    expect(landings(assassin(WHITE, dormant, 'g7', true))).not.toContain('g10')
    expect(kills(assassin(WHITE, awake, 'g7', true))).toEqual([take('g7', 'g9', 'g10')])
  })
})
describe('assassin at the edge', () => {
  it('cannot capture a piece on rank 13 from the front, or on file a along the rank', () => {
    const top: SquareOccupant = { g13: { side: BLACK, piece: HERALD } }
    const side: SquareOccupant = { a7: { side: BLACK, piece: HERALD } }
    expect(kills(assassin(WHITE, top, 'g7', true))).toEqual([])
    expect(kills(assassin(WHITE, side, 'g7', true))).toEqual([])
    expect(kills(assassin(WHITE, top, 'c13', true))).toEqual([take('c13', 'g13', 'h13')])
    expect(kills(assassin(WHITE, side, 'a3', true))).toEqual([take('a3', 'a7', 'a8')])
  })
  it('captures in every corner by taking the corner square itself', () => {
    for (const corner of CORNERS) {
      const occupancy: SquareOccupant = { [corner]: { side: BLACK, piece: HERALD } }
      expect(kills(assassin(WHITE, occupancy, 'g7', false))).toEqual([take('g7', corner, corner)])
    }
  })
  it('takes a corner along a file, a rank or a diagonal, 6 tiles away even while restricted', () => {
    const corner: SquareOccupant = { m13: { side: BLACK, piece: HERALD } }
    for (const from of ['m7', 'g13', 'h8'])
      expect(kills(assassin(WHITE, corner, from, false))).toEqual([take(from, 'm13', 'm13')])
  })
  it('never reaches past 6 tiles for a piece beside a corner while restricted', () => {
    const occupancy: SquareOccupant = { m12: { side: BLACK, piece: HERALD } }
    expect(kills(assassin(WHITE, occupancy, 'm6', false))).toEqual([])
    expect(kills(assassin(WHITE, occupancy, 'm7', false))).toEqual([take('m7', 'm12', 'm13')])
  })
  it('never wraps around to the far side of the board', () => {
    const squares = landings(assassin(WHITE, {}, 'a7', false))
    expect(squares.size).toBe(30)
    for (const square of squares) expect(parseSquare(square).file).toBeLessThanOrEqual(6)
  })
})
describe('assassin across the whole board', () => {
  it('only ever moves along a queen line, and never more than 6 tiles when restricted', () => {
    for (const from of everySquare())
      for (const { to } of assassin(WHITE, {}, from, false)) {
        const [file, rank] = gap(from, to)
        expect([0, Math.max(file, rank)]).toContain(Math.min(file, rank))
        expect(Math.max(file, rank)).toBeLessThanOrEqual(6)
      }
  })
  it('moves the same for white and black', () => {
    for (const from of everySquare())
      for (const isEnhanced of [false, true])
        expect(assassin(BLACK, {}, from, isEnhanced)).toEqual(assassin(WHITE, {}, from, isEnhanced))
  })
})