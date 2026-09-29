import type { Message, Transcript } from '@/types/tutor'
import { useState, useEffect } from 'react'
import { TUTOR } from '@/constants/storage'
import { EMPTY } from '../constants/state'
import { USER, ASSISTANT } from '@/constants/chat'
import { ask } from '../lib/question'

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
export const useTutor = () => {
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