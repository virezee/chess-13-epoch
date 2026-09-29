export const WORKER =
  process.env.NEXT_PUBLIC_WORKER ?? 'wss://chess-13-epoch-room.virezee.workers.dev'
export const API = WORKER.replace(/^ws/u, 'http')
export const DATA = 'data: '
export const DONE = '[DONE]'