import type { Page, BrowserContext } from '@playwright/test'
import { test, expect } from '@playwright/test'
import { SIZE } from '@/constants/board'
import { parseSquare } from '@/features/game/lib/coordinate'

const BOARD = '.outline-square-edge'
const select = async (page: Page, square: string): Promise<void> => {
  const board = page.locator(BOARD)
  const width = await board.evaluate(element => element.clientWidth)
  const { file, rank } = parseSquare(square)
  await board.click({
    position: { x: ((file + .5) * width) / SIZE, y: ((SIZE - rank + .5) * width) / SIZE }
  })
}
const occupant = (page: Page, square: string): Promise<string | null> => {
  const { file, rank } = parseSquare(square)
  return page.locator(BOARD).evaluate(
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
    { column: file, row: SIZE - rank, size: SIZE }
  )
}
const join = async (page: Page, context: BrowserContext): Promise<Page> => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Host Game' }).click()
  await expect(page).toHaveURL(/\/\d{6}$/u)
  const guest = await context.newPage()
  await guest.goto(page.url())
  await expect(page.getByText('Waiting For Opponent')).toBeHidden()
  return guest
}
const settle = (page: Page): Promise<void> =>
  page.evaluate(
    () =>
      new Promise<void>(resolve => {
        let last = window.scrollY
        let still = 0
        const tick = (): void => {
          still = window.scrollY === last ? still + 1 : 0
          last = window.scrollY
          if (still >= 10) resolve()
          else requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      })
  )
const press = async (page: Page, name: string): Promise<void> => {
  const button = page.getByRole('button', { name, exact: true })
  await button.waitFor()
  await settle(page)
  await button.click()
}
const ENDINGS = [
  {
    name: 'resignation',
    end: async (page: Page): Promise<void> => {
      await press(page, 'Resign')
      await press(page, '✓')
      await expect(page.getByText('Resignation')).toBeVisible()
    }
  },
  {
    name: 'a draw by agreement',
    end: async (page: Page, guest: Page): Promise<void> => {
      await press(page, 'Draw')
      await press(page, '✓')
      await press(guest, '✓')
      await expect(page.getByText('Agreement')).toBeVisible()
    }
  }
]
for (const { name, end } of ENDINGS)
  test.describe(`after ${name}`, () => {
    test('the board no longer moves', async ({ page, context }) => {
      const guest = await join(page, context)
      await end(page, guest)
      await select(page, 'e3')
      await select(page, 'e4')
      expect(await occupant(page, 'e3')).toBe('white legionary')
      expect(await occupant(page, 'e4')).toBeNull()
    })
    test('only New Game is left to press', async ({ page, context }) => {
      const guest = await join(page, context)
      await end(page, guest)
      await Promise.all(
        [page, guest].map(async player => {
          await expect(player.getByRole('button', { name: 'Resign', exact: true })).toBeHidden()
          await expect(player.getByRole('button', { name: 'Draw', exact: true })).toBeHidden()
          await expect(player.getByRole('button', { name: 'New Game', exact: true })).toBeVisible()
        })
      )
    })
  })