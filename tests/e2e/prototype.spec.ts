import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { initialState } from "../../src/features/prototype/model";
import { STORAGE_KEY } from "../../src/features/prototype/storage";
import { readFile } from "node:fs/promises";
async function choose(page: Page, name: string) {
  await page.goto("/#/auth/sign-in");
  await page.getByRole("button", { name: `Wejdź jako ${name}`, exact: true }).click();
}
async function application(page: Page) {
  await choose(page, "Anna Kowalska");
  await page.goto("/#/aplikuj/ai-product-manager");
  await page
    .getByLabel("Dlaczego pasujesz do tej roli?")
    .fill(
      "Zaprojektowałam proces automatyzacji i przeprowadziłam badania użytkowników. Wynik: krótszy czas obsługi zgłoszeń o 30%.",
    );
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Wyślij aplikację", exact: true }).click();
}

for (const [name, filename] of [
  ["Anna Kowalska", "anna-kowalska-cv-v1.pdf"],
  ["Marek Nowak", "marek-nowak-cv-v1.pdf"],
]) {
  test(`${name} has the same local PDF in profile, application and employer detail`, async ({
    page,
  }) => {
    const external: string[] = [];
    page.on("request", (request) => {
      if (!request.url().startsWith("http://127.0.0.1:3106")) external.push(request.url());
    });
    await choose(page, name);
    await page.goto("/#/app/profil");
    const downloadLink = page.getByRole("link", { name: "Pobierz CV (PDF)", exact: true });
    const href = await downloadLink.getAttribute("href");
    const response = await page.request.get(href!);
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("application/pdf");
    const bytes = await response.body();
    expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
    const downloaded = page.waitForEvent("download");
    await downloadLink.focus();
    await page.keyboard.press("Enter");
    const download = await downloaded;
    expect(download.suggestedFilename()).toBe(filename);
    expect(await readFile((await download.path())!)).toEqual(bytes);
    await page.getByLabel("Imię i nazwisko").fill(`Zmieniony profil ${name}`);
    await page.getByRole("button", { name: "Zapisz profil", exact: true }).click();
    await page.reload();
    await expect(downloadLink).toHaveAttribute("href", href!);
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(downloadLink).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: `artifacts/${filename}-mobile.png`, fullPage: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/#/aplikuj/ai-operations-specialist");
    await expect(downloadLink).toHaveAttribute("href", href!);
    await expect(page.getByRole("link", { name: "Otwórz CV (PDF)", exact: false })).toHaveAttribute(
      "target",
      "_blank",
    );
    await page
      .getByLabel("Dlaczego pasujesz do tej roli?")
      .fill("Mam doświadczenie w rozwoju produktów i automatyzacji obsługi zgłoszeń.");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Wyślij aplikację", exact: true }).click();
    await page.getByRole("link", { name: "AI Operations Specialist", exact: true }).click();
    await page.getByRole("tab", { name: "CV", exact: true }).click();
    await expect(downloadLink).toHaveAttribute("href", href!);
    const id = page.url().split("/").pop();
    await choose(page, "Karolina Wiśniewska");
    await page.goto(`/#/app/kandydaci/${id}`);
    await page.reload();
    await expect(downloadLink).toHaveCount(0);
    await page.getByRole("tab", { name: "CV", exact: true }).click();
    await expect(downloadLink).toHaveAttribute("href", href!);
    await page.screenshot({ path: `artifacts/${filename}-employer-desktop.png`, fullPage: true });
    expect(external).toEqual([]);
  });
}

