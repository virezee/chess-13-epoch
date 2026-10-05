import type { Page, BrowserContext } from '@playwright/test'
import { test, expect } from '@playwright/test'
import { SIZE } from '@/constants/board'
import { parseSquare } from '@/features/game/lib/coordinate'

const BOARD = '.outline-square-edge'
const occupant = (page: Page, square: string, isFlipped: boolean): Promise<string | null> => {
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
    {
      column: isFlipped ? SIZE - 1 - file : file,
      row: isFlipped ? rank - 1 : SIZE - rank,
      size: SIZE
    }
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
test.describe('resign', () => {
  test('cancelling keeps the game going', async ({ page, context }) => {
    await join(page, context)
    await press(page, 'Resign')
    await press(page, '✕')
    await expect(page.getByText('Resign?')).toBeHidden()
    await expect(page.getByRole('button', { name: 'Resign', exact: true })).toBeVisible()
    await expect(page.getByText('Resignation')).toBeHidden()
  })
  test('confirming gives the win to the opponent', async ({ page, context }) => {
    const guest = await join(page, context)
    await press(page, 'Resign')
    await press(page, '✓')
    await Promise.all(
      [page, guest].map(async player => {
        await expect(player.getByText('black wins')).toBeVisible()
        await expect(player.getByText('Resignation')).toBeVisible()
      })
    )
  })
  test('black resigning on the white turn gives the win to white', async ({ page, context }) => {
    const guest = await join(page, context)
    await press(guest, 'Resign')
    await press(guest, '✓')
    await Promise.all(
      [page, guest].map(async player => {
        await expect(player.getByText('white wins')).toBeVisible()
        await expect(player.getByText('Resignation')).toBeVisible()
      })
    )
  })
})
test.describe('draw offer', () => {
  test('cancelling sends nothing', async ({ page, context }) => {
    await join(page, context)
    await press(page, 'Draw')
    await press(page, '✕')
    await expect(page.getByText('Offer A Draw?')).toBeHidden()
    await expect(page.getByText('Draw Offered · Waiting')).toBeHidden()
    await expect(page.getByRole('button', { name: 'Draw', exact: true })).toBeVisible()
  })
  test('accepting ends the game in a draw', async ({ page, context }) => {
    const guest = await join(page, context)
    await press(page, 'Draw')
    await press(page, '✓')
    await expect(page.getByText('Draw Offered · Waiting')).toBeVisible()
    await expect(guest.getByText('Accept A Draw?')).toBeVisible()
    await press(guest, '✓')
    await Promise.all(
      [page, guest].map(player => expect(player.getByText('Agreement')).toBeVisible())
    )
  })
  test('declining brings the buttons back', async ({ page, context }) => {
    const guest = await join(page, context)
    await press(page, 'Draw')
    await press(page, '✓')
    await press(guest, '✕')
    await expect(page.getByText('Draw Offered · Waiting')).toBeHidden()
    await expect(page.getByRole('button', { name: 'Draw', exact: true })).toBeVisible()
    await expect(page.getByText('Agreement')).toBeHidden()
  })
})
test.describe('new game offer', () => {
  test('accepting starts a new game with the colours swapped', async ({ page, context }) => {
    const guest = await join(page, context)
    await press(page, 'Resign')
    await press(page, '✓')
    await press(page, 'New Game')
    await press(page, '✓')
    await expect(guest.getByText('Accept A New Game?')).toBeVisible()
    await press(guest, '✓')
    await Promise.all(
      [page, guest].map(async player => {
        await expect(player.getByText('Resignation')).toBeHidden()
        await expect(player.getByRole('button', { name: 'Resign', exact: true })).toBeVisible()
      })
    )
    await expect.poll(() => occupant(guest, 'e3', false)).toBe('white legionary')
  })
  test('declining keeps the result', async ({ page, context }) => {
    const guest = await join(page, context)
    await press(page, 'Resign')
    await press(page, '✓')
    await press(page, 'New Game')
    await press(page, '✓')
    await press(guest, '✕')
    await expect(page.getByText('New Game Offered · Waiting')).toBeHidden()
    await expect(page.getByText('black wins')).toBeVisible()
    await expect(page.getByRole('button', { name: 'New Game', exact: true })).toBeVisible()
  })
})