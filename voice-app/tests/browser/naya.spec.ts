import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("Naya expands, follows up, displays text safely and retries errors", async ({
  page,
}) => {
  await page.goto("http://localhost:43874/articles/article-test");
  const toggle = page.getByRole("button", {
    name: "✦ Naya · Comprendre cet article",
  });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await expect(
    page.getByText("Résumé assisté par IA, vérifié par la rédaction."),
  ).toBeVisible();
  let requests = 0;
  await page.route("**/api/naya", async (route) => {
    requests++;
    const payload = route.request().postDataJSON();
    if (requests === 2) {
      expect(payload.history).toHaveLength(2);
      await route.fulfill({
        status: 503,
        json: {
          error:
            "Je rencontre un petit problème technique. Réessaie dans un instant.",
        },
      });
    } else
      await route.fulfill({
        json: {
          answer:
            "Trois accords ont été annoncés, sans garantie de marchés. <script>window.injected=true</script>",
          source: "/articles/article-test",
        },
      });
  });
  await page.getByLabel("Votre question sur cet article").fill("Pourquoi ?");
  await page.getByRole("button", { name: "Envoyer", exact: true }).click();
  await expect(page.locator(".naya-message.assistant")).toHaveCount(1);
  expect(
    await page.evaluate(
      () => (window as unknown as { injected?: boolean }).injected,
    ),
  ).toBeUndefined();
  await page.getByLabel("Votre question sur cet article").fill("Et ensuite ?");
  await page.getByRole("button", { name: "Envoyer", exact: true }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByRole("button", { name: "Réessayer" }).click();
  await expect(page.locator(".naya-message.assistant")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Utile", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("button", { name: "Utile", exact: true }).first(),
  ).toBeDisabled();
  expect(
    (await new AxeBuilder({ page }).include(".naya").analyze()).violations,
  ).toEqual([]);
  await page.screenshot({
    path: "test-results/naya-" + test.info().project.name + ".png",
  });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
});
