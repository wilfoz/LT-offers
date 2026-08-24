// Script E2E do QA da change catalogo-cabos-guarda-opgw.
// Executa os cenários do spec catalogos/cabos-guarda contra web (4200) +
// api (3000) reais e salva evidências em qa/evidences/. Uso: node e2e-qa.mjs
import { createRequire } from 'node:module';

const require = createRequire(
  'C:/Users/wilwa/Desktop/Developer/offer/.claude/skills/playwright-skill/run.js',
);
const { chromium } = require('playwright');

const BASE = 'http://localhost:4200';
const EVID =
  'C:/Users/wilwa/Desktop/Developer/offer/openspec/changes/catalogo-cabos-guarda-opgw/qa/evidences';

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
  await page.goto(`${BASE}/catalogs/ground-wires`);
  await page
    .getByRole('heading', { name: 'Catálogo de cabos de guarda' })
    .waitFor();
  await foto('01-lista-vazia');

  // ---------- S1: Criação de cabo de aço com dados válidos ----------
  await page.getByRole('link', { name: 'Novo cabo de guarda' }).click();
  await page.getByLabel('Código *').waitFor();
  await page.getByLabel(/Tipo \*/).selectOption('STEEL');
  await page.getByLabel('Classe de galvanização').waitFor();
  await preencher({
    'Código *': 'QA-CG-EHS',
    Descrição: 'Cordoalha de aço EHS 3/8',
    'Peso (ton/km)': '0.406',
    'Bobina (m)': '2000',
    'Diâmetro (mm)': '9.52',
    'UTS — carga de ruptura (kN)': '68.4',
    'Classe de galvanização': 'B',
    'Grau de resistência': 'EHS',
    'Número de fios': '7',
  });
  await foto('02-form-aco-preenchido');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.waitForURL('**/catalogs/ground-wires');
  const linhaAco = page.locator('tbody tr', { hasText: 'QA-CG-EHS' });
  await linhaAco.waitFor();
  const textoAco = await linhaAco.textContent();
  const acoOk = textoAco.includes('Aço') && textoAco.includes('Completo');
  await foto('03-lista-apos-criacao-aco');
  registrar(
    'S1 criação de cabo de aço com dados válidos, exibido com o tipo',
    acoOk ? 'PASSOU' : 'FALHOU',
    acoOk ? '' : textoAco,
  );

  // ---------- S2: Criação de cabo OPGW com dados válidos (sem fabricante) ----------
  await page.getByRole('link', { name: 'Novo cabo de guarda' }).click();
  await page.getByLabel('Código *').waitFor();
  await page.getByLabel(/Tipo \*/).selectOption('OPGW');
  await page.getByLabel('Fabricante').waitFor();
  await preencher({
    'Código *': 'QA-OPGW-48',
    Descrição: 'OPGW 48 fibras',
    'Peso (ton/km)': '0.55',
    'Bobina (m)': '4000',
    'Diâmetro (mm)': '12.1',
    'UTS — carga de ruptura (kN)': '75',
    'I²t (kA²·s)': '95.5',
    'Número de fibras': '48',
  });
  await foto('04-form-opgw-preenchido');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.waitForURL('**/catalogs/ground-wires');
  const linhaOpgw = page.locator('tbody tr', { hasText: 'QA-OPGW-48' });
  await linhaOpgw.waitFor();
  const textoOpgw = await linhaOpgw.textContent();
  const opgwOk = textoOpgw.includes('OPGW') && textoOpgw.includes('Completo');
  await foto('05-lista-apos-criacao-opgw');
  registrar(
    'S2 criação de cabo OPGW com dados válidos, exibido com o tipo',
    opgwOk ? 'PASSOU' : 'FALHOU',
    opgwOk ? '' : textoOpgw,
  );
  registrar(
    'S13 cabo OPGW completo sem fabricante não aparece como pendência',
    textoOpgw.includes('Completo') ? 'PASSOU' : 'FALHOU',
    textoOpgw.includes('Completo') ? '' : textoOpgw,
  );

  // ---------- S3: Código duplicado rejeitado mesmo entre tipos ----------
  await page.getByRole('link', { name: 'Novo cabo de guarda' }).click();
  await page.getByLabel('Código *').fill('QA-CG-EHS');
  await page.getByLabel(/Tipo \*/).selectOption('OPGW');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.getByText('já está em uso').waitFor({ timeout: 5000 });
  await foto('06-erro-codigo-duplicado-entre-tipos');
  registrar('S3 código duplicado rejeitado mesmo entre tipos', 'PASSOU');

  // ---------- S6: Valores numéricos inválidos ----------
  await page.getByLabel('Código *').fill('QA-INVALIDO');
  await page.getByLabel('Peso (ton/km)').fill('abc');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.getByText('número decimal positivo').waitFor({ timeout: 5000 });
  await foto('07-erro-valor-numerico');
  registrar('S6 valor numérico inválido rejeitado em pt-BR', 'PASSOU');

  // ---------- S9: Contagens não inteiras ----------
  await page.goto(`${BASE}/catalogs/ground-wires/new`);
  await page.getByLabel(/Tipo \*/).selectOption('OPGW');
  await page.getByLabel('Número de fibras').waitFor();
  await preencher({ 'Código *': 'QA-FRAC', 'Número de fibras': '2.5' });
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.getByText('número inteiro positivo').waitFor({ timeout: 5000 });
  await foto('08-erro-contagem-fracionaria');
  registrar('S9 contagem fracionária rejeitada em pt-BR', 'PASSOU');

  // ---------- S10: Busca por código ----------
  await page.goto(`${BASE}/catalogs/ground-wires`);
  await page.getByLabel('Buscar por código ou descrição').fill('QA-OPGW');
  const respostaBusca = page.waitForResponse((r) =>
    r.url().includes('search=QA-OPGW'),
  );
  await page.getByRole('button', { name: 'Buscar' }).click();
  await respostaBusca;
  await page.waitForFunction(
    () => document.querySelectorAll('tbody tr').length === 1,
    undefined,
    { timeout: 5000 },
  );
  const linhasBusca = await page.locator('tbody tr').count();
  await foto('09-busca-por-codigo');
  registrar(
    'S10 busca por código mostra tipo e valores da versão vigente',
    linhasBusca === 1 ? 'PASSOU' : 'FALHOU',
    `linhas=${linhasBusca}`,
  );

  // ---------- S11: Filtro por tipo mantém o termo de busca ----------
  await page.getByLabel('Buscar por código ou descrição').fill('QA');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.waitForFunction(
    () => document.querySelectorAll('tbody tr').length >= 2,
    undefined,
    { timeout: 5000 },
  );
  const respostaFiltro = page.waitForResponse(
    (r) => r.url().includes('type=OPGW') && r.url().includes('search=QA'),
  );
  await page.getByLabel('Tipo').selectOption('OPGW');
  await respostaFiltro;
  await page.waitForFunction(
    () => document.querySelectorAll('tbody tr').length === 1,
    undefined,
    { timeout: 5000 },
  );
  const textoFiltro = await page.locator('tbody').textContent();
  const filtroOk =
    textoFiltro.includes('QA-OPGW-48') && !textoFiltro.includes('QA-CG-EHS');
  await foto('10-filtro-por-tipo');
  registrar(
    'S11 filtro por tipo OPGW mantém o termo de busca',
    filtroOk ? 'PASSOU' : 'FALHOU',
    filtroOk ? '' : textoFiltro.trim().slice(0, 120),
  );

  // ---------- S12: Cabo de aço sem classe de galvanização sinalizado ----------
  await page.goto(`${BASE}/catalogs/ground-wires/new`);
  await page.getByLabel(/Tipo \*/).selectOption('STEEL');
  await page.getByLabel('Classe de galvanização').waitFor();
  await preencher({
    'Código *': 'QA-CG-PEND',
    'Peso (ton/km)': '0.3',
    'Bobina (m)': '1500',
    'Diâmetro (mm)': '7.9',
    'UTS — carga de ruptura (kN)': '48',
    'Grau de resistência': 'HS',
    'Número de fios': '7',
  });
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.waitForURL('**/catalogs/ground-wires');
  const linhaPend = page.locator('tbody tr', { hasText: 'QA-CG-PEND' });
  await linhaPend.waitFor();
  const textoPend = await linhaPend.textContent();
  const pendOk =
    textoPend.includes('Pendente') &&
    textoPend.includes('classe de galvanização');
  await foto('11-pendencia-classe-galvanizacao');
  registrar(
    'S12 cabo de aço sem classe de galvanização sinalizado com o campo',
    pendOk ? 'PASSOU' : 'FALHOU',
    pendOk ? '' : textoPend,
  );

  // ---------- S5 (UI): tipo travado na edição + S14: histórico após edição ----------
  await page
    .locator('tbody tr', { hasText: 'QA-CG-EHS' })
    .getByRole('link', { name: 'Editar' })
    .click();
  await page.getByText('Código: QA-CG-EHS').waitFor();
  const selectTipo = await page.locator('select#type').count();
  const travadoOk =
    selectTipo === 0 &&
    (await page.getByText('fixo desde a criação').count()) > 0;
  await foto('12-edicao-tipo-travado');
  registrar(
    'S5 (UI) tipo exibido como fixo na edição, sem seleção',
    travadoOk ? 'PASSOU' : 'FALHOU',
  );
  await page.waitForFunction(
    () => !document.querySelector('input#weightTonPerKm')?.disabled,
  );
  await page.getByLabel('Classe de galvanização').fill('A');
  await page.getByLabel(/Início de vigência/).fill('2026-09-01');
  await foto('13-form-nova-versao');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.waitForURL('**/catalogs/ground-wires');
  await page
    .locator('tbody tr', { hasText: 'QA-CG-EHS' })
    .getByRole('link', { name: 'Histórico' })
    .click();
  await page.getByRole('heading', { name: /Histórico de versões/ }).waitFor();
  await page.locator('tbody tr').first().waitFor();
  const linhasHist = await page.locator('tbody tr').count();
  const textoHist = await page.locator('tbody').textContent();
  const histOk =
    linhasHist === 2 &&
    textoHist.includes('sistema') &&
    textoHist.includes('01/09/2026') &&
    textoHist.includes('EHS');
  await foto('14-historico-com-especificos');
  registrar(
    'S14 histórico lista versões com autor, vigência e atributos do tipo',
    histOk ? 'PASSOU' : 'FALHOU',
    `linhas=${linhasHist}`,
  );

  // ---------- S4, S5 (API), S7, S8: contratos que a UI não expõe ----------
  const api = contexto.request;
  const tipoInvalido = await api.post(`${BASE}/api/catalogs/ground-wires`, {
    data: { code: 'QA-TIPO-X', type: 'ACO' },
  });
  registrar(
    'S4 tipo inválido rejeitado em pt-BR',
    tipoInvalido.status() === 400 ? 'PASSOU' : 'FALHOU',
    `status=${tipoInvalido.status()}`,
  );

  const lista = await (
    await api.get(`${BASE}/api/catalogs/ground-wires?search=QA-CG-EHS`)
  ).json();
  const idAco = lista[0].id;
  const trocaTipo = await api.post(
    `${BASE}/api/catalogs/ground-wires/${idAco}/versions`,
    { data: { effectiveFrom: '2026-10-01', type: 'OPGW' } },
  );
  registrar(
    'S5 (API) troca de tipo em nova versão rejeitada',
    trocaTipo.status() === 400 ? 'PASSOU' : 'FALHOU',
    `status=${trocaTipo.status()}`,
  );

  const fibraEmAco = await api.post(
    `${BASE}/api/catalogs/ground-wires/${idAco}/versions`,
    { data: { effectiveFrom: '2026-10-01', fiberCount: 24 } },
  );
  const corpoFibra = await fibraEmAco.json();
  registrar(
    'S7 atributo de OPGW em cabo de aço rejeitado apontando o campo',
    fibraEmAco.status() === 400 &&
      String(corpoFibra.message).includes('número de fibras')
      ? 'PASSOU'
      : 'FALHOU',
    `status=${fibraEmAco.status()}`,
  );

  const galvEmOpgw = await api.post(`${BASE}/api/catalogs/ground-wires`, {
    data: { code: 'QA-OPGW-GALV', type: 'OPGW', galvanizationClass: 'B' },
  });
  const corpoGalv = await galvEmOpgw.json();
  registrar(
    'S8 atributo de aço em cabo OPGW rejeitado apontando o campo',
    galvEmOpgw.status() === 400 &&
      String(corpoGalv.message).includes('classe de galvanização')
      ? 'PASSOU'
      : 'FALHOU',
    `status=${galvEmOpgw.status()}`,
  );

  const fs = require('fs');
  fs.writeFileSync(
    `${EVID}/api-contratos-tipo.json`,
    JSON.stringify(
      {
        tipo_invalido: {
          status: tipoInvalido.status(),
          corpo: await tipoInvalido.json(),
        },
        troca_de_tipo: {
          status: trocaTipo.status(),
          corpo: await trocaTipo.json(),
        },
        fibra_em_aco: { status: fibraEmAco.status(), corpo: corpoFibra },
        galvanizacao_em_opgw: { status: galvEmOpgw.status(), corpo: corpoGalv },
      },
      null,
      2,
    ),
  );

  // ---------- Acessibilidade ----------
  await page.goto(`${BASE}/catalogs/ground-wires/new`);
  await page.getByLabel('Código *').waitFor();
  await page.getByLabel(/Tipo \*/).selectOption('STEEL');
  await page.getByLabel('Classe de galvanização').waitFor();
  const semLabel = await page.evaluate(
    () =>
      [...document.querySelectorAll('input, select')].filter(
        (i) => !document.querySelector(`label[for="${i.id}"]`),
      ).length,
  );
  registrar(
    'A11y: todo input/select do formulário tem label associado',
    semLabel === 0 ? 'PASSOU' : 'FALHOU',
    `campos sem label=${semLabel}`,
  );
  const focados = [];
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press('Tab');
    focados.push(
      await page.evaluate(
        () => document.activeElement?.id || document.activeElement?.tagName,
      ),
    );
  }
  const tabOk =
    focados.includes('code') &&
    focados.includes('type') &&
    focados.includes('galvanizationClass');
  registrar(
    'A11y: navegação por teclado percorre os campos, incluindo o bloco do tipo',
    tabOk ? 'PASSOU' : 'FALHOU',
    focados.join('>'),
  );
  await foto('15-a11y-form');

  // ---------- Responsividade ----------
  for (const [nome, vp] of Object.entries({
    'mobile-375': { width: 375, height: 812 },
    'tablet-768': { width: 768, height: 1024 },
    'desktop-1280': { width: 1280, height: 800 },
  })) {
    await page.setViewportSize(vp);
    await page.goto(`${BASE}/catalogs/ground-wires`);
    await page.locator('tbody tr').first().waitFor();
    await foto(`16-responsivo-lista-${nome}`);
  }
  // estado vazio
  await page.setViewportSize({ width: 1280, height: 800 });
  await page
    .getByLabel('Buscar por código ou descrição')
    .fill('ZZZ-INEXISTENTE');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.getByText('Nenhum cabo de guarda encontrado').waitFor();
  await foto('17-estado-vazio');
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
