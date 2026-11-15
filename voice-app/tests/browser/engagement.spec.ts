import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("engaged newsletter invitation supports Escape and persistent dismissal", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/articles/guinee-acces-facebook-vpn");
  await page.getByRole("button", { name: "Tout refuser" }).click();
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }),
  );
  await page.clock.fastForward(40000);
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    (await new AxeBuilder({ page }).include(".newsletter-popup").analyze())
      .violations,
  ).toEqual([]);
  await page.screenshot({
    path: "test-results/newsletter-" + test.info().project.name + ".png",
  });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.reload();
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }),
  );
  await page.clock.fastForward(40000);
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
