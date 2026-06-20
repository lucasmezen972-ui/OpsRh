import { expect, test } from "@playwright/test";
import { collectPageErrors, expectNo404 } from "./helpers";

test.describe("advanced modules", () => {
  test("modules page opens enabled advanced modules", async ({ page }) => {
    const errors = await collectPageErrors(page);
    await page.goto("/modules", { waitUntil: "domcontentloaded" });
    await expectNo404(page);
    for (const name of ["Assistant IA", "Signature électronique", "Analyse automatique des documents", "Import WhatsApp / Email"]) {
      await expect(page.getByText(name)).toBeVisible();
    }
    await expect(page.getByRole("link", { name: "Ouvrir" })).toHaveCount(4);
    await errors.assertClean();
  });

  test("AI assistant generates an editable draft", async ({ page }) => {
    await page.goto("/modules/ia", { waitUntil: "domcontentloaded" });
    await page.getByLabel("Contexte complémentaire").fill("Relance courte et professionnelle.");
    await page.getByRole("button", { name: "Générer" }).click();
    await expect(page.getByLabel("Contenu généré")).toBeVisible();
    await expect(page.getByText("Actions proposées")).toBeVisible();
  });

  test("document analysis returns a suggested status", async ({ page }) => {
    await page.goto("/modules/analyse", { waitUntil: "domcontentloaded" });
    await page.getByLabel("Nom du document").fill("RIB Clara Martin.pdf");
    await page.getByLabel("Texte ou indices visibles").fill("IBAN FR76 BIC AGRIFRPP");
    await page.getByRole("button", { name: "Analyser" }).click();
    await expect(page.getByText("Type détecté")).toBeVisible();
    await expect(page.getByText(/Type détecté\s*:\s*RIB/)).toBeVisible();
  });

  test("message import proposes or creates a task", async ({ page }) => {
    await page.goto("/modules/import", { waitUntil: "domcontentloaded" });
    await page.getByLabel("Contenu du message").fill("Urgent - merci de relancer pour le contrat signé.");
    await page.getByRole("button", { name: "Importer" }).click();
    await expect(page.getByText("Titre proposé")).toBeVisible();
    await expect(page.getByText("Priorité")).toBeVisible();
  });
});
