import type { DARK, LIGHT, NATIVE, CLASSIC } from '@/constants/display'

export type Theme = typeof DARK | typeof LIGHT
export type Mode = typeof NATIVE | typeof CLASSIC