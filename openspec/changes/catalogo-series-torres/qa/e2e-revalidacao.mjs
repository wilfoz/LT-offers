// Revalidação dos 5 itens que falharam por defeito do próprio script de QA
// (corridas de renderização, literal decimal e premissa de ordem de foco).
// Usa os dados já criados pela execução principal (QA Série 500/230, QA-SA1).
import { chromium } from 'file:///C:/Users/wilwa/Desktop/Developer/offer/.claude/skills/playwright-skill/node_modules/playwright/index.mjs';

const BASE = 'http://localhost:4200';
const EVID = process.env.EVID_DIR;
const results = [];

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.error(`${ok ? 'PASS' : 'FAIL'} - ${name}${detail ? ' :: ' + detail : ''}`);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.setDefaultTimeout(10000);

try {
  // 1. Série: valores numéricos inválidos — espera as mensagens renderizarem
  await page.goto(`${BASE}/catalogs/structure-series/new`);
  await page.getByLabel('Nome *').fill('QA Revalida');
  await page.getByLabel('Tensão (kV)').fill('-500');
  await page.getByLabel('Quantidade de circuitos').fill('1.5');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.getByText('Informe um número decimal positivo com ponto').waitFor();
  await page.getByText('Informe um número inteiro positivo').waitFor();
  record('Série: valores numéricos inválidos rejeitados em pt-BR', true);

  // 2. Busca por nome — espera a resposta filtrada antes de ler a tabela
  await page.goto(`${BASE}/catalogs/structure-series`);
  await page.getByRole('cell', { name: 'QA Série 230' }).waitFor();
  await page.getByLabel('Buscar por nome ou projetista').fill('500');
  await Promise.all([
    page.waitForResponse((r) => r.url().includes('search=500')),
    page.getByRole('button', { name: 'Buscar' }).click(),
  ]);
  await page.getByRole('cell', { name: 'QA Série 230' }).waitFor({ state: 'detached' });
  const table = await page.locator('table').innerText();
  record(
    'Busca por nome filtra a listagem',
    table.includes('QA Série 500') && !table.includes('QA Série 230'),
  );
  await page.screenshot({ path: `${EVID}/21-revalida-busca-nome.png`, fullPage: true });

  // 3. Ponto zero/fora da escala — espera as mensagens por linha
  await page.goto(`${BASE}/catalogs/structure-series`);
  await page
    .locator('tr', { hasText: 'QA Série 500' })
    .getByRole('link', { name: 'Tipos de torre' })
    .click();
  await page.getByRole('link', { name: 'Novo tipo de torre' }).click();
  await page.getByLabel('Sigla *').fill('QA-REV');
  await page.getByLabel('Função *').selectOption('ANCHOR');
  await page.getByRole('button', { name: 'Adicionar ponto' }).click();
  await page.getByLabel('Altura (m)').nth(0).fill('0');
  await page.getByLabel('Peso (kg)').nth(0).fill('5200.125');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.getByText('Informe um número decimal positivo com ponto (ex.: 24.5)').waitFor();
  await page.getByText('Use no máximo 2 casas decimais').waitFor();
  record('Ponto zero/fora da escala rejeitado apontando a linha', true);

  // 4. Histórico do tipo — literal correto do contrato Decimal→string (5200.5)
  await page.goto(`${BASE}/catalogs/structure-series`);
  await page
    .locator('tr', { hasText: 'QA Série 500' })
    .getByRole('link', { name: 'Tipos de torre' })
    .click();
  await page
    .locator('tr', { hasText: 'QA-SA1' })
    .getByRole('link', { name: 'Histórico' })
    .click();
  await page.getByText('Vigente desde 01/09/2026').waitFor();
  const hist = await page.locator('section').innerText();
  record(
    'Histórico do tipo preserva a tabela por versão',
    hist.includes('5300') && hist.includes('5200.5') && hist.includes('7000'),
  );

  // 5. Teclado: Tab percorre o cabeçalho e alcança o campo Nome do form
  await page.goto(`${BASE}/catalogs/structure-series/new`);
  let reached = false;
  for (let i = 0; i < 12; i += 1) {
    await page.keyboard.press('Tab');
    const id = await page.evaluate(() => document.activeElement?.getAttribute('id'));
    if (id === 'name') {
      reached = true;
      break;
    }
  }
  record('Navegação por teclado alcança o campo Nome via Tab', reached);
} catch (error) {
  record('EXCEÇÃO na revalidação', false, String(error));
  await page.screenshot({ path: `${EVID}/22-revalida-excecao.png`, fullPage: true });
} finally {
  await browser.close();
}

console.log(JSON.stringify(results, null, 2));
if (results.some((r) => !r.ok)) process.exitCode = 1;
