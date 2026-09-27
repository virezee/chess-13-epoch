import type { Handlers, Connection } from '@/types/network'
import { WORKER } from '@/constants/server'

export const connect = (path: string, handlers: Handlers): Connection => {
  const ws = new WebSocket(`wss://${WORKER}/${path}`)
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data as string)
    if (message.code) handlers.onCode(message.code)
    else if (message.abandoned) handlers.onAbandoned()
    else if (message.save) handlers.onSave(message.save)
  })
  ws.addEventListener('close', handlers.onClose)
  return {
    send: (save, over) => ws.send(JSON.stringify({ save, over })),
    leave: () => ws.close()
  }
}