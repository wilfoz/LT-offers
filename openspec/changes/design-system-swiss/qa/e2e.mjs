// QA E2E da change design-system-swiss — cenários do spec
// interface/casca-navegacao + smoke das 14 telas refitadas (claro/escuro,
// desktop/móvel). Saída: JSON de resultados no stdout.
import { chromium } from 'file:///C:/Users/wilwa/Desktop/Developer/offer/.claude/skills/playwright-skill/node_modules/playwright/index.mjs';

const BASE = 'http://localhost:4200';
const EVID = process.env.EVID_DIR;
const results = [];
let step = 0;

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.error(`${ok ? 'PASS' : 'FAIL'} - ${name}${detail ? ' :: ' + detail : ''}`);
}

async function shot(page, name) {
  step += 1;
  await page.screenshot({
    path: `${EVID}/${String(step).padStart(2, '0')}-${name}.png`,
    fullPage: true,
  });
}

const browser = await chromium.launch();

// ---------- Contexto claro / desktop ----------
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.setDefaultTimeout(10000);

try {
  // Cenário: item ativo destacado + navegação fixa em tela larga
  await page.goto(`${BASE}/catalogs/structure-series`);
  await page.getByRole('heading', { name: 'Catálogo de séries de estruturas' }).waitFor();
  const activeText = await page.locator('a.active-link').innerText();
  const itemCount = await page.locator('mat-nav-list a').count();
  const menuButton = await page
    .locator('button[aria-label="Abrir menu de navegação"]')
    .count();
  record(
    'Item ativo destacado, demais acessíveis, sidenav fixa sem botão de menu',
    activeText.includes('Séries de estruturas') && itemCount === 4 && menuButton === 0,
    `ativo=${activeText.trim()} itens=${itemCount}`,
  );
  await shot(page, 'casca-desktop-claro-item-ativo');

  // Cenário: troca de catálogo pela navegação
  await page.getByRole('link', { name: 'Cabos de tirante' }).click();
  await page.getByRole('heading', { name: 'Catálogo de cabos de tirante' }).waitFor();
  const newActive = await page.locator('a.active-link').innerText();
  record('Troca de catálogo move o destaque', newActive.includes('Cabos de tirante'));
  await shot(page, 'casca-troca-catalogo');

  // Cenário: confirmação após salvar (snackbar) — cria série de QA
  await page.goto(`${BASE}/catalogs/structure-series/new`);
  await page.getByLabel('Nome *').fill('QA Design Swiss');
  await page.getByLabel('Projetista').fill('SAE Towers');
  await page.getByLabel('Tensão (kV)').fill('500');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.waitForURL('**/catalogs/structure-series');
  await page.getByText('Série de estrutura salva').waitFor();
  record('Confirmação transitória após salvar + navegação para a listagem', true);
  await shot(page, 'snackbar-serie-salva');

  // Smoke claro/desktop: 4 listagens + 5 forms + detalhe + históricos
  const smokes = [
    ['catalogs/conductor-cables', 'Catálogo de cabos condutores'],
    ['catalogs/ground-wires', 'Catálogo de cabos de guarda'],
    ['catalogs/guy-wires', 'Catálogo de cabos de tirante'],
    ['catalogs/conductor-cables/new', 'Novo cabo condutor'],
    ['catalogs/ground-wires/new', 'Novo cabo de guarda'],
    ['catalogs/guy-wires/new', 'Novo cabo de tirante'],
    ['catalogs/structure-series/new', 'Nova série de estrutura'],
  ];
  for (const [path, heading] of smokes) {
    await page.goto(`${BASE}/${path}`);
    await page.getByRole('heading', { name: heading }).waitFor();
    await shot(page, `smoke-${path.replaceAll('/', '_')}`);
  }
  record('Smoke claro/desktop: listagens e formulários dos 4 catálogos', true);

  // Detalhe da série + form de tipo + histórico da série
  await page.goto(`${BASE}/catalogs/structure-series`);
  await page
    .locator('tr', { hasText: 'QA Design Swiss' })
    .getByRole('link', { name: 'Tipos de torre' })
    .click();
  await page.getByText('Nenhum tipo de torre cadastrado nesta série.').waitFor();
  await shot(page, 'smoke-detalhe-serie');
  await page.getByRole('link', { name: 'Novo tipo de torre' }).click();
  await page.getByLabel('Sigla *').waitFor();
  await page.getByRole('button', { name: 'Adicionar ponto' }).click();
  await page.getByLabel('Altura (m)').waitFor();
  await shot(page, 'smoke-tipo-form-formarray');
  await page.goto(`${BASE}/catalogs/structure-series`);
  await page
    .locator('tr', { hasText: 'QA Design Swiss' })
    .getByRole('link', { name: 'Histórico' })
    .click();
  await page.getByText('Da vigência mais recente').waitFor();
  await shot(page, 'smoke-historico-serie');
  record('Smoke detalhe, form de tipo (FormArray) e histórico', true);

  // Cenário: falha de leitura exibida inline, navegação utilizável
  await page.route('**/api/catalogs/guy-wires**', (route) => route.abort());
  await page.goto(`${BASE}/catalogs/guy-wires`);
  await page.getByText('Não foi possível carregar o catálogo').waitFor();
  const navStillThere = await page.locator('mat-nav-list a').count();
  record(
    'Falha de leitura inline com navegação utilizável',
    navStillThere === 4,
  );
  await shot(page, 'erro-leitura-inline');
  await page.unroute('**/api/catalogs/guy-wires**');
} catch (error) {
  record('EXCEÇÃO (claro/desktop)', false, String(error));
  await shot(page, 'excecao-claro');
} finally {
  await page.close();
}

