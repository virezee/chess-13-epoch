import type { SquareOccupant } from '@/types/material'
import type { Move, State, Result } from '@/types/game'
import { describe, it, expect } from 'vitest'
import { WHITE, BLACK } from '@/constants/player'
import { POPE, SENTINEL, HERALD, TEMPLAR, LEGIONARY } from '@/constants/piece'
import { CHECKMATE, STALEMATE, REPETITION, INSUFFICIENT_MATERIAL } from '@/constants/outcome'
import { opening } from './opening'
import { position } from './position'
import { legality } from './legality'
import { turn } from './turn'
import { result, repetitionKey } from './result'

const still = (): State => {
  const none = { left: false, right: false }
  return { ...opening().state, castlingSide: { [WHITE]: none, [BLACK]: none } }
}
const outcome = (occupancy: SquareOccupant): Result | null => {
  const next = position(WHITE, occupancy, still())
  return result(next, legality(next), opening().match)
}
const replay = (occupancy: SquareOccupant, moves: Move[]): Result | null => {
  const state = still()
  const match = { ...opening().match, history: [repetitionKey(WHITE, occupancy, state)] }
  let played = turn({ side: WHITE, occupancy, state, match }, null)
  for (const move of moves) played = turn(played.save, move)
  return played.result
}
describe('legionary en passant in repetition', () => {
  const occupancy: SquareOccupant = {
    a1: { side: WHITE, piece: POPE },
    e7: { side: WHITE, piece: LEGIONARY },
    d7: { side: BLACK, piece: LEGIONARY },
    m13: { side: BLACK, piece: POPE }
  }
  it('counts a position with the en passant right as a different position', () => {
    const { state } = opening()
    const right = { ...state, enPassant: { target: 'e6', captured: 'e7' } }
    expect(repetitionKey(BLACK, occupancy, right)).not.toBe(repetitionKey(BLACK, occupancy, state))
  })
})
describe('templar delivering mate', () => {
  it('mates a boxed pope, since a leap cannot be blocked', () => {
    const occupancy: SquareOccupant = {
      m1: { side: WHITE, piece: POPE },
      c10: { side: WHITE, piece: TEMPLAR },
      a13: { side: BLACK, piece: POPE },
      a12: { side: BLACK, piece: TEMPLAR },
      b12: { side: BLACK, piece: HERALD },
      b13: { side: BLACK, piece: SENTINEL }
    }
    const { match } = opening()
    const next = position(BLACK, occupancy, opening().state)
    const moves = legality(next)
    expect(moves).toEqual([])
    expect(result(next, moves, match)).toEqual({ winner: WHITE, reason: CHECKMATE })
  })
})
describe('templar repeating a position', () => {
  const occupancy: SquareOccupant = {
    a1: { side: WHITE, piece: POPE },
    g7: { side: WHITE, piece: TEMPLAR },
    c10: { side: BLACK, piece: TEMPLAR },
    m13: { side: BLACK, piece: POPE }
  }
  const round: Move[] = [
    { from: 'g7', to: 'i10' },
    { from: 'c10', to: 'a7' },
    { from: 'i10', to: 'g7' },
    { from: 'a7', to: 'c10' }
  ]
  it('loses for the side whose leap brings the position back a third time', () => {
    expect(replay(occupancy, round)).toBeNull()
    expect(replay(occupancy, [...round, ...round])).toEqual({ winner: WHITE, reason: REPETITION })
  })
})
describe('insufficient material with a legionary or a templar', () => {
  const popes: SquareOccupant = {
    a1: { side: WHITE, piece: POPE },
    m13: { side: BLACK, piece: POPE }
  }
  it('draws only when the two popes stand alone', () => {
    expect(outcome(popes)).toEqual({ winner: null, reason: INSUFFICIENT_MATERIAL })
    expect(outcome({ ...popes, e3: { side: WHITE, piece: LEGIONARY } })).toBeNull()
    expect(outcome({ ...popes, g7: { side: BLACK, piece: TEMPLAR } })).toBeNull()
  })
})
describe('stalemate with a legionary and a templar', () => {
  it('wins for the side left with a blocked legionary, a pinned templar and no pope move', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      a2: { side: WHITE, piece: LEGIONARY },
      c3: { side: WHITE, piece: TEMPLAR },
      a3: { side: BLACK, piece: LEGIONARY },
      c2: { side: BLACK, piece: LEGIONARY },
      f6: { side: BLACK, piece: HERALD },
      m13: { side: BLACK, piece: POPE }
    }
    expect(outcome(occupancy)).toEqual({ winner: WHITE, reason: STALEMATE })
  })
})