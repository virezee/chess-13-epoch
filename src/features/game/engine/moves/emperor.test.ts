import type { Side, SquareOccupant } from '@/types/material'
import type { Move } from '@/types/game'
import { describe, it, expect } from 'vitest'
import { FILES, RANKS } from '@/constants/board'
import { WHITE, BLACK } from '@/constants/player'
import { EMPEROR, MAGE, HERALD } from '@/constants/piece'
import { parseSquare } from '../../lib/coordinate'
import { isDormant, emperor } from './emperor'

const landings = (moves: Move[]): Set<string> => new Set(moves.map(({ to }) => to))
const take = (from: string, to: string): Move => ({ from, to, captures: [to] })
const everySquare = (): string[] => FILES.flatMap(file => RANKS.map(rank => `${file}${rank}`))
const gap = (from: string, to: string): [number, number] => {
  const origin = parseSquare(from)
  const target = parseSquare(to)
  return [Math.abs(target.file - origin.file), Math.abs(target.rank - origin.rank)]
}
const awake = (side: Side, square: string): SquareOccupant => ({
  [square]: { side, piece: EMPEROR, awake: true }
})
describe('emperor dormancy', () => {
  it('counts an emperor as dormant until it wakes, and no other piece', () => {
    expect(isDormant({ side: WHITE, piece: EMPEROR })).toBe(true)
    expect(isDormant({ side: WHITE, piece: EMPEROR, awake: false })).toBe(true)
    expect(isDormant({ side: WHITE, piece: EMPEROR, awake: true })).toBe(false)
    expect(isDormant({ side: WHITE, piece: MAGE })).toBe(false)
  })
  it('neither moves nor captures while dormant', () => {
    const occupancy: SquareOccupant = {
      g7: { side: WHITE, piece: EMPEROR, awake: false },
      h8: { side: BLACK, piece: HERALD }
    }
    expect(emperor(WHITE, occupancy, 'g7')).toEqual([])
  })
})
describe('emperor quiet moves', () => {
  it('slides along all 8 queen lines to the edge of the board once awake', () => {
    const squares = landings(emperor(WHITE, awake(WHITE, 'g7'), 'g7'))
    expect(squares.size).toBe(48)
    for (const square of ['g1', 'g13', 'a7', 'm7', 'a1', 'm13', 'a13', 'm1'])
      expect(squares).toContain(square)
  })
  it('stops in front of its own piece, never jumping', () => {
    const occupancy: SquareOccupant = { ...awake(WHITE, 'a1'), a4: { side: WHITE, piece: MAGE } }
    const squares = landings(emperor(WHITE, occupancy, 'a1'))
    expect(squares).toContain('a3')
    expect(squares).not.toContain('a4')
    expect(squares).not.toContain('a5')
  })
})
describe('emperor captures', () => {
  it('captures an enemy for either side, and never its own piece', () => {
    const white: SquareOccupant = { ...awake(WHITE, 'a1'), a4: { side: BLACK, piece: HERALD } }
    const black: SquareOccupant = { ...awake(BLACK, 'a1'), a4: { side: WHITE, piece: HERALD } }
    const own: SquareOccupant = { ...awake(WHITE, 'a1'), a4: { side: WHITE, piece: HERALD } }
    expect(emperor(WHITE, white, 'a1')).toContainEqual(take('a1', 'a4'))
    expect(emperor(BLACK, black, 'a1')).toContainEqual(take('a1', 'a4'))
    expect(landings(emperor(WHITE, own, 'a1'))).not.toContain('a4')
  })
  it('reaches a capture at any distance along a line', () => {
    const occupancy: SquareOccupant = { ...awake(WHITE, 'a1'), m13: { side: BLACK, piece: HERALD } }
    expect(emperor(WHITE, occupancy, 'a1')).toContainEqual(take('a1', 'm13'))
  })
  it('captures only the first piece in its way', () => {
    const occupancy: SquareOccupant = {
      ...awake(WHITE, 'a1'),
      a4: { side: BLACK, piece: HERALD },
      a6: { side: BLACK, piece: HERALD }
    }
    const moves = emperor(WHITE, occupancy, 'a1')
    expect(moves).toContainEqual(take('a1', 'a4'))
    expect(landings(moves)).not.toContain('a5')
    expect(landings(moves)).not.toContain('a6')
  })
})
describe('emperor and the enemy emperor', () => {
  it('cannot capture a dormant emperor, which still blocks the line, but captures an awake one', () => {
    const dormant: SquareOccupant = { ...awake(WHITE, 'g7'), g9: { side: BLACK, piece: EMPEROR } }
    const woken: SquareOccupant = { ...awake(WHITE, 'g7'), ...awake(BLACK, 'g9') }
    const squares = landings(emperor(WHITE, dormant, 'g7'))
    expect(squares).not.toContain('g9')
    expect(squares).not.toContain('g10')
    expect(emperor(WHITE, woken, 'g7')).toContainEqual(take('g7', 'g9'))
  })
})
describe('emperor at the edge', () => {
  it('reaches the three other corners from a corner', () => {
    const squares = landings(emperor(WHITE, awake(WHITE, 'a1'), 'a1'))
    expect(squares.size).toBe(36)
    for (const square of ['a13', 'm1', 'm13']) expect(squares).toContain(square)
  })
  it('never wraps around to the far side of the board', () => {
    const squares = landings(emperor(WHITE, awake(WHITE, 'a7'), 'a7'))
    expect(squares.size).toBe(36)
    expect(squares).not.toContain('m6')
    expect(squares).not.toContain('m8')
  })
})
describe('emperor across the whole board', () => {
  it('only ever moves along a queen line', () => {
    for (const from of everySquare())
      for (const { to } of emperor(WHITE, awake(WHITE, from), from)) {
        const [file, rank] = gap(from, to)
        expect([0, Math.max(file, rank)]).toContain(Math.min(file, rank))
      }
  })
  it('moves the same for white and black', () => {
    for (const from of everySquare())
      expect(emperor(BLACK, awake(BLACK, from), from)).toEqual(
        emperor(WHITE, awake(WHITE, from), from)
      )
  })
})