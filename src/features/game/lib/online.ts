import type { Role, Offer, Handlers, Connection } from '@/types/network'
import { WORKER } from '@/constants/server'
import { HOST, GUEST, DRAW, NEW } from '@/constants/room'
import { isSave } from './save'

const isRole = (value: unknown): value is Role => value === HOST || value === GUEST
const isOffer = (value: unknown): value is Offer => value === DRAW || value === NEW
export const connect = (path: string, handlers: Handlers): Connection => {
  const ws = new WebSocket(`${WORKER}/${path}`)
  ws.addEventListener('message', event => {
    if (typeof event.data !== 'string') return
    const message: unknown = JSON.parse(event.data)
    if (typeof message !== 'object' || message === null) return
    if ('code' in message && typeof message.code === 'string') handlers.onCode(message.code)
    else if ('role' in message && isRole(message.role)) handlers.onRole(message.role)
    else if ('save' in message && isSave(message.save)) handlers.onSave(message.save)
    else if ('players' in message && typeof message.players === 'number')
      handlers.onPlayers(
        message.players,
        'remaining' in message && typeof message.remaining === 'number' ? message.remaining : null
      )
    else if ('abandoned' in message && message.abandoned === true) handlers.onAbandoned()
    else if ('offer' in message && isOffer(message.offer)) handlers.onOffer(message.offer)
    else if ('decline' in message && isOffer(message.decline)) handlers.onDecline(message.decline)
  })
  let isOpen = false
  ws.addEventListener('open', () => {
    isOpen = true
  })
  ws.addEventListener('close', () => {
    if (isOpen) handlers.onClose()
    else handlers.onReject()
  })
  return {
    send: (save, over) => {
      ws.send(JSON.stringify({ save, over }))
    },
    offer: offer => {
      ws.send(JSON.stringify({ offer }))
    },
    decline: offer => {
      ws.send(JSON.stringify({ decline: offer }))
    },
    leave: () => {
      ws.close()
    }
  }
}