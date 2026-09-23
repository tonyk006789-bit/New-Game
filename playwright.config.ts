import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
const localChrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: false, workers: 1, retries: 0,
  timeout: 30000, reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:5173', trace: 'retain-on-failure', screenshot: 'only-on-failure',
    launchOptions: { ...(existsSync(localChrome) ? { executablePath: localChrome } : {}), args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } },
  projects: [{name:'desktop',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:1000}}},{name:'phone',use:{...devices['Pixel 7'],viewport:{width:390,height:844}}},{name:'landscape',use:{...devices['Desktop Chrome'],viewport:{width:1024,height:461}}}],
  webServer: [{command:'node --env-file-if-exists=.local/runtime.env scripts/e2e-api.mjs',url:'http://127.0.0.1:3000/v1/health',reuseExistingServer:!process.env.CI},{ command: 'node node_modules/vite/bin/vite.js --config apps/player/vite.config.ts', url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI }, { command: 'node node_modules/vite/bin/vite.js --config apps/admin/vite.config.ts', url: 'http://127.0.0.1:5174', reuseExistingServer: !process.env.CI }]
});
