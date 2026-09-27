import type { Save } from './game'

export interface Handlers {
  onCode: (code: string) => void
  onSave: (save: Save) => void
  onAbandoned: () => void
  onClose: () => void
}
export interface Connection {
  send: (save: Save, over: boolean) => void
  leave: () => void
}