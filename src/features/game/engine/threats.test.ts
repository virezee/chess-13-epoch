import type { Side, SquareOccupant } from '@/types/material'
import type { Position } from '@/types/game'
import { describe, it, expect } from 'vitest'
import { WHITE, BLACK } from '@/constants/player'
import { POPE, MARSHAL, ASSASSIN, HERALD, TEMPLAR, LEGIONARY } from '@/constants/piece'
import { opening } from './opening'
import { position } from './position'
import { threats } from './threats'
import { legality } from './legality'

const setup = (side: Side, occupancy: SquareOccupant): Position =>
  position(
    side,
    { a1: { side: WHITE, piece: POPE }, m13: { side: BLACK, piece: POPE }, ...occupancy },
    opening().state
  )
const attackers = (side: Side, occupancy: SquareOccupant, square: string): string[] =>
  threats(setup(WHITE, occupancy), side, {}, false, square)
const capturesFrom = (side: Side, occupancy: SquareOccupant, square: string): string[][] =>
  legality(setup(side, occupancy))
    .filter(({ from }) => from === square)
    .map(({ captures }) => captures ?? [])
describe('legionary attacks', () => {
  it('attacks one tile diagonally forward for white', () => {
    const occupancy: SquareOccupant = { e5: { side: WHITE, piece: LEGIONARY } }
    expect(attackers(WHITE, occupancy, 'd6')).toEqual(['e5'])
    expect(attackers(WHITE, occupancy, 'f6')).toEqual(['e5'])
  })
  it('attacks one tile diagonally forward for black', () => {
    const occupancy: SquareOccupant = { e5: { side: BLACK, piece: LEGIONARY } }
    expect(attackers(BLACK, occupancy, 'd4')).toEqual(['e5'])
    expect(attackers(BLACK, occupancy, 'f4')).toEqual(['e5'])
  })
  it('attacks nothing straight ahead, sideways, backwards or further away', () => {
    const occupancy: SquareOccupant = { e5: { side: WHITE, piece: LEGIONARY } }
    for (const square of ['e6', 'd5', 'f5', 'd4', 'f4', 'c7', 'g7'])
      expect(attackers(WHITE, occupancy, square)).toEqual([])
  })
})
describe('templar attacks', () => {
  const templar: SquareOccupant = { g7: { side: WHITE, piece: TEMPLAR } }
  it('attacks its long leaps when restricted but not its short ones', () => {
    expect(attackers(WHITE, templar, 'i10')).toEqual(['g7'])
    expect(attackers(WHITE, templar, 'h9')).toEqual([])
  })
  it('attacks its short leaps when enhanced', () => {
    const enhanced: SquareOccupant = { ...templar, g5: { side: WHITE, piece: MARSHAL } }
    expect(attackers(WHITE, enhanced, 'h9')).toEqual(['g7'])
  })
  it('judges the short leap from the square it stands on', () => {
    const occupancy: SquareOccupant = {
      h8: { side: WHITE, piece: TEMPLAR },
      d4: { side: WHITE, piece: MARSHAL }
    }
    expect(attackers(WHITE, occupancy, 'j9')).toEqual(['h8'])
  })
  it('attacks over any pieces in between', () => {
    const crowded: SquareOccupant = {
      ...templar,
      g8: { side: BLACK, piece: HERALD },
      h8: { side: BLACK, piece: HERALD },
      h9: { side: BLACK, piece: HERALD },
      i9: { side: BLACK, piece: HERALD }
    }
    expect(attackers(WHITE, crowded, 'i10')).toEqual(['g7'])
  })
})
describe('pinned pieces keep attacking', () => {
  const pinner: SquareOccupant = { f6: { side: BLACK, piece: HERALD } }
  it('counts a pinned templar', () => {
    const occupancy: SquareOccupant = { ...pinner, c3: { side: WHITE, piece: TEMPLAR } }
    expect(attackers(WHITE, occupancy, 'e6')).toEqual(['c3'])
  })
  it('counts a pinned legionary', () => {
    const occupancy: SquareOccupant = { ...pinner, c3: { side: WHITE, piece: LEGIONARY } }
    expect(attackers(WHITE, occupancy, 'd4')).toEqual(['c3'])
  })
})
describe('watching an assassin landing', () => {
  const victim: SquareOccupant = {
    e10: { side: BLACK, piece: ASSASSIN },
    e7: { side: WHITE, piece: HERALD }
  }
  it('lets the assassin capture onto an unwatched tile', () => {
    expect(capturesFrom(BLACK, victim, 'e10')).toContainEqual(['e7'])
  })
  it('forbids the capture when a templar watches the landing tile', () => {
    const watched: SquareOccupant = { ...victim, g3: { side: WHITE, piece: TEMPLAR } }
    expect(capturesFrom(BLACK, watched, 'e10')).not.toContainEqual(['e7'])
  })
  it('forbids the capture when a legionary watches the landing tile', () => {
    const watched: SquareOccupant = { ...victim, d5: { side: WHITE, piece: LEGIONARY } }
    expect(capturesFrom(BLACK, watched, 'e10')).not.toContainEqual(['e7'])
  })
})
describe('supporting a marshal capture', () => {
  const target: SquareOccupant = {
    d4: { side: WHITE, piece: MARSHAL },
    d8: { side: BLACK, piece: HERALD }
  }
  it('forbids the capture without support', () => {
    expect(capturesFrom(WHITE, target, 'd4')).not.toContainEqual(['d8'])
  })
  it('allows it when a templar attacks the target', () => {
    const supported: SquareOccupant = { ...target, f5: { side: WHITE, piece: TEMPLAR } }
    expect(capturesFrom(WHITE, supported, 'd4')).toContainEqual(['d8'])
  })
  it('allows it when a legionary attacks the target', () => {
    const supported: SquareOccupant = { ...target, c7: { side: WHITE, piece: LEGIONARY } }
    expect(capturesFrom(WHITE, supported, 'd4')).toContainEqual(['d8'])
  })
  it('counts a pinned templar as support', () => {
    const pinned: SquareOccupant = {
      c3: { side: WHITE, piece: TEMPLAR },
      f6: { side: BLACK, piece: HERALD },
      e9: { side: WHITE, piece: MARSHAL },
      e6: { side: BLACK, piece: LEGIONARY }
    }
    expect(capturesFrom(WHITE, pinned, 'e9')).toContainEqual(['e6'])
  })
})