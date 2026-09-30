import type { Side, Piece, SquareOccupant } from '@/types/material'
import type { Move, State } from '@/types/game'
import { describe, it, expect } from 'vitest'
import { WHITE, BLACK } from '@/constants/player'
import { POPE, EMPEROR, MARSHAL, TEMPLAR, LEGIONARY } from '@/constants/piece'
import { opening } from './opening'
import { position } from './position'
import { apply } from './apply'

const emperorAfter = (
  side: Side,
  occupancy: SquareOccupant,
  changes: Partial<State> = {}
): Piece | undefined =>
  position(side, occupancy, { ...opening().state, ...changes }).occupancy['e1']
const sleeper: SquareOccupant = {
  m1: { side: WHITE, piece: POPE },
  e1: { side: WHITE, piece: EMPEROR, awake: false },
  h1: { side: WHITE, piece: MARSHAL },
  m13: { side: BLACK, piece: POPE }
}
describe('emperor woken by a templar or a legionary', () => {
  it('wakes when a templar attacks it at the start of its owner turn', () => {
    const occupancy: SquareOccupant = { ...sleeper, g4: { side: BLACK, piece: TEMPLAR } }
    expect(emperorAfter(WHITE, occupancy)).toEqual({ side: WHITE, piece: EMPEROR, awake: true })
  })
  it('wakes when a legionary attacks it at the start of its owner turn', () => {
    const occupancy: SquareOccupant = { ...sleeper, d2: { side: BLACK, piece: LEGIONARY } }
    expect(emperorAfter(WHITE, occupancy)).toEqual({ side: WHITE, piece: EMPEROR, awake: true })
  })
  it('stays asleep during the opponent turn', () => {
    const occupancy: SquareOccupant = { ...sleeper, g4: { side: BLACK, piece: TEMPLAR } }
    expect(emperorAfter(BLACK, occupancy)).toEqual({ side: WHITE, piece: EMPEROR, awake: false })
  })
  it('stays asleep while nothing attacks it', () => {
    expect(emperorAfter(WHITE, sleeper)).toEqual({ side: WHITE, piece: EMPEROR, awake: false })
  })
  it('wakes to a short leap only from an enhanced templar', () => {
    const restricted: SquareOccupant = { ...sleeper, g2: { side: BLACK, piece: TEMPLAR } }
    const enhanced: SquareOccupant = { ...restricted, g5: { side: BLACK, piece: MARSHAL } }
    expect(emperorAfter(WHITE, restricted)).toEqual({ side: WHITE, piece: EMPEROR, awake: false })
    expect(emperorAfter(WHITE, enhanced)).toEqual({ side: WHITE, piece: EMPEROR, awake: true })
  })
})
describe('emperor and the marshal', () => {
  it('wakes once a templar captures its marshal', () => {
    const occupancy: SquareOccupant = {
      ...sleeper,
      h1: { side: WHITE, piece: POPE },
      m1: { side: WHITE, piece: MARSHAL },
      k4: { side: BLACK, piece: TEMPLAR }
    }
    const take: Move = { from: 'k4', to: 'm1', captures: ['m1'] }
    const played = apply(position(BLACK, occupancy, opening().state), take, opening().match)
    expect(emperorAfter(WHITE, played.occupancy, played.state)).toEqual({
      side: WHITE,
      piece: EMPEROR,
      awake: true
    })
  })
  it('is not put back to sleep by a marshal promoted from a legionary', () => {
    const occupancy: SquareOccupant = {
      m1: { side: WHITE, piece: POPE },
      e1: { side: WHITE, piece: EMPEROR, awake: true },
      e12: { side: WHITE, piece: LEGIONARY },
      m13: { side: BLACK, piece: POPE }
    }
    const state: State = {
      ...opening().state,
      awake: { [WHITE]: true, [BLACK]: false },
      promotions: { [WHITE]: [{ file: 4, piece: [MARSHAL] }], [BLACK]: [] }
    }
    const promote: Move = { from: 'e12', to: 'e13', promotesTo: MARSHAL }
    const played = apply(position(WHITE, occupancy, state), promote, opening().match)
    expect(emperorAfter(WHITE, played.occupancy, played.state)).toEqual({
      side: WHITE,
      piece: EMPEROR,
      awake: true
    })
  })
})
describe('command zone after a promotion', () => {
  it('comes back once a legionary promotes into a marshal', () => {
    const occupancy: SquareOccupant = {
      m1: { side: WHITE, piece: POPE },
      e12: { side: WHITE, piece: LEGIONARY },
      g11: { side: WHITE, piece: TEMPLAR },
      m13: { side: BLACK, piece: POPE }
    }
    const state: State = {
      ...opening().state,
      promotions: { [WHITE]: [{ file: 4, piece: [MARSHAL] }], [BLACK]: [] }
    }
    const promote: Move = { from: 'e12', to: 'e13', promotesTo: MARSHAL }
    const before = position(WHITE, occupancy, state)
    const played = apply(before, promote, opening().match)
    expect(before.enhanced.has('g11')).toBe(false)
    expect(position(BLACK, played.occupancy, played.state).enhanced.has('g11')).toBe(true)
  })
})