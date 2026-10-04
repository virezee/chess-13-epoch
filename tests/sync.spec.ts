import type { Page } from '@playwright/test'
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
const select = async (page: Page, square: string): Promise<void> => {
  const board = page.locator(BOARD)
  const width = await board.evaluate(element => element.clientWidth)
  const { column, row } = cell(square, false)
  await board.click({
    position: { x: ((column + .5) * width) / SIZE, y: ((row + .5) * width) / SIZE }
  })
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
test.describe('move sync', () => {
  test('a white move appears on the black board', async ({ page, context }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Host Game' }).click()
    await expect(page).toHaveURL(/\/\d{6}$/u)
    const guest = await context.newPage()
    await guest.goto(page.url())
    await expect(page.getByText('Waiting For Opponent')).toBeHidden()
    await select(page, 'e3')
    await select(page, 'e4')
    await expect.poll(() => occupant(guest, 'e4', true)).toBe('white legionary')
    await expect.poll(() => occupant(guest, 'e3', true)).toBeNull()
  })
})