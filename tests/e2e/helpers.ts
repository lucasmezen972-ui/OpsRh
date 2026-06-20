import { expect, type Page } from "@playwright/test";

export const APP_ROUTES = [
  "/login",
  "/dashboard",
  "/clients",
  "/clients/nouveau",
  "/clients/c1",
  "/dossiers",
  "/dossiers/nouveau",
  "/dossiers/d1",
  "/taches",
  "/documents",
  "/mails",
  "/temps",
  "/pre-facturation",
  "/portail",
  "/espace-client",
  "/modules",
  "/modules/ia",
  "/modules/signature",
  "/modules/analyse",
  "/modules/import",
  "/parametres",
];

export async function collectPageErrors(page: Page) {
  const consoleErrors: string[] = [];
  const serverErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 500) serverErrors.push(`${response.status()} ${response.url()}`);
  });

  return {
    consoleErrors,
    serverErrors,
    async assertClean() {
      expect(consoleErrors, "console errors").toEqual([]);
      expect(serverErrors, "500 responses").toEqual([]);
    },
  };
}

export async function expectNo404(page: Page) {
  await expect(page.locator("body")).not.toContainText("404");
  await expect(page.locator("body")).not.toContainText("This page could not be found");
}
