import { defineConfig, devices } from '@playwright/test'

const isCI = process.env['CI'] === 'true'
const DESKTOP = [
  'Desktop Chrome',
  'Desktop Chrome HiDPI',
  'Desktop Edge',
  'Desktop Edge HiDPI',
  'Desktop Firefox',
  'Desktop Firefox HiDPI',
  'Desktop Safari'
] as const
const HANDHELD = [
  'Pixel 10',
  'Pixel 10 Pro',
  'Pixel 10 Pro XL',
  'Galaxy S24',
  'Galaxy A55',
  'Galaxy Z Fold 7',
  'Galaxy Z Fold 7 Cover',
  'Galaxy Z Flip 7',
  'Galaxy Z Flip 7 Cover',
  'Galaxy Tab S9',
  'iPhone 17',
  'iPhone Air',
  'iPhone 17 Pro',
  'iPhone 17 Pro Max',
  'iPhone 17e',
  'iPad (gen 11)',
  'iPad Mini',
  'iPad Pro 11'
] as const
export default defineConfig({
  testDir: 'tests/',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : '50%',
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'on-first-retry'
  },
  projects: [
    ...DESKTOP.map(device => ({
      name: device,
      testIgnore: /mobile\.spec\.ts/u,
      use: { ...devices[device] }
    })),
    ...HANDHELD.flatMap(device => [device, `${device} landscape` as const]).map(device => ({
      name: device,
      testMatch: /mobile\.spec\.ts/u,
      use: { ...devices[device] }
    }))
  ].filter(project => isCI || project.use.defaultBrowserType !== 'webkit'),
  webServer: [
    {
      command: 'bun worker',
      port: 8787,
      reuseExistingServer: !isCI
    },
    {
      command: 'bun dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !isCI,
      env: { NEXT_PUBLIC_WORKER: 'ws://localhost:8787' }
    }
  ]
})