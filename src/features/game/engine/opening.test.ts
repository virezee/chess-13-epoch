import type { PieceName, SquareOccupant } from '@/types/material'
import { describe, it, expect } from 'vitest'
import { FILES } from '@/constants/board'
import { WHITE, BLACK } from '@/constants/player'
import {
  EMPEROR,
  MARSHAL,
  ASSASSIN,
  SENTINEL,
  MAGE,
  HERALD,
  TEMPLAR,
  LEGIONARY
} from '@/constants/piece'
import { opening } from './opening'

const placed = (name: PieceName): SquareOccupant =>
  Object.fromEntries(Object.entries(opening().occupancy).filter(([, { piece }]) => piece === name))
describe('opening placement', () => {
  it('fills rank 3 with white legionaries and rank 11 with black ones, and nowhere else', () => {
    const { occupancy } = opening()
    for (const file of FILES) {
      expect(occupancy[`${file}3`]).toEqual({ side: WHITE, piece: LEGIONARY })
      expect(occupancy[`${file}11`]).toEqual({ side: BLACK, piece: LEGIONARY })
    }
    expect(Object.values(occupancy).filter(({ piece }) => piece === LEGIONARY)).toHaveLength(26)
  })
  it('puts the templars on b1, l1, b13 and l13', () => {
    expect(placed(TEMPLAR)).toEqual({
      b1: { side: WHITE, piece: TEMPLAR },
      l1: { side: WHITE, piece: TEMPLAR },
      b13: { side: BLACK, piece: TEMPLAR },
      l13: { side: BLACK, piece: TEMPLAR }
    })
  })
  it('puts the heralds on c1, k1, c13 and k13', () => {
    expect(placed(HERALD)).toEqual({
      c1: { side: WHITE, piece: HERALD },
      k1: { side: WHITE, piece: HERALD },
      c13: { side: BLACK, piece: HERALD },
      k13: { side: BLACK, piece: HERALD }
    })
  })
  it('puts the mages on d1, j1, d13 and j13', () => {
    expect(placed(MAGE)).toEqual({
      d1: { side: WHITE, piece: MAGE },
      j1: { side: WHITE, piece: MAGE },
      d13: { side: BLACK, piece: MAGE },
      j13: { side: BLACK, piece: MAGE }
    })
  })
  it('puts the sentinels on a1, m1, a13 and m13', () => {
    expect(placed(SENTINEL)).toEqual({
      a1: { side: WHITE, piece: SENTINEL },
      m1: { side: WHITE, piece: SENTINEL },
      a13: { side: BLACK, piece: SENTINEL },
      m13: { side: BLACK, piece: SENTINEL }
    })
  })
})
describe('opening placement in the centre of the back rank', () => {
  it('puts the assassins on e1, i1, e13 and i13', () => {
    expect(placed(ASSASSIN)).toEqual({
      e1: { side: WHITE, piece: ASSASSIN },
      i1: { side: WHITE, piece: ASSASSIN },
      e13: { side: BLACK, piece: ASSASSIN },
      i13: { side: BLACK, piece: ASSASSIN }
    })
  })
  it('puts the marshals on h1 and h13', () => {
    expect(placed(MARSHAL)).toEqual({
      h1: { side: WHITE, piece: MARSHAL },
      h13: { side: BLACK, piece: MARSHAL }
    })
  })
  it('puts the emperors on f1 and f13, both dormant', () => {
    expect(placed(EMPEROR)).toEqual({
      f1: { side: WHITE, piece: EMPEROR, awake: false },
      f13: { side: BLACK, piece: EMPEROR, awake: false }
    })
  })
})