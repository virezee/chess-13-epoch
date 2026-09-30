import type { USER, ASSISTANT } from '@/constants/chat'

export interface Message {
  role: typeof USER | typeof ASSISTANT
  content: string
}
export interface Entry extends Message {
  id: number
}
export interface Transcript {
  isOpen: boolean
  messages: Entry[]
}
export interface Conversation {
  transcript: Transcript
  notice: string | null
  isBusy: boolean
  send: (question: string) => Promise<void>
  toggle: () => void
}