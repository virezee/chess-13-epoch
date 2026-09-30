import type { Side, SquareOccupant } from '@/types/material'
import type { Move, State, Save } from '@/types/game'
import { describe, it, expect } from 'vitest'
import { WHITE, BLACK } from '@/constants/player'
import { POPE, EMPEROR, MARSHAL, MAGE, HERALD, TEMPLAR, LEGIONARY } from '@/constants/piece'
import { position } from './position'
import { opening } from './opening'
import { apply } from './apply'

const play = (
  side: Side,
  occupancy: SquareOccupant,
  move: Move,
  changes: Partial<State> = {}
): Save => {
  const { state, match } = opening()
  const board: SquareOccupant = {
    a1: { side: WHITE, piece: POPE },
    a13: { side: BLACK, piece: POPE },
    ...occupancy
  }
  const start = { ...state, noProgress: { count: 5, limit: 120 }, ...changes }
  return apply(position(side, board, start), move, match)
}
const slots = (...slot: State['promotions'][typeof WHITE]): Partial<State> => ({
  promotions: { [WHITE]: slot, [BLACK]: [] }
})
describe('legionary en passant right', () => {
  it('opens behind a white burst from rank 3 to rank 7', () => {
    const occupancy: SquareOccupant = { e3: { side: WHITE, piece: LEGIONARY } }
    const { state } = play(WHITE, occupancy, { from: 'e3', to: 'e7' })
    expect(state.enPassant).toEqual({ target: 'e6', captured: 'e7' })
  })
  it('opens behind a black burst from rank 11 to rank 7', () => {
    const occupancy: SquareOccupant = { e11: { side: BLACK, piece: LEGIONARY } }
    const { state } = play(BLACK, occupancy, { from: 'e11', to: 'e7' })
    expect(state.enPassant).toEqual({ target: 'e8', captured: 'e7' })
  })
  it.each([
    ['e3', 'e6'],
    ['e4', 'e7'],
    ['e5', 'e7'],
    ['e6', 'e7'],
    ['e7', 'e9']
  ])('does not open after %s to %s', (from, to) => {
    const occupancy: SquareOccupant = { [from]: { side: WHITE, piece: LEGIONARY } }
    expect(play(WHITE, occupancy, { from, to }).state.enPassant).toBeNull()
  })
})
describe('legionary en passant capture', () => {
  const right: Partial<State> = { enPassant: { target: 'e6', captured: 'e7' } }
  it('is lost when the reply is any other move', () => {
    const occupancy: SquareOccupant = {
      e7: { side: WHITE, piece: LEGIONARY },
      h10: { side: BLACK, piece: LEGIONARY }
    }
    const { state } = play(BLACK, occupancy, { from: 'h10', to: 'h9' }, right)
    expect(state.enPassant).toBeNull()
  })
  it('removes the victim from rank 7 and lands behind it', () => {
    const occupancy: SquareOccupant = {
      d7: { side: BLACK, piece: LEGIONARY },
      e7: { side: WHITE, piece: LEGIONARY }
    }
    const move: Move = { from: 'd7', to: 'e6', captures: ['e7'] }
    const { occupancy: next } = play(BLACK, occupancy, move, right)
    expect(next['e6']).toEqual({ side: BLACK, piece: LEGIONARY })
    expect(next['e7']).toBeUndefined()
    expect(next['d7']).toBeUndefined()
  })
  it('arms the riposte from the square the victim died on, not where the capturer lands', () => {
    const passage: SquareOccupant = {
      d7: { side: BLACK, piece: LEGIONARY },
      e7: { side: WHITE, piece: LEGIONARY }
    }
    const move: Move = { from: 'd7', to: 'e6', captures: ['e7'] }
    const onVictim: SquareOccupant = { ...passage, a7: { side: WHITE, piece: MARSHAL } }
    const onLanding: SquareOccupant = { ...passage, a2: { side: WHITE, piece: MARSHAL } }
    expect(play(BLACK, onVictim, move, right).state.riposte).toBe(true)
    expect(play(BLACK, onLanding, move, right).state.riposte).toBe(false)
  })
})
describe('legionary promotion', () => {
  const arriving: SquareOccupant = { e12: { side: WHITE, piece: LEGIONARY } }
  const toMage: Move = { from: 'e12', to: 'e13', promotesTo: MAGE }
  it('turns into the claimed piece and closes the slot', () => {
    const { occupancy, state } = play(WHITE, arriving, toMage, slots({ file: 4, piece: [MAGE] }))
    expect(occupancy['e13']).toEqual({ side: WHITE, piece: MAGE })
    expect(state.promotions[WHITE]).toEqual([])
  })
  it('closes a slot on a neighbouring file', () => {
    const { state } = play(WHITE, arriving, toMage, slots({ file: 3, piece: [MAGE] }))
    expect(state.promotions[WHITE]).toEqual([])
  })
  it('takes only the claimed piece out of a shared slot', () => {
    const { state } = play(WHITE, arriving, toMage, slots({ file: 4, piece: [MAGE, HERALD] }))
    expect(state.promotions[WHITE]).toEqual([{ file: 4, piece: [HERALD] }])
  })
  it('turns into an emperor that is already awake', () => {
    const move: Move = { from: 'e12', to: 'e13', promotesTo: EMPEROR }
    const { occupancy } = play(WHITE, arriving, move, slots({ file: 4, piece: [EMPEROR] }))
    expect(occupancy['e13']).toEqual({ side: WHITE, piece: EMPEROR, awake: true })
  })
  it('promotes in place from the last rank', () => {
    const waiting: SquareOccupant = { e13: { side: WHITE, piece: LEGIONARY } }
    const move: Move = { from: 'e13', to: 'e13', promotesTo: MAGE }
    const { occupancy } = play(WHITE, waiting, move, slots({ file: 4, piece: [MAGE] }))
    expect(occupancy['e13']).toEqual({ side: WHITE, piece: MAGE })
  })
})
describe('legionary progress and slots', () => {
  it('resets the no-progress counter on any legionary move', () => {
    const occupancy: SquareOccupant = { e3: { side: WHITE, piece: LEGIONARY } }
    const { state } = play(WHITE, occupancy, { from: 'e3', to: 'e4' })
    expect(state.noProgress.count).toBe(0)
  })
  it('opens no promotion slot when it dies', () => {
    const occupancy: SquareOccupant = {
      e5: { side: WHITE, piece: LEGIONARY },
      g8: { side: BLACK, piece: TEMPLAR }
    }
    const { state } = play(BLACK, occupancy, { from: 'g8', to: 'e5', captures: ['e5'] })
    expect(state.promotions[WHITE]).toEqual([])
  })
})
describe('templar riposte', () => {
  const lines: SquareOccupant = {
    d4: { side: WHITE, piece: MARSHAL },
    d8: { side: WHITE, piece: HERALD },
    f11: { side: BLACK, piece: TEMPLAR }
  }
  const take: Move = { from: 'f11', to: 'd8', captures: ['d8'] }
  it('arms the riposte by capturing on a clear line of the enemy marshal', () => {
    expect(play(BLACK, lines, take).state.riposte).toBe(true)
  })
  it('does not arm it when the line is blocked', () => {
    const blocked: SquareOccupant = { ...lines, d6: { side: WHITE, piece: LEGIONARY } }
    expect(play(BLACK, blocked, take).state.riposte).toBe(false)
  })
  it('does not arm it by capturing off the lines', () => {
    const off: SquareOccupant = {
      d4: { side: WHITE, piece: MARSHAL },
      m1: { side: WHITE, piece: HERALD },
      j3: { side: BLACK, piece: TEMPLAR }
    }
    expect(play(BLACK, off, { from: 'j3', to: 'm1', captures: ['m1'] }).state.riposte).toBe(false)
  })
})
describe('templar progress and slots', () => {
  const fallen: SquareOccupant = {
    e5: { side: WHITE, piece: TEMPLAR },
    g8: { side: BLACK, piece: TEMPLAR }
  }
  const take: Move = { from: 'g8', to: 'e5', captures: ['e5'] }
  it('adds to the no-progress counter with a quiet leap', () => {
    const occupancy: SquareOccupant = { g7: { side: WHITE, piece: TEMPLAR } }
    const { state } = play(WHITE, occupancy, { from: 'g7', to: 'i10' })
    expect(state.noProgress.count).toBeGreaterThan(5)
  })
  it('resets the no-progress counter with a capture', () => {
    const occupancy: SquareOccupant = {
      g7: { side: WHITE, piece: TEMPLAR },
      i10: { side: BLACK, piece: HERALD }
    }
    const { state } = play(WHITE, occupancy, { from: 'g7', to: 'i10', captures: ['i10'] })
    expect(state.noProgress.count).toBe(0)
  })
  it('opens a templar slot on the file it dies on', () => {
    const { state } = play(BLACK, fallen, take)
    expect(state.promotions[WHITE]).toEqual([{ file: 4, piece: [TEMPLAR] }])
  })
  it('adds a second fallen templar to the same slot', () => {
    const { state } = play(BLACK, fallen, take, slots({ file: 4, piece: [TEMPLAR] }))
    expect(state.promotions[WHITE]).toEqual([{ file: 4, piece: [TEMPLAR, TEMPLAR] }])
  })
})
describe('marshal and emperor slots', () => {
  const quiet: Move = { from: 'g8', to: 'i11' }
  const take: Move = { from: 'g8', to: 'e5', captures: ['e5'] }
  it('opens a marshal slot only once the marshal dies', () => {
    const occupancy: SquareOccupant = {
      e5: { side: WHITE, piece: MARSHAL },
      g8: { side: BLACK, piece: TEMPLAR }
    }
    expect(play(BLACK, occupancy, quiet).state.promotions[WHITE]).toEqual([])
    expect(play(BLACK, occupancy, take).state.promotions[WHITE]).toEqual([
      { file: 4, piece: [MARSHAL] }
    ])
  })
  it('opens an emperor slot only once the emperor dies', () => {
    const occupancy: SquareOccupant = {
      e5: { side: WHITE, piece: EMPEROR, awake: true },
      g8: { side: BLACK, piece: TEMPLAR }
    }
    expect(play(BLACK, occupancy, quiet).state.promotions[WHITE]).toEqual([])
    expect(play(BLACK, occupancy, take).state.promotions[WHITE]).toEqual([
      { file: 4, piece: [EMPEROR] }
    ])
  })
})
describe('legionary riposte and progress', () => {
  it('arms the riposte with an ordinary capture on a clear line of the enemy marshal', () => {
    const occupancy: SquareOccupant = {
      d4: { side: WHITE, piece: MARSHAL },
      d8: { side: WHITE, piece: HERALD },
      c9: { side: BLACK, piece: LEGIONARY }
    }
    const take: Move = { from: 'c9', to: 'd8', captures: ['d8'] }
    expect(play(BLACK, occupancy, take).state.riposte).toBe(true)
  })
  it('resets the no-progress counter when it promotes in place', () => {
    const waiting: SquareOccupant = { e13: { side: WHITE, piece: LEGIONARY } }
    const move: Move = { from: 'e13', to: 'e13', promotesTo: MAGE }
    const { state } = play(WHITE, waiting, move, slots({ file: 4, piece: [MAGE] }))
    expect(state.noProgress.count).toBe(0)
  })
  it('reads the no-progress limit again from the pieces left, 158 turns for three', () => {
    const step = play(WHITE, { e3: { side: WHITE, piece: LEGIONARY } }, { from: 'e3', to: 'e4' })
    const capture = play(
      WHITE,
      { g7: { side: WHITE, piece: TEMPLAR }, i10: { side: BLACK, piece: HERALD } },
      { from: 'g7', to: 'i10', captures: ['i10'] }
    )
    expect(step.state.noProgress).toEqual({ count: 0, limit: 158 * 2 })
    expect(capture.state.noProgress).toEqual({ count: 0, limit: 158 * 2 })
  })
})