/**
 * E2E do QA da change viabilidade-lote-licitante (M13).
 * Executar da raiz do repo: node openspec/changes/viabilidade-lote-licitante/qa/e2e-viabilidade.js
 * Pré-requisitos: API em :3000, web em :4200, seed aplicado e ofertas QA-M13-* criadas pelos TI.
 * AVISO de reexecução: o script assume banco recém-semeado — os ids de oferta
 * (29–32) e a vigência criada no E2E-11 (2027-06-01) são fixos; numa 2ª rodada
 * sobre o mesmo banco o E2E-11 responde 409 (vigência duplicada) e os ids
 * podem divergir. Ajustar ids/vigência ou recriar o banco antes de reexecutar.
 */
const path = require('path');
const { chromium } = require(
  path.join(__dirname, '..', '..', '..', '..', 'node_modules', 'playwright'),
);

const EV = __dirname + '/evidences';
const BASE = 'http://localhost:4200';
const results = [];

function ok(name) {
  results.push(`PASSOU  ${name}`);
  console.log(`PASSOU  ${name}`);
}
function fail(name, err) {
  results.push(`FALHOU  ${name}: ${err}`);
  console.log(`FALHOU  ${name}: ${err}`);
}

async function openParamsTab(page, offerId) {
  await page.goto(`${BASE}/offers/${offerId}`);
  await page
    .getByRole('tab', { name: /Parâmetros e Datas da Revisão/ })
    .click();
  await page.waitForSelector('[data-testid="viability-panel"]');
}

