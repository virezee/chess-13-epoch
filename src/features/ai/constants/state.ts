import type { Transcript } from '@/types/tutor'

export const EMPTY: Transcript = { isOpen: false, messages: [] }
export const NOTICE: Record<number, string> = {
  400: 'That question is too long or malformed.',
  422: 'I only answer questions about chess.',
  429: 'Too many questions. Wait a minute and try again.',
  503: 'The tutor is unavailable right now. Try again later.'
}