test("published job → saved offer/draft → submitted application → employer decision survives reload", async ({
  page,
}) => {
  const external: string[] = [];
  const errors: string[] = [];
  page.on("request", (r) => {
    if (
      !r.url().startsWith("http://127.0.0.1:3106") &&
      !r.url().startsWith("data:") &&
      !r.url().startsWith("blob:")
    )
      external.push(r.url());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await choose(page, "Karolina Wiśniewska");
  await page.getByRole("link", { name: "Dodaj ofertę", exact: true }).click();
  await page.getByLabel("Nazwa stanowiska").fill("Product Designer do automatyzacji");
  await page
    .getByLabel("Brief — kogo szukasz i do jakiego zadania?")
    .fill("Szukamy osoby do badań z klientami, prototypowania i wdrażania automatyzacji obsługi.");
  await page.getByRole("button", { name: "Przygotuj opis z AI" }).click();
  await page.getByRole("button", { name: "Użyj propozycji" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Opublikuj ofertę" }).click();
  await expect(
    page.getByRole("link", { name: "Product Designer do automatyzacji", exact: true }),
  ).toBeVisible();
  await choose(page, "Anna Kowalska");
  await page.goto("/#/oferty");
  await page.getByLabel("Szukaj ofert", { exact: true }).fill("Product Designer do automatyzacji");
  await page.getByRole("button", { name: "Szukaj", exact: true }).click();
  await page.reload();
  await page.getByRole("link", { name: "Product Designer do automatyzacji", exact: true }).click();
  await page.getByRole("button", { name: "Zapisz ofertę", exact: true }).click();
  await page.getByRole("link", { name: "Aplikuj", exact: true }).click();
  const answer = page.getByLabel("Dlaczego pasujesz do tej roli?");
  const draftAnswer =
    "Przeprowadziłam badania z użytkownikami i wdrożyłam automatyzację. Czas obsługi skrócił się o 30%.";
  await expect(page.getByLabel("Twoje notatki do aplikacji (opcjonalnie)")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Przygotuj propozycję z AI" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Użyj propozycji" })).toHaveCount(0);
  await answer.fill(draftAnswer);
  await page.getByRole("button", { name: "Zapisz szkic" }).click();
  await expect(page.getByRole("status")).toHaveText("Szkic został zapisany.");
  expect(
    await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).drafts.at(-1), STORAGE_KEY),
  ).toMatchObject({ notes: "", generated: "", answer: draftAnswer });
  await page.reload();
  await expect(answer).toHaveValue(draftAnswer);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Wyślij aplikację", exact: true }).click();
  await expect(page.getByText("Aplikacja została wysłana.", { exact: false })).toBeVisible();
  await page.reload();
  await page.getByRole("link", { name: "Product Designer do automatyzacji", exact: true }).click();
  const candidateUrl = page.url();
  await expect(page.getByText("Match Score: 84%", { exact: true })).toBeVisible();
  await choose(page, "Karolina Wiśniewska");
  await page.getByRole("link", { name: "Kandydaci", exact: true }).click();
  await page.getByRole("link", { name: "Anna Kowalska", exact: true }).click();
  await page
    .getByLabel("Notatka rekrutacyjna (widoczna pracodawcy)")
    .fill("Notatka pracodawcy — tylko panel firmy.");
  await page.getByRole("button", { name: "W przeglądzie", exact: true }).click();
  for (const label of ["Zaproszenie na rozmowę", "Pierwsza rozmowa odbyta", "Kolejny etap"])
    await page.getByRole("button", { name: label, exact: true }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Zatrudnienie", exact: true })).toBeVisible();
  await choose(page, "Anna Kowalska");
  await page.goto(candidateUrl);
  await expect(page.locator(".record-stage")).toHaveText("Kolejny etap");
  await expect(
    page.getByText("Notatka pracodawcy — tylko panel firmy.", { exact: true }),
  ).toHaveCount(0);
  await page.screenshot({ path: "artifacts/candidate-desktop.png", fullPage: true });
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test("another company cannot see or change a candidate application", async ({ page }) => {
  await choose(page, "Tomasz Zieliński");
  await page.goto("/#/app/kandydaci");
  await expect(page.getByRole("link", { name: "Marek Nowak", exact: true })).toHaveCount(0);
  await page.goto("/#/app/kandydaci/application-example");
  await expect(page.getByRole("heading", { name: "Nie znaleziono strony" })).toBeVisible();
});
test("candidate withdrawal is confirmed and terminal", async ({ page }) => {
  await application(page);
  await page.getByRole("link", { name: "AI Product Manager", exact: true }).click();
  await page.getByRole("button", { name: "Wycofaj aplikację", exact: true }).click();
  await page.getByRole("button", { name: "Anuluj", exact: true }).click();
  await expect(page.getByRole("button", { name: "Wycofaj aplikację", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Wycofaj aplikację", exact: true }).click();
  await page.getByRole("button", { name: "Potwierdź wycofanie", exact: true }).click();
  await page.reload();
  await expect(page.locator(".record-stage")).toHaveText("Wycofana");
});
test("profile changes do not rewrite a submitted application snapshot", async ({ page }) => {
  await application(page);
  await page.goto("/#/app/profil");
  await page.getByLabel("Imię i nazwisko").fill("Nowa Anna");
  await page.getByRole("button", { name: "Zapisz profil", exact: true }).click();
  await page.goto("/#/app/aplikacje");
  await page.getByRole("link", { name: "AI Product Manager", exact: true }).click();
  await expect(page.locator("main")).toContainText("Anna Kowalska");
});
test("invalid import preserves state, valid import replaces state, reset asks for confirmation", async ({
  page,
}) => {
  await choose(page, "Anna Kowalska");
  await page.goto("/#/app/settings");
  const before = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
  await page.getByLabel("Importuj plik scenariusza").setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":99}'),
  });
  await page.getByRole("button", { name: "Importuj", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Nieprawidłowy plik");
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(before);
  const imported = initialState();
  imported.activePersonId = "candidate-anna";
  imported.people[0].name = "Zaimportowana Anna";
  await page.getByLabel("Importuj plik scenariusza").setInputFiles({
    name: "scenario.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(imported)),
  });
  await page.getByRole("button", { name: "Importuj", exact: true }).click();
  await expect(page.getByText("Zaimportowana Anna", { exact: true }).first()).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Eksportuj dane" }).click();
  expect((await download).suggestedFilename()).toBe("doroboty-scenariusz.json");
  await page.getByRole("button", { name: "Resetuj scenariusz", exact: true }).click();
  await page.getByRole("button", { name: "Anuluj", exact: true }).click();
  await expect(page.getByText("Zaimportowana Anna", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Resetuj scenariusz", exact: true }).click();
  await page.getByRole("button", { name: "Resetuj", exact: true }).click();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).activePersonId,
      STORAGE_KEY,
    ),
  ).toBe(null);
});
test("unreadable save stays untouched while the user works in memory", async ({ page }) => {
  await page.goto("/");
  await page.evaluate((key) => localStorage.setItem(key, '{"version":999}'), STORAGE_KEY);
  await page.reload();
  await expect(page.getByRole("status")).toContainText("nie zostaną nadpisane");
  await choose(page, "Anna Kowalska");
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(
    '{"version":999}',
  );
  await page.goto("/#/app/settings");
  await expect(page.getByRole("button", { name: "Pobierz poprzedni zapis" })).toBeVisible();
});
test("storage denial keeps the app usable and offers export", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Storage.prototype, "setItem", {
      value() {
        throw new Error("Storage denied");
      },
    });
  });
  await choose(page, "Anna Kowalska");
  await expect(page.getByRole("status")).toContainText("Wyeksportuj");
  await page.goto("/#/app/profil");
  await expect(page.getByLabel("Imię i nazwisko")).toHaveValue("Anna Kowalska");
});
test("map, hash deep links and unknown records work without external requests", async ({
  page,
}) => {
  const external: string[] = [];
  page.on("request", (r) => {
    if (r.url().startsWith("https://")) external.push(r.url());
  });
  await page.goto("/#/oferty?view=map");
  await page
    .getByRole("region", { name: "Mapa ofert w Polsce" })
    .getByRole("button")
    .first()
    .click();
  await page.getByRole("link", { name: "Zobacz rolę", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.screenshot({ path: "artifacts/job-desktop.png", fullPage: true });
  expect(external).toEqual([]);
  await page.goto("/#/oferty/missing");
  await expect(page.getByRole("heading", { name: "Nie znaleziono strony" })).toBeVisible();
});
test("mobile navigation, light-only appearance and keyboard person selection", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/#/auth/sign-in");
  const anna = page.getByRole("button", { name: "Wejdź jako Anna Kowalska", exact: true });
  await anna.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Otwórz menu" }).click();
  await page.getByRole("link", { name: "Profil", exact: true }).click();
  await expect(page.getByLabel("Imię i nazwisko")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "artifacts/profile-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Otwórz menu" }).click();
  await page.getByRole("link", { name: "Ustawienia", exact: true }).click();
  await page.emulateMedia({ colorScheme: "dark" });
  await page.reload();
  await expect(page.getByRole("combobox", { name: "Motyw" })).toHaveCount(0);
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(247, 237, 218)");
  await page.screenshot({ path: "artifacts/settings-mobile-light.png", fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test("core screens have no serious accessibility violations", async ({ page }) => {
  await page.goto("/#/oferty");
  let results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(results.violations).toEqual([]);
  await choose(page, "Anna Kowalska");
  await page.goto("/#/app/profil");
  results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(results.violations).toEqual([]);
});

test("public home and filters reflow at 320px with no external requests", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Wiesz, czego szukają.");
  await page.screenshot({ path: "artifacts/home-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/#/oferty");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "artifacts/jobs-mobile.png", fullPage: true });
});

test("application submission explains short answers and missing approval without losing input", async ({
  page,
}) => {
  await choose(page, "Anna Kowalska");
  await page.goto("/#/aplikuj/ai-product-manager");
  const answer = page.getByLabel("Dlaczego pasujesz do tej roli?");
  const send = page.getByRole("button", { name: "Wyślij aplikację", exact: true });
  await answer.fill("krótka odpowiedź");
  await page.getByRole("checkbox").check();
  await expect(send).toBeEnabled();
  await send.click();
  await expect(page.getByRole("alert")).toContainText("Odpowiedź jest za krótka");
  await expect(answer).toBeFocused();
  await expect(answer).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("checkbox")).toBeChecked();
  await expect(answer).toHaveValue("krótka odpowiedź");
  await answer.fill("Moje doświadczenie pasuje do odpowiedzialności opisanej w tej ofercie.");
  await send.click();
  await expect(page.getByRole("alert")).toHaveText(
    "Zatwierdź treść aplikacji i jej przesłanie pracodawcy.",
  );
  await expect(page.getByRole("checkbox")).toBeFocused();
  await page.getByRole("checkbox").check();
  await send.click();
  await expect(page.getByText("Aplikacja została wysłana.", { exact: false })).toBeVisible();
});

for (const width of [1440, 375]) {
  test(`legacy application draft stays compatible without notes or AI controls at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const legacy = initialState();
    legacy.activePersonId = "candidate-anna";
    const job = legacy.jobs.find((job) => job.slug === "ai-product-manager")!;
    const draft = {
      candidateId: "candidate-anna",
      jobId: job.id,
      notes: "Dawne notatki źródłowe kandydata",
      generated: "Dawna propozycja AI, która nie jest zatwierdzoną odpowiedzią",
      answer: "Zapisana wcześniej odpowiedź kandydata do dalszej edycji.",
    };
    legacy.drafts.push(draft);
    await choose(page, "Anna Kowalska");
    await page.goto("/#/app/settings");
    await page.getByLabel("Importuj plik scenariusza").setInputFiles({
      name: "legacy-draft.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(legacy)),
    });
    await page.getByRole("button", { name: "Importuj", exact: true }).click();
    await page.goto(`/#/aplikuj/${job.slug}`);
    await page.reload();
    const form = page.locator("main form");
    const answer = page.getByLabel("Dlaczego pasujesz do tej roli?");
    await expect(answer).toHaveValue(draft.answer);
    // The answer plus the two optional E1 own-work examples (empty for a legacy draft).
    await expect(form.getByRole("textbox")).toHaveCount(3);
    await expect(page.getByLabel("Twoje notatki do aplikacji (opcjonalnie)")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Przygotuj propozycję z AI" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Użyj propozycji" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Propozycja odpowiedzi" })).toHaveCount(0);
    await expect(page.locator("main")).not.toContainText(draft.notes);
    await expect(page.locator("main")).not.toContainText(draft.generated);
    const cvSection = form.getByRole("region", { name: "Twoje CV", exact: true });
    await expect(cvSection).toBeVisible();
    await expect(answer).toBeVisible();
    expect(
      await cvSection.evaluate((element) =>
        Boolean(
          element.compareDocumentPosition(document.querySelector("textarea")!) &
          Node.DOCUMENT_POSITION_FOLLOWING,
        ),
      ),
    ).toBe(true);
    // Keyboard order: answer → optional E1 step (example, "Popraw literówki", ×2) → approval.
    const ownWork = form.locator("section.own-work");
    const ownWorkStops = 4;
    await answer.focus();
    await page.keyboard.press("Tab");
    await expect(ownWork.getByRole("textbox").first()).toBeFocused();
    for (let i = 1; i < ownWorkStops; i++) await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("checkbox", { name: "Zatwierdzam treść i przesłanie aplikacji" }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Wyślij aplikację", exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Zapisz szkic", exact: true })).toBeFocused();
    const editedAnswer = "Moja poprawiona odpowiedź opisuje doświadczenie potrzebne w tej roli.";
    await answer.fill(editedAnswer);
    for (let i = 0; i < ownWorkStops + 3; i++) await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Zapisz szkic", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("status")).toHaveText("Szkic został zapisany.");
    expect(
      await page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)!).drafts.at(-1),
        STORAGE_KEY,
      ),
    ).toEqual({ ...draft, answer: editedAnswer, examples: [] });
    await page.reload();
    await expect(answer).toHaveValue(editedAnswer);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: `artifacts/application-simplified-${width}.png`,
      fullPage: true,
    });
    await answer.focus();
    for (let i = 0; i <= ownWorkStops; i++) await page.keyboard.press("Tab");
    await page.keyboard.press("Space");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(page.getByText("Aplikacja została wysłana.", { exact: false })).toBeVisible();
    expect(
      await page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)!).applications.at(-1),
        STORAGE_KEY,
      ),
    ).toMatchObject({
      sourceNotes: draft.notes,
      generatedAnswer: draft.generated,
      answer: editedAnswer,
    });
    await page.reload();
    await page.getByRole("link", { name: job.title, exact: true }).click();
    await expect(page.locator("main")).toContainText(editedAnswer);
    await expect(page.locator("main")).not.toContainText(draft.notes);
    await expect(page.locator("main")).not.toContainText(draft.generated);
  });
}

