import { expect, test } from "@playwright/test";

const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/tarifs",
  "/contact",
  "/confidentialite",
  "/mentions-legales",
];

const PRIVATE_ROUTES = [
  "/dashboard",
  "/clients",
  "/dossiers",
  "/taches",
  "/documents",
  "/mails",
  "/temps",
  "/pre-facturation",
  "/portail",
  "/parametres",
  "/abonnement",
];

test.describe("production SaaS core", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`public route ${route} renders without demo data`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.locator("body")).not.toContainText("404");
      await expect(page.locator("body")).not.toContainText("demo@opsrh.fr");
      await expect(page.locator("body")).not.toContainText("demo1234");
      await expect(page.locator("body")).not.toContainText("Mode démo");
    });
  }

  for (const route of PRIVATE_ROUTES) {
    test(`private route ${route} requires authentication`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/login/);
    });
  }

  test("pricing page exposes official support email and checkout choices", async ({ page }) => {
    await page.goto("/tarifs", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Ops RH Pro").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "contact@tradikom.com" })).toBeVisible();
    await expect(page.getByRole("button", { name: /mensuel/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /annuel/i })).toBeVisible();
  });

  test("contact page posts to official support path", async ({ page }) => {
    await page.goto("/contact", { waitUntil: "domcontentloaded" });
    await page.getByLabel("Votre e-mail").fill("client@example.com");
    await page.getByLabel("Sujet").fill("Question abonnement");
    await page.getByLabel("Message").fill("Bonjour, je souhaite obtenir des informations sur Ops RH Pro.");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Envoyer" }).click();
    await expect(page.getByRole("status")).toContainText(/transmis|reçu/i);
  });
});
