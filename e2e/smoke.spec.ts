import { test, expect } from "@playwright/test";

/**
 * Smoke tests — garantem que as rotas públicas principais carregam sem erro
 * e que a navegação básica funciona. Não dependem de login nem de IA.
 */

const PUBLIC_ROUTES: Array<{ path: string; expect: RegExp }> = [
  { path: "/", expect: /solando/i },
  { path: "/manual", expect: /manual|compêndio|regras/i },
  { path: "/arquimago", expect: /arquimago/i },
  { path: "/comunidade", expect: /comunidade/i },
  { path: "/guia", expect: /guia|passo a passo/i },
  { path: "/entrar", expect: /entrar/i },
];

for (const route of PUBLIC_ROUTES) {
  test(`carrega ${route.path}`, async ({ page }) => {
    const response = await page.goto(route.path);
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator("body")).toContainText(route.expect);
  });
}

test("a barra de navegação leva ao Guia", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /guia/i }).first().click();
  await expect(page).toHaveURL(/\/guia/);
  await expect(page.getByRole("heading", { name: /como usar o solando/i })).toBeVisible();
});
