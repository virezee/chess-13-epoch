import type { USER, ASSISTANT } from '@/constants/chat'

export interface Message {
  role: typeof USER | typeof ASSISTANT
  content: string
}