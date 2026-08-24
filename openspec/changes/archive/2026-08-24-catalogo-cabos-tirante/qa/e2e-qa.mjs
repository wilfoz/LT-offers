// Script E2E do QA da change catalogo-cabos-tirante.
// Executa os cenários do spec catalogos/cabos-tirante contra web (4200) +
// api (3000) reais, mais o smoke dos catálogos refitados (condutores e
// guarda), e salva evidências em qa/evidences/. Uso: node e2e-qa.mjs
import { createRequire } from 'node:module';

const require = createRequire(
  'C:/Users/wilwa/Desktop/Developer/offer/.claude/skills/playwright-skill/run.js',
);
const { chromium } = require('playwright');

const BASE = 'http://localhost:4200';
const EVID =
  'C:/Users/wilwa/Desktop/Developer/offer/openspec/changes/catalogo-cabos-tirante/qa/evidences';

const resultados = [];
const registrar = (cenario, status, detalhe = '') => {
  resultados.push({ cenario, status, detalhe });
  console.log(`${status === 'PASSOU' ? '✓' : '✗'} ${cenario} ${detalhe}`);
};

const navegador = await chromium.launch();
const contexto = await navegador.newContext({
  viewport: { width: 1280, height: 800 },
});
const page = await contexto.newPage();
const foto = (nome) =>
  page.screenshot({ path: `${EVID}/${nome}.png`, fullPage: true });

async function preencher(campos) {
  for (const [rotulo, valor] of Object.entries(campos)) {
    await page.getByLabel(rotulo).fill(valor);
  }
}

