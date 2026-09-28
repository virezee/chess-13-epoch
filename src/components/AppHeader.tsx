'use client'

import { usePathname } from 'next/navigation'
import { IconButton } from './ui/IconButton'
import { PieceSetToggle } from './PieceSetToggle'
import { ThemeToggle } from './ThemeToggle'
import { cn } from '@/lib/cn'

export function AppHeader() {
  const isBoard = usePathname() !== '/rules'
  return (
    <header className='sticky top-0 z-10 border-b border-line bg-bg/85 backdrop-blur'>
      <div className='mx-auto flex h-14 w-full max-w-[1600px] items-center justify-between px-5'>
        <span className='whitespace-nowrap font-display text-[30px] leading-none text-ink'>
          Chess 13<span className='hidden sm:inline'>: Epoch</span>
        </span>
        <div className='flex items-center gap-1'>
          {isBoard && <PieceSetToggle />}
          <IconButton label={isBoard ? 'Rules' : 'Board'} href={isBoard ? '/rules' : '/'}>
            <span
              className={cn(
                'h-4 w-4 bg-current',
                isBoard
                  ? '[mask:url(/guide.svg)_center/contain_no-repeat]'
                  : '[mask:url(/board.svg)_center/contain_no-repeat]'
              )}
            />
          </IconButton>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}