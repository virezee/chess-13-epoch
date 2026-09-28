import type { Move, Position, Match, Save, Result } from '@/types/game'
import type { Role } from '@/types/network'
import { WHITE, BLACK, NAMES } from '@/constants/player'
import { HOST, GUEST } from '@/constants/room'
import { REPETITION_LIMIT } from '@/constants/outcome'
import { canSwap, takeSwap } from '../engine/apply'
import { repetitionCount } from '../engine/result'
import { ArmyInfo } from './panel/ArmyInfo'
import { MoveList } from './panel/MoveList'
import { GameStatus } from './panel/GameStatus'

type PanelProps = {
  role: Role
  players: number
  seconds: number | null
  save: Save
  sync: (save: Save) => void
  position: Position
  promotions: Move[]
  pending: 'resign' | 'draw' | 'new' | null
  setPending: (pending: 'resign' | 'draw' | 'new' | null) => void
  offer: { kind: 'draw' | 'new'; isMine: boolean } | null
  result: Result | null
  onHost: (() => void) | null
  onMove: (move: Move) => void
  onResign: () => void
  onOffer: (offer: 'draw' | 'new') => void
  onReply: (isAccepted: boolean) => void
}
function Armies({ position, match }: { position: Position; match: Match }) {
  const player = {
    [WHITE]: NAMES[match.whitePlayer],
    [BLACK]: NAMES[match.whitePlayer === HOST ? GUEST : HOST]
  }
  return (
    <aside className='order-2 flex flex-col gap-4 lg:order-2 xl:order-1'>
      <ArmyInfo
        player={player[WHITE]}
        position={position}
        side={WHITE}
        active={position.side === WHITE}
      />
      <ArmyInfo
        player={player[BLACK]}
        position={position}
        side={BLACK}
        active={position.side === BLACK}
      />
    </aside>
  )
}
function Promotions({ promotions, onPick }: { promotions: Move[]; onPick: (move: Move) => void }) {
  if (promotions.length === 0) return null
  return (
    <div className='flex flex-wrap items-center gap-2 rounded border border-line bg-surface px-3 py-2'>
      <span className='text-[11px] uppercase tracking-[0.16em] text-ink-faint'>Promote To?</span>
      {promotions.map(move => (
        <button
          key={move.promotesTo}
          type='button'
          onClick={() => {
            onPick(move)
          }}
          className='rounded-xs border border-line-strong bg-surface-2 px-2 py-1 text-[11px] capitalize text-ink-dim hover:text-ink'>
          {move.promotesTo}
        </button>
      ))}
    </div>
  )
}
function Control(props: PanelProps) {
  const { save, sync, role, position, promotions, result, onMove } = props
  return (
    <aside className='order-3 flex flex-col gap-4'>
      <Promotions promotions={promotions} onPick={onMove} />
      <MoveList pgn={save.match.pgn} toMove={position.side} />
      <GameStatus
        players={props.players}
        seconds={props.seconds}
        counters={{
          repetition: {
            count: repetitionCount(save.match.history.at(-1)!, save.match.history),
            limit: REPETITION_LIMIT
          },
          noProgress: position.state.noProgress
        }}
        canSwap={canSwap(position, save.match) && role !== save.match.whitePlayer}
        pending={props.pending}
        setPending={props.setPending}
        offer={props.offer}
        result={result}
        onHost={props.onHost}
        onDecline={() => {
          sync({ ...save, match: { ...save.match, swap: false } })
        }}
        onAccept={() => {
          sync(takeSwap(position, save.match, role))
        }}
        onResign={props.onResign}
        onOffer={props.onOffer}
        onReply={props.onReply}
      />
    </aside>
  )
}
export function Panel(props: PanelProps) {
  return (
    <>
      <Armies position={props.position} match={props.save.match} />
      <Control {...props} />
    </>
  )
}