// oxlint-disable max-lines
import type { Side, SquareOccupant } from '@/types/material'
import type { Move, State, Save } from '@/types/game'
import { describe, it, expect } from 'vitest'
import { WHITE, BLACK } from '@/constants/player'
import {
  POPE,
  EMPEROR,
  MARSHAL,
  SENTINEL,
  MAGE,
  HERALD,
  TEMPLAR,
  LEGIONARY
} from '@/constants/piece'
import { GUEST } from '@/constants/room'
import { position } from './position'
import { apply, canSwap, takeSwap } from './apply'
import { opening } from './opening'

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
const follow = (save: Save, move: Move): Save =>
  apply(position(save.side, save.occupancy, save.state), move, save.match)
const WINGS: SquareOccupant = {
  g1: { side: WHITE, piece: POPE },
  a1: { side: WHITE, piece: SENTINEL },
  m1: { side: WHITE, piece: SENTINEL },
  g13: { side: BLACK, piece: POPE },
  a13: { side: BLACK, piece: SENTINEL },
  m13: { side: BLACK, piece: SENTINEL }
}
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
  it('keeps the right when black swaps sides after a first-move burst', () => {
    const burst = play(WHITE, { e3: { side: WHITE, piece: LEGIONARY } }, { from: 'e3', to: 'e7' })
    const next = position(burst.side, burst.occupancy, burst.state)
    expect(canSwap(next, burst.match)).toBe(true)
    expect(takeSwap(next, burst.match, GUEST).state.enPassant).toEqual({
      target: 'e6',
      captured: 'e7'
    })
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
    expect(state.noProgress.count).toBe(6)
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
  it('does not arm the riposte when the line to the marshal is blocked', () => {
    const occupancy: SquareOccupant = {
      d4: { side: WHITE, piece: MARSHAL },
      d6: { side: WHITE, piece: LEGIONARY },
      d8: { side: WHITE, piece: HERALD },
      c9: { side: BLACK, piece: LEGIONARY }
    }
    const take: Move = { from: 'c9', to: 'd8', captures: ['d8'] }
    expect(play(BLACK, occupancy, take).state.riposte).toBe(false)
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
describe('herald riposte', () => {
  const lines: SquareOccupant = {
    d4: { side: WHITE, piece: MARSHAL },
    d8: { side: WHITE, piece: TEMPLAR },
    g11: { side: BLACK, piece: HERALD }
  }
  const take: Move = { from: 'g11', to: 'd8', captures: ['d8'] }
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
      m1: { side: WHITE, piece: TEMPLAR },
      j4: { side: BLACK, piece: HERALD }
    }
    expect(play(BLACK, off, { from: 'j4', to: 'm1', captures: ['m1'] }).state.riposte).toBe(false)
  })
})
describe('herald progress and slots', () => {
  const fallen: SquareOccupant = {
    e5: { side: WHITE, piece: HERALD },
    g8: { side: BLACK, piece: TEMPLAR }
  }
  const take: Move = { from: 'g8', to: 'e5', captures: ['e5'] }
  it('adds 1 to the no-progress counter with a quiet move', () => {
    const occupancy: SquareOccupant = { g7: { side: WHITE, piece: HERALD } }
    const { state } = play(WHITE, occupancy, { from: 'g7', to: 'j10' })
    expect(state.noProgress.count).toBe(6)
  })
  it('resets the no-progress counter with a capture and reads the limit again, 158 turns for three', () => {
    const occupancy: SquareOccupant = {
      g7: { side: WHITE, piece: HERALD },
      j10: { side: BLACK, piece: TEMPLAR }
    }
    const { state } = play(WHITE, occupancy, { from: 'g7', to: 'j10', captures: ['j10'] })
    expect(state.noProgress).toEqual({ count: 0, limit: 158 * 2 })
  })
  it('opens a herald slot on the file it dies on', () => {
    const { state } = play(BLACK, fallen, take)
    expect(state.promotions[WHITE]).toEqual([{ file: 4, piece: [HERALD] }])
  })
  it('adds a second fallen herald to the same slot', () => {
    const { state } = play(BLACK, fallen, take, slots({ file: 4, piece: [HERALD] }))
    expect(state.promotions[WHITE]).toEqual([{ file: 4, piece: [HERALD, HERALD] }])
  })
})
describe('mage blast', () => {
  it('destroys the pieces it blasts and leaves the mage on its square', () => {
    const occupancy: SquareOccupant = {
      e5: { side: WHITE, piece: MAGE },
      d6: { side: BLACK, piece: HERALD },
      f4: { side: BLACK, piece: TEMPLAR }
    }
    const blast: Move = { from: 'e5', to: 'e5', captures: ['d6', 'f4'] }
    const { occupancy: next } = play(WHITE, occupancy, blast)
    expect(next['e5']).toEqual({ side: WHITE, piece: MAGE })
    expect(next['d6']).toBeUndefined()
    expect(next['f4']).toBeUndefined()
  })
  it('never sets off a mage that dies, whether blasted or captured', () => {
    const blasted: SquareOccupant = {
      e5: { side: WHITE, piece: MAGE },
      d6: { side: BLACK, piece: MAGE },
      c7: { side: WHITE, piece: LEGIONARY }
    }
    const captured: SquareOccupant = {
      e5: { side: WHITE, piece: MAGE },
      d4: { side: BLACK, piece: LEGIONARY },
      g8: { side: BLACK, piece: TEMPLAR }
    }
    const blast = play(WHITE, blasted, { from: 'e5', to: 'e5', captures: ['d6'] })
    const take = play(BLACK, captured, { from: 'g8', to: 'e5', captures: ['e5'] })
    expect(blast.occupancy['c7']).toEqual({ side: WHITE, piece: LEGIONARY })
    expect(take.occupancy['d4']).toEqual({ side: BLACK, piece: LEGIONARY })
  })
})
describe('mage blast slots and castling', () => {
  it('opens a slot for every piece the blast destroys, its own side included', () => {
    const occupancy: SquareOccupant = {
      e5: { side: WHITE, piece: MAGE },
      d6: { side: BLACK, piece: HERALD },
      f4: { side: BLACK, piece: TEMPLAR },
      f6: { side: WHITE, piece: TEMPLAR },
      e6: { side: WHITE, piece: LEGIONARY }
    }
    const blast: Move = { from: 'e5', to: 'e5', captures: ['d6', 'e6', 'f4', 'f6'] }
    const { state } = play(WHITE, occupancy, blast)
    expect(state.promotions[BLACK]).toEqual([
      { file: 3, piece: [HERALD] },
      { file: 5, piece: [TEMPLAR] }
    ])
    expect(state.promotions[WHITE]).toEqual([{ file: 5, piece: [TEMPLAR] }])
  })
  it('takes away castling on the wing whose sentinel it destroys, on either side', () => {
    const enemy: SquareOccupant = {
      l2: { side: BLACK, piece: MAGE },
      m1: { side: WHITE, piece: SENTINEL }
    }
    const own: SquareOccupant = {
      l12: { side: BLACK, piece: MAGE },
      m13: { side: BLACK, piece: SENTINEL },
      k13: { side: WHITE, piece: HERALD }
    }
    const first = play(BLACK, enemy, { from: 'l2', to: 'l2', captures: ['m1'] })
    const second = play(BLACK, own, { from: 'l12', to: 'l12', captures: ['k13', 'm13'] })
    expect(first.state.castlingSide[WHITE]).toEqual({ left: true, right: false })
    expect(second.state.castlingSide[BLACK]).toEqual({ left: true, right: false })
  })
})
describe('mage riposte', () => {
  const lines: SquareOccupant = {
    d4: { side: WHITE, piece: MARSHAL },
    d8: { side: WHITE, piece: TEMPLAR },
    e9: { side: BLACK, piece: MAGE }
  }
  const blast: Move = { from: 'e9', to: 'e9', captures: ['d8'] }
  it('arms the riposte by blasting a piece on a clear line of the enemy marshal', () => {
    expect(play(BLACK, lines, blast).state.riposte).toBe(true)
  })
  it('does not arm it when the line is blocked, even by the mage itself', () => {
    const blocked: SquareOccupant = { ...lines, d6: { side: WHITE, piece: LEGIONARY } }
    const shield: SquareOccupant = {
      d4: { side: WHITE, piece: MARSHAL },
      d6: { side: BLACK, piece: MAGE },
      d7: { side: WHITE, piece: TEMPLAR }
    }
    const behind: Move = { from: 'd6', to: 'd6', captures: ['d7'] }
    expect(play(BLACK, blocked, blast).state.riposte).toBe(false)
    expect(play(BLACK, shield, behind).state.riposte).toBe(false)
  })
  it('counts the square the victim stood on, not the square of the mage', () => {
    const off: SquareOccupant = {
      d4: { side: WHITE, piece: MARSHAL },
      d10: { side: BLACK, piece: MAGE },
      c9: { side: WHITE, piece: TEMPLAR }
    }
    const move: Move = { from: 'd10', to: 'd10', captures: ['c9'] }
    expect(play(BLACK, off, move).state.riposte).toBe(false)
  })
  it('arms the riposte when only one of several blasted pieces lies on its lines', () => {
    const several: SquareOccupant = {
      d4: { side: WHITE, piece: MARSHAL },
      d8: { side: WHITE, piece: TEMPLAR },
      c9: { side: WHITE, piece: HERALD },
      c8: { side: BLACK, piece: MAGE }
    }
    const move: Move = { from: 'c8', to: 'c8', captures: ['c9', 'd8'] }
    expect(play(BLACK, several, move).state.riposte).toBe(true)
  })
})
describe('mage riposte on the board after the blast', () => {
  it('judges the line after the blast has cleared it', () => {
    const cleared: SquareOccupant = {
      d4: { side: WHITE, piece: MARSHAL },
      d6: { side: BLACK, piece: LEGIONARY },
      d7: { side: WHITE, piece: TEMPLAR },
      e7: { side: BLACK, piece: MAGE }
    }
    const move: Move = { from: 'e7', to: 'e7', captures: ['d6', 'd7'] }
    expect(play(BLACK, cleared, move).state.riposte).toBe(true)
  })
  it('ignores the pieces of its own side that the restricted blast destroys', () => {
    const own: SquareOccupant = {
      h8: { side: BLACK, piece: MARSHAL },
      e5: { side: WHITE, piece: MAGE },
      f6: { side: WHITE, piece: LEGIONARY },
      e4: { side: BLACK, piece: HERALD }
    }
    const move: Move = { from: 'e5', to: 'e5', captures: ['f6', 'e4'] }
    expect(play(WHITE, own, move).state.riposte).toBe(false)
  })
  it('gives its own marshal no riposte for its own pieces the restricted blast destroys', () => {
    const own: SquareOccupant = {
      d4: { side: WHITE, piece: MARSHAL },
      d8: { side: WHITE, piece: TEMPLAR },
      e9: { side: WHITE, piece: MAGE },
      f10: { side: BLACK, piece: HERALD }
    }
    const blasted = play(WHITE, own, { from: 'e9', to: 'e9', captures: ['d8', 'f10'] })
    const next = position(blasted.side, blasted.occupancy, blasted.state)
    expect(apply(next, { from: 'a13', to: 'b13' }, blasted.match).state.riposte).toBe(false)
  })
})
describe('mage progress and slots', () => {
  const fallen: SquareOccupant = {
    e5: { side: WHITE, piece: MAGE },
    g8: { side: BLACK, piece: TEMPLAR }
  }
  const take: Move = { from: 'g8', to: 'e5', captures: ['e5'] }
  it('adds 1 to the no-progress counter with a quiet move', () => {
    const occupancy: SquareOccupant = { g7: { side: WHITE, piece: MAGE } }
    const { state } = play(WHITE, occupancy, { from: 'g7', to: 'h8' })
    expect(state.noProgress.count).toBe(6)
  })
  it('resets the no-progress counter with a blast and reads the limit again, 158 turns for three', () => {
    const occupancy: SquareOccupant = {
      g7: { side: WHITE, piece: MAGE },
      h8: { side: BLACK, piece: HERALD },
      g8: { side: BLACK, piece: LEGIONARY }
    }
    const { state } = play(WHITE, occupancy, { from: 'g7', to: 'g7', captures: ['h8', 'g8'] })
    expect(state.noProgress).toEqual({ count: 0, limit: 158 * 2 })
  })
  it('opens a mage slot on the file it dies on', () => {
    const { state } = play(BLACK, fallen, take)
    expect(state.promotions[WHITE]).toEqual([{ file: 4, piece: [MAGE] }])
  })
  it('adds a second fallen mage to the same slot', () => {
    const { state } = play(BLACK, fallen, take, slots({ file: 4, piece: [MAGE] }))
    expect(state.promotions[WHITE]).toEqual([{ file: 4, piece: [MAGE, MAGE] }])
  })
})
describe('sentinel riposte', () => {
  const lines: SquareOccupant = {
    d4: { side: WHITE, piece: MARSHAL },
    d8: { side: WHITE, piece: TEMPLAR },
    h8: { side: BLACK, piece: SENTINEL }
  }
  const take: Move = { from: 'h8', to: 'd8', captures: ['d8'] }
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
      m1: { side: WHITE, piece: TEMPLAR },
      m5: { side: BLACK, piece: SENTINEL }
    }
    expect(play(BLACK, off, { from: 'm5', to: 'm1', captures: ['m1'] }).state.riposte).toBe(false)
  })
})
describe('sentinel progress and slots', () => {
  const fallen: SquareOccupant = {
    e5: { side: WHITE, piece: SENTINEL },
    g8: { side: BLACK, piece: TEMPLAR }
  }
  const take: Move = { from: 'g8', to: 'e5', captures: ['e5'] }
  it('adds 1 to the no-progress counter with a quiet move', () => {
    const occupancy: SquareOccupant = { g7: { side: WHITE, piece: SENTINEL } }
    const { state } = play(WHITE, occupancy, { from: 'g7', to: 'g10' })
    expect(state.noProgress.count).toBe(6)
  })
  it('resets the no-progress counter with a capture and reads the limit again, 158 turns for three', () => {
    const occupancy: SquareOccupant = {
      g7: { side: WHITE, piece: SENTINEL },
      g11: { side: BLACK, piece: TEMPLAR }
    }
    const { state } = play(WHITE, occupancy, { from: 'g7', to: 'g11', captures: ['g11'] })
    expect(state.noProgress).toEqual({ count: 0, limit: 158 * 2 })
  })
  it('opens a sentinel slot on the file it dies on', () => {
    const { state } = play(BLACK, fallen, take)
    expect(state.promotions[WHITE]).toEqual([{ file: 4, piece: [SENTINEL] }])
  })
  it('adds a second fallen sentinel to the same slot', () => {
    const { state } = play(BLACK, fallen, take, slots({ file: 4, piece: [SENTINEL] }))
    expect(state.promotions[WHITE]).toEqual([{ file: 4, piece: [SENTINEL, SENTINEL] }])
  })
})
describe('sentinel and castling rights', () => {
  it('loses the right on its own wing once it moves, for good even if it comes back', () => {
    const start: Save = { ...opening(), occupancy: WINGS }
    const moved = follow(start, { from: 'a1', to: 'a3' })
    const reply = follow(moved, { from: 'm13', to: 'm11' })
    const back = follow(reply, { from: 'a3', to: 'a1' })
    expect(moved.state.castlingSide[WHITE]).toEqual({ left: false, right: true })
    expect(reply.state.castlingSide[BLACK]).toEqual({ left: true, right: false })
    expect(back.state.castlingSide[WHITE]).toEqual({ left: false, right: true })
  })
  it('loses the right when an enemy captures it on its corner', () => {
    const occupancy: SquareOccupant = { ...WINGS, m7: { side: BLACK, piece: SENTINEL } }
    const start: Save = { ...opening(), side: BLACK, occupancy }
    const taken = follow(start, { from: 'm7', to: 'm1', captures: ['m1'] })
    expect(taken.state.castlingSide[WHITE]).toEqual({ left: true, right: false })
  })
})
describe('sentinel moved by castling', () => {
  it('lands beside the pope, from a1 to e1 or from m1 to i1, and ends both rights', () => {
    const start: Save = { ...opening(), occupancy: WINGS }
    const left = follow(start, { from: 'g1', to: 'd1', sentinel: { from: 'a1', to: 'e1' } })
    const right = follow(start, { from: 'g1', to: 'j1', sentinel: { from: 'm1', to: 'i1' } })
    expect(left.occupancy['e1']).toEqual({ side: WHITE, piece: SENTINEL })
    expect(left.occupancy['a1']).toBeUndefined()
    expect(right.occupancy['i1']).toEqual({ side: WHITE, piece: SENTINEL })
    expect(right.occupancy['m1']).toBeUndefined()
    expect(left.state.castlingSide[WHITE]).toEqual({ left: false, right: false })
  })
  it('lands beside the pope for black, from a13 to e13 or from m13 to i13', () => {
    const start: Save = { ...opening(), side: BLACK, occupancy: WINGS }
    const left = follow(start, { from: 'g13', to: 'd13', sentinel: { from: 'a13', to: 'e13' } })
    const right = follow(start, { from: 'g13', to: 'j13', sentinel: { from: 'm13', to: 'i13' } })
    expect(left.occupancy['e13']).toEqual({ side: BLACK, piece: SENTINEL })
    expect(right.occupancy['i13']).toEqual({ side: BLACK, piece: SENTINEL })
  })
})