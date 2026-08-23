// Script E2E do QA da change piloto-catalogo-cabos.
// Executa os cenários dos specs contra web (4200) + api (3000) reais e salva
// evidências em qa/evidences/. Uso: node e2e-qa.mjs
import { createRequire } from 'node:module';

const require = createRequire(
  'C:/Users/wilwa/Desktop/Developer/offer/.claude/skills/playwright-skill/run.js',
);
const { chromium } = require('playwright');

const BASE = 'http://localhost:4200';
const EVID =
  'C:/Users/wilwa/Desktop/Developer/offer/openspec/changes/piloto-catalogo-cabos/qa/evidences';

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
const foto = (nome) => page.screenshot({ path: `${EVID}/${nome}.png`, fullPage: true });

async function preencherFormulario(campos) {
  for (const [rotulo, valor] of Object.entries(campos)) {
    await page.getByLabel(rotulo).fill(valor);
  }
}

try {
  // ---------- Estado inicial ----------
  await page.goto(`${BASE}/catalogos/cabos-condutores`);
  await page.getByRole('heading', { name: 'Catálogo de cabos condutores' }).waitFor();
  await foto('01-lista-inicial');

  // ---------- S7: Criação com dados válidos ----------
  await page.getByRole('link', { name: 'Novo cabo condutor' }).click();
  await page.getByLabel('Código *').waitFor();
  await preencherFormulario({
    'Código *': 'QA-E2E-001',
    Descrição: 'Cabo QA Grosbeak',
    'Peso (ton/km)': '1.3026',
    'Bobina (m)': '2500',
    'Diâmetro (mm)': '25.16',
    'UTS — carga de ruptura (kN)': '124.9',
  });
  await foto('02-form-novo-preenchido');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.waitForURL('**/catalogos/cabos-condutores');
  const linhaNova = page.locator('tbody tr', { hasText: 'QA-E2E-001' });
  await linhaNova.waitFor();
  const criacaoOk = (await linhaNova.textContent()).includes('Completo');
  await foto('03-lista-apos-criacao');
  registrar('S7 criação com dados válidos', criacaoOk ? 'PASSOU' : 'FALHOU');

  // ---------- S8: Código duplicado ----------
  await page.getByRole('link', { name: 'Novo cabo condutor' }).click();
  await page.getByLabel('Código *').fill('QA-E2E-001');
  await page.getByRole('button', { name: 'Salvar' }).click();
  const msgDup = page.getByText('já está em uso');
  await msgDup.waitFor({ timeout: 5000 });
  await foto('04-erro-codigo-duplicado');
  registrar('S8 código duplicado rejeitado', 'PASSOU');

  // ---------- S9: Valores numéricos inválidos ----------
  await page.getByLabel('Código *').fill('QA-INVALIDO');
  await page.getByLabel('Peso (ton/km)').fill('abc');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.getByText('número decimal positivo').waitFor({ timeout: 5000 });
  await foto('05-erro-valor-numerico');
  registrar('S9 valor numérico inválido rejeitado em pt-BR', 'PASSOU');

  // ---------- S11: Item sem UTS sinalizado ----------
  await page.goto(`${BASE}/catalogos/cabos-condutores/novo`);
  await preencherFormulario({
    'Código *': 'QA-PEND-001',
    Descrição: 'Cabo QA sem UTS',
    'Peso (ton/km)': '1.1',
    'Bobina (m)': '2000',
    'Diâmetro (mm)': '21.0',
  });
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.waitForURL('**/catalogos/cabos-condutores');
  const linhaPend = page.locator('tbody tr', { hasText: 'QA-PEND-001' });
  await linhaPend.waitFor();
  const textoPend = await linhaPend.textContent();
  const pendOk = textoPend.includes('Pendente') && textoPend.includes('UTS (kN)');
  await foto('06-lista-pendencia-uts');
  registrar(
    'S11 item sem UTS sinalizado com o campo',
    pendOk ? 'PASSOU' : 'FALHOU',
    pendOk ? '' : textoPend,
  );

  // ---------- S10: Busca por código ----------
  await page.getByLabel('Buscar por código ou descrição').fill('QA-E2E');
  const respostaFiltrada = page.waitForResponse((r) =>
    r.url().includes('busca=QA-E2E'),
  );
  await page.getByRole('button', { name: 'Buscar' }).click();
  await respostaFiltrada;
  await page.waitForFunction(
    () => document.querySelectorAll('tbody tr').length === 1,
    undefined,
    { timeout: 5000 },
  );
  const linhasBusca = await page.locator('tbody tr').count();
  await foto('07-busca-por-codigo');
  registrar(
    'S10 busca por código',
    linhasBusca === 1 ? 'PASSOU' : 'FALHOU',
    `linhas=${linhasBusca}`,
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
    () => !document.querySelector('input#pesoTonKm')?.disabled,
  );
  await page.getByLabel('Peso (ton/km)').fill('1.3100');
  await page.getByLabel(/Início de vigência/).fill('2026-09-01');
  await foto('08-form-nova-versao');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.waitForURL('**/catalogos/cabos-condutores');
  registrar('S1 edição cria nova versão', 'PASSOU');

  // ---------- S3: Consulta na data atual (versão futura NÃO vigente hoje) ----------
  const linhaAtual = page.locator('tbody tr', { hasText: 'QA-E2E-001' });
  await linhaAtual.waitFor();
  const textoAtual = await linhaAtual.textContent();
  const vigenciaAtualOk =
    textoAtual.includes('1.3026') && !textoAtual.includes('1.31,');
  await foto('09-lista-vigencia-atual');
  registrar(
    'S3 consulta na data atual retorna versão vigente (não a futura)',
    vigenciaAtualOk ? 'PASSOU' : 'FALHOU',
    textoAtual.trim().slice(0, 120),
  );

  // ---------- S12 + S6: Histórico com autor e vigências ----------
  await linhaAtual.getByRole('link', { name: 'Histórico' }).click();
  await page.getByRole('heading', { name: /Histórico de versões/ }).waitFor();
  await page.locator('tbody tr').first().waitFor();
  const linhasHist = await page.locator('tbody tr').count();
  const textoHist = await page.locator('tbody').textContent();
  const histOk =
    linhasHist === 2 &&
    textoHist.includes('sistema') &&
    textoHist.includes('01/09/2026');
  await foto('10-historico-versoes');
  registrar(
    'S12 histórico lista versões em ordem de vigência',
    histOk ? 'PASSOU' : 'FALHOU',
    `linhas=${linhasHist}`,
  );
  registrar(
    'S6 autoria registrada e visível no histórico',
    textoHist.includes('sistema') ? 'PASSOU' : 'FALHOU',
  );

  // ---------- S2, S4, S5: contratos de API (a UI não expõe) ----------
  const api = contexto.request;
  const lista = await (
    await api.get(`${BASE}/api/catalogos/cabos-condutores?busca=QA-E2E-001`)
  ).json();
  const id = lista[0].id;

  const passada = await (
    await api.get(`${BASE}/api/catalogos/cabos-condutores/${id}?vigenteEm=2026-08-23`)
  ).json();
  const futura = await (
    await api.get(`${BASE}/api/catalogos/cabos-condutores/${id}?vigenteEm=2026-12-01`)
  ).json();
  const semVigencia = await api.get(
    `${BASE}/api/catalogos/cabos-condutores/${id}?vigenteEm=2020-01-01`,
  );
  const patch = await api.patch(
    `${BASE}/api/catalogos/cabos-condutores/${id}/versoes/1`,
    { data: {} },
  );

  const s4ok =
    passada.versaoVigente.pesoTonKm === '1.3026' &&
    futura.versaoVigente.pesoTonKm === '1.31';
  registrar(
    'S4 consulta em data passada retorna valores da época',
    s4ok ? 'PASSOU' : 'FALHOU',
    `passada=${passada.versaoVigente.pesoTonKm} futura=${futura.versaoVigente.pesoTonKm}`,
  );
  registrar(
    'S5 data anterior à primeira vigência responde sem valor',
    semVigencia.status() === 404 ? 'PASSOU' : 'FALHOU',
    `status=${semVigencia.status()}`,
  );
  registrar(
    'S2 versão histórica é imutável (PATCH rejeitado)',
    patch.status() === 405 ? 'PASSOU' : 'FALHOU',
    `status=${patch.status()}`,
  );
  const fs = require('fs');
  fs.writeFileSync(
    `${EVID}/api-contratos-vigencia.json`,
    JSON.stringify(
      {
        vigenteEm_2026_08_23: passada,
        vigenteEm_2026_12_01: futura,
        vigenteEm_2020_01_01: { status: semVigencia.status(), corpo: await semVigencia.json() },
        patch_versao: { status: patch.status(), corpo: await patch.json() },
      },
      null,
      2,
    ),
  );

  // ---------- Acessibilidade ----------
  await page.goto(`${BASE}/catalogos/cabos-condutores/novo`);
  await page.getByLabel('Código *').waitFor();
  const semLabel = await page.evaluate(() =>
    [...document.querySelectorAll('input')].filter(
      (i) => !document.querySelector(`label[for="${i.id}"]`),
    ).length,
  );
  registrar(
    'A11y: todo input do formulário tem label associado',
    semLabel === 0 ? 'PASSOU' : 'FALHOU',
    `inputs sem label=${semLabel}`,
  );
  const focados = [];
  for (let i = 0; i < 9; i++) {
    await page.keyboard.press('Tab');
    focados.push(
      await page.evaluate(
        () => document.activeElement?.id || document.activeElement?.tagName,
      ),
    );
  }
  const tabOk = focados.includes('codigo') && focados.includes('vigenciaInicio');
  registrar(
    'A11y: navegação por teclado percorre os campos',
    tabOk ? 'PASSOU' : 'FALHOU',
    focados.join('>'),
  );
  await foto('11-a11y-form');

  // ---------- Responsividade ----------
  for (const [nome, vp] of Object.entries({
    'mobile-375': { width: 375, height: 812 },
    'tablet-768': { width: 768, height: 1024 },
    'desktop-1280': { width: 1280, height: 800 },
  })) {
    await page.setViewportSize(vp);
    await page.goto(`${BASE}/catalogos/cabos-condutores`);
    await page.locator('tbody tr').first().waitFor();
    await foto(`12-responsivo-lista-${nome}`);
  }
  // estado vazio
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByLabel('Buscar por código ou descrição').fill('ZZZ-INEXISTENTE');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.getByText('Nenhum cabo condutor encontrado').waitFor();
  await foto('13-estado-vazio');
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
