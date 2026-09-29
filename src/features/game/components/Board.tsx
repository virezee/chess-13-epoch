import type { BoardProps } from '../types/props'
import { useState } from 'react'
import { clickSquares } from '../engine/turn'
import { Grid } from './board/Grid'
import { mark, markColour } from '../lib/annotation'
import { emperorFlag, riposteFlag } from '../lib/trace'

export function Board(props: BoardProps) {
  const { position, lastMove, isFlipped, locked, moves, result, onMove, onPromotions } = props
  const [selected, setSelected] = useState<string | null>(null)
  const [marks, setMarks] = useState<Record<string, string>>({})
  const [arrows, setArrows] = useState<Record<string, string>>({})
  const select = (square: string) => {
    setMarks({})
    setArrows({})
    if (locked) return
    const reached = moves.filter(
      move => move.from === selected && clickSquares(move).includes(square)
    )
    onPromotions(reached.length > 1 ? reached : [])
    if (reached.length === 1) {
      setSelected(null)
      onMove(reached[0]!)
    } else if (reached.length === 0)
      setSelected(position.occupancy[square]?.side === position.side ? square : null)
  }
  return (
    <div className='order-1 flex justify-center lg:col-span-2 xl:order-2 xl:col-span-1'>
      <Grid
        position={position}
        lastMove={lastMove}
        selected={selected}
        targets={[
          ...new Set(
            moves.filter(move => move.from === selected).flatMap(move => clickSquares(move))
          )
        ]}
        marks={marks}
        arrows={arrows}
        trace={[...emperorFlag(position), ...riposteFlag(position)]}
        isFlipped={isFlipped}
        result={result}
        onSelect={select}
        onMark={(square, event) => {
          setMarks(current => mark(current, square, markColour(event)))
        }}
        onArrow={(from, to, event) => {
          setArrows(current => mark(current, `${from}-${to}`, markColour(event)))
        }}
      />
    </div>
  )
}