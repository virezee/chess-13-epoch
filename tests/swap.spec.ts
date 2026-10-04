import type { Page, BrowserContext } from '@playwright/test'
import { test, expect } from '@playwright/test'
import { SIZE } from '@/constants/board'
import { parseSquare } from '@/features/game/lib/coordinate'

const BOARD = '.outline-square-edge'
const cell = (square: string, isFlipped: boolean): { column: number; row: number } => {
  const { file, rank } = parseSquare(square)
  return {
    column: isFlipped ? SIZE - 1 - file : file,
    row: isFlipped ? rank - 1 : SIZE - rank
  }
}
const select = async (page: Page, square: string, isFlipped: boolean): Promise<void> => {
  const board = page.locator(BOARD)
  const width = await board.evaluate(element => element.clientWidth)
  const { column, row } = cell(square, isFlipped)
  await board.click({
    position: { x: ((column + .5) * width) / SIZE, y: ((row + .5) * width) / SIZE }
  })
}
const move = async (page: Page, from: string, to: string, isFlipped: boolean): Promise<void> => {
  await select(page, from, isFlipped)
  await select(page, to, isFlipped)
}
const occupant = (page: Page, square: string, isFlipped: boolean): Promise<string | null> =>
  page.locator(BOARD).evaluate(
    (board, { column, row, size }) => {
      const origin = board.getBoundingClientRect()
      const x = origin.left + ((column + .5) * origin.width) / size
      const y = origin.top + ((row + .5) * origin.height) / size
      const image = [...board.querySelectorAll('img')].find(img => {
        const rect = img.getBoundingClientRect()
        return rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom
      })
      return image?.alt ?? null
    },
    { ...cell(square, isFlipped), size: SIZE }
  )
const join = async (page: Page, context: BrowserContext): Promise<Page> => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Host Game' }).click()
  await expect(page).toHaveURL(/\/\d{6}$/u)
  const guest = await context.newPage()
  await guest.goto(page.url())
  await expect(page.getByText('Waiting For Opponent')).toBeHidden()
  return guest
}
test.describe('swap offer', () => {
  test('only black sees it, after the first white move', async ({ page, context }) => {
    const guest = await join(page, context)
    await expect.poll(() => occupant(guest, 'e3', true)).toBe('white legionary')
    await expect(guest.getByText('Swap Sides?')).toBeHidden()
    await move(page, 'e3', 'e4', false)
    await expect(guest.getByText('Swap Sides?')).toBeVisible()
    await expect(page.getByText('Swap Sides?')).toBeHidden()
  })
  test('is gone on the second black turn', async ({ page, context }) => {
    const guest = await join(page, context)
    await move(page, 'e3', 'e4', false)
    await guest.getByRole('button', { name: '✕' }).click()
    await move(guest, 'e11', 'e10', true)
    await expect.poll(() => occupant(page, 'e10', false)).toBe('black legionary')
    await move(page, 'f3', 'f4', false)
    await expect.poll(() => occupant(guest, 'f4', true)).toBe('white legionary')
    await expect(guest.getByText('Swap Sides?')).toBeHidden()
  })
})
test.describe('swap answer', () => {
  test('accepting makes black the white player', async ({ page, context }) => {
    const guest = await join(page, context)
    await move(page, 'e3', 'e4', false)
    await guest.getByRole('button', { name: '✓' }).click()
    await expect(guest.getByText('Swap Sides?')).toBeHidden()
    await expect.poll(() => occupant(guest, 'e4', false)).toBe('white legionary')
    await expect.poll(() => occupant(page, 'e4', true)).toBe('white legionary')
    await move(page, 'e11', 'e10', true)
    await expect.poll(() => occupant(guest, 'e10', false)).toBe('black legionary')
  })
  test('declining keeps black on its own side', async ({ page, context }) => {
    const guest = await join(page, context)
    await move(page, 'e3', 'e4', false)
    await guest.getByRole('button', { name: '✕' }).click()
    await expect(guest.getByText('Swap Sides?')).toBeHidden()
    await move(guest, 'e11', 'e10', true)
    await expect.poll(() => occupant(page, 'e10', false)).toBe('black legionary')
  })
})