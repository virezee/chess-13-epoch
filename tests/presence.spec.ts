import type { Page, BrowserContext } from '@playwright/test'
import { test, expect } from '@playwright/test'

const host = async (page: Page): Promise<void> => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Host Game' }).click()
  await expect(page).toHaveURL(/\/\d{6}$/u)
}
const join = async (page: Page, context: BrowserContext): Promise<Page> => {
  await host(page)
  const guest = await context.newPage()
  await guest.goto(page.url())
  await expect(page.getByText('Waiting For Opponent')).toBeHidden()
  return guest
}
const countdown = async (page: Page): Promise<number> => {
  const text = await page.getByText(/Opponent Left · \d+s/u).textContent()
  return Number(/(\d+)s/u.exec(text ?? '')?.[1])
}
test.describe('presence', () => {
  test('waits for the opponent until the guest joins', async ({ page, context }) => {
    await host(page)
    await expect(page.getByText('Waiting For Opponent')).toBeVisible()
    const guest = await context.newPage()
    await guest.goto(page.url())
    await expect(page.getByText('Waiting For Opponent')).toBeHidden()
  })
  test('counts down from 60 seconds when the opponent leaves', async ({ page, context }) => {
    const guest = await join(page, context)
    await guest.close()
    const start = await countdown(page)
    expect(start).toBeLessThanOrEqual(60)
    await expect.poll(() => countdown(page)).toBeLessThan(start)
  })
  test('wins by abandonment when the opponent stays away', async ({ page, context }) => {
    test.setTimeout(90_000)
    const guest = await join(page, context)
    await guest.close()
    await expect(page.getByText('white wins')).toBeVisible({ timeout: 70_000 })
    await expect(page.getByText('Abandonment')).toBeVisible()
  })
})