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
const resign = async (page: Page): Promise<void> => {
  await press(page, 'Resign')
  await press(page, '✓')
}
const atBottom = (page: Page): Promise<boolean> =>
  page.evaluate(
    () => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1
  )
const scrolls = async (page: Page, label: string): Promise<void> => {
  await expect(page.getByText(label)).toBeVisible()
  await expect.poll(() => atBottom(page)).toBe(true)
  await press(page, '✕')
  await expect(page.getByText(label)).toBeHidden()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
}
test.describe('board on mobile', () => {
  test.skip(({ isMobile }) => !isMobile, 'mobile only')
  test('fits inside the screen width', async ({ page }) => {
    await page.goto('/')
    const { left, right, screen } = await page.locator(BOARD).evaluate(element => {
      const rect = element.getBoundingClientRect()
      return { left: rect.left, right: rect.right, screen: document.documentElement.clientWidth }
    })
    expect(left).toBeGreaterThanOrEqual(0)
    expect(right).toBeLessThanOrEqual(screen)
  })
  test('cannot be scrolled in any direction', async ({ page }) => {
    await page.goto('/')
    const wrapper = page.locator(BOARD).locator('xpath=../..')
    const size = await wrapper.evaluate(element => ({
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight
    }))
    expect(size.scrollWidth).toBeLessThanOrEqual(size.clientWidth)
    expect(size.scrollHeight).toBeLessThanOrEqual(size.clientHeight)
  })
})
test.describe('prompt scroll during the game', () => {
  test.skip(({ isMobile }) => !isMobile, 'mobile only')
  test('Swap Sides?', async ({ page, context }) => {
    const guest = await join(page, context)
    await select(page, 'e3')
    await select(page, 'e4')
    await scrolls(guest, 'Swap Sides?')
  })
  test('Resign?', async ({ page, context }) => {
    await join(page, context)
    await press(page, 'Resign')
    await scrolls(page, 'Resign?')
  })
  test('Offer A Draw?', async ({ page, context }) => {
    await join(page, context)
    await press(page, 'Draw')
    await scrolls(page, 'Offer A Draw?')
  })
  test('Accept A Draw?', async ({ page, context }) => {
    const guest = await join(page, context)
    await press(page, 'Draw')
    await press(page, '✓')
    await scrolls(guest, 'Accept A Draw?')
  })
})
test.describe('prompt scroll after the game', () => {
  test.skip(({ isMobile }) => !isMobile, 'mobile only')
  test('Offer A New Game?', async ({ page, context }) => {
    await join(page, context)
    await resign(page)
    await press(page, 'New Game')
    await scrolls(page, 'Offer A New Game?')
  })
  test('Accept A New Game?', async ({ page, context }) => {
    const guest = await join(page, context)
    await resign(page)
    await press(page, 'New Game')
    await press(page, '✓')
    await scrolls(guest, 'Accept A New Game?')
  })
})