import { expect, test } from "@playwright/test";

test("login, relatório, clientes, cobrança, pagamento e exportação", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Bom ter você por aqui." }),
  ).toBeVisible();
  await page.screenshot({ path: "../artifacts/login.png", fullPage: true });
  await page.getByLabel("Senha", { exact: true }).fill("Clara@2026!");
  await page.getByRole("button", { name: "Entrar na plataforma" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Relatório de faturamento",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Total atualizado", { exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "../artifacts/relatorio.png", fullPage: true });

  await page.getByRole("link", { name: "Clientes", exact: true }).click();
  await page.getByRole("button", { name: "Novo cliente" }).click();
  const name = "Teste E2E " + Date.now();
  const document = String(Date.now()).slice(-11);
  await page.getByLabel("Nome ou razão social").fill(name);
  await page.getByLabel("CPF ou CNPJ").fill(document);
  await page.getByLabel("E-mail", { exact: true }).fill("e2e@example.com");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByText("Cliente cadastrado com sucesso.")).toBeVisible();
  await page.getByLabel("Buscar por nome ou documento").fill(name);
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page.getByRole("button", { name, exact: true })).toBeVisible();
  await page.screenshot({ path: "../artifacts/clientes.png", fullPage: true });

  await page.getByRole("link", { name: "Cobranças", exact: true }).click();
  await page.getByRole("button", { name: "Nova cobrança" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Buscar cliente").fill(name);
  await dialog.getByRole("button", { name: new RegExp(name) }).click();
  await dialog
    .getByLabel("Descrição", { exact: true })
    .fill("Projeto criado no teste de navegador");
  await dialog.getByLabel("Valor original (R$)").fill("1250.50");
  await dialog.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByText("Cobrança criada com sucesso.")).toBeVisible();
  await page.getByLabel("Buscar cliente").fill(name);
  await page.getByRole("button", { name: new RegExp(name) }).click();
  await page.getByRole("button", { name: "Aplicar", exact: true }).click();
  await page.getByRole("button", { name, exact: true }).click();
  await page
    .getByRole("button", { name: "Registrar pagamento", exact: true })
    .click();
  await page.getByLabel("Valor recebido (R$)").fill("1200.00");
  await page.getByRole("button", { name: "Confirmar pagamento" }).click();
  await expect(
    page.getByText("Pagamento registrado com sucesso."),
  ).toBeVisible();
  await expect(
    page.getByRole("table").getByText("Paga", { exact: true }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Relatórios", exact: true }).click();
  await expect(
    page.getByText("Total atualizado", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "CSV", exact: true }).click();
  await expect(
    page.getByText(
      "Exportação solicitada. Acompanhe o arquivo em Exportações.",
    ),
  ).toBeVisible();
  const exported = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/exports") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Exportar PDF" }).click();
  const newExport = await (await exported).json();
  await page.getByRole("link", { name: "Exportações", exact: true }).click();
  const downloadLink = page
    .getByTestId("export-" + newExport.id)
    .getByRole("link", { name: "Baixar" });
  await expect(downloadLink).toBeVisible({
    timeout: 40000,
  });
  const downloadPromise = page.waitForEvent("download");
  await downloadLink.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(
    /faturamento-.*\.(csv|pdf|zip)$/,
  );
  await download.saveAs("../artifacts/" + download.suggestedFilename());
  await page.screenshot({
    path: "../artifacts/exportacoes.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Sair da conta" }).click();
  await expect(
    page.getByRole("heading", { name: "Bom ter você por aqui." }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("interface móvel mantém navegação e formulários acessíveis", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByLabel("Senha", { exact: true }).fill("Clara@2026!");
  await page.getByRole("button", { name: "Entrar na plataforma" }).click();
  await expect(
    page.getByText("Total atualizado", { exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "../artifacts/mobile.png", fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await page.getByRole("link", { name: "Clientes", exact: true }).click();
  await page.getByRole("button", { name: "Novo cliente" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
