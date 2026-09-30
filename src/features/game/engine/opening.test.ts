import { describe, it, expect } from 'vitest'
import { FILES } from '@/constants/board'
import { WHITE, BLACK } from '@/constants/player'
import { TEMPLAR, LEGIONARY } from '@/constants/piece'
import { opening } from './opening'

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
    const { occupancy } = opening()
    const templars = Object.fromEntries(
      Object.entries(occupancy).filter(([, { piece }]) => piece === TEMPLAR)
    )
    expect(templars).toEqual({
      b1: { side: WHITE, piece: TEMPLAR },
      l1: { side: WHITE, piece: TEMPLAR },
      b13: { side: BLACK, piece: TEMPLAR },
      l13: { side: BLACK, piece: TEMPLAR }
    })
  })
})