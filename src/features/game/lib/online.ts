import type { Handlers, Connection } from '@/types/network'
import { WORKER } from '@/constants/server'

export const connect = (path: string, handlers: Handlers): Connection => {
  const ws = new WebSocket(`wss://${WORKER}/${path}`)
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data as string)
    if (message.code) handlers.onCode(message.code)
    else if (message.role) handlers.onRole(message.role)
    else if (message.save) handlers.onSave(message.save)
    else if (message.players) handlers.onPlayers(message.players, message.remaining ?? null)
    else if (message.abandoned) handlers.onAbandoned()
    else if (message.offer) handlers.onOffer(message.offer)
    else if (message.decline) handlers.onDecline(message.decline)
  })
  ws.addEventListener('close', handlers.onClose)
  return {
    send: save => ws.send(JSON.stringify({ save })),
    offer: offer => ws.send(JSON.stringify({ offer })),
    decline: offer => ws.send(JSON.stringify({ decline: offer })),
    leave: () => ws.close()
  }
}