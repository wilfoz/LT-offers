// QA E2E da Importação Analítica (task 4.2) — Playwright headless.
// Executar da raiz: node openspec/changes/importacao-analitica-catalogos/qa/e2e-importacao.js
// Pré-requisitos: API em :3000 e web em :5100 (proxy /api → 3000).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const WEB = process.env.WEB_URL || 'http://localhost:5100';
const API = process.env.API_URL || 'http://localhost:3000/api';
const EVIDENCES = path.join(__dirname, 'evidences');
const TEMPLATE = path.resolve(
  'template/Calculo LT-CELEO-LOTE-04-2026-XXX_R0_COM REIDI BR-v03.xlsm',
);
const DATE = '2026-09-30';
const results = [];

fs.mkdirSync(EVIDENCES, { recursive: true });

async function shot(page, name) {
  await page.screenshot({
    path: path.join(EVIDENCES, `qa-${DATE}-${name}.png`),
    fullPage: true,
  });
}

function check(id, description, ok, detail = '') {
  results.push({ id, description, result: ok ? 'PASSOU' : 'FALHOU', detail });
  console.log(`${ok ? 'PASSOU' : 'FALHOU'} ${id} — ${description} ${detail}`);
}

async function select(page, selectId, optionName) {
  // O mat-label de um select vazio fica sobre o gatilho (clicar nele abre o
  // select para o usuário); o Playwright recusa o clique, então é forçado
  await page.locator(`#${selectId}`).click({ force: true });
  await page.getByRole('option', { name: optionName }).first().click();
  // Espera o painel do mat-select fechar antes da próxima interação
  await page.locator('.cdk-overlay-backdrop').waitFor({ state: 'detached' });
}

async function openWizard(page) {
  await page.goto(`${WEB}/upload`);
  await page.getByRole('heading', { name: 'Importação Analítica' }).waitFor();
}

async function uploadTemplate(page) {
  await page.locator('#import-file').setInputFiles(TEMPLATE);
  await page.locator('#catalog').waitFor({ timeout: 60000 });
}

async function toMapping(page, catalog, sheet) {
  await select(page, 'catalog', catalog);
  await page.getByRole('button', { name: 'Avançar' }).click();
  await select(page, 'sheet', sheet);
  await select(page, 'header-row', /^Linha 5:/);
  await page.getByRole('button', { name: 'Avançar' }).click();
  await page.locator('.mapping').waitFor();
}

async function waitPreview(page) {
  await page.getByText('Linhas lidas:').waitFor({ timeout: 60000 });
}

