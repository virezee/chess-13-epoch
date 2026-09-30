import { describe, it, expect } from 'vitest'
import { MAGE, HERALD, TEMPLAR, LEGIONARY, VALUE } from './piece'

describe('piece values', () => {
  it('prices the legionary at 2, enhanced or restricted', () => {
    expect(VALUE[LEGIONARY]).toEqual({ enhanced: 2, restricted: 2 })
  })
  it('prices the templar at 7 enhanced and 5 restricted', () => {
    expect(VALUE[TEMPLAR]).toEqual({ enhanced: 7, restricted: 5 })
  })
  it('prices the herald at 7 enhanced and 5 restricted', () => {
    expect(VALUE[HERALD]).toEqual({ enhanced: 7, restricted: 5 })
  })
  it('prices the mage at 8 enhanced and 5 restricted', () => {
    expect(VALUE[MAGE]).toEqual({ enhanced: 8, restricted: 5 })
  })
})