try {
  // ---------- Estado inicial (catálogo vazio) ----------
  await page.goto(`${BASE}/catalogs/guy-wires`);
  await page
    .getByRole('heading', { name: 'Catálogo de cabos de tirante' })
    .waitFor();
  await foto('01-lista-vazia');

  // ---------- S1: Criação com dados válidos ----------
  await page.getByRole('link', { name: 'Novo cabo de tirante' }).click();
  await page.getByLabel('Código *').waitFor();
  await preencher({
    'Código *': 'QA-CT-HS',
    Descrição: 'Cordoalha HS 5/16',
    'Peso (ton/km)': '0.31',
    'Bobina (m)': '1500',
    'Diâmetro (mm)': '7.9',
    'UTS — carga de ruptura (kN)': '48.2',
    'Classe de galvanização': 'B',
    'Grau de resistência': 'HS',
    'Número de fios': '7',
  });
  await foto('02-form-preenchido');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.waitForURL('**/catalogs/guy-wires');
  const linhaNova = page.locator('tbody tr', { hasText: 'QA-CT-HS' });
  await linhaNova.waitFor();
  const textoNova = await linhaNova.textContent();
  await foto('03-lista-apos-criacao');
  registrar(
    'S1 criação com dados válidos exibida na listagem',
    textoNova.includes('Completo') ? 'PASSOU' : 'FALHOU',
    textoNova.includes('Completo') ? '' : textoNova,
  );

  // ---------- S2: Código duplicado ----------
  await page.getByRole('link', { name: 'Novo cabo de tirante' }).click();
  await page.getByLabel('Código *').fill('QA-CT-HS');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.getByText('já está em uso').waitFor({ timeout: 5000 });
  await foto('04-erro-codigo-duplicado');
  registrar('S2 código duplicado rejeitado', 'PASSOU');

  // ---------- S3: Valores numéricos inválidos ----------
  await page.getByLabel('Código *').fill('QA-INVALIDO');
  await page.getByLabel('Peso (ton/km)').fill('abc');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.getByText('número decimal positivo').waitFor({ timeout: 5000 });
  await foto('05-erro-valor-numerico');
  registrar('S3 valor numérico inválido rejeitado em pt-BR', 'PASSOU');

  // ---------- S4: Número de fios não inteiro ----------
  await page.goto(`${BASE}/catalogs/guy-wires/new`);
  await preencher({ 'Código *': 'QA-FRAC', 'Número de fios': '2.5' });
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.getByText('número inteiro positivo').waitFor({ timeout: 5000 });
  await foto('06-erro-fios-fracionario');
  registrar('S4 número de fios não inteiro rejeitado em pt-BR', 'PASSOU');

  // ---------- S6: Item sem grau de resistência sinalizado ----------
  await page.goto(`${BASE}/catalogs/guy-wires/new`);
  await preencher({
    'Código *': 'QA-CT-PEND',
    'Peso (ton/km)': '0.25',
    'Bobina (m)': '1000',
    'Diâmetro (mm)': '6.4',
    'UTS — carga de ruptura (kN)': '35',
    'Classe de galvanização': 'A',
    'Número de fios': '7',
  });
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.waitForURL('**/catalogs/guy-wires');
  const linhaPend = page.locator('tbody tr', { hasText: 'QA-CT-PEND' });
  await linhaPend.waitFor();
  const textoPend = await linhaPend.textContent();
  const pendOk =
    textoPend.includes('Pendente') && textoPend.includes('grau de resistência');
  await foto('07-pendencia-grau-resistencia');
  registrar(
    'S6 item sem grau de resistência sinalizado com o campo',
    pendOk ? 'PASSOU' : 'FALHOU',
    pendOk ? '' : textoPend,
  );

  // ---------- S5: Busca por código ----------
  await page.getByLabel('Buscar por código ou descrição').fill('QA-CT-HS');
  const respostaBusca = page.waitForResponse((r) =>
    r.url().includes('search=QA-CT-HS'),
  );
  await page.getByRole('button', { name: 'Buscar' }).click();
  await respostaBusca;
  await page.waitForFunction(
    () => document.querySelectorAll('tbody tr').length === 1,
    undefined,
    { timeout: 5000 },
  );
  const linhasBusca = await page.locator('tbody tr').count();
  await foto('08-busca-por-codigo');
  registrar(
    'S5 busca por código mostra os valores da versão vigente',
    linhasBusca === 1 ? 'PASSOU' : 'FALHOU',
    `linhas=${linhasBusca}`,
  );

  // ---------- S7: Histórico após edição ----------
  await page.getByLabel('Buscar por código ou descrição').fill('');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page
    .locator('tbody tr', { hasText: 'QA-CT-HS' })
    .getByRole('link', { name: 'Editar' })
    .click();
  await page.getByText('Código: QA-CT-HS').waitFor();
  await page.waitForFunction(
    () => !document.querySelector('input#weightTonPerKm')?.disabled,
  );
  await page.getByLabel('Classe de galvanização').fill('A');
  await page.getByLabel(/Início de vigência/).fill('2026-11-01');
  await foto('09-form-nova-versao');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.waitForURL('**/catalogs/guy-wires');
  await page
    .locator('tbody tr', { hasText: 'QA-CT-HS' })
    .getByRole('link', { name: 'Histórico' })
    .click();
  await page.getByRole('heading', { name: /Histórico de versões/ }).waitFor();
  await page.locator('tbody tr').first().waitFor();
  const linhasHist = await page.locator('tbody tr').count();
  const textoHist = await page.locator('tbody').textContent();
  const histOk =
    linhasHist === 2 &&
    textoHist.includes('sistema') &&
    textoHist.includes('01/11/2026') &&
    textoHist.includes('HS');
  await foto('10-historico-versoes');
  registrar(
    'S7 histórico lista versões com autor, vigência e valores da época',
    histOk ? 'PASSOU' : 'FALHOU',
    `linhas=${linhasHist}`,
  );

  // ---------- Contratos de API que a UI não expõe ----------
  const api = contexto.request;
  const lista = await (
    await api.get(`${BASE}/api/catalogs/guy-wires?search=QA-CT-HS`)
  ).json();
  const id = lista[0].id;
  const passada = await (
    await api.get(`${BASE}/api/catalogs/guy-wires/${id}?effectiveOn=2026-09-01`)
  ).json();
  const semVigencia = await api.get(
    `${BASE}/api/catalogs/guy-wires/${id}?effectiveOn=2020-01-01`,
  );
  const patch = await api.patch(
    `${BASE}/api/catalogs/guy-wires/${id}/versions/1`,
    { data: {} },
  );
  registrar(
    'API: consulta em data passada retorna valores da época',
    passada.effectiveVersion.galvanizationClass === 'B' ? 'PASSOU' : 'FALHOU',
    `galv=${passada.effectiveVersion.galvanizationClass}`,
  );
  registrar(
    'API: data anterior à primeira vigência responde 404',
    semVigencia.status() === 404 ? 'PASSOU' : 'FALHOU',
    `status=${semVigencia.status()}`,
  );
  registrar(
    'API: versão imutável (PATCH 405)',
    patch.status() === 405 ? 'PASSOU' : 'FALHOU',
    `status=${patch.status()}`,
  );
  const fs = require('fs');
  fs.writeFileSync(
    `${EVID}/api-contratos.json`,
    JSON.stringify(
      {
        effectiveOn_2026_09_01: passada,
        effectiveOn_2020_01_01: {
          status: semVigencia.status(),
          corpo: await semVigencia.json(),
        },
        patch_versao: { status: patch.status(), corpo: await patch.json() },
      },
      null,
      2,
    ),
  );

  // ---------- Smoke dos catálogos refitados (task 6.1) ----------
  await page.goto(`${BASE}/catalogs/conductor-cables`);
  await page.locator('tbody tr').first().waitFor({ timeout: 10000 });
  await foto('11-smoke-condutores');
  registrar('Smoke refit: listagem de condutores com dados', 'PASSOU');
  await page.goto(`${BASE}/catalogs/ground-wires`);
  await page.locator('tbody tr').first().waitFor({ timeout: 10000 });
  await page.getByLabel('Tipo').selectOption('OPGW');
  await page.waitForFunction(
    () =>
      document.body.textContent.includes('QA-OPGW-48') &&
      !document.body.textContent.includes('QA-CG-EHS'),
    undefined,
    { timeout: 10000 },
  );
  await foto('12-smoke-guarda-filtro');
  registrar('Smoke refit: filtro por tipo dos cabos de guarda', 'PASSOU');

  // ---------- Acessibilidade ----------
  await page.goto(`${BASE}/catalogs/guy-wires/new`);
  await page.getByLabel('Código *').waitFor();
  const semLabel = await page.evaluate(
    () =>
      [...document.querySelectorAll('input, select')].filter(
        (i) => !document.querySelector(`label[for="${i.id}"]`),
      ).length,
  );
  registrar(
    'A11y: todo campo do formulário tem label associado',
    semLabel === 0 ? 'PASSOU' : 'FALHOU',
    `campos sem label=${semLabel}`,
  );
  const focados = [];
  // 3 links de navegação precedem o formulário; 15 Tabs cobrem até a vigência
  for (let i = 0; i < 15; i++) {
    await page.keyboard.press('Tab');
    focados.push(
      await page.evaluate(
        () => document.activeElement?.id || document.activeElement?.tagName,
      ),
    );
  }
  const tabOk =
    focados.includes('code') &&
    focados.includes('wireCount') &&
    focados.includes('effectiveFrom');
  registrar(
    'A11y: navegação por teclado percorre os campos',
    tabOk ? 'PASSOU' : 'FALHOU',
    focados.join('>'),
  );
  await foto('13-a11y-form');

  // ---------- Responsividade ----------
  for (const [nome, vp] of Object.entries({
    'mobile-375': { width: 375, height: 812 },
    'tablet-768': { width: 768, height: 1024 },
    'desktop-1280': { width: 1280, height: 800 },
  })) {
    await page.setViewportSize(vp);
    await page.goto(`${BASE}/catalogs/guy-wires`);
    await page.locator('tbody tr').first().waitFor();
    await foto(`14-responsivo-lista-${nome}`);
  }
  // estado vazio
  await page.setViewportSize({ width: 1280, height: 800 });
  await page
    .getByLabel('Buscar por código ou descrição')
    .fill('ZZZ-INEXISTENTE');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.getByText('Nenhum cabo de tirante encontrado').waitFor();
  await foto('15-estado-vazio');
  registrar('Visual: estados vazio/dados/erro capturados', 'PASSOU');
} catch (erro) {
  registrar('EXECUÇÃO', 'FALHOU', String(erro).slice(0, 300));
  await foto('99-falha-inesperada').catch(() => undefined);
} finally {
  await navegador.close();
}

console.log('\n=== RESUMO ===');
console.log(JSON.stringify(resultados, null, 2));
const falhas = resultados.filter((r) => r.status !== 'PASSOU').length;
process.exit(falhas === 0 ? 0 : 1);
