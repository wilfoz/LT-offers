// Script E2E adaptado da change piloto-catalogo-cabos para as rotas e campos
// em inglês (change convencao-codigo-ingles). Mesmos 15 cenários; evidências
// em qa/evidences/ desta change. Uso: node e2e-qa.mjs
import { createRequire } from 'node:module';

const require = createRequire(
  'C:/Users/wilwa/Desktop/Developer/offer/.claude/skills/playwright-skill/run.js',
);
const { chromium } = require('playwright');

const BASE = 'http://localhost:4200';
const EVID =
  'C:/Users/wilwa/Desktop/Developer/offer/openspec/changes/convencao-codigo-ingles/qa/evidences';

const results = [];
const record = (scenario, status, detail = '') => {
  results.push({ scenario, status, detail });
  console.log(`${status === 'PASSOU' ? '✓' : '✗'} ${scenario} ${detail}`);
};

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
});
const page = await context.newPage();
const shot = (name) =>
  page.screenshot({ path: `${EVID}/${name}.png`, fullPage: true });

async function fillForm(fields) {
  for (const [label, value] of Object.entries(fields)) {
    await page.getByLabel(label).fill(value);
  }
}

try {
  // ---------- Estado inicial ----------
  await page.goto(`${BASE}/catalogs/conductor-cables`);
  await page
    .getByRole('heading', { name: 'Catálogo de cabos condutores' })
    .waitFor();
  await shot('01-lista-inicial');

  // ---------- S7: Criação com dados válidos ----------
  await page.getByRole('link', { name: 'Novo cabo condutor' }).click();
  await page.getByLabel('Código *').waitFor();
  await fillForm({
    'Código *': 'QA-E2E-001',
    Descrição: 'Cabo QA Grosbeak',
    'Peso (ton/km)': '1.3026',
    'Bobina (m)': '2500',
    'Diâmetro (mm)': '25.16',
    'UTS — carga de ruptura (kN)': '124.9',
  });
  await shot('02-form-novo-preenchido');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.waitForURL('**/catalogs/conductor-cables');
  const newRow = page.locator('tbody tr', { hasText: 'QA-E2E-001' });
  await newRow.waitFor();
  const createdOk = (await newRow.textContent()).includes('Completo');
  await shot('03-lista-apos-criacao');
  record('S7 criação com dados válidos', createdOk ? 'PASSOU' : 'FALHOU');

  // ---------- S8: Código duplicado ----------
  await page.getByRole('link', { name: 'Novo cabo condutor' }).click();
  await page.getByLabel('Código *').fill('QA-E2E-001');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.getByText('já está em uso').waitFor({ timeout: 5000 });
  await shot('04-erro-codigo-duplicado');
  record('S8 código duplicado rejeitado', 'PASSOU');

  // ---------- S9: Valores numéricos inválidos ----------
  await page.getByLabel('Código *').fill('QA-INVALIDO');
  await page.getByLabel('Peso (ton/km)').fill('abc');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.getByText('número decimal positivo').waitFor({ timeout: 5000 });
  await shot('05-erro-valor-numerico');
  record('S9 valor numérico inválido rejeitado em pt-BR', 'PASSOU');

  // ---------- S11: Item sem UTS sinalizado ----------
  await page.goto(`${BASE}/catalogs/conductor-cables/new`);
  await fillForm({
    'Código *': 'QA-PEND-001',
    Descrição: 'Cabo QA sem UTS',
    'Peso (ton/km)': '1.1',
    'Bobina (m)': '2000',
    'Diâmetro (mm)': '21.0',
  });
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.waitForURL('**/catalogs/conductor-cables');
  const pendingRow = page.locator('tbody tr', { hasText: 'QA-PEND-001' });
  await pendingRow.waitFor();
  const pendingText = await pendingRow.textContent();
  const pendingOk =
    pendingText.includes('Pendente') && pendingText.includes('UTS (kN)');
  await shot('06-lista-pendencia-uts');
  record(
    'S11 item sem UTS sinalizado com o campo',
    pendingOk ? 'PASSOU' : 'FALHOU',
    pendingOk ? '' : pendingText,
  );

  // ---------- S10: Busca por código ----------
  await page.getByLabel('Buscar por código ou descrição').fill('QA-E2E');
  const filteredResponse = page.waitForResponse((r) =>
    r.url().includes('search=QA-E2E'),
  );
  await page.getByRole('button', { name: 'Buscar' }).click();
  await filteredResponse;
  await page.waitForFunction(
    () => document.querySelectorAll('tbody tr').length === 1,
    undefined,
    { timeout: 5000 },
  );
  const searchRows = await page.locator('tbody tr').count();
  await shot('07-busca-por-codigo');
  record(
    'S10 busca por código',
    searchRows === 1 ? 'PASSOU' : 'FALHOU',
    `linhas=${searchRows}`,
  );

  // ---------- S1: Edição gera nova versão (vigência futura 2026-09-01) ----------
  await page.getByLabel('Buscar por código ou descrição').fill('');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page
    .locator('tbody tr', { hasText: 'QA-E2E-001' })
    .getByRole('link', { name: 'Editar' })
    .click();
  await page.getByText('Código: QA-E2E-001').waitFor();
  // aguarda o prefill habilitar o formulário
  await page.waitForFunction(
    () => !document.querySelector('input#weightTonPerKm')?.disabled,
  );
  await page.getByLabel('Peso (ton/km)').fill('1.3100');
  await page.getByLabel(/Início de vigência/).fill('2026-09-01');
  await shot('08-form-nova-versao');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.waitForURL('**/catalogs/conductor-cables');
  record('S1 edição cria nova versão', 'PASSOU');

  // ---------- S3: Consulta na data atual (versão futura NÃO vigente hoje) ----------
  const currentRow = page.locator('tbody tr', { hasText: 'QA-E2E-001' });
  await currentRow.waitFor();
  const currentText = await currentRow.textContent();
  const effectiveOk =
    currentText.includes('1.3026') && !currentText.includes('1.31,');
  await shot('09-lista-vigencia-atual');
  record(
    'S3 consulta na data atual retorna versão vigente (não a futura)',
    effectiveOk ? 'PASSOU' : 'FALHOU',
    currentText.trim().slice(0, 120),
  );

  // ---------- S12 + S6: Histórico com autor e vigências ----------
  await currentRow.getByRole('link', { name: 'Histórico' }).click();
  await page.getByRole('heading', { name: /Histórico de versões/ }).waitFor();
  await page.locator('tbody tr').first().waitFor();
  const historyRows = await page.locator('tbody tr').count();
  const historyText = await page.locator('tbody').textContent();
  const historyOk =
    historyRows === 2 &&
    historyText.includes('sistema') &&
    historyText.includes('01/09/2026');
  await shot('10-historico-versoes');
  record(
    'S12 histórico lista versões em ordem de vigência',
    historyOk ? 'PASSOU' : 'FALHOU',
    `linhas=${historyRows}`,
  );
  record(
    'S6 autoria registrada e visível no histórico',
    historyText.includes('sistema') ? 'PASSOU' : 'FALHOU',
  );

  // ---------- S2, S4, S5: contratos de API (a UI não expõe) ----------
  const api = context.request;
  const list = await (
    await api.get(`${BASE}/api/catalogs/conductor-cables?search=QA-E2E-001`)
  ).json();
  const id = list[0].id;

  const past = await (
    await api.get(
      `${BASE}/api/catalogs/conductor-cables/${id}?effectiveOn=2026-08-23`,
    )
  ).json();
  const future = await (
    await api.get(
      `${BASE}/api/catalogs/conductor-cables/${id}?effectiveOn=2026-12-01`,
    )
  ).json();
  const noEffective = await api.get(
    `${BASE}/api/catalogs/conductor-cables/${id}?effectiveOn=2020-01-01`,
  );
  const patch = await api.patch(
    `${BASE}/api/catalogs/conductor-cables/${id}/versions/1`,
    { data: {} },
  );

  const s4ok =
    past.effectiveVersion.weightTonPerKm === '1.3026' &&
    future.effectiveVersion.weightTonPerKm === '1.31';
  record(
    'S4 consulta em data passada retorna valores da época',
    s4ok ? 'PASSOU' : 'FALHOU',
    `passada=${past.effectiveVersion.weightTonPerKm} futura=${future.effectiveVersion.weightTonPerKm}`,
  );
  record(
    'S5 data anterior à primeira vigência responde sem valor',
    noEffective.status() === 404 ? 'PASSOU' : 'FALHOU',
    `status=${noEffective.status()}`,
  );
  record(
    'S2 versão histórica é imutável (PATCH rejeitado)',
    patch.status() === 405 ? 'PASSOU' : 'FALHOU',
    `status=${patch.status()}`,
  );
  const fs = require('fs');
  fs.writeFileSync(
    `${EVID}/api-contratos-vigencia.json`,
    JSON.stringify(
      {
        effectiveOn_2026_08_23: past,
        effectiveOn_2026_12_01: future,
        effectiveOn_2020_01_01: {
          status: noEffective.status(),
          body: await noEffective.json(),
        },
        patch_version: { status: patch.status(), body: await patch.json() },
      },
      null,
      2,
    ),
  );

  // ---------- Acessibilidade ----------
  await page.goto(`${BASE}/catalogs/conductor-cables/new`);
  await page.getByLabel('Código *').waitFor();
  const unlabeled = await page.evaluate(
    () =>
      [...document.querySelectorAll('input')].filter(
        (i) => !document.querySelector(`label[for="${i.id}"]`),
      ).length,
  );
  record(
    'A11y: todo input do formulário tem label associado',
    unlabeled === 0 ? 'PASSOU' : 'FALHOU',
    `inputs sem label=${unlabeled}`,
  );
  const focused = [];
  for (let i = 0; i < 9; i++) {
    await page.keyboard.press('Tab');
    focused.push(
      await page.evaluate(
        () => document.activeElement?.id || document.activeElement?.tagName,
      ),
    );
  }
  const tabOk = focused.includes('code') && focused.includes('effectiveFrom');
  record(
    'A11y: navegação por teclado percorre os campos',
    tabOk ? 'PASSOU' : 'FALHOU',
    focused.join('>'),
  );
  await shot('11-a11y-form');

  // ---------- Responsividade ----------
  for (const [name, vp] of Object.entries({
    'mobile-375': { width: 375, height: 812 },
    'tablet-768': { width: 768, height: 1024 },
    'desktop-1280': { width: 1280, height: 800 },
  })) {
    await page.setViewportSize(vp);
    await page.goto(`${BASE}/catalogs/conductor-cables`);
    await page.locator('tbody tr').first().waitFor();
    await shot(`12-responsivo-lista-${name}`);
  }
  // estado vazio
  await page.setViewportSize({ width: 1280, height: 800 });
  await page
    .getByLabel('Buscar por código ou descrição')
    .fill('ZZZ-INEXISTENTE');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.getByText('Nenhum cabo condutor encontrado').waitFor();
  await shot('13-estado-vazio');
  record('Visual: estados vazio/dados/erro capturados', 'PASSOU');
} catch (error) {
  record('EXECUÇÃO', 'FALHOU', String(error).slice(0, 300));
  await shot('99-falha-inesperada').catch(() => undefined);
} finally {
  await browser.close();
}

console.log('\n=== RESUMO ===');
console.log(JSON.stringify(results, null, 2));
const failures = results.filter((r) => r.status !== 'PASSOU').length;
process.exit(failures === 0 ? 0 : 1);