async function saveParams(page) {
  await page.click('form.params-grid button[type="submit"]');
  await page
    .getByText('Revisão salva com sucesso!')
    .waitFor({ timeout: 10000 });
  // Espera o snackbar sumir para não poluir a próxima captura.
  await page
    .getByText('Revisão salva com sucesso!')
    .waitFor({ state: 'detached', timeout: 10000 })
    .catch(() => {});
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('dialog', (d) => d.accept());

  // E2E-1 (V5): painel da oferta-mestre com origem estimativa ANEEL e valores canônicos
  try {
    await openParamsTab(page, 29);
    const panel = page.locator('[data-testid="viability-panel"]');
    await panel.getByText('estimativa ANEEL').waitFor({ timeout: 15000 });
    const text = await panel.textContent();
    for (const expected of [
      'Viabilidade do Lote (M13)',
      '365.080.751,22',
      '496.657.825,69',
      '34,88%',
      'viável no teto do edital',
      'RAP vencedora estimada',
      'Base histórica completa (49',
      'Parâmetros vigentes desde 2026-03-01',
      'WACC real após impostos 8,00%',
    ]) {
      if (!text.includes(expected)) {
        throw new Error(`texto ausente: "${expected}"`);
      }
    }
    await panel.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${EV}/e2e1-painel-mestre-aneel.png`, fullPage: false });
    ok('E2E-1 painel da oferta-mestre: origem estimativa ANEEL + valores canônicos (34,88%)');
  } catch (e) {
    await page.screenshot({ path: `${EV}/e2e1-FALHA.png` });
    fail('E2E-1', e.message);
  }

  // E2E-2 (O1/V4): informar bidderCapex em rascunho recalcula com origem licitante
  try {
    await page.fill('#revBidderCapex', '4110000000.00');
    await saveParams(page);
    const panel = page.locator('[data-testid="viability-panel"]');
    await panel
      .getByText('informado pelo licitante')
      .waitFor({ timeout: 15000 });
    await panel.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${EV}/e2e2-bidder-capex-origem-licitante.png` });
    ok('E2E-2 bidderCapex informado: parecer recalcula com origem "informado pelo licitante"');
  } catch (e) {
    await page.screenshot({ path: `${EV}/e2e2-FALHA.png` });
    fail('E2E-2', e.message);
  }

  // E2E-3 (V8): RAP vencedora acima da mínima -> viável com folga em p.p.
  try {
    await page.fill('#revWinningRap', '500000000.00');
    await saveParams(page);
    const panel = page.locator('[data-testid="viability-panel"]');
    await panel
      .getByText(/remunera o investimento com folga de 0,44 p\.p\./)
      .waitFor({ timeout: 15000 });
    const verdict = page.locator('[data-testid="viability-estimated-verdict"]');
    const cls = await verdict.getAttribute('class');
    if (!cls.includes('viability-good')) {
      throw new Error(`classe viability-good ausente: ${cls}`);
    }
    await panel.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${EV}/e2e3-viavel-com-folga.png` });
    ok('E2E-3 painel completo viável: deságio 34,44% com folga de 0,44 p.p. destacada');
  } catch (e) {
    await page.screenshot({ path: `${EV}/e2e3-FALHA.png` });
    fail('E2E-3', e.message);
  }

  // E2E-4 (V9): deságio pretendido acima do suportado é destacado sem impedir a gravação
  try {
    await page.fill('#revWinningRap', '381315000.00');
    await saveParams(page); // a gravação NÃO é impedida (parecer informativo)
    const panel = page.locator('[data-testid="viability-panel"]');
    await panel
      .getByText(/não remunera o investimento nas premissas vigentes/)
      .waitFor({ timeout: 15000 });
    const verdict = page.locator('[data-testid="viability-estimated-verdict"]');
    const text = await verdict.textContent();
    if (!text.includes('excesso de 15,12 p.p.')) {
      throw new Error(`excesso esperado 15,12 p.p.; obtido: ${text}`);
    }
    const cls = await verdict.getAttribute('class');
    if (!cls.includes('viability-bad')) {
      throw new Error(`classe viability-bad ausente: ${cls}`);
    }
    await panel.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${EV}/e2e4-desagio-acima-do-suportado.png` });
    ok('E2E-4 deságio pretendido 50,00% > 34,88%: destacado (excesso de 15,12 p.p.) sem bloquear a gravação');
  } catch (e) {
    await page.screenshot({ path: `${EV}/e2e4-FALHA.png` });
    fail('E2E-4', e.message);
  }

  // Restauração do estado original da oferta-mestre (bidderCapex e winningRap limpos)
  try {
    await page.fill('#revBidderCapex', '');
    await page.fill('#revWinningRap', '');
    await saveParams(page);
    const panel = page.locator('[data-testid="viability-panel"]');
    await panel.getByText('estimativa ANEEL').waitFor({ timeout: 15000 });
    ok('E2E-5 limpeza: campos voltam a "não informado" e origem retorna a estimativa ANEEL (RNF-09)');
  } catch (e) {
    await page.screenshot({ path: `${EV}/e2e5-FALHA.png` });
    fail('E2E-5', e.message);
  }

  // E2E-6 (V7): oferta sem financeiros -> entradas faltantes orientadas
  try {
    await openParamsTab(page, 31);
    const panel = page.locator('[data-testid="viability-panel"]');
    await panel
      .getByText('Entradas faltantes para o parecer completo')
      .waitFor({ timeout: 15000 });
    const text = await panel.textContent();
    for (const expected of [
      'Investimento (do licitante ou CAPEX estimado ANEEL)',
      'RAP máxima do edital',
      'RAP vencedora estimada',
    ]) {
      if (!text.includes(expected)) {
        throw new Error(`entrada faltante ausente: "${expected}"`);
      }
    }
    if (text.includes('Deságio máximo suportado:')) {
      throw new Error('derivado exibido apesar das entradas faltantes');
    }
    await panel.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${EV}/e2e6-entradas-faltantes.png` });
    ok('E2E-6 entradas faltantes listadas em pt-BR sem inventar zero');
  } catch (e) {
    await page.screenshot({ path: `${EV}/e2e6-FALHA.png` });
    fail('E2E-6', e.message);
  }

  // E2E-7 (V6): RAP mínima acima do teto -> deságio negativo, inviável
  try {
    await openParamsTab(page, 30);
    const panel = page.locator('[data-testid="viability-panel"]');
    await panel
      .getByText('inviável nas condições do edital')
      .waitFor({ timeout: 15000 });
    const verdict = page.locator('[data-testid="viability-max-verdict"]');
    const text = await verdict.textContent();
    if (!text.includes('-24,16%')) {
      throw new Error(`deságio negativo esperado -24,16%; obtido: ${text}`);
    }
    await panel.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${EV}/e2e7-inviavel-teto.png` });
    ok('E2E-7 teto insuficiente: deságio máximo -24,16% sinalizado como inviável');
  } catch (e) {
    await page.screenshot({ path: `${EV}/e2e7-FALHA.png` });
    fail('E2E-7', e.message);
  }

  // E2E-8 (V10): leilão presente no snapshot -> deságios praticados lado a lado
  try {
    await openParamsTab(page, 32);
    const panel = page.locator('[data-testid="viability-panel"]');
    await panel
      .getByText(/Deságios praticados no leilão 001\/2022/)
      .waitFor({ timeout: 15000 });
    const text = await panel.textContent();
    for (const expected of ['(13 lote(s))', '5,00%', '41,31%', '60,00%', 'frente ao máximo suportado']) {
      if (!text.includes(expected)) {
        throw new Error(`texto ausente: "${expected}"`);
      }
    }
    await panel.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${EV}/e2e8-benchmark-leilao.png` });
    ok('E2E-8 comparação com deságios praticados do leilão 001/2022 (mín/méd/máx 5,00/41,31/60,00)');
  } catch (e) {
    await page.screenshot({ path: `${EV}/e2e8-FALHA.png` });
    fail('E2E-8', e.message);
  }

  // E2E-9: tela de parâmetros exibe a versão vigente e o aviso de hipótese
  try {
    await page.goto(`${BASE}/catalogs/viability-parameters`);
    await page
      .getByText('Versão vigente desde 2026-03-01')
      .waitFor({ timeout: 15000 });
    const wacc = await page
      .getByLabel('WACC real após impostos (% a.a.)')
      .inputValue();
    if (wacc !== '8.00') {
      throw new Error(`WACC prefill esperado 8.00; obtido ${wacc}`);
    }
    const body = await page.textContent('body');
    if (!body.includes('hipótese de trabalho a calibrar')) {
      throw new Error('aviso de hipótese ausente');
    }
    await page.screenshot({ path: `${EV}/e2e9-tela-parametros.png` });
    ok('E2E-9 tela de parâmetros: vigente 8,00% desde 2026-03-01 prefilled + fatores como hipótese');
  } catch (e) {
    await page.screenshot({ path: `${EV}/e2e9-FALHA.png` });
    fail('E2E-9', e.message);
  }

  // E2E-10: validação da tela (WACC 0 bloqueia com mensagem pt-BR)
  try {
    await page.fill('input[formcontrolname="waccRealAfterTaxPercent"]', '0');
    await page.fill('input[formcontrolname="effectiveFrom"]', '2027-06-01');
    await page.click('button[type="submit"]');
    await page
      .getByText('O WACC deve ser um decimal maior que zero (ex.: 8.00)')
      .waitFor({ timeout: 10000 });
    await page.screenshot({ path: `${EV}/e2e10-validacao-wacc.png` });
    ok('E2E-10 WACC 0 rejeitado na tela com mensagem em português');
  } catch (e) {
    await page.screenshot({ path: `${EV}/e2e10-FALHA.png` });
    fail('E2E-10', e.message);
  }

  // E2E-11: criar versão nova com vigência futura (histórico preservado — TI já cobre a imutabilidade)
  try {
    await page.fill(
      'input[formcontrolname="waccRealAfterTaxPercent"]',
      '7.25',
    );
    await page.click('button[type="submit"]');
    await page
      .getByText('Parâmetros de viabilidade salvos')
      .waitFor({ timeout: 10000 });
    // A vigente de hoje segue 8,00 (a nova versão só vale a partir de 2027-06-01).
    await page
      .getByText('Versão vigente desde 2026-03-01')
      .waitFor({ timeout: 10000 });
    await page.screenshot({ path: `${EV}/e2e11-versao-futura-criada.png` });
    ok('E2E-11 versão nova com vigência 2027-06-01 criada; vigente de hoje permanece 2026-03-01');
  } catch (e) {
    await page.screenshot({ path: `${EV}/e2e11-FALHA.png` });
    fail('E2E-11', e.message);
  }

  // E2E-12: item de menu presente na casca
  try {
    const menuLink = page.locator('mat-nav-list a', {
      hasText: 'Parâmetros de viabilidade',
    });
    await menuLink.waitFor({ timeout: 10000 });
    ok('E2E-12 item "Parâmetros de viabilidade" presente no menu da casca');
  } catch (e) {
    fail('E2E-12', e.message);
  }

  // E2E-13: acessibilidade básica da tela nova (rótulos associados + foco por teclado)
  try {
    await page.goto(`${BASE}/catalogs/viability-parameters`);
    await page
      .getByText('Versão vigente desde 2026-03-01')
      .waitFor({ timeout: 15000 });
    // getByLabel só resolve com rótulo associado ao campo.
    for (const label of [
      'WACC real após impostos (% a.a.)',
      'Prazo de recebimento da RAP (anos)',
      'PIS/COFINS (% da RAP)',
      'O&M (% da RAP)',
      'IR/CSLL (%)',
      'Início de vigência da nova versão *',
    ]) {
      await page.getByLabel(label).waitFor({ timeout: 5000 });
    }
    await page.getByLabel('WACC real após impostos (% a.a.)').focus();
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(
      () => document.activeElement?.getAttribute('formcontrolname') ?? '',
    );
    if (focused !== 'concessionYears') {
      throw new Error(`Tab não avançou para o próximo campo (foco em: ${focused})`);
    }
    ok('E2E-13 a11y: 6 campos com rótulos associados e navegação por teclado');
  } catch (e) {
    fail('E2E-13', e.message);
  }

  // E2E-14: responsividade 375px (tela de parâmetros e painel de viabilidade)
  try {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/catalogs/viability-parameters`);
    await page
      .getByText('Versão vigente desde 2026-03-01')
      .waitFor({ timeout: 15000 });
    await page.screenshot({ path: `${EV}/e2e14-parametros-375px.png`, fullPage: true });
    const overflowParams = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    await openParamsTab(page, 29);
    await page
      .locator('[data-testid="viability-panel"]')
      .scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${EV}/e2e14-painel-375px.png` });
    const overflowPanel = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    if (overflowParams > 380 || overflowPanel > 380) {
      throw new Error(
        `overflow horizontal: parametros=${overflowParams}px painel=${overflowPanel}px`,
      );
    }
    ok('E2E-14 responsividade 375px sem overflow horizontal');
  } catch (e) {
    await page.screenshot({ path: `${EV}/e2e14-FALHA.png` });
    fail('E2E-14', e.message);
  }

  await browser.close();
  console.log('\n===== RESUMO =====');
  results.forEach((r) => console.log(r));
  const failures = results.filter((r) => r.startsWith('FALHOU')).length;
  console.log(`\n${results.length - failures}/${results.length} cenários E2E passaram`);
  process.exit(failures > 0 ? 1 : 0);
})();
