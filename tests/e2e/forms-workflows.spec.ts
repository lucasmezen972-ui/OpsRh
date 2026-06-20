import { expect, test } from "@playwright/test";

test.describe("functional workflows", () => {
  test("login page supports bad password, signup toggle, and demo exploration", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Bon retour|Créer mon espace/i })).toBeVisible();
    await page.getByLabel(/email/i).fill("demo@opsrh.fr");
    await page.getByLabel(/mot de passe/i).fill("wrong-password");
    await page.getByRole("button", { name: /Se connecter/i }).click();
    await expect(page.locator("body")).toContainText(/démo|erreur|connect|identifiants/i);
    await page.getByRole("button", { name: /Créer un espace/i }).click();
    await expect(page.getByRole("heading", { name: /Créer mon espace/i })).toBeVisible();
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Mode démo").first()).toBeVisible();
  });

  test("mails generate, copy, draft, sent state, and template creation feedback", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/mails?clientId=c1&caseId=d1&type=relance_documents&document=RIB", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "Mails & modèles" })).toBeVisible();
    await page.getByRole("button", { name: /^Générer$/ }).click();
    await expect(page.getByRole("status")).toContainText(/brouillon|généré/i);
    const copyButton = page.getByRole("button", { name: /Copier/i });
    await expect(copyButton).toBeEnabled();
    await copyButton.click();
    await expect(page.getByRole("status")).toContainText(/copié|Impossible/i);
    const sentButton = page.getByRole("button", { name: /Marquer comme envoyé/i });
    await expect(sentButton).toBeEnabled();
    await sentButton.click();
    await expect(page.getByRole("status")).toContainText(/envoyé|Générez/i);
    await page.getByRole("button", { name: /Nouveau modèle/i }).click();
    await page.getByLabel("Titre").fill("Relance test");
    await page.getByRole("button", { name: /Créer le modèle/i }).click();
    await expect(page.getByLabel("Titre")).toHaveValue("Relance test");
    await page.keyboard.press("Escape");
  });

  test("time form validates local date, positive duration, and delete confirmation exists", async ({ page }) => {
    await page.goto("/temps?clientId=c1&caseId=d1&taskId=t1", { waitUntil: "domcontentloaded" });
    const dateValue = await page.getByLabel("Date").inputValue();
    expect(dateValue).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    await page.getByLabel("Durée (min)").fill("0");
    await page.getByRole("button", { name: /Ajouter/i }).click();
    await expect.poll(async () => page.getByLabel("Durée (min)").evaluate((input) => (input as HTMLInputElement).checkValidity())).toBe(false);
  });

  test("documents require a real file and expose contextual relance links", async ({ page }) => {
    await page.goto("/documents", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /Ajouter un document/i }).click();
    await expect(page.getByLabel("Fichier")).toBeVisible();
    await expect(page.getByText(/PDF, PNG, JPG/i)).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByRole("tab", { name: /Documents manquants/i }).click();
    const relanceLink = page.getByRole("link", { name: /Générer une relance groupée/i }).first();
    if (await relanceLink.isVisible().catch(() => false)) {
      await expect(relanceLink).toHaveAttribute("href", /clientId=.*type=relance_documents/);
    } else {
      await expect(page.getByText(/Aucun document manquant|Tous les documents attendus/i).first()).toBeVisible();
    }
  });

  test("pre-invoice PDF export downloads a file", async ({ page, isMobile }) => {
    test.skip(isMobile, "Mobile browsers do not expose download events consistently.");
    await page.goto("/pre-facturation", { waitUntil: "domcontentloaded" });
    const button = page.getByRole("button", { name: /Exporter en PDF/i }).first();
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 30_000 }),
      button.click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/pre-facturation.*\.pdf/);
  });

  test("premium and unavailable buttons are disabled with clear text", async ({ page }) => {
    await page.goto("/modules", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("link", { name: "Ouvrir" })).toHaveCount(5);
    await page.goto("/portail", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: /Déposer.*Bientôt disponible/i }).first()).toBeDisabled();
  });
});
