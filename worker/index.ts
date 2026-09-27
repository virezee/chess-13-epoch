import { DurableObject } from 'cloudflare:workers'

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
    if (this.ctx.getWebSockets().length >= 2) return new Response(null, { status: 403 })
    if (creating) await this.ctx.storage.put('active', true)
    const pair = new WebSocketPair()
    const client = pair[0]
    const server = pair[1]
    this.ctx.acceptWebSocket(server)
    await this.ctx.storage.deleteAlarm()
    if (creating) server.send(JSON.stringify({ code: url.pathname.split('/')[1] }))
    const save = await this.ctx.storage.get('save')
    if (save) server.send(JSON.stringify({ save }))
    return new Response(null, { status: 101, webSocket: client })
  }
  override async webSocketMessage(ws: WebSocket, data: string | ArrayBuffer): Promise<void> {
    const text = typeof data === 'string' ? data : new TextDecoder().decode(data)
    const { save, over } = JSON.parse(text)
    for (const other of this.ctx.getWebSockets()) if (other !== ws) other.send(text)
    if (over) return this.release()
    await this.ctx.storage.put('save', save)
  }
  override async webSocketClose(ws: WebSocket): Promise<void> {
    const left = this.ctx.getWebSockets().filter(other => other !== ws).length
    if (left === 0) return this.release()
    if (left === 1) await this.ctx.storage.setAlarm(Date.now() + 60_000)
  }
  override async alarm(): Promise<void> {
    for (const ws of this.ctx.getWebSockets()) ws.send(JSON.stringify({ abandoned: true }))
    await this.release()
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