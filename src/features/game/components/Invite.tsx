import { useState, useEffect } from 'react'
import { cn } from '@/lib/cn'

function Copy({ link }: { link: string }) {
  const [isCopied, setCopied] = useState(false)
  useEffect(() => {
    const timer = isCopied
      ? setTimeout(() => {
          setCopied(false)
        }, 1500)
      : null
    return (): void => {
      if (timer !== null) clearTimeout(timer)
    }
  }, [isCopied])
  return (
    <button
      type='button'
      onClick={() => {
        void navigator.clipboard.writeText(link).then(() => {
          setCopied(true)
        })
      }}
      className={cn(
        'h-9 flex-1 cursor-pointer rounded-[3px] border text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors',
        isCopied
          ? 'border-good/60 bg-good/10 text-good'
          : 'border-line bg-surface-2 text-ink-dim hover:text-ink'
      )}>
      {isCopied ? 'Copied' : 'Copy'}
    </button>
  )
}
export function Invite({ link, onClose }: { link: string; onClose: () => void }) {
  return (
    <div className='fixed inset-0 z-20 grid place-items-center bg-bg/70 px-4 backdrop-blur-[1px]'>
      <section className='w-full max-w-sm rounded border border-line bg-surface px-4 py-4'>
        <p className='text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint'>
          Invite A Player
        </p>
        <p className='mt-2 text-[13px] leading-snug text-ink-dim'>
          Send this link to your opponent. The game starts when they join.
        </p>
        <p className='mt-3 select-text break-all rounded-[3px] border border-line bg-surface-2 px-2.5 py-2 font-notation text-[12px] text-ink'>
          {link}
        </p>
        <div className='mt-3 flex gap-2'>
          <Copy link={link} />
          <button
            type='button'
            onClick={onClose}
            className='h-9 flex-1 cursor-pointer rounded-[3px] border border-line bg-surface-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-dim hover:text-ink'>
            Close
          </button>
        </div>
      </section>
    </div>
  )
}