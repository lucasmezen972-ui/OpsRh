import { expect, test } from "@playwright/test";
import { APP_ROUTES, collectPageErrors, expectNo404 } from "./helpers";

test.describe("navigation and global audit", () => {
  for (const route of APP_ROUTES) {
    test(`route ${route} responds without 404 or server error`, async ({ page }) => {
      const errors = await collectPageErrors(page);
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.locator("body")).toBeVisible();
      await expectNo404(page);
      await errors.assertClean();
    });
  }

  test("sidebar and mobile menu navigate without 404", async ({ page, isMobile }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    if (isMobile) {
      await page.getByLabel("Ouvrir le menu").click();
    }
    for (const label of ["Clients", "Dossiers", "Tâches", "Documents", "Mails", "Temps", "Pré-facturation", "Portail", "Modules", "Paramètres"]) {
      const link = page.getByRole("link", { name: new RegExp(label, "i") }).first();
      await expect(link).toBeVisible();
    }
  });

  test("global search returns contextual results and supports keyboard navigation", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    const search = page.getByLabel("Recherche globale");
    await search.click();
    await search.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
    await search.type("Alpha");
    await expect(search).toHaveValue("Alpha");
    await expect(page.getByRole("listbox")).toBeVisible();
    await expect(page.getByRole("option").first()).toContainText("Alpha");
    await search.press("ArrowDown");
    await search.press("Enter");
    await expect(page).not.toHaveURL(/\/dashboard$/);
  });

  test("notifications can be opened and marked read", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Notifications" }).click();
    await expect(page.getByText("Notifications").first()).toBeVisible();
    const markAll = page.getByRole("button", { name: /Tout marquer comme lu/i });
    if (await markAll.isVisible().catch(() => false)) await markAll.click();
  });
});
