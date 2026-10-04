'use client'

import type { Entry } from '@/types/tutor'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { USER } from '@/constants/chat'
import { useTutor } from '../lib/memory'
import { cn } from '@/lib/cn'
import { FENCE, INLINE } from '../constants/format'

function Inline({ text }: { text: string }) {
  const nodes: ReactNode[] = []
  let last = 0
  for (const match of text.matchAll(INLINE)) {
    const [token] = match
    if (match.index > last) nodes.push(text.slice(last, match.index))
    nodes.push(
      token.startsWith('`') ? (
        <code
          key={match.index}
          className='rounded-xs bg-surface-2 px-1 py-px font-mono text-[12px] text-ink'>
          {token.slice(1, -1)}
        </code>
      ) : (
        <a
          key={match.index}
          href={token}
          target='_blank'
          rel='noreferrer'
          className='break-all text-ink underline underline-offset-2'>
          {token}
        </a>
      )
    )
    last = match.index + token.length
  }
  nodes.push(text.slice(last))
  return nodes
}
function Content({ text }: { text: string }) {
  const nodes: ReactNode[] = []
  let at = 0
  for (const [index, part] of text.split(FENCE).entries()) {
    nodes.push(
      index % 2 === 1 ? (
        <pre
          key={at}
          className='my-1 overflow-x-auto whitespace-pre rounded-[3px] border border-line bg-surface-2 p-2 font-mono text-[12px] leading-snug text-ink'>
          {part.replace(/^\w*\n/u, '').replace(/\n$/u, '')}
        </pre>
      ) : (
        <Inline key={at} text={part} />
      )
    )
    at += part.length + FENCE.length
  }
  return nodes
}
function Messages({ messages, notice }: { messages: Entry[]; notice: string | null }) {
  return (
    <div className='flex flex-1 select-text flex-col-reverse overflow-y-auto p-3'>
      <div className='flex flex-col gap-2'>
        {messages.length === 0 && (
          <p className='text-[13px] leading-snug text-ink-faint'>
            Ask anything about the rules of Chess 13: Epoch or standard chess.
          </p>
        )}
        {messages.map(message => (
          <div
            key={message.id}
            className={cn(
              'max-w-[85%] whitespace-pre-wrap rounded-[3px] px-2.5 py-2 text-[13px] leading-snug',
              message.role === USER
                ? 'self-end bg-surface-2 text-ink'
                : 'self-start border border-line text-ink-dim'
            )}>
            {message.content === '' ? '…' : <Content text={message.content} />}
          </div>
        ))}
        {notice !== null && <p className='text-[12px] leading-snug text-alert'>{notice}</p>}
      </div>
    </div>
  )
}
function Composer({ isBusy, onSend }: { isBusy: boolean; onSend: (question: string) => void }) {
  const [draft, setDraft] = useState('')
  return (
    <form
      className='flex gap-2 border-t border-line p-2.5'
      onSubmit={event => {
        event.preventDefault()
        const question = draft.trim()
        if (question === '' || isBusy) return
        setDraft('')
        onSend(question)
      }}>
      <input
        value={draft}
        maxLength={500}
        placeholder='Ask about the rules'
        onChange={event => {
          setDraft(event.target.value)
        }}
        className='h-9 min-w-0 flex-1 select-text rounded-[3px] border border-line bg-surface-2 px-2.5 text-[13px] text-ink outline-none placeholder:text-ink-faint focus:border-line-strong'
      />
      <button
        type='submit'
        disabled={isBusy}
        className='h-9 cursor-pointer rounded-[3px] border border-line bg-surface-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-dim hover:text-ink disabled:cursor-default disabled:opacity-50'>
        Send
      </button>
    </form>
  )
}
function Chatbox({
  messages,
  notice,
  isBusy,
  onSend,
  onClose
}: {
  messages: Entry[]
  notice: string | null
  isBusy: boolean
  onSend: (question: string) => void
  onClose: () => void
}) {
  return (
    <section className='flex h-112 max-h-[70vh] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded border border-line bg-surface shadow-lg'>
      <header className='flex items-center justify-between border-b border-line px-3.5 py-2.5'>
        <p className='text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint'>
          Rules Tutor
        </p>
        <button
          type='button'
          aria-label='Close tutor'
          onClick={onClose}
          className='cursor-pointer text-[15px] leading-none text-ink-faint hover:text-ink'>
          ✕
        </button>
      </header>
      <Messages messages={messages} notice={notice} />
      <Composer isBusy={isBusy} onSend={onSend} />
    </section>
  )
}
export function Tutor() {
  const { transcript, notice, isBusy, send, toggle } = useTutor()
  return (
    <div className='fixed bottom-4 right-4 z-30 flex flex-col items-end gap-3'>
      {transcript.isOpen && (
        <Chatbox
          messages={transcript.messages}
          notice={notice}
          isBusy={isBusy}
          onSend={question => {
            void send(question)
          }}
          onClose={toggle}
        />
      )}
      <button
        type='button'
        aria-label={transcript.isOpen ? 'Close tutor' : 'Open tutor'}
        onClick={toggle}
        className='grid size-12 cursor-pointer place-items-center rounded-full border border-line bg-surface text-ink-dim shadow-lg transition-colors hover:text-ink'>
        <span className='size-5 bg-current [mask:url(/guide.svg)_center/contain_no-repeat]' />
      </button>
    </div>
  )
}