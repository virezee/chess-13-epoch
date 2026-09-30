import type { Side, SquareOccupant } from '@/types/material'
import type { Move, State } from '@/types/game'
import { describe, it, expect } from 'vitest'
import { WHITE, BLACK } from '@/constants/player'
import { POPE, MARSHAL, MAGE, HERALD, TEMPLAR, LEGIONARY } from '@/constants/piece'
import { position } from './position'
import { opening } from './opening'
import { notation } from './notation'

const write = (
  side: Side,
  occupancy: SquareOccupant,
  move: Move,
  changes: Partial<State> = {}
): string => {
  const board: SquareOccupant = {
    a1: { side: WHITE, piece: POPE },
    a13: { side: BLACK, piece: POPE },
    ...occupancy
  }
  return notation(position(side, board, { ...opening().state, ...changes }), move)
}
const slots = (...slot: State['promotions'][typeof WHITE]): Partial<State> => ({
  promotions: { [WHITE]: slot, [BLACK]: [] }
})
describe('legionary notation', () => {
  it('writes no letter, a dash for a move and an x for a capture', () => {
    const capture: SquareOccupant = {
      e8: { side: WHITE, piece: LEGIONARY },
      d9: { side: BLACK, piece: MAGE }
    }
    expect(write(WHITE, { e3: { side: WHITE, piece: LEGIONARY } }, { from: 'e3', to: 'e7' })).toBe(
      'e3-e7'
    )
    expect(write(WHITE, capture, { from: 'e8', to: 'd9', captures: ['d9'] })).toBe('e8xd9')
  })
  it('marks en passant after the move', () => {
    const passage: SquareOccupant = {
      d7: { side: BLACK, piece: LEGIONARY },
      e7: { side: WHITE, piece: LEGIONARY }
    }
    expect(write(BLACK, passage, { from: 'd7', to: 'e6', captures: ['e7'] })).toBe('d7xe6 e.p.')
  })
  it('writes the claimed piece, and the slot file when two slots offer it', () => {
    const arriving: SquareOccupant = { e12: { side: WHITE, piece: LEGIONARY } }
    const move: Move = { from: 'e12', to: 'e13', promotesTo: MAGE }
    const one = slots({ file: 4, piece: [MAGE] })
    const two = slots({ file: 3, piece: [MAGE] }, { file: 5, piece: [MAGE] })
    expect(write(WHITE, arriving, move, one)).toBe('e12-e13=G')
    expect(write(WHITE, arriving, move, two)).toBe('e12-e13=Gd')
  })
  it('marks a move made inside the command zone', () => {
    const enhanced: SquareOccupant = {
      e7: { side: WHITE, piece: LEGIONARY },
      e5: { side: WHITE, piece: MARSHAL }
    }
    expect(write(WHITE, enhanced, { from: 'e7', to: 'e9' })).toBe('e7-e9^')
  })
})
describe('templar notation', () => {
  it('writes T, a dash for a move and an x for a capture', () => {
    const capture: SquareOccupant = {
      g7: { side: WHITE, piece: TEMPLAR },
      i10: { side: BLACK, piece: HERALD }
    }
    expect(write(WHITE, { g7: { side: WHITE, piece: TEMPLAR } }, { from: 'g7', to: 'i10' })).toBe(
      'Tg7-i10'
    )
    expect(write(WHITE, capture, { from: 'g7', to: 'i10', captures: ['i10'] })).toBe('Tg7xi10')
  })
  it('marks a leap made inside the command zone', () => {
    const enhanced: SquareOccupant = {
      g7: { side: WHITE, piece: TEMPLAR },
      g5: { side: WHITE, piece: MARSHAL }
    }
    expect(write(WHITE, enhanced, { from: 'g7', to: 'h9' })).toBe('Tg7-h9^')
  })
})
describe('herald notation', () => {
  it('writes H for either side, a dash for a move and an x for a capture', () => {
    const capture: SquareOccupant = {
      g7: { side: WHITE, piece: HERALD },
      j10: { side: BLACK, piece: TEMPLAR }
    }
    expect(write(BLACK, { g7: { side: BLACK, piece: HERALD } }, { from: 'g7', to: 'd4' })).toBe(
      'Hg7-d4'
    )
    expect(write(WHITE, capture, { from: 'g7', to: 'j10', captures: ['j10'] })).toBe('Hg7xj10')
  })
  it('marks a step capture made inside the command zone', () => {
    const enhanced: SquareOccupant = {
      g7: { side: WHITE, piece: HERALD },
      g5: { side: WHITE, piece: MARSHAL },
      g8: { side: BLACK, piece: MAGE }
    }
    expect(write(WHITE, enhanced, { from: 'g7', to: 'g8', captures: ['g8'] })).toBe('Hg7xg8^')
  })
})