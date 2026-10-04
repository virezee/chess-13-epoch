import type { SquareOccupant } from '@/types/material'
import type { Move } from '@/types/game'
import { describe, it, expect } from 'vitest'
import { FILES, RANKS } from '@/constants/board'
import { WHITE, BLACK } from '@/constants/player'
import { EMPEROR, ASSASSIN, MAGE, HERALD, LEGIONARY } from '@/constants/piece'
import { parseSquare } from '../../lib/coordinate'
import { riposteSquares, marshal } from './marshal'

const landings = (moves: Move[]): Set<string> => new Set(moves.map(({ to }) => to))
const take = (from: string, to: string): Move => ({ from, to, captures: [to] })
const everySquare = (): string[] => FILES.flatMap(file => RANKS.map(rank => `${file}${rank}`))
const gap = (from: string, to: string): [number, number] => {
  const origin = parseSquare(from)
  const target = parseSquare(to)
  return [Math.abs(target.file - origin.file), Math.abs(target.rank - origin.rank)]
}
describe('marshal quiet moves', () => {
  it('slides along all 8 queen lines to the edge of the board', () => {
    const squares = landings(marshal(WHITE, {}, 'g7'))
    expect(squares.size).toBe(48)
    for (const square of ['g1', 'g13', 'a7', 'm7', 'a1', 'm13', 'a13', 'm1'])
      expect(squares).toContain(square)
  })
  it('stops in front of its own piece, never jumping', () => {
    const occupancy: SquareOccupant = { a4: { side: WHITE, piece: MAGE } }
    const squares = landings(marshal(WHITE, occupancy, 'a1'))
    expect(squares).toContain('a3')
    expect(squares).not.toContain('a4')
    expect(squares).not.toContain('a5')
  })
})
describe('marshal captures', () => {
  it('captures an enemy for either side, and never its own piece', () => {
    const white: SquareOccupant = { a4: { side: BLACK, piece: HERALD } }
    const black: SquareOccupant = { a4: { side: WHITE, piece: HERALD } }
    expect(marshal(WHITE, white, 'a1')).toContainEqual(take('a1', 'a4'))
    expect(marshal(BLACK, black, 'a1')).toContainEqual(take('a1', 'a4'))
    expect(landings(marshal(BLACK, white, 'a1'))).not.toContain('a4')
  })
  it('reaches a capture at any distance along a line', () => {
    const occupancy: SquareOccupant = { m13: { side: BLACK, piece: HERALD } }
    expect(marshal(WHITE, occupancy, 'a1')).toContainEqual(take('a1', 'm13'))
  })
  it('captures only the first piece in its way', () => {
    const occupancy: SquareOccupant = {
      a4: { side: BLACK, piece: HERALD },
      a6: { side: BLACK, piece: HERALD }
    }
    const moves = marshal(WHITE, occupancy, 'a1')
    expect(moves).toContainEqual(take('a1', 'a4'))
    expect(landings(moves)).not.toContain('a5')
    expect(landings(moves)).not.toContain('a6')
  })
})
describe('marshal and the dormant emperor', () => {
  it('cannot capture a dormant emperor, which still blocks the line, but captures an awake one', () => {
    const dormant: SquareOccupant = { g9: { side: BLACK, piece: EMPEROR } }
    const awake: SquareOccupant = { g9: { side: BLACK, piece: EMPEROR, awake: true } }
    const squares = landings(marshal(WHITE, dormant, 'g7'))
    expect(squares).not.toContain('g9')
    expect(squares).not.toContain('g10')
    expect(marshal(WHITE, awake, 'g7')).toContainEqual(take('g7', 'g9'))
  })
})
describe('marshal at the edge', () => {
  it('reaches the three other corners from a corner', () => {
    const squares = landings(marshal(WHITE, {}, 'a1'))
    expect(squares.size).toBe(36)
    for (const square of ['a13', 'm1', 'm13']) expect(squares).toContain(square)
  })
  it('never wraps around to the far side of the board', () => {
    const squares = landings(marshal(WHITE, {}, 'a7'))
    expect(squares.size).toBe(36)
    expect(squares).not.toContain('m6')
    expect(squares).not.toContain('m8')
  })
})
describe('marshal across the whole board', () => {
  it('only ever moves along a queen line', () => {
    for (const from of everySquare())
      for (const { to } of marshal(WHITE, {}, from)) {
        const [file, rank] = gap(from, to)
        expect([0, Math.max(file, rank)]).toContain(Math.min(file, rank))
      }
  })
  it('moves the same for white and black', () => {
    for (const from of everySquare())
      expect(marshal(BLACK, {}, from)).toEqual(marshal(WHITE, {}, from))
  })
})
describe('marshal riposte squares', () => {
  it('counts only the enemy pieces a move destroys, never its own', () => {
    const occupancy: SquareOccupant = {
      e5: { side: WHITE, piece: MAGE },
      d6: { side: BLACK, piece: HERALD },
      f6: { side: WHITE, piece: LEGIONARY }
    }
    const blast: Move = { from: 'e5', to: 'e5', captures: ['d6', 'f6'] }
    expect(riposteSquares(WHITE, occupancy, blast)).toEqual(['d6'])
  })
  it('counts the square the victim stood on, not where the capturer lands', () => {
    const occupancy: SquareOccupant = {
      e10: { side: BLACK, piece: ASSASSIN },
      e7: { side: WHITE, piece: HERALD }
    }
    const strike: Move = { from: 'e10', to: 'e6', captures: ['e7'] }
    expect(riposteSquares(BLACK, occupancy, strike)).toEqual(['e7'])
  })
  it('counts nothing for a move that captures nothing', () => {
    expect(riposteSquares(WHITE, {}, { from: 'a1', to: 'a2' })).toEqual([])
  })
})