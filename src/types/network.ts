import type { Save } from './game'
import type { HOST, GUEST, DRAW, NEW } from '@/constants/room'

export type Role = typeof HOST | typeof GUEST
export type Offer = typeof DRAW | typeof NEW
export interface Handlers {
  onCode: (code: string) => void
  onRole: (role: Role) => void
  onSave: (save: Save) => void
  onPlayers: (players: number, remaining: number | null) => void
  onAbandoned: () => void
  onOffer: (offer: Offer) => void
  onDecline: (offer: Offer) => void
  onClose: () => void
}
export interface Connection {
  send: (save: Save, over: boolean) => void
  offer: (offer: Offer) => void
  decline: (offer: Offer) => void
  leave: () => void
}