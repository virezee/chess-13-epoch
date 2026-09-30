// oxlint-disable max-lines
import type { Side, Piece, SquareOccupant } from '@/types/material'
import type { Move, State, Save } from '@/types/game'
import { describe, it, expect } from 'vitest'
import { WHITE, BLACK } from '@/constants/player'
import {
  POPE,
  EMPEROR,
  MARSHAL,
  ASSASSIN,
  SENTINEL,
  MAGE,
  HERALD,
  TEMPLAR,
  LEGIONARY
} from '@/constants/piece'
import { legality } from './legality'
import { position } from './position'
import { apply } from './apply'
import { opening } from './opening'
import { turn } from './turn'

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
  it('stays asleep during the opponent turn under a legionary', () => {
    const occupancy: SquareOccupant = { ...sleeper, d2: { side: BLACK, piece: LEGIONARY } }
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
  it('wakes once a legionary captures its marshal', () => {
    const occupancy: SquareOccupant = { ...sleeper, g2: { side: BLACK, piece: LEGIONARY } }
    const take: Move = { from: 'g2', to: 'h1', captures: ['h1'] }
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
describe('emperor woken by a herald', () => {
  it('wakes when a herald attacks it along a diagonal', () => {
    const occupancy: SquareOccupant = { ...sleeper, h4: { side: BLACK, piece: HERALD } }
    expect(emperorAfter(WHITE, occupancy)).toEqual({ side: WHITE, piece: EMPEROR, awake: true })
  })
  it('stays asleep during the opponent turn under a herald', () => {
    const occupancy: SquareOccupant = { ...sleeper, h4: { side: BLACK, piece: HERALD } }
    expect(emperorAfter(BLACK, occupancy)).toEqual({ side: WHITE, piece: EMPEROR, awake: false })
  })
  it('wakes to the straight step only from an enhanced herald', () => {
    const restricted: SquareOccupant = { ...sleeper, e2: { side: BLACK, piece: HERALD } }
    const enhanced: SquareOccupant = { ...restricted, b4: { side: BLACK, piece: MARSHAL } }
    expect(emperorAfter(WHITE, restricted)).toEqual({ side: WHITE, piece: EMPEROR, awake: false })
    expect(emperorAfter(WHITE, enhanced)).toEqual({ side: WHITE, piece: EMPEROR, awake: true })
  })
  it('wakes once a herald captures its marshal', () => {
    const occupancy: SquareOccupant = { ...sleeper, k4: { side: BLACK, piece: HERALD } }
    const take: Move = { from: 'k4', to: 'h1', captures: ['h1'] }
    const played = apply(position(BLACK, occupancy, opening().state), take, opening().match)
    expect(emperorAfter(WHITE, played.occupancy, played.state)).toEqual({
      side: WHITE,
      piece: EMPEROR,
      awake: true
    })
  })
})
describe('emperor in the herald example from the rules', () => {
  const occupancy: SquareOccupant = {
    e1: { side: WHITE, piece: EMPEROR, awake: false },
    e4: { side: WHITE, piece: HERALD },
    l1: { side: WHITE, piece: MARSHAL },
    m1: { side: WHITE, piece: POPE },
    e7: { side: BLACK, piece: SENTINEL },
    l13: { side: BLACK, piece: MARSHAL },
    m13: { side: BLACK, piece: POPE }
  }
  const none = { left: false, right: false }
  const state: State = { ...opening().state, castlingSide: { [WHITE]: none, [BLACK]: none } }
  const start: Save = { side: WHITE, occupancy, state, match: opening().match }
  it('stays asleep when the sentinel leaves the file He4-b7 opened before white moves again', () => {
    const opened = turn(start, { from: 'e4', to: 'b7' })
    const withdrawn = turn(opened.save, { from: 'e7', to: 'f7' })
    const standing = turn(opened.save, { from: 'm13', to: 'm12' })
    expect(withdrawn.position.occupancy['e1']).toEqual({
      side: WHITE,
      piece: EMPEROR,
      awake: false
    })
    expect(standing.position.occupancy['e1']).toEqual({ side: WHITE, piece: EMPEROR, awake: true })
  })
  it('cannot play Se7-a7 as the rules write it, past the herald on b7 and beyond 3 tiles', () => {
    const opened = turn(start, { from: 'e4', to: 'b7' })
    expect(opened.moves).not.toContainEqual({ from: 'e7', to: 'a7' })
    expect(opened.moves).toContainEqual({ from: 'e7', to: 'f7' })
  })
})
describe('emperor woken by a mage', () => {
  it('wakes when a mage stands beside it, although the blast would pass around it', () => {
    const occupancy: SquareOccupant = { ...sleeper, d2: { side: BLACK, piece: MAGE } }
    expect(emperorAfter(WHITE, occupancy)).toEqual({ side: WHITE, piece: EMPEROR, awake: true })
  })
  it('stays asleep during the opponent turn beside a mage', () => {
    const occupancy: SquareOccupant = { ...sleeper, d2: { side: BLACK, piece: MAGE } }
    expect(emperorAfter(BLACK, occupancy)).toEqual({ side: WHITE, piece: EMPEROR, awake: false })
  })
  it('survives a blast while it sleeps', () => {
    const occupancy: SquareOccupant = {
      ...sleeper,
      d2: { side: BLACK, piece: MAGE },
      e2: { side: WHITE, piece: LEGIONARY }
    }
    expect(legality(position(BLACK, occupancy, opening().state))).toContainEqual({
      from: 'd2',
      to: 'd2',
      captures: ['e2']
    })
  })
  it('wakes once a mage blasts its marshal', () => {
    const occupancy: SquareOccupant = { ...sleeper, g2: { side: BLACK, piece: MAGE } }
    const blast: Move = { from: 'g2', to: 'g2', captures: ['h1'] }
    const played = apply(position(BLACK, occupancy, opening().state), blast, opening().match)
    expect(emperorAfter(WHITE, played.occupancy, played.state)).toEqual({
      side: WHITE,
      piece: EMPEROR,
      awake: true
    })
  })
})
describe('emperor woken by a sentinel', () => {
  it('wakes when a sentinel attacks it along a line', () => {
    const occupancy: SquareOccupant = { ...sleeper, e6: { side: BLACK, piece: SENTINEL } }
    expect(emperorAfter(WHITE, occupancy)).toEqual({ side: WHITE, piece: EMPEROR, awake: true })
  })
  it('stays asleep during the opponent turn under a sentinel', () => {
    const occupancy: SquareOccupant = { ...sleeper, e6: { side: BLACK, piece: SENTINEL } }
    expect(emperorAfter(BLACK, occupancy)).toEqual({ side: WHITE, piece: EMPEROR, awake: false })
  })
  it('wakes from 7 tiles only under an enhanced sentinel', () => {
    const restricted: SquareOccupant = { ...sleeper, e8: { side: BLACK, piece: SENTINEL } }
    const enhanced: SquareOccupant = { ...restricted, b10: { side: BLACK, piece: MARSHAL } }
    expect(emperorAfter(WHITE, restricted)).toEqual({ side: WHITE, piece: EMPEROR, awake: false })
    expect(emperorAfter(WHITE, enhanced)).toEqual({ side: WHITE, piece: EMPEROR, awake: true })
  })
  it('is not woken through a piece the sentinel could pass on a quiet move', () => {
    const occupancy: SquareOccupant = {
      ...sleeper,
      e7: { side: BLACK, piece: SENTINEL },
      e4: { side: BLACK, piece: MAGE },
      b3: { side: BLACK, piece: MARSHAL }
    }
    expect(emperorAfter(WHITE, occupancy)).toEqual({ side: WHITE, piece: EMPEROR, awake: false })
  })
  it('wakes once a sentinel captures its marshal', () => {
    const occupancy: SquareOccupant = { ...sleeper, h5: { side: BLACK, piece: SENTINEL } }
    const take: Move = { from: 'h5', to: 'h1', captures: ['h1'] }
    const played = apply(position(BLACK, occupancy, opening().state), take, opening().match)
    expect(emperorAfter(WHITE, played.occupancy, played.state)).toEqual({
      side: WHITE,
      piece: EMPEROR,
      awake: true
    })
  })
})
describe('emperor woken by an assassin', () => {
  it('wakes when an assassin attacks it along its rank', () => {
    const occupancy: SquareOccupant = { ...sleeper, a1: { side: BLACK, piece: ASSASSIN } }
    expect(emperorAfter(WHITE, occupancy)).toEqual({ side: WHITE, piece: EMPEROR, awake: true })
  })
  it('stays asleep during the opponent turn under an assassin', () => {
    const occupancy: SquareOccupant = { ...sleeper, a1: { side: BLACK, piece: ASSASSIN } }
    expect(emperorAfter(BLACK, occupancy)).toEqual({ side: WHITE, piece: EMPEROR, awake: false })
  })
  it('stays asleep when the tile behind it is occupied', () => {
    const occupancy: SquareOccupant = {
      ...sleeper,
      a1: { side: BLACK, piece: ASSASSIN },
      f1: { side: WHITE, piece: LEGIONARY }
    }
    expect(emperorAfter(WHITE, occupancy)).toEqual({ side: WHITE, piece: EMPEROR, awake: false })
  })
  it('stays asleep under an assassin aiming from above, whose landing would be off the board', () => {
    const occupancy: SquareOccupant = { ...sleeper, e6: { side: BLACK, piece: ASSASSIN } }
    expect(emperorAfter(WHITE, occupancy)).toEqual({ side: WHITE, piece: EMPEROR, awake: false })
  })
})
describe('emperor beside an assassin', () => {
  it('wakes when an assassin lands beside it, and may take the assassin', () => {
    const occupancy: SquareOccupant = {
      m1: { side: WHITE, piece: POPE },
      e3: { side: WHITE, piece: EMPEROR, awake: false },
      h1: { side: WHITE, piece: MARSHAL },
      e5: { side: WHITE, piece: LEGIONARY },
      e8: { side: BLACK, piece: ASSASSIN },
      m13: { side: BLACK, piece: POPE }
    }
    const start: Save = { side: BLACK, occupancy, state: opening().state, match: opening().match }
    const landed = turn(start, { from: 'e8', to: 'e4', captures: ['e5'] })
    expect(landed.position.occupancy['e3']).toEqual({ side: WHITE, piece: EMPEROR, awake: true })
    expect(landed.moves).toContainEqual({ from: 'e3', to: 'e4', captures: ['e4'] })
  })
  it('wakes once an assassin captures its marshal', () => {
    const occupancy: SquareOccupant = { ...sleeper, f1: { side: BLACK, piece: ASSASSIN } }
    const take: Move = { from: 'f1', to: 'i1', captures: ['h1'] }
    const played = apply(position(BLACK, occupancy, opening().state), take, opening().match)
    expect(emperorAfter(WHITE, played.occupancy, played.state)).toEqual({
      side: WHITE,
      piece: EMPEROR,
      awake: true
    })
  })
})