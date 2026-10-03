import type { Role } from '@/types/network'
import { HOST, GUEST } from '@/constants/room'
import { DurableObject } from 'cloudflare:workers'
import { tutor } from './tutor'

const PRODUCTION = 'https://chess-13-epoch.vercel.app'
const ORIGINS = new Set([
  PRODUCTION,
  'https://chess-13-epoch-git-feature-online-play-virezee.vercel.app'
])
const site = (req: Request): string => {
  const origin = req.headers.get('origin') ?? ''
  return ORIGINS.has(origin) ? origin : PRODUCTION
}
const cors = (req: Request): Record<string, string> => ({
  'access-control-allow-origin': site(req),
  'access-control-allow-methods': 'POST',
  'access-control-allow-headers': 'content-type',
  vary: 'origin'
})
const withCors = async (req: Request, res: Promise<Response>): Promise<Response> => {
  const response = await res
  for (const [name, value] of Object.entries(cors(req))) response.headers.set(name, value)
  return response
}
const claim = async (req: Request, env: Env, left: number): Promise<Response> => {
  if (left === 0) return new Response(null, { status: 503 })
  const code = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
  const res = await env.ROOM.get(env.ROOM.idFromName(code)).fetch(
    new Request(`${new URL(req.url).origin}/${code}/create`, req)
  )
  return res.status === 409 ? claim(req, env, left - 1) : res
}
export class Room extends DurableObject<Env> {
  override async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url)
    const creating = url.pathname.endsWith('/create')
    const active = await this.ctx.storage.get<boolean>('active')
    if (creating && active === true) return new Response(null, { status: 409 })
    if (!creating && active !== true) {
      const pair = new WebSocketPair()
      pair[1].accept()
      pair[1].send(JSON.stringify({ rejected: true }))
      pair[1].close()
      return new Response(null, { status: 101, webSocket: pair[0] })
    }
    const sockets = this.ctx.getWebSockets()
    if (sockets.length >= 2) return new Response(null, { status: 403 })
    if (creating) await this.ctx.storage.put('active', true)
    const role: Role = sockets.some(ws => ws.deserializeAttachment() === HOST) ? GUEST : HOST
    const pair = new WebSocketPair()
    const client = pair[0]
    const server = pair[1]
    this.ctx.acceptWebSocket(server)
    server.serializeAttachment(role)
    await this.ctx.storage.deleteAlarm()
    if (creating) server.send(JSON.stringify({ code: url.pathname.split('/')[1] }))
    server.send(JSON.stringify({ role }))
    const save = await this.ctx.storage.get('save')
    if (save !== undefined) server.send(JSON.stringify({ save }))
    this.broadcast({ players: this.ctx.getWebSockets().length })
    return new Response(null, { status: 101, webSocket: client })
  }
  override async webSocketMessage(ws: WebSocket, data: string | ArrayBuffer): Promise<void> {
    const text = typeof data === 'string' ? data : new TextDecoder().decode(data)
    const message: unknown = JSON.parse(text)
    for (const other of this.ctx.getWebSockets()) if (other !== ws) other.send(text)
    if (typeof message !== 'object' || message === null || !('save' in message)) return
    const isOver = 'over' in message && message.over === true
    await this.ctx.storage.put('over', isOver)
    if (isOver) await this.ctx.storage.delete('save')
    else await this.ctx.storage.put('save', message.save)
  }
  override async webSocketClose(ws: WebSocket): Promise<void> {
    const others = this.ctx.getWebSockets().filter(other => other !== ws)
    if (others.length === 0) return this.release()
    const isOver = await this.ctx.storage.get<boolean>('over')
    if (isOver === true) return this.ctx.storage.setAlarm(Date.now())
    const deadline = Date.now() + 60_000
    await this.ctx.storage.setAlarm(deadline)
    for (const other of others)
      other.send(JSON.stringify({ players: others.length, remaining: deadline - Date.now() }))
  }
  override async alarm(): Promise<void> {
    this.broadcast({ abandoned: true })
    await this.release()
  }
  private broadcast(message: object): void {
    const text = JSON.stringify(message)
    for (const ws of this.ctx.getWebSockets()) ws.send(text)
  }
  private async release(): Promise<void> {
    await this.ctx.storage.deleteAlarm()
    for (const ws of this.ctx.getWebSockets()) ws.close()
    await this.ctx.storage.deleteAll()
  }
}
export default {
  fetch(req: Request, env: Env): Promise<Response> | Response {
    const url = new URL(req.url)
    if (url.pathname === '/tutor') {
      if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) })
      return withCors(req, tutor(req, env, site(req)))
    }
    if (req.headers.get('Upgrade') !== 'websocket') return new Response(null, { status: 426 })
    if (url.pathname === '/create') return claim(req, env, 10)
    const code = url.pathname.split('/')[1]
    if (!/^\d{6}$/u.test(code ?? '')) return new Response(null, { status: 400 })
    return env.ROOM.get(env.ROOM.idFromName(code ?? '')).fetch(req)
  }
}