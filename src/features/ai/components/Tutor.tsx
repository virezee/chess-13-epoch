'use client'

import type { Message, Transcript } from '@/types/tutor'
import { useState, useEffect, useRef } from 'react'
import { TUTOR } from '@/constants/storage'
import { USER, ASSISTANT } from '@/constants/chat'
import { ask } from '../lib/question'
import { cn } from '@/lib/cn'

const EMPTY: Transcript = { isOpen: false, messages: [] }
const NOTICE: Record<number, string> = {
  400: 'That question is too long or malformed.',
  422: 'I only answer questions about chess.',
  429: 'Too many questions. Wait a minute and try again.',
  503: 'The tutor is unavailable right now. Try again later.'
}

const isMessage = (value: unknown): value is Message =>
  typeof value === 'object' &&
  value !== null &&
  'role' in value &&
  (value.role === USER || value.role === ASSISTANT) &&
  'content' in value &&
  typeof value.content === 'string'
const isTranscript = (value: unknown): value is Transcript =>
  typeof value === 'object' &&
  value !== null &&
  'isOpen' in value &&
  typeof value.isOpen === 'boolean' &&
  'messages' in value &&
  Array.isArray(value.messages) &&
  value.messages.every((message: unknown) => isMessage(message))
const load = (): Transcript => {
  try {
    const stored = sessionStorage.getItem(TUTOR)
    if (stored === null) return EMPTY
    const transcript: unknown = JSON.parse(stored)
    return isTranscript(transcript) ? transcript : EMPTY
  } catch {
    return EMPTY
  }
}
const save = (transcript: Transcript): void => {
  try {
    sessionStorage.setItem(TUTOR, JSON.stringify(transcript))
  } catch {}
}
const append = (messages: Message[], text: string): Message[] =>
  messages.map((message, index) =>
    index === messages.length - 1 ? { ...message, content: message.content + text } : message
  )
const useTutor = () => {
  const [transcript, setTranscript] = useState<Transcript>(EMPTY)
  const [isLoaded, setLoaded] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [isBusy, setBusy] = useState(false)
  useEffect(() => {
    setTranscript(load())
    setLoaded(true)
  }, [])
  useEffect(() => {
    if (isLoaded) save(transcript)
  }, [isLoaded, transcript])
  const toggle = (): void => {
    setTranscript(current => ({ ...current, isOpen: !current.isOpen }))
  }
  const send = async (question: string): Promise<void> => {
    const history: Message[] = [...transcript.messages, { role: USER, content: question }]
    setTranscript(current => ({
      ...current,
      messages: [...history, { role: ASSISTANT, content: '' }]
    }))
    setNotice(null)
    setBusy(true)
    const status = await ask(history, text => {
      setTranscript(current => ({ ...current, messages: append(current.messages, text) }))
    }).catch(() => 0)
    setBusy(false)
    if (status === 200) return
    setTranscript(current => ({ ...current, messages: transcript.messages }))
    setNotice(NOTICE[status] ?? 'Could not reach the tutor.')
  }
  return { transcript, notice, isBusy, send, toggle }
}
function Messages({ messages, notice }: { messages: Message[]; notice: string | null }) {
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (box.current !== null) box.current.scrollTop = box.current.scrollHeight
  }, [messages])
  return (
    <div ref={box} className='flex flex-1 select-text flex-col gap-2 overflow-y-auto p-3'>
      {messages.length === 0 && (
        <p className='text-[13px] leading-snug text-ink-faint'>
          Ask anything about the rules of Chess 13: Epoch or standard chess.
        </p>
      )}
      {messages.map((message, index) => (
        <p
          key={index}
          className={cn(
            'max-w-[85%] whitespace-pre-wrap rounded-[3px] px-2.5 py-2 text-[13px] leading-snug',
            message.role === USER
              ? 'self-end bg-surface-2 text-ink'
              : 'self-start border border-line text-ink-dim'
          )}>
          {message.content === '' ? '…' : message.content}
        </p>
      ))}
      {notice !== null && <p className='text-[12px] leading-snug text-alert'>{notice}</p>}
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
function Panel({
  messages,
  notice,
  isBusy,
  onSend,
  onClose
}: {
  messages: Message[]
  notice: string | null
  isBusy: boolean
  onSend: (question: string) => void
  onClose: () => void
}) {
  return (
    <section className='flex h-[28rem] max-h-[70vh] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded border border-line bg-surface shadow-lg'>
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
        <Panel
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