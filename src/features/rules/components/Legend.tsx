import { FONT_SIZE, BASELINE, BUFF, SELECTED, DEST, DEST_CAPTURE, MARKS } from '@/constants/style'
import { arrowPoints } from '@/features/game/lib/annotation'

function Mark({
  background,
  letter,
  clip,
  arrow,
  children
}: {
  background?: string
  letter?: string
  clip?: string
  arrow?: string
  children: string
}) {
  return (
    <li className='flex items-center gap-3'>
      {arrow === undefined ? (
        <span className='size-7 shrink-0 select-none rounded-xs bg-square-dark outline outline-square-edge'>
          <span className='block h-full w-full' style={{ background, clipPath: clip }}>
            <svg viewBox='0 0 100 100' className='h-full w-full opacity-70' aria-hidden>
              <text
                x='50'
                y={BASELINE}
                textAnchor='middle'
                fontSize={FONT_SIZE}
                className='fill-square-command-ink font-command'>
                {letter}
              </text>
            </svg>
          </span>
        </span>
      ) : (
        <svg viewBox='0.85 12.17 0.66 0.66' className='size-7 shrink-0' aria-hidden>
          <polygon points={arrowPoints({ from: 'a1', to: 'b1' }, false)} fill={arrow} />
        </svg>
      )}
      <span className='text-[13px] leading-snug text-ink-dim'>{children}</span>
    </li>
  )
}
export function Legend() {
  return (
    <div className='mt-4 rounded border border-ink/20 bg-ink/5 px-3.5 py-3'>
      <p className='text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint'>Legend</p>
      <ul className='mt-2.5 grid gap-2 sm:grid-cols-2'>
        <Mark background={SELECTED}>The green square is the piece being explained.</Mark>
        <Mark background={DEST}>A green dot is a square the piece can move to.</Mark>
        <Mark background={DEST_CAPTURE}>
          Red corners are a square the piece can move to only when the move takes a piece.
        </Mark>
        <Mark background={MARKS.red}>A red square is a piece caught in a blast.</Mark>
        <Mark arrow={MARKS.red}>
          A red arrow shows the piece attacking an opponent&apos;s piece.
        </Mark>
        <Mark arrow={MARKS.blue}>
          A blue arrow shows the piece defending a piece of the same colour.
        </Mark>
        <Mark background={BUFF.white} clip='polygon(50% 0, 100% 50%, 50% 100%, 0 50%)'>
          The badge behind a piece means it is enhanced.
        </Mark>
        <Mark background='var(--square-command)' letter='M'>
          The purple square is the command square.
        </Mark>
      </ul>
      <p className='mt-2.5 text-[11px] leading-snug text-ink-faint'>
        These marks belong to this page only, to make the diagrams easier to read. In a game you may
        mark the board however you like.
      </p>
    </div>
  )
}