import type { Message, Entry, Transcript, Conversation } from '@/types/tutor'
import { useState, useSyncExternalStore } from 'react'
import { TUTOR } from '@/constants/storage'
import { EMPTY, NOTICE } from '../constants/state'
import { USER, ASSISTANT } from '@/constants/chat'
import { ask } from '../lib/question'

const isMessage = (value: unknown): value is Message =>
  typeof value === 'object' &&
  value !== null &&
  'role' in value &&
  (value.role === USER || value.role === ASSISTANT) &&
  'content' in value &&
  typeof value.content === 'string'
const isEntry = (value: unknown): value is Entry =>
  isMessage(value) && 'id' in value && typeof value.id === 'number'
const isTranscript = (value: unknown): value is Transcript =>
  typeof value === 'object' &&
  value !== null &&
  'isOpen' in value &&
  typeof value.isOpen === 'boolean' &&
  'messages' in value &&
  Array.isArray(value.messages) &&
  value.messages.every((message: unknown) => isEntry(message))
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
const listeners = new Set<() => void>()
let cache: Transcript | null = null
const read = (): Transcript => {
  cache ??= load()
  return cache
}
const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
const update = (change: (current: Transcript) => Transcript): void => {
  cache = change(read())
  save(cache)
  for (const listener of listeners) listener()
}
const append = (messages: Entry[], text: string): Entry[] =>
  messages.map((message, index) =>
    index === messages.length - 1 ? { ...message, content: message.content + text } : message
  )
const toggle = (): void => {
  update(current => ({ ...current, isOpen: !current.isOpen }))
}
export const useTutor = (): Conversation => {
  const transcript = useSyncExternalStore(subscribe, read, () => EMPTY)
  const [notice, setNotice] = useState<string | null>(null)
  const [isBusy, setBusy] = useState(false)
  const send = async (question: string): Promise<void> => {
    const id = (transcript.messages.at(-1)?.id ?? 0) + 1
    const history: Entry[] = [...transcript.messages, { id, role: USER, content: question }]
    update(current => ({
      ...current,
      messages: [...history, { id: id + 1, role: ASSISTANT, content: '' }]
    }))
    setNotice(null)
    setBusy(true)
    const status = await ask(
      history.map(({ role, content }) => ({ role, content })),
      text => {
        update(current => ({ ...current, messages: append(current.messages, text) }))
      }
    ).catch(() => 0)
    setBusy(false)
    if (status === 200) return
    update(current => ({ ...current, messages: transcript.messages }))
    setNotice(NOTICE[status] ?? 'Could not reach the tutor.')
  }
  return { transcript, notice, isBusy, send, toggle }
}