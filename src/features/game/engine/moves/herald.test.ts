import type { SquareOccupant } from '@/types/material'
import type { Move } from '@/types/game'
import { describe, it, expect } from 'vitest'
import { FILES, RANKS } from '@/constants/board'
import { WHITE, BLACK } from '@/constants/player'
import { EMPEROR, MAGE } from '@/constants/piece'
import { parseSquare } from '../../lib/coordinate'
import { herald } from './herald'

const landings = (moves: Move[]): Set<string> => new Set(moves.map(({ to }) => to))
const everySquare = (): string[] => FILES.flatMap(file => RANKS.map(rank => `${file}${rank}`))
const gap = (from: string, to: string): [number, number] => {
  const origin = parseSquare(from)
  const target = parseSquare(to)
  return [Math.abs(target.file - origin.file), Math.abs(target.rank - origin.rank)]
}
const colour = (square: string): number => {
  const { file, rank } = parseSquare(square)
  return (file + rank) % 2
}
const average = (isEnhanced: boolean): number => {
  const squares = everySquare()
  let total = 0
  for (const from of squares) total += herald(WHITE, {}, from, isEnhanced).length
  return total / squares.length
}
const SHORT = ['b2', 'c3', 'd4', 'e5', 'f6', 'g7']
const LONG = [...SHORT, 'h8', 'i9', 'j10', 'k11', 'l12', 'm13']
const STEPS = ['g8', 'h7', 'g6', 'f7']
describe('herald diagonals', () => {
  it('slides up to 6 tiles when restricted and across the whole board when enhanced', () => {
    expect(landings(herald(WHITE, {}, 'a1', false))).toEqual(new Set([...SHORT, 'a2', 'b1']))
    expect(landings(herald(WHITE, {}, 'a1', true))).toEqual(new Set([...LONG, 'a2', 'b1']))
  })
  it('captures exactly as far as it moves', () => {
    const near: SquareOccupant = { g7: { side: BLACK, piece: MAGE } }
    const far: SquareOccupant = { h8: { side: BLACK, piece: MAGE } }
    const farthest: SquareOccupant = { m13: { side: BLACK, piece: MAGE } }
    expect(herald(WHITE, near, 'a1', false)).toContainEqual({
      from: 'a1',
      to: 'g7',
      captures: ['g7']
    })
    expect(landings(herald(WHITE, far, 'a1', false))).not.toContain('h8')
    expect(herald(WHITE, farthest, 'a1', true)).toContainEqual({
      from: 'a1',
      to: 'm13',
      captures: ['m13']
    })
  })
  it('stops in front of its own piece and on an enemy one, never jumping', () => {
    const own: SquareOccupant = { d4: { side: WHITE, piece: MAGE } }
    const enemy: SquareOccupant = { d4: { side: BLACK, piece: MAGE } }
    expect(landings(herald(WHITE, own, 'a1', true))).toEqual(new Set(['b2', 'c3', 'a2', 'b1']))
    expect(landings(herald(WHITE, enemy, 'a1', true))).toEqual(
      new Set(['b2', 'c3', 'd4', 'a2', 'b1'])
    )
  })
})
describe('herald straight step', () => {
  it('steps one tile straight in each direction, never further', () => {
    const straight = herald(WHITE, {}, 'g7', false).filter(({ to }) => gap('g7', to).includes(0))
    expect(landings(straight)).toEqual(new Set(STEPS))
  })
  it('cannot capture with the step while restricted', () => {
    const occupancy: SquareOccupant = { g8: { side: BLACK, piece: MAGE } }
    expect(landings(herald(WHITE, occupancy, 'g7', false))).not.toContain('g8')
  })
  it('captures with the step while enhanced', () => {
    const occupancy: SquareOccupant = { g8: { side: BLACK, piece: MAGE } }
    expect(herald(WHITE, occupancy, 'g7', true)).toContainEqual({
      from: 'g7',
      to: 'g8',
      captures: ['g8']
    })
  })
  it('never steps onto its own piece', () => {
    const occupancy: SquareOccupant = { g8: { side: WHITE, piece: MAGE } }
    expect(landings(herald(WHITE, occupancy, 'g7', false))).not.toContain('g8')
    expect(landings(herald(WHITE, occupancy, 'g7', true))).not.toContain('g8')
  })
})
describe('herald across the whole board', () => {
  it('only ever moves along a diagonal or one tile straight', () => {
    for (const from of everySquare())
      for (const isEnhanced of [false, true])
        for (const { to } of herald(WHITE, {}, from, isEnhanced)) {
          const [file, rank] = gap(from, to)
          expect([rank, 1 - rank]).toContain(file)
        }
  })
  it('keeps its colour along a diagonal and changes it with the step', () => {
    for (const from of everySquare())
      for (const { to } of herald(WHITE, {}, from, false)) {
        const [file, rank] = gap(from, to)
        expect(colour(to) === colour(from)).toBe(file === rank)
      }
  })
  it('never slides more than 6 tiles while restricted', () => {
    for (const from of everySquare())
      for (const { to } of herald(WHITE, {}, from, false))
        expect(Math.max(...gap(from, to))).toBeLessThanOrEqual(6)
  })
  it('moves the same for white and black', () => {
    for (const from of everySquare())
      for (const isEnhanced of [false, true])
        expect(herald(BLACK, {}, from, isEnhanced)).toEqual(herald(WHITE, {}, from, isEnhanced))
  })
  it('reaches 16.9 squares restricted and 19.1 enhanced on average', () => {
    expect(average(false)).toBeCloseTo(16.9, 1)
    expect(average(true)).toBeCloseTo(19.1, 1)
  })
})
describe('herald and the dormant emperor', () => {
  it('cannot take a dormant emperor on the diagonal, which still blocks it', () => {
    const dormant: SquareOccupant = { h8: { side: BLACK, piece: EMPEROR } }
    const awake: SquareOccupant = { h8: { side: BLACK, piece: EMPEROR, awake: true } }
    const squares = landings(herald(WHITE, dormant, 'g7', true))
    expect(squares).not.toContain('h8')
    expect(squares).not.toContain('i9')
    expect(herald(WHITE, awake, 'g7', true)).toContainEqual({
      from: 'g7',
      to: 'h8',
      captures: ['h8']
    })
  })
  it('cannot step onto a dormant emperor even while enhanced', () => {
    const dormant: SquareOccupant = { g8: { side: BLACK, piece: EMPEROR } }
    const awake: SquareOccupant = { g8: { side: BLACK, piece: EMPEROR, awake: true } }
    expect(landings(herald(WHITE, dormant, 'g7', true))).not.toContain('g8')
    expect(herald(WHITE, awake, 'g7', true)).toContainEqual({
      from: 'g7',
      to: 'g8',
      captures: ['g8']
    })
  })
})
describe('herald at the edge', () => {
  it('keeps to the board from a corner', () => {
    expect(landings(herald(WHITE, {}, 'm13', false))).toEqual(
      new Set(['l12', 'k11', 'j10', 'i9', 'h8', 'g7', 'm12', 'l13'])
    )
  })
  it('never wraps around to the far side of the board', () => {
    expect(landings(herald(WHITE, {}, 'a7', false))).toEqual(
      new Set([
        'b8',
        'c9',
        'd10',
        'e11',
        'f12',
        'g13',
        'b6',
        'c5',
        'd4',
        'e3',
        'f2',
        'g1',
        'a8',
        'b7',
        'a6'
      ])
    )
  })
})