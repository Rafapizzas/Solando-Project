import { defineConfig, devices } from "@playwright/test";

/**
 * Configuração do Playwright para testes de fumaça (smoke) end-to-end.
 * Sobe o servidor Next em modo produção e valida as rotas principais.
 *
 * Para rodar localmente pela primeira vez:
 *   npm run test:install   # baixa os navegadores (uma vez)
 *   npm run build
 *   npm run test:e2e
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
