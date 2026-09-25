import { expect, test } from "@playwright/test";

test("filtro de cliente exige seleção, envia ID e permite limpar pelo teclado", async ({
  page,
}) => {
  const requests: string[] = [];
  await page.route("**/api/user", (route) =>
    route.fulfill({
      json: { user: { id: 1, name: "Teste", email: "test@example.com" } },
    }),
  );
  await page.route("**/api/customers?**", (route) =>
    route.fulfill({
      json: {
        data: [
          {
            id: 42,
            name: "Aurora",
            document: "12345678901",
            email: "a@example.com",
            active: true,
          },
        ],
        next_cursor: null,
        prev_cursor: null,
      },
    }),
  );
  await page.route("**/api/reports/billing?**", (route) => {
    requests.push(route.request().url());
    return route.fulfill({
      json: {
        rows: { data: [], next_cursor: null, prev_cursor: null },
        totals: {
          count: 0,
          original_amount: "0.00",
          interest: "0.00",
          updated_amount: "0.00",
          received_amount: "0.00",
          pending_amount: "0.00",
        },
      },
    });
  });
  await page.goto("/");
  await expect(
    page.getByText("Total atualizado", { exact: true }),
  ).toBeVisible();
  const input = page.getByLabel("Buscar cliente");
  const apply = page.getByRole("button", { name: "Aplicar", exact: true });
  await input.fill("Aurora");
  await apply.focus();
  await apply.press("Enter");
  await expect(page.getByRole("alert")).toContainText("Selecione um cliente");
  expect(
    requests.every((url) => !new URL(url).searchParams.has("customer_id")),
  ).toBe(true);

  await input.focus();
  const option = page.getByRole("button", { name: "Aurora 12345678901" });
  await expect(option).toBeVisible();
  await input.press("Tab"); // Todos os clientes
  await page.keyboard.press("Tab"); // Aurora
  await expect(option).toBeFocused();
  await page.keyboard.press("Enter");
  await apply.focus();
  await apply.press("Enter");
  await expect
    .poll(() => new URL(requests.at(-1)!).searchParams.get("customer_id"))
    .toBe("42");
  await expect(page.getByRole("alert")).toHaveCount(0);

  await input.fill("Outro cliente");
  await apply.focus();
  await apply.press("Enter");
  await expect(page.getByRole("alert")).toContainText("Selecione um cliente");
  await input.fill("");
  await apply.focus();
  await apply.press("Enter");
  await expect
    .poll(() => new URL(requests.at(-1)!).searchParams.has("customer_id"))
    .toBe(false);

  await input.fill("Aurora");
  await option.click();
  await apply.click();
  await expect
    .poll(() => new URL(requests.at(-1)!).searchParams.get("customer_id"))
    .toBe("42");
  await page.getByRole("button", { name: "Limpar filtros" }).click();
  await expect(input).toHaveValue("");
  await expect
    .poll(() => new URL(requests.at(-1)!).searchParams.has("customer_id"))
    .toBe(false);
});
