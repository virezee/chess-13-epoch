import type { Message } from '@/types/tutor'
import { API, DATA, DONE } from '@/constants/server'

const parse = (data: string): string => {
  if (data === DONE) return ''
  const chunk: unknown = JSON.parse(data)
  if (typeof chunk !== 'object' || chunk === null || !('choices' in chunk)) return ''
  const choice: unknown = Array.isArray(chunk.choices) ? chunk.choices[0] : null
  if (typeof choice !== 'object' || choice === null || !('delta' in choice)) return ''
  const { delta } = choice
  return typeof delta === 'object' &&
    delta !== null &&
    'content' in delta &&
    typeof delta.content === 'string'
    ? delta.content
    : ''
}
const pump = async (
  reader: ReadableStreamDefaultReader<string>,
  buffer: string,
  onChunk: (text: string) => void
): Promise<void> => {
  const { done, value } = await reader.read()
  if (done) return
  const lines = `${buffer}${value}`.split('\n')
  for (const line of lines.slice(0, -1))
    if (line.startsWith(DATA)) onChunk(parse(line.slice(DATA.length)))
  await pump(reader, lines.at(-1) ?? '', onChunk)
}
export const ask = async (history: Message[], onChunk: (text: string) => void): Promise<number> => {
  const res = await fetch(`${API}/tutor`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(history)
  })
  if (res.ok && res.body !== null)
    await pump(res.body.pipeThrough(new TextDecoderStream()).getReader(), '', onChunk)
  return res.status
}