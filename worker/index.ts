import { DurableObject } from 'cloudflare:workers'

type Role = 'host' | 'guest'
const claim = async (env: Env, req: Request, left: number): Promise<Response> => {
  if (left === 0) return new Response(null, { status: 503 })
  const code = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
  const res = await env.ROOM.get(env.ROOM.idFromName(code)).fetch(
    new Request(`${new URL(req.url).origin}/${code}/create`, req)
  )
  return res.status === 409 ? claim(env, req, left - 1) : res
}
export class Room extends DurableObject<Env> {
  override async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url)
    const creating = url.pathname.endsWith('/create')
    const active = await this.ctx.storage.get<boolean>('active')
    if (creating && active) return new Response(null, { status: 409 })
    if (!creating && !active) return new Response(null, { status: 404 })
    const sockets = this.ctx.getWebSockets()
    if (sockets.length >= 2) return new Response(null, { status: 403 })
    if (creating) await this.ctx.storage.put('active', true)
    const role: Role = sockets.some(ws => ws.deserializeAttachment() === 'host') ? 'guest' : 'host'
    const pair = new WebSocketPair()
    const client = pair[0]
    const server = pair[1]
    this.ctx.acceptWebSocket(server)
    server.serializeAttachment(role)
    await this.ctx.storage.deleteAlarm()
    if (creating) server.send(JSON.stringify({ code: url.pathname.split('/')[1] }))
    server.send(JSON.stringify({ role }))
    const save = await this.ctx.storage.get('save')
    if (save) server.send(JSON.stringify({ save }))
    this.broadcast({ players: this.ctx.getWebSockets().length })
    return new Response(null, { status: 101, webSocket: client })
  }
  override async webSocketMessage(ws: WebSocket, data: string | ArrayBuffer): Promise<void> {
    const text = typeof data === 'string' ? data : new TextDecoder().decode(data)
    const { save } = JSON.parse(text)
    for (const other of this.ctx.getWebSockets()) if (other !== ws) other.send(text)
    if (save) await this.ctx.storage.put('save', save)
  }
  override async webSocketClose(ws: WebSocket): Promise<void> {
    const others = this.ctx.getWebSockets().filter(other => other !== ws)
    if (others.length === 0) return this.release()
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
    if (req.headers.get('Upgrade') !== 'websocket') return new Response(null, { status: 426 })
    if (url.pathname === '/create') return claim(env, req, 10)
    const code = url.pathname.split('/')[1]
    if (!/^\d{6}$/u.test(code ?? '')) return new Response(null, { status: 400 })
    return env.ROOM.get(env.ROOM.idFromName(code!)).fetch(req)
  }
}