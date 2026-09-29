export function Invite({ link, onClose }: { link: string; onClose: () => void }) {
  return (
    <div className='fixed inset-0 z-20 grid place-items-center bg-bg/70 px-4 backdrop-blur-[2px]'>
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
          <button
            type='button'
            onClick={() => {
              void navigator.clipboard.writeText(link)
            }}
            className='h-9 flex-1 cursor-pointer rounded-[3px] border border-line bg-surface-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-dim hover:text-ink'>
            Copy
          </button>
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