// ---------- Contexto móvel (375px) ----------
const mobile = await browser.newPage({ viewport: { width: 375, height: 800 } });
mobile.setDefaultTimeout(10000);
try {
  // Cenário: tela estreita com menu recolhido + abre sobreposto
  await mobile.goto(`${BASE}/catalogs/structure-series`);
  await mobile.getByRole('heading', { name: 'Catálogo de séries de estruturas' }).waitFor();
  const sidenavVisible = await mobile.locator('mat-sidenav').isVisible();
  const button = mobile.locator('button[aria-label="Abrir menu de navegação"]');
  await button.waitFor();
  await shot(mobile, 'movel-menu-recolhido');
  await button.click();
  await mobile.locator('mat-nav-list a').first().waitFor();
  record(
    'Tela estreita: menu inicia oculto e botão abre a navegação sobreposta',
    !sidenavVisible,
    `sidenav visível antes do clique: ${sidenavVisible}`,
  );
  await shot(mobile, 'movel-menu-aberto');
  await mobile.getByRole('link', { name: 'Cabos condutores' }).click();
  await mobile.getByRole('heading', { name: 'Catálogo de cabos condutores' }).waitFor();

  // Cenário: tabela larga rola no contêiner, body sem rolagem horizontal
  await mobile.goto(`${BASE}/catalogs/structure-series`);
  await mobile.getByRole('cell', { name: 'QA Design Swiss' }).waitFor();
  const metrics = await mobile.evaluate(() => ({
    bodyScroll: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
    tableScrollable: (() => {
      const wrap = document.querySelector('.table-scroll');
      return wrap ? wrap.scrollWidth > wrap.clientWidth : false;
    })(),
  }));
  record(
    'Tabela larga rola no próprio contêiner; página sem rolagem horizontal',
    metrics.bodyScroll <= metrics.viewport && metrics.tableScrollable,
    JSON.stringify(metrics),
  );
  await shot(mobile, 'movel-tabela-rolagem-contida');
} catch (error) {
  record('EXCEÇÃO (móvel)', false, String(error));
  await shot(mobile, 'excecao-movel');
} finally {
  await mobile.close();
}

// ---------- Contexto escuro ----------
const darkCtx = await browser.newContext({
  colorScheme: 'dark',
  viewport: { width: 1280, height: 900 },
});
const dark = await darkCtx.newPage();
dark.setDefaultTimeout(10000);
try {
  await dark.goto(`${BASE}/catalogs/structure-series`);
  await dark.getByRole('cell', { name: 'QA Design Swiss' }).waitFor();
  const colors = await dark.evaluate(() => {
    const html = getComputedStyle(document.documentElement);
    const parse = (c) => c.match(/\d+/g).slice(0, 3).map(Number);
    const luminance = ([r, g, b]) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    const bg = parse(html.backgroundColor);
    const fg = parse(html.color);
    return { bg: html.backgroundColor, fg: html.color, bgLum: luminance(bg), fgLum: luminance(fg) };
  });
  record(
    'Tema escuro: superfícies escuras com texto claro legível',
    colors.bgLum < 0.3 && colors.fgLum > 0.7,
    JSON.stringify(colors),
  );
  await shot(dark, 'escuro-listagem-series');
  await dark.goto(`${BASE}/catalogs/structure-series/new`);
  await dark.getByLabel('Nome *').waitFor();
  await shot(dark, 'escuro-form-serie');
  await dark.goto(`${BASE}/catalogs/conductor-cables`);
  await dark.getByRole('heading', { name: 'Catálogo de cabos condutores' }).waitFor();
  await shot(dark, 'escuro-lista-condutores');
  record('Smoke escuro: listagens e formulário', true);
} catch (error) {
  record('EXCEÇÃO (escuro)', false, String(error));
  await shot(dark, 'excecao-escuro');
} finally {
  await darkCtx.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
if (results.some((r) => !r.ok)) process.exitCode = 1;
