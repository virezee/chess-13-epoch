import type { ReactNode } from 'react'
import type { Counter, Result } from '@/types/game'
import type { GameCounters } from '@/types/panel'
import { useEffect } from 'react'
import { cn } from '@/lib/cn'

type ControlsProps = {
  pending: 'resign' | 'draw' | 'new' | null
  setPending: (pending: 'resign' | 'draw' | 'new' | null) => void
  offer: { kind: 'draw' | 'new'; isMine: boolean } | null
  onResign: () => void
  onOffer: (offer: 'draw' | 'new') => void
  onReply: (isAccepted: boolean) => void
}
function Presence({ players, seconds }: { players: number; seconds: number | null }) {
  if (players >= 2) return null
  return (
    <p
      className={cn(
        'border-t border-line px-3.5 py-3 text-[10px] font-semibold uppercase tracking-[0.16em]',
        seconds === null ? 'text-ink-faint' : 'text-alert'
      )}>
      {seconds === null ? 'Waiting For Opponent' : `Opponent Left · ${seconds}s`}
    </p>
  )
}
function RepetitionGauge({ count, limit }: Counter) {
  const nearLimit = count >= limit - 1
  return (
    <div className='border-t border-line px-3.5 py-3'>
      <div className='flex items-baseline justify-between gap-3'>
        <p className='text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint'>
          Repetition
        </p>
        <span className={cn('font-mono text-[11px]', nearLimit ? 'text-alert' : 'text-ink-dim')}>
          {count}/{limit}
        </span>
      </div>
      <div className='mt-2 flex gap-1'>
        {Array.from({ length: limit }, (_, i) => (
          <span
            key={i}
            className={cn(
              'h-1 flex-1 rounded-[1px]',
              i >= count && 'bg-track',
              i < count && !nearLimit && 'bg-ink-faint',
              i < count && nearLimit && 'bg-alert'
            )}
          />
        ))}
      </div>
      <p className={cn('mt-2 text-[11px]', nearLimit ? 'text-alert' : 'text-ink-faint')}>
        {nearLimit ? 'One more repetition loses the game' : 'Third repetition loses the game'}
      </p>
    </div>
  )
}
function NoProgressGauge({ count, limit }: Counter) {
  const ratio = limit === 0 ? 0 : Math.min(count / limit, 1)
  const nearLimit = ratio >= .8
  return (
    <div className='border-t border-line px-3.5 py-3'>
      <div className='flex items-baseline justify-between gap-3'>
        <p className='text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint'>
          No Progress
        </p>
        <span className={cn('font-mono text-[11px]', nearLimit ? 'text-alert' : 'text-ink-dim')}>
          {count}/{limit}
        </span>
      </div>
      <div className='mt-2 h-1 w-full overflow-hidden rounded-[1px] bg-track'>
        <div
          className={cn(
            'h-full transition-[width] duration-300',
            nearLimit ? 'bg-alert' : 'bg-ink-faint'
          )}
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>
    </div>
  )
}
function Action({
  tone = 'quiet',
  onClick,
  children
}: {
  tone?: 'quiet' | 'accept' | 'decline'
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'h-9 flex-1 cursor-pointer rounded-[3px] border text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors',
        tone === 'quiet' &&
          'border-line bg-surface-2 text-ink-dim hover:border-line-strong hover:bg-line/60 hover:text-ink',
        tone === 'accept' && 'border-good/60 bg-good/10 text-good hover:bg-good/20',
        tone === 'decline' && 'border-alert/60 bg-alert/10 text-alert hover:bg-alert/20'
      )}>
      {children}
    </button>
  )
}
function Prompt({
  label,
  onDecline,
  onAccept
}: {
  label: string
  onDecline: () => void
  onAccept: () => void
}) {
  return (
    <div className='border-t border-line px-3.5 py-3'>
      <p className='text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint'>
        {label}
      </p>
      <div className='mt-2 flex gap-2'>
        <Action tone='decline' onClick={onDecline}>
          <span className='text-[15px] leading-none tracking-normal'>✕</span>
        </Action>
        <Action tone='accept' onClick={onAccept}>
          <span className='text-[15px] leading-none tracking-normal'>✓</span>
        </Action>
      </div>
    </div>
  )
}
function Controls({ pending, setPending, offer, onResign, onOffer, onReply }: ControlsProps) {
  if (offer?.isMine === false)
    return (
      <Prompt
        label={offer.kind === 'draw' ? 'Accept A Draw?' : 'Accept A New Game?'}
        onDecline={() => {
          onReply(false)
        }}
        onAccept={() => {
          onReply(true)
        }}
      />
    )
  if (offer !== null)
    return (
      <p className='border-t border-line px-3.5 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint'>
        {offer.kind === 'draw' ? 'Draw' : 'New Game'} Offered · Waiting
      </p>
    )
  if (pending !== null)
    return (
      <Prompt
        label={{ resign: 'Resign?', draw: 'Offer A Draw?', new: 'Offer A New Game?' }[pending]}
        onDecline={() => {
          setPending(null)
        }}
        onAccept={() => {
          setPending(null)
          if (pending === 'resign') onResign()
          else onOffer(pending)
        }}
      />
    )
  return (
    <div className='border-t border-line px-3.5 py-3'>
      <div className='flex gap-2'>
        {(['resign', 'draw'] as const).map(choice => (
          <Action
            key={choice}
            onClick={() => {
              setPending(choice)
            }}>
            {choice === 'resign' ? 'Resign' : 'Draw'}
          </Action>
        ))}
      </div>
    </div>
  )
}
function Outcome({ result, ...controls }: ControlsProps & { result: Result }) {
  const isDraw = result.winner === null
  return (
    <>
      <div className='border-t border-line px-3.5 py-3'>
        <div
          className={cn(
            'rounded-[3px] border px-3 py-2.5',
            isDraw ? 'border-line-strong bg-surface-2' : 'border-good/60 bg-good/10'
          )}>
          <p
            className={cn(
              'text-[11px] font-semibold uppercase tracking-[0.12em]',
              isDraw ? 'text-ink-dim' : 'text-good'
            )}>
            {isDraw ? 'Draw' : `${result.winner} wins`}
          </p>
          <p className='mt-1 text-[11px] capitalize text-ink-faint'>{result.reason}</p>
        </div>
        {controls.offer === null && (
          <div className='mt-2 flex'>
            <Action
              onClick={() => {
                controls.onOffer('new')
              }}>
              New Game
            </Action>
          </div>
        )}
      </div>
      {controls.offer !== null && <Controls {...controls} />}
    </>
  )
}
export function GameStatus(
  props: ControlsProps & {
    players: number
    seconds: number | null
    counters: GameCounters
    canSwap: boolean
    result: Result | null
    onHost: (() => void) | null
    onDecline: () => void
    onAccept: () => void
  }
) {
  const { players, seconds, counters, canSwap, result, onHost, onDecline, onAccept, ...rest } =
    props
  useEffect(() => {
    window.scrollTo({ top: canSwap ? document.body.scrollHeight : 0, behavior: 'smooth' })
  }, [canSwap])
  return (
    <section className='overflow-hidden rounded border border-line bg-surface'>
      <header className='px-3.5 py-3'>
        <p className='text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint'>
          Clocks Off · Counters
        </p>
      </header>
      <Presence players={players} seconds={seconds} />
      <RepetitionGauge count={counters.repetition.count} limit={counters.repetition.limit} />
      <NoProgressGauge count={counters.noProgress.count} limit={counters.noProgress.limit} />
      {result === null ? (
        onHost === null ? (
          canSwap ? (
            <Prompt label='Swap Sides?' onDecline={onDecline} onAccept={onAccept} />
          ) : (
            <Controls {...rest} />
          )
        ) : (
          <div className='border-t border-line px-3.5 py-3'>
            <div className='flex'>
              <Action onClick={onHost}>Host Game</Action>
            </div>
          </div>
        )
      ) : (
        <Outcome result={result} {...rest} />
      )}
    </section>
  )
}