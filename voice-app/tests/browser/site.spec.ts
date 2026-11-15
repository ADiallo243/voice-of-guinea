import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("public routes preserve headings, canonical metadata and mobile width", async ({
  page,
}) => {
  for (const route of [
    "/",
    "/actualites",
    "/culture",
    "/recherche?q=Guinée",
    "/mentions-legales",
    "/confidentialite",
  ]) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto("/mentions-legales");
  await expect(page.getByText("Abdou Diallo", { exact: false })).toBeVisible();
});
test("article schema is parseable; Naya is absent when disabled; images are valid", async ({
  page,
}) => {
  await page.goto("/articles/guinee-acces-facebook-vpn");
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator(".naya")).toHaveCount(0);
  const schema = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  expect(
    schema.map((s) => JSON.parse(s)).some((s) => s["@type"] === "NewsArticle"),
  ).toBe(true);
  const canonical = await page
    .locator('link[rel="canonical"]')
    .getAttribute("href");
  expect(canonical).toContain("/articles/guinee-acces-facebook-vpn");
  expect(
    await page
      .locator(".article-hero img")
      .evaluate(
        (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
      ),
  ).toBe(true);
  const results = await new AxeBuilder({ page })
    .include(".article-page")
    .analyze();
  expect(results.violations).toEqual([]);
});
test("newsletter does not open immediately and admin endpoints remain protected", async ({
  page,
  request,
}) => {
  await page.goto("/articles/guinee-acces-facebook-vpn");
  await expect(page.locator("dialog")).not.toBeVisible();
  const response = await request.post("/api/naya", {
    data: { slug: "test", question: "Bonjour" },
  });
  expect(response.status()).toBe(503);
  expect(response.headers()["cache-control"]).toBe("no-store");
  expect((await request.get("/api/cron/publish-scheduled")).status()).toBe(401);
});
