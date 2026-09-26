import { DurableObject } from 'cloudflare:workers'

export class Room extends DurableObject<Env> {
  override async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url)
    const active = await this.ctx.storage.get<boolean>('active')
    if (url.pathname.endsWith('/create')) {
      if (active) return new Response(null, { status: 409 })
      await this.ctx.storage.put('active', true)
      return new Response(null, { status: 201 })
    }
    if (!active) return new Response(null, { status: 404 })
    if (this.ctx.getWebSockets().length >= 2) return new Response(null, { status: 403 })
    const pair = new WebSocketPair()
    const client = pair[0]
    const server = pair[1]
    this.ctx.acceptWebSocket(server)
    await this.ctx.storage.deleteAlarm()
    const save = await this.ctx.storage.get('save')
    if (save) server.send(JSON.stringify({ save }))
    return new Response(null, { status: 101, webSocket: client })
  }
  override async webSocketMessage(ws: WebSocket, data: string | ArrayBuffer): Promise<void> {
    const text = typeof data === 'string' ? data : new TextDecoder().decode(data)
    const { save, over } = JSON.parse(text)
    if (over) return this.release()
    await this.ctx.storage.put('save', save)
    for (const other of this.ctx.getWebSockets()) if (other !== ws) other.send(text)
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
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url)
    if (url.pathname === '/create') {
      for (let i = 0; i < 10; i++) {
        const code = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
        const res = await env.ROOM.get(env.ROOM.idFromName(code)).fetch(
          new Request(`${url.origin}/${code}/create`)
        )
        if (res.status === 201) return new Response(code)
      }
      return new Response(null, { status: 503 })
    }
    const code = url.pathname.split('/')[1]
    if (!/^\d{6}$/u.test(code ?? '')) return new Response(null, { status: 400 })
    return env.ROOM.get(env.ROOM.idFromName(code!)).fetch(req)
  }
}