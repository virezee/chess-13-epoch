// oxlint-disable import/max-dependencies, max-lines
import type { SquareOccupant } from '@/types/material'
import type { Move, State, Match, Result } from '@/types/game'
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
import {
  CHECKMATE,
  STALEMATE,
  REPETITION,
  RESIGNATION,
  ABANDONMENT,
  NO_PROGRESS,
  INSUFFICIENT_MATERIAL,
  AGREEMENT
} from '@/constants/outcome'
import { legality } from './legality'
import { position } from './position'
import { opening } from './opening'
import { repetitionKey, result } from './result'
import { turn } from './turn'

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
describe('legionary delivering mate', () => {
  it('mates a boxed pope from one tile diagonally below it, with a second one guarding', () => {
    const occupancy: SquareOccupant = {
      m1: { side: WHITE, piece: POPE },
      b12: { side: WHITE, piece: LEGIONARY },
      c11: { side: WHITE, piece: LEGIONARY },
      a13: { side: BLACK, piece: POPE },
      a12: { side: BLACK, piece: LEGIONARY },
      b13: { side: BLACK, piece: LEGIONARY }
    }
    const next = position(BLACK, occupancy, still())
    const moves = legality(next)
    expect(moves).toEqual([])
    expect(result(next, moves, opening().match)).toEqual({ winner: WHITE, reason: CHECKMATE })
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
describe('herald delivering mate or repeating a position', () => {
  it('mates a lone pope in the corner from 6 tiles away', () => {
    const occupancy: SquareOccupant = {
      m1: { side: WHITE, piece: POPE },
      g7: { side: WHITE, piece: HERALD },
      b11: { side: WHITE, piece: LEGIONARY },
      c12: { side: WHITE, piece: LEGIONARY },
      a13: { side: BLACK, piece: POPE }
    }
    const next = position(BLACK, occupancy, still())
    const moves = legality(next)
    expect(moves).toEqual([])
    expect(result(next, moves, opening().match)).toEqual({ winner: WHITE, reason: CHECKMATE })
  })
  it('loses for the side whose move brings the position back a third time', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      d3: { side: WHITE, piece: HERALD },
      j10: { side: BLACK, piece: HERALD },
      m13: { side: BLACK, piece: POPE }
    }
    const round: Move[] = [
      { from: 'd3', to: 'd4' },
      { from: 'j10', to: 'j9' },
      { from: 'd4', to: 'd3' },
      { from: 'j9', to: 'j10' }
    ]
    expect(replay(occupancy, round)).toBeNull()
    expect(replay(occupancy, [...round, ...round])).toEqual({ winner: WHITE, reason: REPETITION })
  })
})
describe('herald insufficient material and stalemate', () => {
  it('keeps the game going while a herald is on the board', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      e5: { side: WHITE, piece: HERALD },
      m13: { side: BLACK, piece: POPE }
    }
    expect(outcome(occupancy)).toBeNull()
  })
  it('wins for the side whose pinned herald and pope have no move', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      b1: { side: WHITE, piece: HERALD },
      c1: { side: BLACK, piece: SENTINEL },
      a3: { side: BLACK, piece: LEGIONARY },
      b3: { side: BLACK, piece: LEGIONARY },
      m13: { side: BLACK, piece: POPE }
    }
    expect(outcome(occupancy)).toEqual({ winner: WHITE, reason: STALEMATE })
  })
})
describe('mage delivering mate or repeating a position', () => {
  it('mates a pope boxed in the corner from the tile beside it', () => {
    const occupancy: SquareOccupant = {
      m1: { side: WHITE, piece: POPE },
      b12: { side: WHITE, piece: MAGE },
      a11: { side: WHITE, piece: LEGIONARY },
      a13: { side: BLACK, piece: POPE }
    }
    const next = position(BLACK, occupancy, still())
    const moves = legality(next)
    expect(moves).toEqual([])
    expect(result(next, moves, opening().match)).toEqual({ winner: WHITE, reason: CHECKMATE })
  })
  it('loses for the side whose move brings the position back a third time', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      d3: { side: WHITE, piece: MAGE },
      j10: { side: BLACK, piece: MAGE },
      m13: { side: BLACK, piece: POPE }
    }
    const round: Move[] = [
      { from: 'd3', to: 'd4' },
      { from: 'j10', to: 'j9' },
      { from: 'd4', to: 'd3' },
      { from: 'j9', to: 'j10' }
    ]
    expect(replay(occupancy, round)).toBeNull()
    expect(replay(occupancy, [...round, ...round])).toEqual({ winner: WHITE, reason: REPETITION })
  })
})
describe('mage insufficient material and stalemate', () => {
  it('keeps the game going while a mage is on the board', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      e5: { side: WHITE, piece: MAGE },
      m13: { side: BLACK, piece: POPE }
    }
    expect(outcome(occupancy)).toBeNull()
  })
  it('wins for the side whose boxed mage may not blast beside its own pope', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      a2: { side: WHITE, piece: MAGE },
      a3: { side: BLACK, piece: LEGIONARY },
      b1: { side: BLACK, piece: TEMPLAR },
      b2: { side: BLACK, piece: TEMPLAR },
      b3: { side: BLACK, piece: LEGIONARY },
      c2: { side: BLACK, piece: LEGIONARY },
      m13: { side: BLACK, piece: POPE }
    }
    expect(outcome(occupancy)).toEqual({ winner: WHITE, reason: STALEMATE })
  })
})
describe('sentinel delivering mate or repeating a position', () => {
  it('mates along the back rank from 6 tiles away, further than it could move', () => {
    const occupancy: SquareOccupant = {
      m1: { side: WHITE, piece: POPE },
      g13: { side: WHITE, piece: SENTINEL },
      a13: { side: BLACK, piece: POPE },
      a12: { side: BLACK, piece: LEGIONARY },
      b12: { side: BLACK, piece: LEGIONARY }
    }
    const next = position(BLACK, occupancy, still())
    const moves = legality(next)
    expect(moves).toEqual([])
    expect(result(next, moves, opening().match)).toEqual({ winner: WHITE, reason: CHECKMATE })
  })
  it('loses for the side whose move brings the position back a third time', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      d3: { side: WHITE, piece: SENTINEL },
      j10: { side: BLACK, piece: SENTINEL },
      m13: { side: BLACK, piece: POPE }
    }
    const round: Move[] = [
      { from: 'd3', to: 'd4' },
      { from: 'j10', to: 'j9' },
      { from: 'd4', to: 'd3' },
      { from: 'j9', to: 'j10' }
    ]
    expect(replay(occupancy, round)).toBeNull()
    expect(replay(occupancy, [...round, ...round])).toEqual({ winner: WHITE, reason: REPETITION })
  })
})
describe('sentinel insufficient material and stalemate', () => {
  it('keeps the game going while a sentinel is on the board', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      e5: { side: WHITE, piece: SENTINEL },
      m13: { side: BLACK, piece: POPE }
    }
    expect(outcome(occupancy)).toBeNull()
  })
  it('wins for the side whose pinned sentinel and pope have no move', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      b2: { side: WHITE, piece: SENTINEL },
      e5: { side: BLACK, piece: HERALD },
      b3: { side: BLACK, piece: LEGIONARY },
      c2: { side: BLACK, piece: LEGIONARY },
      m13: { side: BLACK, piece: POPE }
    }
    expect(outcome(occupancy)).toEqual({ winner: WHITE, reason: STALEMATE })
  })
})
describe('assassin delivering mate or repeating a position', () => {
  it('mates a pope in the corner by aiming at the corner itself', () => {
    const occupancy: SquareOccupant = {
      m1: { side: WHITE, piece: POPE },
      a7: { side: WHITE, piece: ASSASSIN },
      c11: { side: WHITE, piece: LEGIONARY },
      c12: { side: WHITE, piece: LEGIONARY },
      a13: { side: BLACK, piece: POPE }
    }
    const next = position(BLACK, occupancy, still())
    const moves = legality(next)
    expect(moves).toEqual([])
    expect(result(next, moves, opening().match)).toEqual({ winner: WHITE, reason: CHECKMATE })
  })
  it('loses for the side whose move brings the position back a third time', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      d3: { side: WHITE, piece: ASSASSIN },
      j10: { side: BLACK, piece: ASSASSIN },
      m13: { side: BLACK, piece: POPE }
    }
    const round: Move[] = [
      { from: 'd3', to: 'd4' },
      { from: 'j10', to: 'j9' },
      { from: 'd4', to: 'd3' },
      { from: 'j9', to: 'j10' }
    ]
    expect(replay(occupancy, round)).toBeNull()
    expect(replay(occupancy, [...round, ...round])).toEqual({ winner: WHITE, reason: REPETITION })
  })
})
describe('assassin insufficient material and stalemate', () => {
  it('keeps the game going while an assassin is on the board', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      e5: { side: WHITE, piece: ASSASSIN },
      m13: { side: BLACK, piece: POPE }
    }
    expect(outcome(occupancy)).toBeNull()
  })
  it('wins for the side whose pinned assassin and pope have no move', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      b2: { side: WHITE, piece: ASSASSIN },
      c3: { side: BLACK, piece: HERALD },
      b3: { side: BLACK, piece: LEGIONARY },
      c2: { side: BLACK, piece: LEGIONARY },
      e5: { side: BLACK, piece: LEGIONARY },
      m13: { side: BLACK, piece: POPE }
    }
    expect(outcome(occupancy)).toEqual({ winner: WHITE, reason: STALEMATE })
  })
})
describe('marshal riposte in repetition', () => {
  it('counts a position with the riposte right as a different position', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      d3: { side: WHITE, piece: MARSHAL },
      m13: { side: BLACK, piece: POPE }
    }
    const { state } = opening()
    const armed = { ...state, riposte: true }
    expect(repetitionKey(WHITE, occupancy, armed)).not.toBe(repetitionKey(WHITE, occupancy, state))
  })
})
describe('marshal delivering mate or repeating a position', () => {
  it('mates on its own, since it needs no support against the pope', () => {
    const occupancy: SquareOccupant = {
      m1: { side: WHITE, piece: POPE },
      g13: { side: WHITE, piece: MARSHAL },
      a13: { side: BLACK, piece: POPE },
      a12: { side: BLACK, piece: LEGIONARY },
      b12: { side: BLACK, piece: LEGIONARY }
    }
    const next = position(BLACK, occupancy, still())
    const moves = legality(next)
    expect(moves).toEqual([])
    expect(result(next, moves, opening().match)).toEqual({ winner: WHITE, reason: CHECKMATE })
  })
  it('loses for the side whose move brings the position back a third time', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      b5: { side: WHITE, piece: MARSHAL },
      l9: { side: BLACK, piece: MARSHAL },
      m13: { side: BLACK, piece: POPE }
    }
    const round: Move[] = [
      { from: 'b5', to: 'b6' },
      { from: 'l9', to: 'l8' },
      { from: 'b6', to: 'b5' },
      { from: 'l8', to: 'l9' }
    ]
    expect(replay(occupancy, round)).toBeNull()
    expect(replay(occupancy, [...round, ...round])).toEqual({ winner: WHITE, reason: REPETITION })
  })
})
describe('marshal insufficient material and stalemate', () => {
  it('keeps the game going while a marshal is on the board', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      e4: { side: WHITE, piece: MARSHAL },
      m13: { side: BLACK, piece: POPE }
    }
    expect(outcome(occupancy)).toBeNull()
  })
  it('wins for the side whose pinned marshal cannot take the unsupported pinner', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      b2: { side: WHITE, piece: MARSHAL },
      c3: { side: BLACK, piece: HERALD },
      b3: { side: BLACK, piece: LEGIONARY },
      c2: { side: BLACK, piece: LEGIONARY },
      m13: { side: BLACK, piece: POPE }
    }
    expect(outcome(occupancy)).toEqual({ winner: WHITE, reason: STALEMATE })
  })
})
describe('emperor delivering mate or repeating a position', () => {
  it('mates on its own once awake', () => {
    const occupancy: SquareOccupant = {
      m1: { side: WHITE, piece: POPE },
      g13: { side: WHITE, piece: EMPEROR, awake: true },
      a13: { side: BLACK, piece: POPE },
      a12: { side: BLACK, piece: LEGIONARY },
      b12: { side: BLACK, piece: LEGIONARY }
    }
    const next = position(BLACK, occupancy, still())
    const moves = legality(next)
    expect(moves).toEqual([])
    expect(result(next, moves, opening().match)).toEqual({ winner: WHITE, reason: CHECKMATE })
  })
  it('loses for the side whose move brings the position back a third time', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      b5: { side: WHITE, piece: EMPEROR, awake: true },
      l9: { side: BLACK, piece: EMPEROR, awake: true },
      m13: { side: BLACK, piece: POPE }
    }
    const round: Move[] = [
      { from: 'b5', to: 'b6' },
      { from: 'l9', to: 'l8' },
      { from: 'b6', to: 'b5' },
      { from: 'l8', to: 'l9' }
    ]
    expect(replay(occupancy, round)).toBeNull()
    expect(replay(occupancy, [...round, ...round])).toEqual({ winner: WHITE, reason: REPETITION })
  })
  it('lets the game go on once an emperor is captured', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      d4: { side: WHITE, piece: EMPEROR, awake: true },
      d8: { side: BLACK, piece: EMPEROR, awake: true },
      l13: { side: BLACK, piece: POPE }
    }
    expect(replay(occupancy, [{ from: 'd4', to: 'd8', captures: ['d8'] }])).toBeNull()
  })
})
describe('emperor insufficient material and stalemate', () => {
  it('keeps the game going while an emperor is on the board, awake or dormant', () => {
    const popes: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      m13: { side: BLACK, piece: POPE }
    }
    expect(outcome({ ...popes, e4: { side: WHITE, piece: EMPEROR, awake: true } })).toBeNull()
    expect(outcome({ ...popes, e4: { side: WHITE, piece: EMPEROR, awake: false } })).toBeNull()
  })
  it('counts a dormant emperor as having no move, so the stalemate stands', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      b2: { side: WHITE, piece: MARSHAL },
      f5: { side: WHITE, piece: EMPEROR, awake: false },
      c3: { side: BLACK, piece: HERALD },
      b3: { side: BLACK, piece: LEGIONARY },
      c2: { side: BLACK, piece: LEGIONARY },
      m13: { side: BLACK, piece: POPE }
    }
    expect(outcome(occupancy)).toEqual({ winner: WHITE, reason: STALEMATE })
  })
})
describe('pope repeating a position', () => {
  it('loses for the side whose step brings the position back a third time', () => {
    const occupancy: SquareOccupant = {
      a1: { side: WHITE, piece: POPE },
      e3: { side: WHITE, piece: LEGIONARY },
      m13: { side: BLACK, piece: POPE }
    }
    const round: Move[] = [
      { from: 'a1', to: 'a2' },
      { from: 'm13', to: 'm12' },
      { from: 'a2', to: 'a1' },
      { from: 'm12', to: 'm13' }
    ]
    expect(replay(occupancy, round)).toBeNull()
    expect(replay(occupancy, [...round, ...round])).toEqual({ winner: WHITE, reason: REPETITION })
  })
})
describe('pope castling rights in repetition', () => {
  it('counts a position with a castling right as a different position', () => {
    const occupancy: SquareOccupant = {
      g1: { side: WHITE, piece: POPE },
      a1: { side: WHITE, piece: SENTINEL },
      m1: { side: WHITE, piece: SENTINEL },
      m13: { side: BLACK, piece: POPE }
    }
    expect(repetitionKey(WHITE, occupancy, opening().state)).not.toBe(
      repetitionKey(WHITE, occupancy, still())
    )
  })
})
describe('no-progress draw', () => {
  const popes: SquareOccupant = {
    a1: { side: WHITE, piece: POPE },
    m13: { side: BLACK, piece: POPE }
  }
  const brink = (occupancy: SquareOccupant, move: Move): Result | null => {
    const state = { ...still(), noProgress: { count: 119, limit: 120 } }
    return turn({ side: WHITE, occupancy, state, match: opening().match }, move).result
  }
  it('draws when a quiet move brings the counter to its limit', () => {
    const occupancy: SquareOccupant = { ...popes, g7: { side: WHITE, piece: TEMPLAR } }
    const quiet: Move = { from: 'g7', to: 'i10' }
    expect(brink(occupancy, quiet)).toEqual({ winner: null, reason: NO_PROGRESS })
  })
  it('plays on when the move at the limit is progress, a legionary move or a capture', () => {
    const legionary: SquareOccupant = { ...popes, e3: { side: WHITE, piece: LEGIONARY } }
    const capture: SquareOccupant = {
      ...popes,
      g7: { side: WHITE, piece: TEMPLAR },
      i10: { side: BLACK, piece: HERALD }
    }
    expect(brink(legionary, { from: 'e3', to: 'e4' })).toBeNull()
    expect(brink(capture, { from: 'g7', to: 'i10', captures: ['i10'] })).toBeNull()
  })
})
describe('resignation, abandonment and agreement', () => {
  const ended = (changes: Partial<Match>): Result | null => {
    const { occupancy, state, match } = opening()
    const next = position(WHITE, occupancy, state)
    return result(next, legality(next), { ...match, ...changes })
  }
  it('gives the win to the other side when a player resigns', () => {
    expect(ended({ resigned: WHITE })).toEqual({ winner: BLACK, reason: RESIGNATION })
    expect(ended({ resigned: BLACK })).toEqual({ winner: WHITE, reason: RESIGNATION })
  })
  it('gives the win to the side that stayed when a player leaves and does not return', () => {
    expect(ended({ abandoned: WHITE })).toEqual({ winner: BLACK, reason: ABANDONMENT })
    expect(ended({ abandoned: BLACK })).toEqual({ winner: WHITE, reason: ABANDONMENT })
  })
  it('draws when one player offers a draw and the other accepts', () => {
    expect(ended({ agreed: true })).toEqual({ winner: null, reason: AGREEMENT })
  })
})