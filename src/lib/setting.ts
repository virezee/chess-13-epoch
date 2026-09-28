import { useSyncExternalStore } from 'react'

const read = <T extends string>(key: string, values: readonly T[], fallback: T): T => {
  try {
    const stored = localStorage.getItem(key)
    return values.find(value => value === stored) ?? fallback
  } catch {
    return fallback
  }
}
const write = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value)
  } catch {
    window.alert('Storage is blocked by the browser.')
  }
}
export const setting = <T extends string>(
  key: string,
  values: readonly T[],
  fallback: T
): { use: () => T; set: (value: T) => void } => {
  const subscribe = (onChange: () => void): (() => void) => {
    window.addEventListener(key, onChange)
    return () => {
      window.removeEventListener(key, onChange)
    }
  }
  return {
    use: (): T =>
      useSyncExternalStore(
        subscribe,
        (): T => read(key, values, fallback),
        (): T => fallback
      ),
    set: (value: T): void => {
      write(key, value)
      window.dispatchEvent(new Event(key))
    }
  }
}