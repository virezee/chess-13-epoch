// oxlint-disable max-lines
import type { Side, SquareOccupant } from '@/types/material'
import type { Position } from '@/types/game'
import { describe, it, expect } from 'vitest'
import { WHITE, BLACK } from '@/constants/player'
import {
  POPE,
  MARSHAL,
  ASSASSIN,
  SENTINEL,
  MAGE,
  HERALD,
  TEMPLAR,
  LEGIONARY
} from '@/constants/piece'
import { threats } from './threats'
import { legality } from './legality'
import { position } from './position'
import { opening } from './opening'

const setup = (side: Side, occupancy: SquareOccupant): Position =>
  position(
    side,
    { a1: { side: WHITE, piece: POPE }, m13: { side: BLACK, piece: POPE }, ...occupancy },
    opening().state
  )
const attackers = (side: Side, occupancy: SquareOccupant, square: string): string[] =>
  threats(setup(WHITE, occupancy), side, {}, false, square)
const capturesFrom = (side: Side, occupancy: SquareOccupant, square: string): string[][] =>
  legality(setup(side, occupancy))
    .filter(({ from }) => from === square)
    .map(({ captures }) => captures ?? [])
describe('legionary attacks', () => {
  it('attacks one tile diagonally forward for white', () => {
    const occupancy: SquareOccupant = { e5: { side: WHITE, piece: LEGIONARY } }
    expect(attackers(WHITE, occupancy, 'd6')).toEqual(['e5'])
    expect(attackers(WHITE, occupancy, 'f6')).toEqual(['e5'])
  })
  it('attacks one tile diagonally forward for black', () => {
    const occupancy: SquareOccupant = { e5: { side: BLACK, piece: LEGIONARY } }
    expect(attackers(BLACK, occupancy, 'd4')).toEqual(['e5'])
    expect(attackers(BLACK, occupancy, 'f4')).toEqual(['e5'])
  })
  it('attacks nothing straight ahead, sideways, backwards or further away', () => {
    const occupancy: SquareOccupant = { e5: { side: WHITE, piece: LEGIONARY } }
    for (const square of ['e6', 'd5', 'f5', 'd4', 'f4', 'c7', 'g7'])
      expect(attackers(WHITE, occupancy, square)).toEqual([])
  })
})
describe('templar attacks', () => {
  const templar: SquareOccupant = { g7: { side: WHITE, piece: TEMPLAR } }
  it('attacks its long leaps when restricted but not its short ones', () => {
    expect(attackers(WHITE, templar, 'i10')).toEqual(['g7'])
    expect(attackers(WHITE, templar, 'h9')).toEqual([])
  })
  it('attacks its short leaps when enhanced', () => {
    const enhanced: SquareOccupant = { ...templar, g5: { side: WHITE, piece: MARSHAL } }
    expect(attackers(WHITE, enhanced, 'h9')).toEqual(['g7'])
  })
  it('judges the short leap from the square it stands on', () => {
    const occupancy: SquareOccupant = {
      h8: { side: WHITE, piece: TEMPLAR },
      d4: { side: WHITE, piece: MARSHAL }
    }
    expect(attackers(WHITE, occupancy, 'j9')).toEqual(['h8'])
  })
  it('attacks over any pieces in between', () => {
    const crowded: SquareOccupant = {
      ...templar,
      g8: { side: BLACK, piece: HERALD },
      h8: { side: BLACK, piece: HERALD },
      h9: { side: BLACK, piece: HERALD },
      i9: { side: BLACK, piece: HERALD }
    }
    expect(attackers(WHITE, crowded, 'i10')).toEqual(['g7'])
  })
})
describe('pinned pieces keep attacking', () => {
  const pinner: SquareOccupant = { f6: { side: BLACK, piece: HERALD } }
  it('counts a pinned templar', () => {
    const occupancy: SquareOccupant = { ...pinner, c3: { side: WHITE, piece: TEMPLAR } }
    expect(attackers(WHITE, occupancy, 'e6')).toEqual(['c3'])
  })
  it('counts a pinned legionary', () => {
    const occupancy: SquareOccupant = { ...pinner, c3: { side: WHITE, piece: LEGIONARY } }
    expect(attackers(WHITE, occupancy, 'd4')).toEqual(['c3'])
  })
})
describe('watching an assassin landing', () => {
  const victim: SquareOccupant = {
    e10: { side: BLACK, piece: ASSASSIN },
    e7: { side: WHITE, piece: HERALD }
  }
  it('lets the assassin capture onto an unwatched tile', () => {
    expect(capturesFrom(BLACK, victim, 'e10')).toContainEqual(['e7'])
  })
  it('forbids the capture when a templar watches the landing tile', () => {
    const watched: SquareOccupant = { ...victim, g3: { side: WHITE, piece: TEMPLAR } }
    expect(capturesFrom(BLACK, watched, 'e10')).not.toContainEqual(['e7'])
  })
  it('forbids the capture when a legionary watches the landing tile', () => {
    const watched: SquareOccupant = { ...victim, d5: { side: WHITE, piece: LEGIONARY } }
    expect(capturesFrom(BLACK, watched, 'e10')).not.toContainEqual(['e7'])
  })
})
describe('pinned pieces watching an assassin landing', () => {
  const victim: SquareOccupant = {
    b8: { side: BLACK, piece: ASSASSIN },
    b5: { side: WHITE, piece: HERALD }
  }
  const diagonal: SquareOccupant = { ...victim, f6: { side: BLACK, piece: HERALD } }
  const rank: SquareOccupant = { ...victim, f1: { side: BLACK, piece: SENTINEL } }
  it('lets the assassin land on b4 while nothing watches it', () => {
    expect(capturesFrom(BLACK, victim, 'b8')).toContainEqual(['b5'])
  })
  it('forbids the landing on b4 whichever pinned piece watches it', () => {
    const legionary: SquareOccupant = { ...diagonal, c3: { side: WHITE, piece: LEGIONARY } }
    const templar: SquareOccupant = { ...rank, d1: { side: WHITE, piece: TEMPLAR } }
    const herald: SquareOccupant = { ...diagonal, c3: { side: WHITE, piece: HERALD } }
    const mage: SquareOccupant = { ...diagonal, c3: { side: WHITE, piece: MAGE } }
    const sentinel: SquareOccupant = { ...rank, b1: { side: WHITE, piece: SENTINEL } }
    const assassin: SquareOccupant = { ...diagonal, c3: { side: WHITE, piece: ASSASSIN } }
    expect(capturesFrom(BLACK, legionary, 'b8')).not.toContainEqual(['b5'])
    expect(capturesFrom(BLACK, templar, 'b8')).not.toContainEqual(['b5'])
    expect(capturesFrom(BLACK, herald, 'b8')).not.toContainEqual(['b5'])
    expect(capturesFrom(BLACK, mage, 'b8')).not.toContainEqual(['b5'])
    expect(capturesFrom(BLACK, sentinel, 'b8')).not.toContainEqual(['b5'])
    expect(capturesFrom(BLACK, assassin, 'b8')).not.toContainEqual(['b5'])
  })
})
describe('supporting a marshal capture', () => {
  const target: SquareOccupant = {
    d4: { side: WHITE, piece: MARSHAL },
    d8: { side: BLACK, piece: HERALD }
  }
  it('forbids the capture without support', () => {
    expect(capturesFrom(WHITE, target, 'd4')).not.toContainEqual(['d8'])
  })
  it('allows it when a templar attacks the target', () => {
    const supported: SquareOccupant = { ...target, f5: { side: WHITE, piece: TEMPLAR } }
    expect(capturesFrom(WHITE, supported, 'd4')).toContainEqual(['d8'])
  })
  it('allows it when a legionary attacks the target', () => {
    const supported: SquareOccupant = { ...target, c7: { side: WHITE, piece: LEGIONARY } }
    expect(capturesFrom(WHITE, supported, 'd4')).toContainEqual(['d8'])
  })
  it('counts a pinned templar as support', () => {
    const pinned: SquareOccupant = {
      c3: { side: WHITE, piece: TEMPLAR },
      f6: { side: BLACK, piece: HERALD },
      e9: { side: WHITE, piece: MARSHAL },
      e6: { side: BLACK, piece: LEGIONARY }
    }
    expect(capturesFrom(WHITE, pinned, 'e9')).toContainEqual(['e6'])
  })
  it('counts a pinned legionary as support', () => {
    const pinned: SquareOccupant = {
      c3: { side: WHITE, piece: LEGIONARY },
      f6: { side: BLACK, piece: HERALD },
      b9: { side: WHITE, piece: MARSHAL },
      b4: { side: BLACK, piece: LEGIONARY }
    }
    expect(capturesFrom(WHITE, pinned, 'b9')).toContainEqual(['b4'])
  })
})
describe('herald attacks', () => {
  const herald: SquareOccupant = { b2: { side: WHITE, piece: HERALD } }
  it('attacks up to 6 tiles along a diagonal when restricted and the whole of it when enhanced', () => {
    const enhanced: SquareOccupant = { ...herald, a5: { side: WHITE, piece: MARSHAL } }
    expect(attackers(WHITE, herald, 'h8')).toEqual(['b2'])
    expect(attackers(WHITE, herald, 'i9')).toEqual([])
    expect(attackers(WHITE, enhanced, 'i9')).toEqual(['b2'])
  })
  it('does not attack through a piece on its diagonal', () => {
    const blocked: SquareOccupant = { ...herald, e5: { side: BLACK, piece: LEGIONARY } }
    expect(attackers(WHITE, blocked, 'e5')).toEqual(['b2'])
    expect(attackers(WHITE, blocked, 'h8')).toEqual([])
  })
  it('attacks with its straight step only when enhanced, and never 2 tiles straight', () => {
    const step: SquareOccupant = { g7: { side: WHITE, piece: HERALD } }
    const enhanced: SquareOccupant = { ...step, g5: { side: WHITE, piece: MARSHAL } }
    expect(attackers(WHITE, step, 'g8')).toEqual([])
    expect(attackers(WHITE, enhanced, 'g8')).toEqual(['g7'])
    expect(attackers(WHITE, enhanced, 'g9')).toEqual([])
  })
  it('keeps attacking while pinned', () => {
    const pinned: SquareOccupant = {
      c3: { side: WHITE, piece: HERALD },
      f6: { side: BLACK, piece: HERALD }
    }
    expect(attackers(WHITE, pinned, 'e1')).toEqual(['c3'])
  })
})
describe('herald watching and supporting', () => {
  const victim: SquareOccupant = {
    e10: { side: BLACK, piece: ASSASSIN },
    e7: { side: WHITE, piece: HERALD }
  }
  const target: SquareOccupant = {
    d4: { side: WHITE, piece: MARSHAL },
    d8: { side: BLACK, piece: HERALD }
  }
  it('watches an assassin landing along a diagonal', () => {
    const watched: SquareOccupant = { ...victim, h3: { side: WHITE, piece: HERALD } }
    expect(capturesFrom(BLACK, watched, 'e10')).not.toContainEqual(['e7'])
  })
  it('watches an assassin landing with the straight step only when enhanced', () => {
    const step: SquareOccupant = { ...victim, e5: { side: WHITE, piece: HERALD } }
    const enhanced: SquareOccupant = { ...step, a4: { side: WHITE, piece: MARSHAL } }
    expect(capturesFrom(BLACK, step, 'e10')).toContainEqual(['e7'])
    expect(capturesFrom(BLACK, enhanced, 'e10')).not.toContainEqual(['e7'])
  })
  it('supports a marshal capture along a diagonal', () => {
    const supported: SquareOccupant = { ...target, b6: { side: WHITE, piece: HERALD } }
    expect(capturesFrom(WHITE, supported, 'd4')).toContainEqual(['d8'])
  })
  it('supports a marshal capture with the straight step only when enhanced', () => {
    const restricted: SquareOccupant = { ...target, d9: { side: WHITE, piece: HERALD } }
    const enhanced: SquareOccupant = { ...target, c8: { side: WHITE, piece: HERALD } }
    expect(capturesFrom(WHITE, restricted, 'd4')).not.toContainEqual(['d8'])
    expect(capturesFrom(WHITE, enhanced, 'd4')).toContainEqual(['d8'])
  })
  it('supports a marshal capture while pinned', () => {
    const pinned: SquareOccupant = {
      c3: { side: WHITE, piece: HERALD },
      f6: { side: BLACK, piece: HERALD },
      e9: { side: WHITE, piece: MARSHAL },
      a5: { side: BLACK, piece: LEGIONARY }
    }
    expect(capturesFrom(WHITE, pinned, 'e9')).toContainEqual(['a5'])
  })
})
describe('mage attacks', () => {
  const mage: SquareOccupant = { g7: { side: WHITE, piece: MAGE } }
  it('attacks the 8 tiles around it', () => {
    for (const square of ['f6', 'f7', 'f8', 'g6', 'g8', 'h6', 'h7', 'h8'])
      expect(attackers(WHITE, mage, square)).toEqual(['g7'])
  })
  it('never attacks 2 tiles away, even when enhanced', () => {
    const enhanced: SquareOccupant = { ...mage, c7: { side: WHITE, piece: MARSHAL } }
    for (const square of ['e5', 'e7', 'e9', 'g5', 'g9', 'i5', 'i7', 'i9'])
      expect(attackers(WHITE, enhanced, square)).toEqual([])
  })
  it('keeps attacking the rest of its ring beside its own pope', () => {
    const beside: SquareOccupant = { b2: { side: WHITE, piece: MAGE } }
    expect(attackers(WHITE, beside, 'c3')).toEqual(['b2'])
  })
  it('keeps attacking while pinned', () => {
    const pinned: SquareOccupant = {
      c3: { side: WHITE, piece: MAGE },
      f6: { side: BLACK, piece: HERALD }
    }
    expect(attackers(WHITE, pinned, 'b4')).toEqual(['c3'])
  })
})
describe('mage watching an assassin landing', () => {
  it('watches the landing with its ring', () => {
    const watched: SquareOccupant = {
      e10: { side: BLACK, piece: ASSASSIN },
      e7: { side: WHITE, piece: HERALD },
      d5: { side: WHITE, piece: MAGE }
    }
    expect(capturesFrom(BLACK, watched, 'e10')).not.toContainEqual(['e7'])
  })
  it('watches the landing even when its own pope beside it forbids the blast', () => {
    const victim: SquareOccupant = {
      f6: { side: BLACK, piece: ASSASSIN },
      d4: { side: WHITE, piece: HERALD }
    }
    const watched: SquareOccupant = { ...victim, b2: { side: WHITE, piece: MAGE } }
    expect(capturesFrom(BLACK, victim, 'f6')).toContainEqual(['d4'])
    expect(capturesFrom(BLACK, watched, 'f6')).not.toContainEqual(['d4'])
  })
  it('leaves the landing free once the assassin takes the mage itself', () => {
    const mage: SquareOccupant = {
      e10: { side: BLACK, piece: ASSASSIN },
      e7: { side: WHITE, piece: MAGE }
    }
    expect(capturesFrom(BLACK, mage, 'e10')).toContainEqual(['e7'])
  })
})
describe('mage supporting a marshal capture', () => {
  const target: SquareOccupant = {
    d4: { side: WHITE, piece: MARSHAL },
    d8: { side: BLACK, piece: HERALD }
  }
  it('supports a marshal capture with its ring', () => {
    const supported: SquareOccupant = { ...target, c9: { side: WHITE, piece: MAGE } }
    expect(capturesFrom(WHITE, supported, 'd4')).toContainEqual(['d8'])
  })
  it('gives no support 2 tiles away, even when enhanced', () => {
    const enhanced: SquareOccupant = { ...target, b8: { side: WHITE, piece: MAGE } }
    expect(capturesFrom(WHITE, enhanced, 'd4')).not.toContainEqual(['d8'])
  })
  it('supports a marshal capture while pinned or beside its own pope', () => {
    const pinned: SquareOccupant = {
      c3: { side: WHITE, piece: MAGE },
      f6: { side: BLACK, piece: HERALD },
      b9: { side: WHITE, piece: MARSHAL },
      b4: { side: BLACK, piece: LEGIONARY }
    }
    const beside: SquareOccupant = {
      b2: { side: WHITE, piece: MAGE },
      c3: { side: BLACK, piece: HERALD },
      c8: { side: WHITE, piece: MARSHAL }
    }
    expect(capturesFrom(WHITE, pinned, 'b9')).toContainEqual(['b4'])
    expect(capturesFrom(WHITE, beside, 'c8')).toContainEqual(['c3'])
  })
})
describe('sentinel attacks', () => {
  const sentinel: SquareOccupant = { c2: { side: WHITE, piece: SENTINEL } }
  it('attacks 6 tiles away while restricted and the whole line when enhanced', () => {
    const enhanced: SquareOccupant = { ...sentinel, a5: { side: WHITE, piece: MARSHAL } }
    expect(attackers(WHITE, sentinel, 'c8')).toEqual(['c2'])
    expect(attackers(WHITE, sentinel, 'c9')).toEqual([])
    expect(attackers(WHITE, enhanced, 'c13')).toEqual(['c2'])
  })
  it('never attacks along a diagonal', () => {
    expect(attackers(WHITE, sentinel, 'd3')).toEqual([])
  })
  it('does not attack through its own piece, even one it could pass on a quiet move', () => {
    const passing: SquareOccupant = {
      ...sentinel,
      c4: { side: WHITE, piece: MAGE },
      a5: { side: WHITE, piece: MARSHAL }
    }
    expect(attackers(WHITE, passing, 'c6')).toEqual([])
  })
  it('keeps attacking while pinned', () => {
    const pinned: SquareOccupant = {
      c3: { side: WHITE, piece: SENTINEL },
      f6: { side: BLACK, piece: HERALD }
    }
    expect(attackers(WHITE, pinned, 'c8')).toEqual(['c3'])
  })
})
describe('sentinel watching an assassin landing', () => {
  const victim: SquareOccupant = {
    e10: { side: BLACK, piece: ASSASSIN },
    e7: { side: WHITE, piece: HERALD }
  }
  it('watches the landing from further than it can move quietly', () => {
    const watched: SquareOccupant = { ...victim, a6: { side: WHITE, piece: SENTINEL } }
    expect(capturesFrom(BLACK, watched, 'e10')).not.toContainEqual(['e7'])
  })
  it('watches the landing through the squares the assassin and its victim leave', () => {
    const watched: SquareOccupant = { ...victim, e12: { side: WHITE, piece: SENTINEL } }
    expect(capturesFrom(BLACK, watched, 'e10')).not.toContainEqual(['e7'])
  })
})
describe('sentinel supporting a marshal capture', () => {
  it('supports a marshal capture from further than it can move quietly', () => {
    const supported: SquareOccupant = {
      d4: { side: WHITE, piece: MARSHAL },
      d8: { side: BLACK, piece: HERALD },
      j8: { side: WHITE, piece: SENTINEL }
    }
    expect(capturesFrom(WHITE, supported, 'd4')).toContainEqual(['d8'])
  })
  it('gives support from 7 tiles only when enhanced', () => {
    const restricted: SquareOccupant = {
      d4: { side: WHITE, piece: MARSHAL },
      d8: { side: BLACK, piece: HERALD },
      k8: { side: WHITE, piece: SENTINEL }
    }
    const enhanced: SquareOccupant = {
      g5: { side: WHITE, piece: MARSHAL },
      d8: { side: BLACK, piece: HERALD },
      k8: { side: WHITE, piece: SENTINEL }
    }
    expect(capturesFrom(WHITE, restricted, 'd4')).not.toContainEqual(['d8'])
    expect(capturesFrom(WHITE, enhanced, 'g5')).toContainEqual(['d8'])
  })
  it('supports a marshal capture while pinned', () => {
    const pinned: SquareOccupant = {
      c3: { side: WHITE, piece: SENTINEL },
      f6: { side: BLACK, piece: HERALD },
      e9: { side: WHITE, piece: MARSHAL },
      c7: { side: BLACK, piece: LEGIONARY }
    }
    expect(capturesFrom(WHITE, pinned, 'e9')).toContainEqual(['c7'])
  })
})
describe('assassin attacks', () => {
  const assassin: SquareOccupant = {
    c2: { side: WHITE, piece: ASSASSIN },
    c6: { side: BLACK, piece: HERALD }
  }
  it('attacks a piece on its line when the tile behind it is empty and unwatched', () => {
    expect(attackers(WHITE, assassin, 'c6')).toEqual(['c2'])
  })
  it('does not attack it when the tile behind is occupied by any piece, or watched', () => {
    const own: SquareOccupant = { ...assassin, c7: { side: WHITE, piece: LEGIONARY } }
    const enemy: SquareOccupant = { ...assassin, c7: { side: BLACK, piece: LEGIONARY } }
    const watched: SquareOccupant = { ...assassin, d8: { side: BLACK, piece: LEGIONARY } }
    expect(attackers(WHITE, own, 'c6')).toEqual([])
    expect(attackers(WHITE, enemy, 'c6')).toEqual([])
    expect(attackers(WHITE, watched, 'c6')).toEqual([])
  })
  it('counts the tile behind inside its range of 6 while restricted, and not when enhanced', () => {
    const far: SquareOccupant = {
      c2: { side: WHITE, piece: ASSASSIN },
      c8: { side: BLACK, piece: HERALD }
    }
    const enhanced: SquareOccupant = { ...far, a5: { side: WHITE, piece: MARSHAL } }
    expect(attackers(WHITE, far, 'c8')).toEqual([])
    expect(attackers(WHITE, enhanced, 'c8')).toEqual(['c2'])
  })
})
describe('assassin attacks at the edge and under a pin', () => {
  it('attacks a corner by aiming at the corner itself, unless the corner is watched', () => {
    const corner: SquareOccupant = {
      g7: { side: WHITE, piece: ASSASSIN },
      a13: { side: BLACK, piece: HERALD }
    }
    const watched: SquareOccupant = { ...corner, a10: { side: BLACK, piece: SENTINEL } }
    expect(attackers(WHITE, corner, 'a13')).toEqual(['g7'])
    expect(attackers(WHITE, watched, 'a13')).toEqual([])
  })
  it('cannot attack a piece on file a along the rank from inside the board', () => {
    const rank: SquareOccupant = {
      g7: { side: WHITE, piece: ASSASSIN },
      a7: { side: BLACK, piece: HERALD }
    }
    const file: SquareOccupant = {
      a3: { side: WHITE, piece: ASSASSIN },
      a7: { side: BLACK, piece: HERALD }
    }
    expect(attackers(WHITE, rank, 'a7')).toEqual([])
    expect(attackers(WHITE, file, 'a7')).toEqual(['a3'])
  })
  it('keeps attacking while pinned', () => {
    const pinned: SquareOccupant = {
      c3: { side: WHITE, piece: ASSASSIN },
      f6: { side: BLACK, piece: HERALD },
      c7: { side: BLACK, piece: LEGIONARY }
    }
    expect(attackers(WHITE, pinned, 'c7')).toEqual(['c3'])
  })
})
describe('assassin watching another assassin landing', () => {
  it('counts an enemy assassin as a watcher only if its own landing would be safe, however deep', () => {
    const base: SquareOccupant = {
      c10: { side: BLACK, piece: ASSASSIN },
      c7: { side: WHITE, piece: HERALD },
      h6: { side: WHITE, piece: ASSASSIN }
    }
    const guarded: SquareOccupant = { ...base, a7: { side: BLACK, piece: LEGIONARY } }
    const countered: SquareOccupant = { ...base, b10: { side: BLACK, piece: ASSASSIN } }
    const recountered: SquareOccupant = { ...countered, a4: { side: WHITE, piece: LEGIONARY } }
    expect(capturesFrom(BLACK, base, 'c10')).not.toContainEqual(['c7'])
    expect(capturesFrom(BLACK, guarded, 'c10')).toContainEqual(['c7'])
    expect(capturesFrom(BLACK, countered, 'c10')).toContainEqual(['c7'])
    expect(capturesFrom(BLACK, recountered, 'c10')).not.toContainEqual(['c7'])
  })
  it('lets a line open behind an enemy assassin that would leave its square to take it', () => {
    const occupancy: SquareOccupant = {
      h10: { side: BLACK, piece: ASSASSIN },
      h7: { side: WHITE, piece: HERALD },
      h2: { side: WHITE, piece: ASSASSIN },
      h1: { side: BLACK, piece: SENTINEL }
    }
    expect(capturesFrom(BLACK, occupancy, 'h10')).toContainEqual(['h7'])
  })
})
describe('four assassins taking in turn', () => {
  it('works the chain back from the last capture, and a guard on h5 turns it around', () => {
    const chain: SquareOccupant = {
      i7: { side: BLACK, piece: ASSASSIN },
      d8: { side: BLACK, piece: ASSASSIN },
      f9: { side: WHITE, piece: ASSASSIN },
      d5: { side: WHITE, piece: ASSASSIN },
      g7: { side: WHITE, piece: LEGIONARY }
    }
    const guarded: SquareOccupant = { ...chain, i6: { side: BLACK, piece: LEGIONARY } }
    expect(capturesFrom(BLACK, chain, 'i7')).not.toContainEqual(['g7'])
    expect(capturesFrom(BLACK, guarded, 'i7')).toContainEqual(['g7'])
  })
  it('never counts a guard from an assassin already taken in the chain', () => {
    const occupancy: SquareOccupant = {
      i7: { side: BLACK, piece: ASSASSIN },
      d8: { side: BLACK, piece: ASSASSIN },
      f9: { side: WHITE, piece: ASSASSIN },
      h4: { side: WHITE, piece: ASSASSIN },
      g7: { side: WHITE, piece: LEGIONARY }
    }
    expect(capturesFrom(BLACK, occupancy, 'i7')).not.toContainEqual(['g7'])
  })
})
describe('assassin supporting a marshal capture', () => {
  it('supports when the tile behind the target is empty, even if the enemy watches it', () => {
    const occupancy: SquareOccupant = {
      d4: { side: WHITE, piece: MARSHAL },
      d8: { side: BLACK, piece: HERALD },
      h8: { side: WHITE, piece: ASSASSIN },
      d9: { side: BLACK, piece: LEGIONARY }
    }
    expect(capturesFrom(WHITE, occupancy, 'h8')).not.toContainEqual(['d8'])
    expect(capturesFrom(WHITE, occupancy, 'd4')).toContainEqual(['d8'])
  })
  it('gives no support when the tile behind the target is occupied by either side', () => {
    const aiming: SquareOccupant = {
      d4: { side: WHITE, piece: MARSHAL },
      d8: { side: BLACK, piece: HERALD },
      h8: { side: WHITE, piece: ASSASSIN }
    }
    const own: SquareOccupant = { ...aiming, c8: { side: WHITE, piece: LEGIONARY } }
    const enemy: SquareOccupant = { ...aiming, c8: { side: BLACK, piece: LEGIONARY } }
    expect(capturesFrom(WHITE, own, 'd4')).not.toContainEqual(['d8'])
    expect(capturesFrom(WHITE, enemy, 'd4')).not.toContainEqual(['d8'])
  })
  it('supports a marshal capture while pinned', () => {
    const pinned: SquareOccupant = {
      c3: { side: WHITE, piece: ASSASSIN },
      f6: { side: BLACK, piece: HERALD },
      e9: { side: WHITE, piece: MARSHAL },
      c7: { side: BLACK, piece: LEGIONARY }
    }
    expect(capturesFrom(WHITE, pinned, 'e9')).toContainEqual(['c7'])
  })
})
describe('marshal attacks', () => {
  const marshal: SquareOccupant = { m1: { side: WHITE, piece: MARSHAL } }
  it('attacks the enemy pope along a line at any distance', () => {
    expect(attackers(WHITE, marshal, 'm13')).toEqual(['m1'])
  })
  it('attacks no ordinary piece and no empty square, since it captures only with support', () => {
    const victim: SquareOccupant = { ...marshal, m7: { side: BLACK, piece: HERALD } }
    expect(attackers(WHITE, victim, 'm7')).toEqual([])
    expect(attackers(WHITE, marshal, 'm5')).toEqual([])
  })
  it('does not attack the pope through a piece on its line', () => {
    const blocked: SquareOccupant = { ...marshal, m7: { side: BLACK, piece: HERALD } }
    expect(attackers(WHITE, blocked, 'm13')).toEqual([])
  })
})
describe('marshal watching an assassin landing', () => {
  it('never watches a landing on its own, since it could not take the assassin there', () => {
    const victim: SquareOccupant = {
      e4: { side: WHITE, piece: MARSHAL },
      h9: { side: BLACK, piece: ASSASSIN },
      f9: { side: WHITE, piece: HERALD }
    }
    const landed: SquareOccupant = {
      e4: { side: WHITE, piece: MARSHAL },
      e9: { side: BLACK, piece: ASSASSIN }
    }
    expect(capturesFrom(BLACK, victim, 'h9')).toContainEqual(['f9'])
    expect(capturesFrom(WHITE, landed, 'e4')).not.toContainEqual(['e9'])
  })
})