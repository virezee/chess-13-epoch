import type { SquareOccupant } from '@/types/material'
import type { Promotion } from '@/types/game'
import { describe, it, expect } from 'vitest'
import { FILES } from '@/constants/board'
import { WHITE, BLACK } from '@/constants/player'
import { EMPEROR, MAGE, HERALD, TEMPLAR, LEGIONARY } from '@/constants/piece'
import { legionary } from './legionary'

const slot = (file: string, ...piece: Promotion['piece']): Promotion => ({
  file: FILES.indexOf(file),
  piece
})
describe('legionary before the centre', () => {
  it.each([3, 4, 5, 6])('white on rank %i walks to rank 7 and never past it', rank => {
    const moves = legionary(WHITE, {}, `e${rank}`, false, [], null)
    expect(moves).toHaveLength(7 - rank)
    expect(moves.at(-1)).toEqual({ from: `e${rank}`, to: 'e7' })
  })
  it.each([11, 10, 9, 8])('black on rank %i walks to rank 7 and never past it', rank => {
    const moves = legionary(BLACK, {}, `e${rank}`, false, [], null)
    expect(moves).toHaveLength(rank - 7)
    expect(moves.at(-1)).toEqual({ from: `e${rank}`, to: 'e7' })
  })
  it('advances four tiles from the starting rank', () => {
    expect(legionary(WHITE, {}, 'e3', false, [], null)).toEqual([
      { from: 'e3', to: 'e4' },
      { from: 'e3', to: 'e5' },
      { from: 'e3', to: 'e6' },
      { from: 'e3', to: 'e7' }
    ])
  })
  it('is not lengthened by the command zone', () => {
    expect(legionary(WHITE, {}, 'e3', true, [], null)).toHaveLength(4)
    expect(legionary(WHITE, {}, 'e6', true, [], null)).toEqual([{ from: 'e6', to: 'e7' }])
  })
})
describe('legionary blocked before the centre', () => {
  it('makes the long advance later from where it stopped', () => {
    expect(legionary(WHITE, {}, 'e5', false, [], null)).toEqual([
      { from: 'e5', to: 'e6' },
      { from: 'e5', to: 'e7' }
    ])
  })
  it('stops short behind its own piece', () => {
    const occupancy: SquareOccupant = { e6: { side: WHITE, piece: MAGE } }
    expect(legionary(WHITE, occupancy, 'e3', false, [], null)).toEqual([
      { from: 'e3', to: 'e4' },
      { from: 'e3', to: 'e5' }
    ])
  })
  it('stops on rank 6 facing an enemy legionary on rank 7', () => {
    const occupancy: SquareOccupant = { e7: { side: BLACK, piece: LEGIONARY } }
    expect(legionary(WHITE, occupancy, 'e3', false, [], null).at(-1)).toEqual({
      from: 'e3',
      to: 'e6'
    })
  })
  it('neither moves nor captures straight ahead into a piece', () => {
    const occupancy: SquareOccupant = { e4: { side: BLACK, piece: MAGE } }
    expect(legionary(WHITE, occupancy, 'e3', false, [], null)).toEqual([])
  })
})
describe('legionary from the centre onward', () => {
  it('moves one tile when restricted', () => {
    expect(legionary(WHITE, {}, 'e7', false, [], null)).toEqual([{ from: 'e7', to: 'e8' }])
    expect(legionary(WHITE, {}, 'e10', false, [], null)).toEqual([{ from: 'e10', to: 'e11' }])
    expect(legionary(BLACK, {}, 'e7', false, [], null)).toEqual([{ from: 'e7', to: 'e6' }])
  })
  it('chooses one or two tiles when enhanced', () => {
    expect(legionary(WHITE, {}, 'e7', true, [], null)).toEqual([
      { from: 'e7', to: 'e8' },
      { from: 'e7', to: 'e9' }
    ])
    expect(legionary(BLACK, {}, 'e7', true, [], null)).toEqual([
      { from: 'e7', to: 'e6' },
      { from: 'e7', to: 'e5' }
    ])
  })
  it('never jumps over a piece on the two-tile move', () => {
    const near: SquareOccupant = { e8: { side: BLACK, piece: MAGE } }
    const far: SquareOccupant = { e9: { side: WHITE, piece: MAGE } }
    expect(legionary(WHITE, near, 'e7', true, [], null)).toEqual([])
    expect(legionary(WHITE, far, 'e7', true, [], null)).toEqual([{ from: 'e7', to: 'e8' }])
  })
  it('stops at the last rank', () => {
    expect(legionary(WHITE, {}, 'e12', true, [], null)).toEqual([{ from: 'e12', to: 'e13' }])
    expect(legionary(WHITE, {}, 'e13', true, [], null)).toEqual([])
    expect(legionary(BLACK, {}, 'e1', true, [], null)).toEqual([])
  })
})
describe('legionary captures', () => {
  it('captures one tile diagonally forward on either side', () => {
    const occupancy: SquareOccupant = {
      d9: { side: BLACK, piece: MAGE },
      f9: { side: BLACK, piece: HERALD }
    }
    expect(legionary(WHITE, occupancy, 'e8', false, [], null)).toEqual([
      { from: 'e8', to: 'e9' },
      { from: 'e8', to: 'd9', captures: ['d9'] },
      { from: 'e8', to: 'f9', captures: ['f9'] }
    ])
  })
  it('captures downward for black', () => {
    const occupancy: SquareOccupant = {
      d5: { side: WHITE, piece: MAGE },
      f5: { side: WHITE, piece: HERALD }
    }
    expect(legionary(BLACK, occupancy, 'e6', false, [], null)).toEqual([
      { from: 'e6', to: 'e5' },
      { from: 'e6', to: 'd5', captures: ['d5'] },
      { from: 'e6', to: 'f5', captures: ['f5'] }
    ])
  })
  it('captures before the centre as well', () => {
    const occupancy: SquareOccupant = { d5: { side: BLACK, piece: MAGE } }
    expect(legionary(WHITE, occupancy, 'e4', false, [], null)).toContainEqual({
      from: 'e4',
      to: 'd5',
      captures: ['d5']
    })
  })
})
describe('legionary capture limits', () => {
  it('never captures its own side, backwards or sideways', () => {
    const occupancy: SquareOccupant = {
      d9: { side: WHITE, piece: MAGE },
      f7: { side: BLACK, piece: MAGE },
      d8: { side: BLACK, piece: HERALD }
    }
    expect(legionary(WHITE, occupancy, 'e8', false, [], null)).toEqual([{ from: 'e8', to: 'e9' }])
  })
  it('captures only one tile away even when enhanced', () => {
    const occupancy: SquareOccupant = { c10: { side: BLACK, piece: MAGE } }
    expect(legionary(WHITE, occupancy, 'e8', true, [], null)).toEqual([
      { from: 'e8', to: 'e9' },
      { from: 'e8', to: 'e10' }
    ])
  })
  it('does not wrap around the edge files', () => {
    const occupancy: SquareOccupant = {
      b9: { side: BLACK, piece: MAGE },
      m9: { side: BLACK, piece: HERALD },
      l9: { side: BLACK, piece: TEMPLAR }
    }
    expect(legionary(WHITE, occupancy, 'a8', false, [], null)).toEqual([
      { from: 'a8', to: 'a9' },
      { from: 'a8', to: 'b9', captures: ['b9'] }
    ])
    expect(legionary(WHITE, occupancy, 'm8', false, [], null)).toContainEqual({
      from: 'm8',
      to: 'l9',
      captures: ['l9']
    })
  })
  it('cannot capture a dormant emperor but can capture an awake one', () => {
    const dormant: SquareOccupant = { d9: { side: BLACK, piece: EMPEROR } }
    const awake: SquareOccupant = { d9: { side: BLACK, piece: EMPEROR, awake: true } }
    expect(legionary(WHITE, dormant, 'e8', false, [], null)).toEqual([{ from: 'e8', to: 'e9' }])
    expect(legionary(WHITE, awake, 'e8', false, [], null)).toContainEqual({
      from: 'e8',
      to: 'd9',
      captures: ['d9']
    })
  })
})
describe('legionary en passant', () => {
  const white: SquareOccupant = { e7: { side: WHITE, piece: LEGIONARY } }
  const black: SquareOccupant = { e7: { side: BLACK, piece: LEGIONARY } }
  const behindWhite = { target: 'e6', captured: 'e7' }
  it('lets black on either side take the burst and land behind it', () => {
    expect(legionary(BLACK, white, 'd7', false, [], behindWhite)).toEqual([
      { from: 'd7', to: 'd6' },
      { from: 'd7', to: 'e6', captures: ['e7'] }
    ])
    expect(legionary(BLACK, white, 'f7', false, [], behindWhite)).toContainEqual({
      from: 'f7',
      to: 'e6',
      captures: ['e7']
    })
  })
  it('lets white take a black burst and land behind it', () => {
    const moves = legionary(WHITE, black, 'd7', false, [], { target: 'e8', captured: 'e7' })
    expect(moves).toContainEqual({ from: 'd7', to: 'e8', captures: ['e7'] })
  })
  it('is not open to a legionary two files away', () => {
    expect(legionary(BLACK, white, 'c7', false, [], behindWhite)).toEqual([
      { from: 'c7', to: 'c6' }
    ])
  })
  it('is not open without the right', () => {
    expect(legionary(BLACK, white, 'd7', false, [], null)).toEqual([{ from: 'd7', to: 'd6' }])
  })
  it('never takes a piece of its own side', () => {
    expect(legionary(BLACK, black, 'd7', false, [], behindWhite)).toEqual([
      { from: 'd7', to: 'd6' }
    ])
  })
  it('works on the edge files', () => {
    const fileA: SquareOccupant = { a7: { side: WHITE, piece: LEGIONARY } }
    const fileM: SquareOccupant = { m7: { side: WHITE, piece: LEGIONARY } }
    expect(legionary(BLACK, fileA, 'b7', false, [], { target: 'a6', captured: 'a7' })).toEqual([
      { from: 'b7', to: 'b6' },
      { from: 'b7', to: 'a6', captures: ['a7'] }
    ])
    expect(legionary(BLACK, fileM, 'l7', false, [], { target: 'm6', captured: 'm7' })).toEqual([
      { from: 'l7', to: 'l6' },
      { from: 'l7', to: 'm6', captures: ['m7'] }
    ])
  })
})
describe('legionary promotion slots', () => {
  it('arrives as a legionary when no slot is open', () => {
    expect(legionary(WHITE, {}, 'e12', false, [], null)).toEqual([{ from: 'e12', to: 'e13' }])
  })
  it('claims a slot on its own file or one file to either side', () => {
    for (const file of ['d', 'e', 'f'])
      expect(legionary(WHITE, {}, 'e12', false, [slot(file, MAGE)], null)).toEqual([
        { from: 'e12', to: 'e13', promotesTo: MAGE }
      ])
  })
  it('cannot claim a slot two files away', () => {
    for (const file of ['c', 'g'])
      expect(legionary(WHITE, {}, 'e12', false, [slot(file, MAGE)], null)).toEqual([
        { from: 'e12', to: 'e13' }
      ])
  })
  it('cannot decline an open slot', () => {
    const moves = legionary(WHITE, {}, 'e12', false, [slot('e', MAGE)], null)
    expect(moves).not.toContainEqual({ from: 'e12', to: 'e13' })
  })
  it('chooses between types and offers each type once', () => {
    const slots = [slot('d', MAGE), slot('e', MAGE, HERALD)]
    expect(legionary(WHITE, {}, 'e12', false, slots, null)).toEqual([
      { from: 'e12', to: 'e13', promotesTo: MAGE },
      { from: 'e12', to: 'e13', promotesTo: HERALD }
    ])
  })
})
describe('legionary promotion on arrival', () => {
  it('counts slots from the file it arrives on', () => {
    const occupancy: SquareOccupant = { d13: { side: BLACK, piece: MAGE } }
    expect(legionary(WHITE, occupancy, 'e12', false, [slot('c', TEMPLAR)], null)).toEqual([
      { from: 'e12', to: 'e13' },
      { from: 'e12', to: 'd13', promotesTo: TEMPLAR, captures: ['d13'] }
    ])
  })
  it('promotes only on the tile that reaches the last rank', () => {
    expect(legionary(WHITE, {}, 'e11', true, [slot('e', MAGE)], null)).toEqual([
      { from: 'e11', to: 'e12' },
      { from: 'e11', to: 'e13', promotesTo: MAGE }
    ])
  })
  it('reaches slots on the edge files', () => {
    expect(legionary(WHITE, {}, 'a12', false, [slot('b', MAGE)], null)).toEqual([
      { from: 'a12', to: 'a13', promotesTo: MAGE }
    ])
  })
  it('promotes on rank 1 for black', () => {
    expect(legionary(BLACK, {}, 'e2', false, [slot('e', MAGE)], null)).toEqual([
      { from: 'e2', to: 'e1', promotesTo: MAGE }
    ])
  })
})
describe('legionary waiting on the last rank', () => {
  it('has no move while no slot is open', () => {
    expect(legionary(WHITE, {}, 'e13', true, [], null)).toEqual([])
  })
  it('claims a slot in place once one opens', () => {
    expect(legionary(WHITE, {}, 'e13', false, [slot('f', MAGE, HERALD)], null)).toEqual([
      { from: 'e13', to: 'e13', promotesTo: MAGE },
      { from: 'e13', to: 'e13', promotesTo: HERALD }
    ])
  })
  it('still cannot claim a slot two files away', () => {
    expect(legionary(WHITE, {}, 'e13', false, [slot('g', MAGE)], null)).toEqual([])
  })
})