async function apiJson(url) {
  const res = await fetch(url);
  return res.json();
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const consoleErrors = [];
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));

  // E2E-1: item de menu e tela nova
  await page.goto(`${WEB}/dashboard`);
  const menu = page.locator('a.system-nav-link', { hasText: 'Importação Analítica' });
  const oldMenu = await page.locator('a.system-nav-link', { hasText: 'Upload & OCR' }).count();
  await menu.click();
  await page.getByRole('heading', { name: 'Importação Analítica' }).waitFor();
  const body1 = await page.locator('body').innerText();
  check('E2E-1', 'Menu "Importação Analítica" abre /upload sem restos do mockup de OCR',
    page.url().endsWith('/upload') && oldMenu === 0 && !body1.includes('Fila de Processamento'));
  await shot(page, 'e2e1-etapa-arquivo');

  // E2E-2: formato não suportado
  await page.locator('#import-file').setInputFiles({
    name: 'projeto.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4'),
  });
  const alert2 = await page.getByRole('alert').innerText();
  check('E2E-2', 'Arquivo .pdf rejeitado com formatos aceitos, sem iniciar o assistente',
    alert2.includes('Formato de arquivo não suportado; envie uma planilha .xlsx, .xlsm, .xls ou .csv')
      && (await page.locator('#catalog').count()) === 0);
  await shot(page, 'e2e2-formato-nao-suportado');

  // E2E-3..E2E-10 gravam no banco: com SKIP_DB_CAL=1 a rodada retoma do OPGW
  if (!process.env.SKIP_DB_CAL) {
  // E2E-3: DB_CAL → cabos condutores (2 linhas de título antes do cabeçalho)
  await openWizard(page);
  await uploadTemplate(page);
  const catalogs = await (async () => {
    await page.locator('#catalog').click();
    const names = await page.getByRole('option').allInnerTexts();
    await page.keyboard.press('Escape');
    return names.map((n) => n.trim());
  })();
  check('E2E-3a', 'Destinos = 8 catálogos planos, sem hierárquicos/compostos',
    catalogs.length === 8 && !catalogs.some((c) => /Séries|Tipos de fundação|Matriz|Equipes|Tipos de torre/.test(c)),
    JSON.stringify(catalogs));
  await toMapping(page, 'Cabos condutores', 'DB_CAL');
  await page.locator('#source-code').click();
  const columnOptions = (await page.getByRole('option').allInnerTexts()).map((t) => t.trim());
  await page.keyboard.press('Escape');
  check('E2E-3b', 'Colunas da linha de cabeçalho exibidas para associação',
    ['C · Código de conductor', 'D · Peso (ton/km)', 'F · Diámetro (mm)', 'G · UTS (kN)']
      .every((c) => columnOptions.includes(c)), JSON.stringify(columnOptions));
  await shot(page, 'e2e3-mapeamento-db-cal');

  // Requerido sem associação bloqueia
  await page.locator('#effective-from').fill('2026-01-01');
  await page.getByRole('button', { name: 'Gerar prévia' }).click();
  const blocked = await page.locator('ul[role="alert"]').innerText();
  check('E2E-4', 'Código sem coluna nem valor fixo bloqueia com orientação em português',
    blocked.includes('O campo Código é requerido: associe uma coluna do arquivo ou informe um valor fixo')
      && (await page.getByText('Linhas lidas:').count()) === 0);
  await shot(page, 'e2e4-requerido-bloqueado');

  // Opcional sem associação avisa
  const warning = await page.locator('.warning').innerText();
  check('E2E-5', 'Opcional sem associação (Descrição) gera aviso de "sem dados"',
    warning.includes('ficarão sem dados (não informado, nunca zero)') && warning.includes('Descrição'));

  // Vigência inválida
  await select(page, 'source-code', 'C · Código de conductor');
  await page.locator('#effective-from').fill('2027-02-30');
  await page.getByRole('button', { name: 'Gerar prévia' }).click();
  check('E2E-6', 'Vigência 2027-02-30 recusada na interface',
    (await page.getByText('Informe uma data real no formato AAAA-MM-DD').count()) > 0);

  await page.locator('#effective-from').fill('2026-01-01');
  await page.getByRole('button', { name: 'Gerar prévia' }).click();
  await waitPreview(page);
  const counts = await page.locator('.counts').innerText();
  const previewText = await page.locator('table').innerText();
  check('E2E-7', 'Prévia classifica as linhas e aponta inválidas com motivo',
    /a importar/.test(counts) && previewText.includes('O campo Código é obrigatório'),
    counts.replace(/\s+/g, ' '));
  await shot(page, 'e2e7-previa-db-cal');

  const importButton = page.getByRole('button', { name: /Importar \d+ item/ });
  const toImport = Number((await importButton.innerText()).match(/\d+/)[0]);
  await importButton.click();
  const summary = await page.locator('.summary').innerText({ timeout: 120000 });
  check('E2E-8', 'Relatório final com contagens', summary.includes(`${toImport} importado`), summary);
  await shot(page, 'e2e8-relatorio-db-cal');

  const cables = await apiJson(`${API}/catalogs/conductor-cables?search=AAAC 63,36 MCM`);
  const created = cables.find((c) => c.code === 'AAAC 63,36 MCM');
  check('E2E-9', 'Item importado aparece no catálogo com a vigência informada e opcional não informado',
    created && created.effectiveVersion?.effectiveFrom?.startsWith('2026-01-01')
      && created.effectiveVersion.description === null
      && created.effectiveVersion.weightTonPerKm === '0.092',
    JSON.stringify(created?.effectiveVersion));

  // E2E-10: reimportar a mesma aba → tudo ignorado (dedup)
  await page.getByRole('button', { name: 'Nova importação' }).click();
  await uploadTemplate(page);
  await toMapping(page, 'Cabos condutores', 'DB_CAL');
  await select(page, 'source-code', 'C · Código de conductor');
  await page.locator('#effective-from').fill('2026-01-01');
  await page.getByRole('button', { name: 'Gerar prévia' }).click();
  await waitPreview(page);
  const counts2 = (await page.locator('.counts').innerText()).replace(/\s+/g, ' ');
  const importDisabled = await page.getByRole('button', { name: /Importar 0 item/ }).isDisabled();
  check('E2E-10', 'Reimportação: nenhum item a importar, já cadastrados ignorados, botão desabilitado',
    counts2.startsWith('0 a importar') && importDisabled, counts2);
  await shot(page, 'e2e10-reimportacao-dedup');

  await page.getByRole('button', { name: 'Voltar ao mapeamento' }).click();
  }

  // E2E-11: DB_OPGW → cabos de guarda com valor fixo OPGW
  await openWizard(page);
  await uploadTemplate(page);
  await toMapping(page, 'Cabos de guarda', 'DB_OPGW');
  await select(page, 'source-code', 'C · Código del cable');
  await select(page, 'source-type', 'Valor fixo…');
  await select(page, 'fixed-type', 'OPGW');
  await select(page, 'source-i2tKa2s', /^E · I2t/);
  await select(page, 'source-fiberCount', 'F · Fibras');
  await page.locator('#effective-from').fill('2026-01-01');
  await shot(page, 'e2e11-mapeamento-opgw-valor-fixo');
  await page.getByRole('button', { name: 'Gerar prévia' }).click();
  await waitPreview(page);
  const opgwTable = await page.locator('table').innerText();
  const opgwCounts = (await page.locator('.counts').innerText()).replace(/\s+/g, ' ');
  check('E2E-12', 'Linha com "12-48" em campo inteiro é inválida sem bloquear as demais',
    opgwTable.includes('O campo Número de fibras deve ser um número inteiro (valor lido: "12-48")')
      && !opgwCounts.startsWith('0 a importar'), opgwCounts);
  await shot(page, 'e2e12-previa-opgw');
  await page.getByRole('button', { name: /Importar \d+ item/ }).click();
  const opgwSummary = await page.locator('.summary').innerText({ timeout: 120000 });
  const wires = await apiJson(`${API}/catalogs/ground-wires?search=DS1.049`);
  check('E2E-13', 'Itens OPGW criados com o tipo do valor fixo, sem coluna de tipo no arquivo',
    wires.length > 0 && wires.every((w) => w.type === 'OPGW'),
    `${opgwSummary} | ${JSON.stringify(wires.map((w) => [w.code, w.type]))}`);
  await shot(page, 'e2e13-relatorio-opgw');

  // Acessibilidade: foco no título da etapa e teclado
  await openWizard(page);
  await page.keyboard.press('Tab');
  await uploadTemplate(page);
  const focused = await page.evaluate(() => document.activeElement?.textContent?.trim());
  check('A11Y-1', 'Troca de etapa move o foco para o título da etapa',
    focused?.startsWith('Etapa 2 de 6: Catálogo'), focused);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await page.getByRole('option', { name: 'Isoladores' }).waitFor();
  await page.keyboard.press('Escape');
  check('A11Y-2', 'Seletor de catálogo operável por teclado (Tab + Enter + Esc)', true);

  // Responsividade 375px: mapeamento e prévia sem rolagem horizontal da página
  await page.setViewportSize({ width: 375, height: 800 });
  await toMapping(page, 'Tipos de solo', 'DB_FUN');
  const overflowMapping = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  await shot(page, 'resp-375-mapeamento');
  check('RESP-1', 'Mapeamento em 375px sem rolagem horizontal da página', !overflowMapping);

  check('CONSOLE', 'Sem erros no console do navegador', consoleErrors.length === 0,
    JSON.stringify(consoleErrors.slice(0, 5)));

  await browser.close();
  fs.writeFileSync(path.join(EVIDENCES, `qa-${DATE}-e2e-resultados${process.env.SKIP_DB_CAL ? '-rodada2' : ''}.json`), JSON.stringify(results, null, 2));
  const failed = results.filter((r) => r.result !== 'PASSOU');
  console.log(`\n${results.length - failed.length}/${results.length} verificações passaram`);
  process.exit(failed.length ? 1 : 0);
})().catch((error) => {
  console.error(error);
  fs.writeFileSync(path.join(EVIDENCES, `qa-${DATE}-e2e-resultados${process.env.SKIP_DB_CAL ? '-rodada2' : ''}.json`), JSON.stringify(results, null, 2));
  process.exit(2);
});
