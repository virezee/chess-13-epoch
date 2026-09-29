import type { SetStateAction, Dispatch, RefObject } from 'react'
import type { Move, Save } from './game'
import type { HOST, GUEST, DRAW, NEW } from '@/constants/room'

export type Role = typeof HOST | typeof GUEST
export type Offer = typeof DRAW | typeof NEW
export interface OfferState {
  offer: Offer
  outgoing: boolean
}
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
export interface Dispatchers {
  link: (link: string) => void
  role: (role: Role) => void
  save: Dispatch<SetStateAction<Save>>
  offer: (offer: OfferState | null) => void
  promotions: (moves: Move[]) => void
  key: Dispatch<SetStateAction<number>>
  players: (players: number) => void
  seconds: (seconds: number | null) => void
}
export interface Connection {
  send: (save: Save, over: boolean) => void
  offer: (offer: Offer) => void
  decline: (offer: Offer) => void
  leave: () => void
}
export interface Room {
  connection: RefObject<Connection | null>
  role: Role | null
  link: string | null
  players: number
  seconds: number | null
  offer: OfferState | null
  setLink: (link: string | null) => void
  setOffer: (offer: OfferState | null) => void
}