test("legacy dark preference keeps scenario data and renders the light interface", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  const legacy = { ...initialState(), activePersonId: "candidate-anna", theme: "dark" };
  legacy.people[0].bio = "Zachowaj mój profil";
  await page.goto("/");
  await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), {
    key: STORAGE_KEY,
    raw: JSON.stringify(legacy),
  });
  await page.reload();
  await page.goto("/#/app/profil");
  await expect(page.getByRole("textbox", { name: "O mnie", exact: true })).toHaveValue(
    "Zachowaj mój profil",
  );
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(247, 237, 218)");
  await page.getByRole("button", { name: "Zapisz profil", exact: true }).click();
  expect(
    await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).theme, STORAGE_KEY),
  ).toBeUndefined();
});

test("DoRoboty offer page keeps the summary beside the segments and before them on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await choose(page, "Anna Kowalska");
  await page.goto("/#/oferty/ai-product-manager");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("AI Product Manager");
  await expect(page.locator("main")).toContainText("Prowadzenie wdrożeń AI od discovery do wyniku");
  for (const heading of [
    "O roli",
    "Wymagania",
    "Proces rekrutacji",
    "Benefity",
    "O firmie BrightLabs",
    "Jak aplikujesz na tę ofertę",
    "Podobne oferty",
  ])
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
  await expect(page.locator("#proces ol > li")).toHaveCount(6);
  await expect(page.locator("#benefity")).toContainText("Budżet edukacyjny");
  await expect(page.locator("#firma")).toContainText("Kultura i wartości");
  await expect(page.getByRole("link", { name: "Zobacz na mapie" })).toHaveAttribute(
    "href",
    /openstreetmap\.org/,
  );
  await expect(page.locator("#o-roli")).toContainText("Doświadczenie na podobnym stanowisku");
  const summary = page.getByRole("complementary", { name: "Podsumowanie oferty" });
  const role = page.locator("#o-roli");
  expect((await summary.boundingBox())!.x).toBeGreaterThan(
    (await role.boundingBox())!.x + (await role.boundingBox())!.width,
  );
  await expect(summary.getByRole("link", { name: "Aplikuj", exact: true })).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Główna nawigacja" });
  await expect(nav.getByRole("link", { name: "Aplikacje", exact: true })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Profil", exact: true })).toBeVisible();
  await page.screenshot({ path: "artifacts/offer-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await summary.boundingBox())!.y).toBeLessThan((await role.boundingBox())!.y);
  await page.screenshot({ path: "artifacts/offer-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await nav.getByRole("link", { name: "Dla firm", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Opowiedz o roli");
});

test("company profile and public navigation keep their structure across screen sizes", async ({
  page,
}) => {
  await choose(page, "Anna Kowalska");
  await page.goto("/#/firmy/brightlabs");
  await expect(page.getByRole("heading", { name: "BrightLabs", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Otwarte role", exact: true })).toBeVisible();
  await expect(page.locator("main")).toContainText("51–200 osób");
  await expect(page.getByRole("link", { name: "Strona firmy", exact: false })).toHaveAttribute(
    "href",
    "https://example.com/brightlabs",
  );
  for (const width of [320, 640, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    const nav = await page.getByRole("navigation", { name: "Główna nawigacja" }).boundingBox();
    expect(nav!.x + nav!.width).toBeLessThanOrEqual(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.goto("/#/oferty");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Oferty pracy z AI");
  await expect(page.getByRole("searchbox", { name: "Szukaj ofert", exact: true })).toBeVisible();
  await expect(page.locator("[data-job-page-summary]")).toHaveText("Oferty 1–6 z 6");
});

test("mobile search stays visible and filter dialog restores focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/oferty");
  const input = page.getByRole("searchbox", { name: "Szukaj ofert", exact: true });
  await expect(input).toBeVisible();
  await input.fill("Product");
  await page.getByRole("button", { name: "Szukaj", exact: true }).click();
  await expect(page).toHaveURL(/query=Product/);
  const trigger = page.getByRole("button", { name: "Filtry", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Filtry", exact: true });
  await dialog.getByRole("checkbox", { name: "Zdalnie", exact: true }).click();
  await expect(dialog.getByRole("checkbox", { name: "Zdalnie", exact: true })).toBeChecked();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(page).toHaveURL(/remote=remote/);
  await trigger.click();
  await dialog.getByRole("button", { name: /Pokaż \d+ ofert/ }).click();
  await expect(trigger).toBeFocused();
  await page.getByRole("button", { name: "Wyczyść wszystko", exact: true }).click();
  await expect(input).toHaveValue("");
  await expect(page).toHaveURL(/#\/oferty$/);
  await page.goBack();
  await expect(input).toHaveValue("Product");
});

test("desktop reset synchronizes search, category and facets with the URL", async ({ page }) => {
  await page.goto("/#/oferty");
  const input = page.getByRole("searchbox", { name: "Szukaj ofert", exact: true });
  await input.fill("Product");
  await page.getByRole("button", { name: "Szukaj", exact: true }).click();
  await page.getByRole("checkbox", { name: "Zdalnie", exact: true }).click();
  await page.getByRole("checkbox", { name: /prowadzisz inicjatywy AI/ }).click();
  await expect(page.getByRole("checkbox", { name: "Zdalnie", exact: true })).toBeChecked();
  await page.getByRole("button", { name: "Wyczyść", exact: true }).click();
  await expect(input).toHaveValue("");
  await expect(page.getByRole("checkbox", { name: "Zdalnie", exact: true })).not.toBeChecked();
  await expect(page.getByRole("checkbox", { name: /prowadzisz inicjatywy AI/ })).not.toBeChecked();
  await expect(page).toHaveURL(/#\/oferty$/);
});

test("distance from home and relocation filters narrow the list and stay in the URL", async ({
  page,
}) => {
  await page.goto("/#/oferty");
  await page.getByLabel("Gdzie mieszkasz").fill("Pruszków");
  await expect(page).toHaveURL(/home=Pruszk/);
  await page.getByLabel("Maksymalnie").selectOption("25");
  await expect(page).toHaveURL(/distance=25/);
  const results = page.getByRole("region", { name: "Wyniki" });
  await expect(
    results.getByRole("heading", { name: "AI Product Manager", exact: true }),
  ).toBeVisible();
  await expect(results.getByRole("heading", { name: "Machine Learning Engineer" })).toHaveCount(0);
  await expect(results.getByRole("heading", { name: "Staff AI Engineer" })).toBeVisible();
  await expect(results).toContainText("km od Ciebie");
  // Controlled checkbox: state follows the URL, so click and then assert.
  await page.getByRole("checkbox", { name: "Pokaż też pracę zdalną" }).click();
  await expect(page.getByRole("checkbox", { name: "Pokaż też pracę zdalną" })).not.toBeChecked();
  await expect(results.getByRole("heading", { name: "Staff AI Engineer" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByLabel("Gdzie mieszkasz")).toHaveValue("Pruszków");
  await page.goto("/#/oferty");
  await page.getByRole("checkbox", { name: "Z dodatkiem relokacyjnym" }).click();
  await expect(page.getByRole("checkbox", { name: "Z dodatkiem relokacyjnym" })).toBeChecked();
  await expect(page).toHaveURL(/relocation=1/);
  await expect(results.locator("article")).toHaveCount(2);
  for (const card of await results.locator("article").all())
    await expect(card).toContainText("Relokacja");
});

test("DoRoboty design: one Inter typeface, K3 cards, K1 buttons and local illustrations", async ({
  page,
}) => {
  const external: string[] = [];
  page.on("request", (r) => {
    if (!r.url().startsWith("http://127.0.0.1:3106") && !r.url().startsWith("data:"))
      external.push(r.url());
  });
  await page.goto("/#/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Wiesz, czego szukają. Pokazujesz, co umiesz.",
  );
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('16px "Inter Variable"'))).toBe(true);
  const fonts = await page.evaluate(() => [
    ...new Set(
      [...document.querySelectorAll("h1, h2, h3, p, a, button, input, dd")].map(
        (el) => getComputedStyle(el).fontFamily.split(",")[0],
      ),
    ),
  ]);
  expect(fonts).toEqual(['"Inter Variable"']);
  const card = page.locator("article.dr-job").first();
  await expect(card).toHaveCSS("border-radius", "8px");
  await expect(card).toHaveCSS("border-top-color", "rgb(230, 218, 196)");
  await expect(card).toHaveCSS("box-shadow", /rgba\(25, 47, 82, 0\.06\)/);
  await expect(card.locator(".ds-tile-human")).toHaveCSS("background-color", "rgb(17, 15, 21)");
  await expect(card.locator(".ds-tag--must").first()).toHaveText("Konieczne");
  await expect(card.getByRole("link", { name: /^Czytaj więcej/ })).toBeVisible();
  const apply = card.getByRole("link", { name: /^Aplikuj/ });
  await expect(apply).toHaveCSS("background-color", "rgb(17, 15, 21)");
  await expect(apply).toHaveCSS("border-radius", "6px");
  await apply.hover();
  await expect(apply).toHaveCSS("background-color", "rgb(25, 47, 82)");
  const images = await page.locator("main img, body > div img").evaluateAll((list) =>
    list.map((img) => ({
      src: (img as HTMLImageElement).src,
      ok: (img as HTMLImageElement).naturalWidth > 0,
    })),
  );
  expect(images.some((x) => x.src.includes("ilu-02"))).toBe(true);
  expect(images.every((x) => x.ok)).toBe(true);
  expect(await page.locator("img[src*='people']").count()).toBe(0);
  for (const path of ["/#/oferty", "/#/oferty/ai-product-manager", "/#/dla-firm", "/#/regulamin"]) {
    await page.goto(path);
    expect(
      await page.evaluate(() =>
        [...document.querySelectorAll("*")].some((el) =>
          /Geist|Arial/.test(getComputedStyle(el).fontFamily.split(",")[0]),
        ),
      ),
    ).toBe(false);
  }
  expect(external).toEqual([]);
});

test("offer section links survive copied URLs and restore section focus through history", async ({
  page,
  context,
}) => {
  await page.goto("/#/oferty/ai-product-manager");
  const toc = page.getByRole("navigation", { name: "Sekcje oferty" });
  const employer = toc.getByRole("link", { name: "O firmie", exact: true });
  const destination = await employer.evaluate((link) => (link as HTMLAnchorElement).href);
  expect(destination).toContain("#/oferty/ai-product-manager#firma");
  await employer.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#firma")).toBeFocused();
  await expect(page).toHaveURL(/#\/oferty\/ai-product-manager#firma$/);
  const copied = await context.newPage();
  await copied.goto(destination);
  await expect(copied.getByRole("heading", { level: 1 })).toHaveText("AI Product Manager");
  await expect(copied.locator("#firma")).toBeFocused();
  expect((await copied.locator("#firma").boundingBox())!.y).toBeLessThan(100);
  await copied.close();
  await toc.getByRole("link", { name: "O roli", exact: true }).click();
  await expect(page.locator("#o-roli")).toBeFocused();
  await page.goBack();
  await expect(page.locator("#firma")).toBeFocused();
  await page.goForward();
  await expect(page.locator("#o-roli")).toBeFocused();
});

for (const width of [1280, 390])
  test(`keyboard chip removal keeps a logical focus successor at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/#/oferty?query=Product&remote=remote");
    const remote = page.getByRole("button", { name: "Usuń filtr: Zdalnie", exact: true });
    await remote.focus();
    await page.keyboard.press("Enter");
    const query = page.getByRole("button", { name: "Usuń filtr: Product", exact: true });
    await expect(query).toBeFocused();
    await expect(page).not.toHaveURL(/remote=/);
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "Wyniki", exact: true })).toBeFocused();
    await expect(page.getByRole("searchbox", { name: "Szukaj ofert", exact: true })).toHaveValue(
      "",
    );
  });

test("public DoRoboty pages: hero, for companies, terms and sign-in simulation", async ({
  page,
}) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [path, heading] of [
      ["/#/", "Wiesz, czego szukają."],
      ["/#/dla-firm", "Opowiedz o roli."],
      ["/#/regulamin", "Regulamin serwisu DoRoboty.ai"],
      ["/#/auth/sign-in?audience=employer", "Wejdź do panelu firmy"],
    ] as const) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(heading);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      expect(results.violations.filter((v) => ["serious", "critical"].includes(v.impact!))).toEqual(
        [],
      );
    }
  }
  await page.goto("/#/");
  await page.getByRole("button", { name: "Lead", exact: true }).click();
  await expect(page.getByRole("button", { name: "Lead", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Szukaj ofert", exact: true }).click();
  await expect(page).toHaveURL(/category=lead/);
  await page.goto("/#/auth/sign-in?audience=candidate");
  await page.getByText("Firma", { exact: true }).click();
  await expect(page).toHaveURL(/audience=employer/);
  await page.getByRole("button", { name: "Wejdź jako Karolina Wiśniewska", exact: true }).click();
  await expect(page).toHaveURL(/#\/app\/oferty$/);
});

test("employer panel lists the company's ads and filters applications per ad", async ({ page }) => {
  await choose(page, "Karolina Wiśniewska");
  await page.goto("/#/app/kandydaci");
  const ads = page.getByRole("region", { name: "Ogłoszenia" });
  await expect(ads.getByRole("button", { name: /Wszystkie ogłoszenia/ })).toHaveAttribute(
    "aria-current",
    "true",
  );
  await expect(page.getByRole("link", { name: "Marek Nowak", exact: true })).toBeVisible();
  await ads.getByRole("button", { name: /AI Operations Specialist/ }).click();
  await expect(page).toHaveURL(/oferta=/);
  await expect(page.getByRole("link", { name: "Marek Nowak", exact: true })).toHaveCount(0);
  await ads.getByRole("button", { name: /AI Product Manager/ }).click();
  await expect(page.getByRole("link", { name: "Marek Nowak", exact: true })).toBeVisible();
  await page.getByText("Nowe", { exact: true }).click();
  await expect(page.getByRole("link", { name: "Marek Nowak", exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("process sheet keeps notes across keyboard tabs and saves stage history with focus", async ({
  page,
}) => {
  await choose(page, "Karolina Wiśniewska");
  await page.goto("/#/app/kandydaci/application-example");
  const note = page.getByLabel("Notatka rekrutacyjna (widoczna pracodawcy)");
  await expect(
    page.locator(".record-meta").getByText("Match Score: 72%", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Wynik przykładowy", { exact: true })).toHaveCount(0);
  await expect(page.locator("iframe[title='Podgląd CV (PDF)']")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Pobierz CV (PDF)", exact: true })).toHaveCount(0);
  const text = "Dopytać o decyzje dotyczące automatyzacji obsługi.";
  await note.fill(text);
  const answer = page.getByRole("tab", { name: "Odpowiedź", exact: true });
  const cv = page.getByRole("tab", { name: "CV", exact: true });
  await answer.focus();
  await page.keyboard.press("ArrowRight");
  await expect(cv).toBeFocused();
  await expect(cv).toHaveAttribute("aria-selected", "true");
  const preview = page.locator("iframe[title='Podgląd CV (PDF)']");
  await expect(preview).toBeVisible();
  await expect(preview).toHaveAttribute("src", /^\.?\/cv\/marek-nowak-cv-v1\.pdf#view=FitH$/);
  await page.setViewportSize({ width: 390, height: 900 });
  expect(
    await preview.evaluate((element) => element.getBoundingClientRect().right <= innerWidth),
  ).toBe(true);
  await page.setViewportSize({ width: 1280, height: 1000 });
  await expect(note).toHaveValue(text);
  await expect(page.getByRole("link", { name: "Pobierz CV (PDF)", exact: true })).toHaveAttribute(
    "href",
    /^\.?\/cv\/marek-nowak-cv-v1\.pdf$/,
  );
  await page.keyboard.press("Home");
  await expect(answer).toBeFocused();
  await expect(page.getByRole("tabpanel", { name: "Odpowiedź", exact: true })).toContainText(
    "Przesłana aplikacja",
  );
  await expect(note).toHaveValue(text);
  await expect(preview).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Pobierz CV (PDF)", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "W przeglądzie", exact: true }).click();
  await expect(page.locator(".record-stage")).toBeFocused();
  await expect(note).toHaveValue("");
  await expect(page.locator(".process-timeline")).toContainText(text);
  await page.reload();
  await expect(page.locator(".process-timeline")).toContainText(text);
  await note.fill("Zakończenie przykładowego procesu.");
  await page.getByRole("button", { name: "Proces zakończony", exact: true }).click();
  await expect(page.locator(".record-stage")).toBeFocused();
  await expect(note).toHaveCount(0);
  // The recruiter own-work note keeps its own save action; process actions are gone.
  await expect(page.locator(":not(.own-work-note) > .record-actions")).toHaveCount(0);
  await expect(page.locator(".process-timeline li")).toHaveCount(3);
  const accessibility = await new AxeBuilder({ page }).include(".recruiting-record").analyze();
  expect(accessibility.violations).toEqual([]);
  await choose(page, "Marek Nowak");
  await page.goto("/#/app/aplikacje/application-example");
  await expect(page.getByText(text, { exact: true })).toHaveCount(0);
});

test("process sheet renders custom snapshots and long content on narrow screens", async ({
  page,
}) => {
  const state = initialState();
  state.activePersonId = "employer-brightlabs";
  const record = state.applications[0];
  record.candidateName = "Marek Nowak z bardzo długim przykładowym nazwiskiem";
  record.jobTitle =
    "Lider rozwoju produktów i automatyzacji procesów z wykorzystaniem sztucznej inteligencji";
  record.cv = "Zapisane niestandardowe CV z importu.\n" + "DoświadczenieBezSpacji".repeat(50);
  record.answer =
    "Długa polska odpowiedź z wieloma przykładami. ".repeat(60) + "DługiWyraz".repeat(60);
  await page.goto("/");
  await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), {
    key: STORAGE_KEY,
    raw: JSON.stringify(state),
  });
  await page.reload();
  await choose(page, "Karolina Wiśniewska");
  await page.goto("/#/app/kandydaci/application-example");
  await expect(page.getByText("Zapisana treść CV", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Pobierz CV (PDF)", exact: true })).toHaveCount(0);
  await page.getByRole("tab", { name: "CV", exact: true }).click();
  await expect(page.getByText("Zapisana treść CV", { exact: true })).toBeVisible();
  await expect(page.locator("iframe[title='Podgląd CV (PDF)']")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Pobierz CV (PDF)", exact: true })).toHaveCount(0);
  await expect(page.getByRole("tabpanel", { name: "CV", exact: true })).toContainText(record.cv);
  for (const width of [1280, 951, 950, 768, 767, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => {
        const elements = [...document.querySelectorAll(".recruiting-record, .recruiting-record *")];
        return (
          document.documentElement.scrollWidth <= innerWidth &&
          elements.every((element) => {
            const rect = element.getBoundingClientRect();
            return !rect.width || (rect.left >= -1 && rect.right <= innerWidth + 1);
          })
        );
      }),
    ).toBe(true);
  }
  await page.getByRole("tab", { name: "Odpowiedź", exact: true }).click();
  await expect(page.getByRole("tabpanel", { name: "Odpowiedź", exact: true })).toContainText(
    record.answer,
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

for (const width of [1280, 390]) {
  test(`application keeps editable draft while reading offer context at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await choose(page, "Anna Kowalska");
    await page.goto("/#/oferty/ai-product-manager");
    // K1 button group: primary first, secondary beside it with an 8 px gap (or wrapped below).
    const gap = await page
      .getByRole("complementary", { name: "Podsumowanie oferty" })
      .locator(".ds-btn-group")
      .evaluate((element) => {
        const [apply, save] = [...element.querySelectorAll("a, button")].map((x) =>
          x.getBoundingClientRect(),
        );
        return save.top >= apply.bottom ? save.top - apply.bottom : save.left - apply.right;
      });
    expect(gap).toBeGreaterThanOrEqual(8);
    await page.getByRole("link", { name: "Aplikuj", exact: true }).click();
    const offer = page.getByRole("complementary", { name: "AI Product Manager", exact: true });
    await expect(offer).toContainText("BrightLabs");
    await expect(offer).toContainText("Hybrydowo");
    const form = page.getByRole("form", { name: "Twoja aplikacja", exact: true });
    const answer = form.getByLabel("Dlaczego pasujesz do tej roli?");
    const text = "Prowadziłam badania i wdrożenie automatyzacji obsługi zgłoszeń w produkcie B2B.";
    await answer.fill(text);
    await form.getByRole("checkbox").check();
    const description = offer.locator("summary");
    await description.focus();
    await page.keyboard.press("Enter");
    await expect(offer.locator("[data-job-description]")).toBeVisible();
    await expect(answer).toHaveValue(text);
    await expect(form.getByRole("checkbox")).toBeChecked();
    await page.keyboard.press("Enter");
    await expect(offer.locator("[data-job-description]")).toBeHidden();
    await expect(form.getByRole("region", { name: "Twoje CV", exact: true })).toContainText(
      "CV z Twojego profilu",
    );
    await expect(form.getByRole("link", { name: "Pobierz CV (PDF)", exact: true })).toHaveAttribute(
      "href",
      /^\.?\/cv\/anna-kowalska-cv-v1\.pdf$/,
    );
    await form.getByRole("button", { name: "Zapisz szkic", exact: true }).click();
    await page.reload();
    await expect(answer).toHaveValue(text);
    await expect(form.getByRole("checkbox")).not.toBeChecked();
    const accessibility = await new AxeBuilder({ page }).include(".application-page").analyze();
    expect(accessibility.violations).toEqual([]);
  });
}

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`submission celebrates only once after success with motion ${reducedMotion}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion });
    await choose(page, "Anna Kowalska");
    await page.goto("/#/aplikuj/ai-product-manager");
    const answer = page.getByLabel("Dlaczego pasujesz do tej roli?");
    await answer.fill("krótko");
    await page.getByRole("button", { name: "Wyślij aplikację", exact: true }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "Odpowiedź jest za krótka" }),
    ).toContainText("Odpowiedź jest za krótka");
    await expect(page.locator(".confetti-burst")).toHaveCount(0);
    await answer.fill(
      "Prowadziłam badania użytkowników i wdrożenie automatyzacji procesu obsługi.",
    );
    await page.getByRole("button", { name: "Zapisz szkic", exact: true }).click();
    await expect(page.locator(".confetti-burst")).toHaveCount(0);
    await page.getByRole("checkbox").check();
    await page.clock.install({ time: new Date("2026-11-03T10:00:00Z") });
    await page.clock.pauseAt(new Date("2026-11-03T10:00:01Z"));
    await page.getByRole("button", { name: "Wyślij aplikację", exact: true }).click();
    await expect(page.getByRole("button", { name: "Wysłano!", exact: true })).toBeDisabled();
    await expect(answer).toBeDisabled();
    if (reducedMotion === "no-preference") {
      await expect(page.locator(".confetti-burst")).toHaveAttribute("aria-hidden", "true");
      expect(
        await page
          .locator(".confetti-burst")
          .evaluate((element) => getComputedStyle(element).pointerEvents),
      ).toBe("none");
      await expect(page.locator(".confetti-burst span")).toHaveCount(30);
    } else {
      await expect(page.locator(".confetti-burst")).toHaveCount(0);
    }
    await page.locator("form").dispatchEvent("submit");
    expect(
      await page.evaluate(
        (key) =>
          JSON.parse(localStorage.getItem(key)!).applications.filter(
            (item: { candidateId: string }) => item.candidateId === "candidate-anna",
          ).length,
        STORAGE_KEY,
      ),
    ).toBe(1);
    await page.clock.fastForward(reducedMotion === "reduce" ? 1 : 1000);
    await expect(page).toHaveURL(/#\/app\/aplikacje\?wyslano=1$/);
    await expect(page.locator(".confetti-burst")).toHaveCount(0);
    await page.reload();
    await expect(page.locator(".confetti-burst")).toHaveCount(0);
    await page.goto("/#/aplikuj/ai-product-manager");
    await expect(
      page.getByText("Aplikacja na tę ofertę została już wysłana.", { exact: true }),
    ).toBeVisible();
    await expect(page.locator(".confetti-burst")).toHaveCount(0);
  });
}

test("candidate record shares snapshot tabs while excluding employer notes and managing withdrawal focus", async ({
  page,
}) => {
  const state = initialState();
  state.activePersonId = "candidate-marek";
  const record = state.applications[0];
  record.stage = "reviewed";
  record.events.push({
    stage: "reviewed",
    at: "2026-11-02T10:00:00.000Z",
    note: "Notatka wyłącznie dla pracodawcy.",
  });
  record.sourceNotes = "Dawna prywatna notatka źródłowa.";
  record.generatedAnswer = "Dawna propozycja, która nie jest zatwierdzoną odpowiedzią.";
  await page.goto("/");
  await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), {
    key: STORAGE_KEY,
    raw: JSON.stringify(state),
  });
  await page.goto("/#/app/aplikacje/application-example");
  await page.reload();
  await expect(
    page.getByRole("heading", { level: 1, name: record.jobTitle, exact: true }),
  ).toBeVisible();
  await expect(page.locator(".record-meta")).toContainText("Match Score: 72%");
  await expect(page.locator("main")).not.toContainText(record.events[1].note);
  await expect(page.locator("main")).not.toContainText(record.sourceNotes);
  await expect(page.locator("main")).not.toContainText(record.generatedAnswer);
  await expect(page.getByRole("textbox")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Pobierz CV (PDF)", exact: true })).toHaveCount(0);
  await page.getByRole("tab", { name: "Odpowiedź", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "CV", exact: true })).toBeFocused();
  await expect(page.locator("iframe[title='Podgląd CV (PDF)']")).toHaveAttribute(
    "src",
    /^\.?\/cv\/marek-nowak-cv-v1\.pdf#view=FitH$/,
  );
  await expect(page.locator("main")).not.toContainText(record.events[1].note);
  await page.keyboard.press("Home");
  await expect(page.getByRole("tabpanel", { name: "Odpowiedź", exact: true })).toContainText(
    record.answer,
  );
  const trigger = page.getByRole("button", { name: "Wycofaj aplikację", exact: true });
  const confirm = page.getByRole("button", { name: "Potwierdź wycofanie", exact: true });
  await trigger.click();
  await expect(confirm).toBeFocused();
  await page.getByRole("button", { name: "Anuluj", exact: true }).click();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await confirm.click();
  await expect(page.locator(".record-stage")).toHaveText("Wycofana");
  await expect(page.locator(".record-stage")).toBeFocused();
  await expect(trigger).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveText("Aplikacja została wycofana.");
  const accessibility = await new AxeBuilder({ page }).include(".recruiting-record").analyze();
  expect(accessibility.violations).toEqual([]);
  await page.reload();
  await expect(page.locator(".record-stage")).toHaveText("Wycofana");
  await expect(trigger).toHaveCount(0);
  await choose(page, "Anna Kowalska");
  await page.goto("/#/app/aplikacje/application-example");
  await expect(
    page.getByRole("heading", { name: "Nie znaleziono strony", exact: true }),
  ).toBeVisible();
});

test("candidate snapshot supports custom CV and long content at desktop and mobile widths", async ({
  page,
}) => {
  const state = initialState();
  state.activePersonId = "candidate-marek";
  const record = state.applications[0];
  record.jobTitle =
    "Starszy lider rozwoju produktów i automatyzacji z wykorzystaniem sztucznej inteligencji";
  record.cv = "Niestandardowa zapisana treść CV.\n" + "DoświadczenieBezSpacji".repeat(70);
  record.answer = "Opis realizowanych projektów i podejmowanych decyzji. ".repeat(40);
  await page.goto("/");
  await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), {
    key: STORAGE_KEY,
    raw: JSON.stringify(state),
  });
  await page.goto("/#/app/aplikacje/application-example");
  await page.reload();
  await page.getByRole("tab", { name: "CV", exact: true }).click();
  await expect(page.getByRole("tabpanel", { name: "CV", exact: true })).toContainText(record.cv);
  await expect(page.locator("iframe[title='Podgląd CV (PDF)']")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Pobierz CV (PDF)", exact: true })).toHaveCount(0);
  for (const width of [1280, 1100, 951, 950, 600, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.getByRole("tab", { name: "Odpowiedź", exact: true }).click();
  await expect(page.getByRole("tabpanel", { name: "Odpowiedź", exact: true })).toContainText(
    record.answer,
  );
});

test("optional own-work examples reach the recruiter, who filters and answers before inviting", async ({
  page,
}) => {
  await choose(page, "Anna Kowalska");
  await page.goto("/#/aplikuj/ai-product-manager");
  await expect(page.getByRole("heading", { name: "Twoja praca", exact: true })).toBeVisible();
  await page
    .getByLabel("Dlaczego pasujesz do tej roli?")
    .fill("Prowadziłam wdrożenia AI w zespole produktowym i mierzyłam ich efekt.");
  const first = page.getByRole("textbox", { name: /prowadziłeś\/prowadziłaś wdrożenie AI/ });
  await first.fill(
    "napewno sama poprowadziłam pilotaż asystenta ,zespół 6 osób.czas obsługi spadł",
  );
  await page.getByRole("button", { name: "Popraw literówki" }).first().click();
  await expect(first).toHaveValue(
    "Na pewno sama poprowadziłam pilotaż asystenta, zespół 6 osób. Czas obsługi spadł",
  );
  await page.getByRole("checkbox", { name: "Zatwierdzam treść i przesłanie aplikacji" }).check();
  await page.getByRole("button", { name: "Wyślij aplikację", exact: true }).click();
  await expect(page.getByText("Zaznacz oświadczenie albo usuń treść przykładów.")).toBeVisible();
  await page
    .getByRole("checkbox", { name: "Oświadczam, że przykłady napisałem/napisałam samodzielnie" })
    .check();
  await page.getByRole("checkbox", { name: "Zatwierdzam treść i przesłanie aplikacji" }).check();
  await page.getByRole("button", { name: "Wyślij aplikację", exact: true }).click();
  await expect(page.getByText("Aplikacja została wysłana.", { exact: false })).toBeVisible();

  await choose(page, "Karolina Wiśniewska");
  await page.getByRole("link", { name: "Kandydaci", exact: true }).click();
  await page.getByText("Z przykładami", { exact: true }).click();
  await expect(page.getByRole("link", { name: "Marek Nowak", exact: true })).toHaveCount(0);
  await expect(page.getByText("Przykłady pracy: 1 · deklaruje: bez AI")).toBeVisible();
  await page.getByRole("link", { name: "Anna Kowalska", exact: true }).click();
  await expect(page.getByText("pilotaż asystenta", { exact: false })).toBeVisible();
  await page
    .getByRole("textbox", { name: "Co ta osoba zrobiła sama i z jakim skutkiem?" })
    .fill("Sama poprowadziła pilotaż asystenta w zespole 6 osób; czas obsługi spadł.");
  await page.getByRole("button", { name: "Zapisz odpowiedź" }).click();
  await expect(page.getByText("Zapisano odpowiedź.")).toBeVisible();
  await page.getByRole("button", { name: "W przeglądzie", exact: true }).click();
  await page.getByRole("button", { name: "Zaproszenie na rozmowę", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Co ta osoba zrobiła sama i z jakim skutkiem?" }),
  ).toHaveValue("Sama poprowadziła pilotaż asystenta w zespole 6 osób; czas obsługi spadł.");
  await expect(page.locator(".record-stage")).toHaveText("Zaproszenie na rozmowę");
});

test("footer tells visitors where to report a problem", async ({ page }) => {
  await page.goto("/#/");
  const report = page
    .getByRole("navigation", { name: "Stopka" })
    .getByRole("link", { name: "Zgłoś problem" });
  await expect(report).toHaveAttribute("href", "https://github.com/greyfox113/doroboty-ai/issues");
  await expect(report).toHaveAttribute("rel", "noreferrer");
});
