import type { Save } from '@/types/game'
import { opening } from '../engine/opening'

const hasKeys = (value: unknown, shape: object): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && Object.keys(shape).every(key => key in value)
export const isSave = (value: unknown): value is Save => {
  const shape = opening()
  return (
    hasKeys(value, shape) &&
    hasKeys(value['state'], shape.state) &&
    hasKeys(value['match'], shape.match)
  )
}