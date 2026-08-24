// QA E2E da change catalogo-series-torres — executa os fluxos de interface
// dos cenários do spec e salva evidências. Saída: JSON de resultados no stdout.
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
  const file = `${EVID}/${String(step).padStart(2, '0')}-${name}.png`;
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.setDefaultTimeout(10000);

try {
  // Home + navegação
  await page.goto(BASE);
  await page.getByRole('link', { name: 'Catálogo de séries de estruturas' }).click();
  await page.waitForURL('**/catalogs/structure-series');
  await page.getByText('Nenhuma série de estrutura encontrada.').waitFor();
  await shot(page, 'lista-series-vazia');
  record('Navegação e estado vazio da listagem', true);

  // Cenário: valores numéricos inválidos rejeitados (série)
  await page.getByRole('link', { name: 'Nova série' }).click();
  await page.getByLabel('Nome *').fill('QA Série 500');
  await page.getByLabel('Tensão (kV)').fill('-500');
  await page.getByLabel('Quantidade de circuitos').fill('1.5');
  await page.getByRole('button', { name: 'Salvar' }).click();
  const invalidText = await page.locator('section').innerText();
  record(
    'Série: valores numéricos inválidos rejeitados em pt-BR',
    invalidText.includes('número decimal positivo') && invalidText.includes('número inteiro positivo'),
  );
  await shot(page, 'serie-form-valores-invalidos');

  // Cenário: criação de série com dados válidos (sem SIL, p/ pendência)
  await page.getByLabel('Tensão (kV)').fill('500');
  await page.getByLabel('Quantidade de circuitos').fill('1');
  await page.getByLabel('Projetista').fill('SAE Towers');
  await page.getByLabel('Cabos por fase').fill('4');
  await page.getByLabel('Vento de projeto (m/s)').fill('25');
  await page.getByLabel('Tipo de isolador').fill('vidro temperado');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.waitForURL('**/catalogs/structure-series');
  await page.getByRole('cell', { name: 'QA Série 500' }).waitFor();
  record('Série criada aparece na listagem como primeira versão', true);

  // Cenário: série sem SIL aparece sinalizada
  const listText1 = await page.locator('table').innerText();
  record('Pendência da série identifica o campo (SIL)', listText1.includes('Pendente: SIL (MW)'));
  await shot(page, 'lista-series-pendencia-sil');

  // Segunda série completa (p/ busca e sigla entre séries)
  await page.getByRole('link', { name: 'Nova série' }).click();
  await page.getByLabel('Nome *').fill('QA Série 230');
  await page.getByLabel('Projetista').fill('Brametal');
  await page.getByLabel('Tensão (kV)').fill('230');
  await page.getByLabel('Quantidade de circuitos').fill('2');
  await page.getByLabel('Cabos por fase').fill('1');
  await page.getByLabel('Vento de projeto (m/s)').fill('30');
  await page.getByLabel('Tipo de isolador').fill('porcelana');
  await page.getByLabel('SIL (MW)').fill('140');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.waitForURL('**/catalogs/structure-series');
  await page.getByRole('cell', { name: 'QA Série 230' }).waitFor();
  const completeRow = page.locator('tr', { hasText: 'QA Série 230' });
  record('Série completa listada sem pendência', (await completeRow.innerText()).includes('Completo'));

  // Cenário: nome duplicado rejeitado
  await page.getByRole('link', { name: 'Nova série' }).click();
  await page.getByLabel('Nome *').fill('QA Série 500');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.getByRole('alert').filter({ hasText: 'já está em uso' }).waitFor();
  record('Série: nome duplicado rejeitado com mensagem', true);
  await shot(page, 'serie-nome-duplicado-409');
  await page.getByRole('link', { name: 'Cancelar' }).click();

  // Cenário: busca por nome
  await page.waitForURL('**/catalogs/structure-series');
  await page.getByLabel('Buscar por nome ou projetista').fill('500');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.getByRole('cell', { name: 'QA Série 500' }).waitFor();
  const searchText = await page.locator('table').innerText();
  record('Busca por nome filtra a listagem', searchText.includes('QA Série 500') && !searchText.includes('QA Série 230'));
  await shot(page, 'lista-series-busca-nome');
  await page.getByLabel('Buscar por nome ou projetista').fill('');
  await page.getByRole('button', { name: 'Buscar' }).click();

  // Detalhe da série 500: estado vazio de tipos
  await page.locator('tr', { hasText: 'QA Série 500' }).getByRole('link', { name: 'Tipos de torre' }).click();
  await page.getByText('Nenhum tipo de torre cadastrado nesta série.').waitFor();
  await shot(page, 'detalhe-serie-sem-tipos');

  // Cenário: criação de tipo com dados válidos + pontos peso × altura + zero estais
  await page.getByRole('link', { name: 'Novo tipo de torre' }).click();
  await page.getByLabel('Sigla *').fill('QA-SA1');
  await page.getByLabel('Função *').selectOption('SUSPENSION');
  await page.getByLabel('Quantidade de estais').fill('0');
  await page.getByRole('button', { name: 'Adicionar ponto' }).click();
  await page.getByLabel('Altura (m)').nth(0).fill('24');
  await page.getByLabel('Peso (kg)').nth(0).fill('5200.50');
  await page.getByRole('button', { name: 'Adicionar ponto' }).click();
  await page.getByLabel('Altura (m)').nth(1).fill('30');
  await page.getByLabel('Peso (kg)').nth(1).fill('6400');
  await shot(page, 'tipo-form-preenchido');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.getByRole('cell', { name: 'QA-SA1' }).waitFor();
  const typeRow = await page.locator('tr', { hasText: 'QA-SA1' }).innerText();
  record('Tipo criado listado na série com função pt-BR', typeRow.includes('suspensão'));
  record('Pontos gravados e resumidos ordenados por altura', typeRow.includes('2 alturas (24–30 m)'));
  record('Zero estais não gera pendência (RNF-09)', typeRow.includes('0') && typeRow.includes('Completo'));
  await shot(page, 'detalhe-serie-tipo-completo');

  // Cenário: ponto com valor inválido rejeitado
  await page.getByRole('link', { name: 'Novo tipo de torre' }).click();
  await page.getByLabel('Sigla *').fill('QA-XX');
  await page.getByLabel('Função *').selectOption('ANCHOR');
  await page.getByRole('button', { name: 'Adicionar ponto' }).click();
  await page.getByLabel('Altura (m)').nth(0).fill('0');
  await page.getByLabel('Peso (kg)').nth(0).fill('5200.125');
  await page.getByRole('button', { name: 'Salvar' }).click();
  const pointErr = await page.locator('fieldset').innerText();
  record(
    'Ponto zero/fora da escala rejeitado apontando a linha',
    pointErr.includes('número decimal positivo') && pointErr.includes('no máximo 2 casas decimais'),
  );
  await shot(page, 'tipo-form-ponto-invalido');

  // Cenário: altura repetida rejeitada (mesmo form)
  await page.getByLabel('Altura (m)').nth(0).fill('24');
  await page.getByLabel('Peso (kg)').nth(0).fill('5200');
  await page.getByRole('button', { name: 'Adicionar ponto' }).click();
  await page.getByLabel('Altura (m)').nth(1).fill('24.000');
  await page.getByLabel('Peso (kg)').nth(1).fill('5300');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.getByText('Há alturas duplicadas na tabela peso × altura').waitFor();
  record('Altura duplicada apontada antes do submit (24 ≡ 24.000)', true);
  await shot(page, 'tipo-form-altura-duplicada');
  await page.getByRole('link', { name: 'Cancelar' }).click();

  // Cenário: tipo sem pontos aparece sinalizado (e estais em branco)
  await page.getByRole('link', { name: 'Novo tipo de torre' }).click();
  await page.getByLabel('Sigla *').fill('QA-AT1');
  await page.getByLabel('Função *').selectOption('ANCHOR');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.getByRole('cell', { name: 'QA-AT1' }).waitFor();
  const at1Row = await page.locator('tr', { hasText: 'QA-AT1' }).innerText();
  record(
    'Tipo sem estais e sem pontos sinalizado com os dois rótulos',
    at1Row.includes('quantidade de estais') && at1Row.includes('tabela peso × altura'),
  );
  await shot(page, 'detalhe-serie-tipo-pendente');

  // Cenário: sigla duplicada na mesma série rejeitada
  await page.getByRole('link', { name: 'Novo tipo de torre' }).click();
  await page.getByLabel('Sigla *').fill('QA-SA1');
  await page.getByLabel('Função *').selectOption('ANCHOR');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.getByRole('alert').filter({ hasText: 'já está em uso nesta série' }).waitFor();
  record('Sigla duplicada na série rejeitada com mensagem', true);
  await shot(page, 'tipo-sigla-duplicada-409');
  await page.getByRole('link', { name: 'Cancelar' }).click();

  // Cenário: nova versão do tipo preserva a tabela anterior
  await page.locator('tr', { hasText: 'QA-SA1' }).getByRole('link', { name: 'Editar' }).click();
  await page.getByText('fixa desde a criação').waitFor();
  await shot(page, 'tipo-form-edicao-funcao-fixa');
  await page.getByLabel('Peso (kg)').nth(0).fill('5300');
  await page.getByRole('button', { name: 'Adicionar ponto' }).click();
  await page.getByLabel('Altura (m)').nth(2).fill('33');
  await page.getByLabel('Peso (kg)').nth(2).fill('7000');
  await page.locator('#effectiveFrom').fill('2026-09-01');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.getByRole('cell', { name: 'QA-SA1' }).waitFor();

  // Cenário: histórico do tipo com a tabela de cada época
  await page.locator('tr', { hasText: 'QA-SA1' }).getByRole('link', { name: 'Histórico' }).click();
  await page.getByText('Vigente desde 01/09/2026').waitFor();
  const histText = await page.locator('section').innerText();
  record(
    'Histórico do tipo preserva a tabela por versão',
    histText.includes('5300') && histText.includes('5200.50') && histText.includes('7000'),
  );
  await shot(page, 'historico-tipo-duas-versoes');
  await page.getByRole('link', { name: 'Voltar à série' }).click();

  // Cenário: histórico da série após edição
  await page.goto(`${BASE}/catalogs/structure-series`);
  await page.locator('tr', { hasText: 'QA Série 500' }).getByRole('link', { name: 'Editar' }).click();
  await page.getByText('Nome: QA Série 500').waitFor();
  await page.getByLabel('SIL (MW)').fill('1150.5');
  await page.locator('#effectiveFrom').fill('2026-09-01');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.waitForURL('**/catalogs/structure-series');
  await page.locator('tr', { hasText: 'QA Série 500' }).getByRole('link', { name: 'Histórico' }).click();
  await page.getByText('01/09/2026').waitFor();
  const serieHist = await page.locator('section').innerText();
  record(
    'Histórico da série lista versões com autor e vigência',
    serieHist.includes('01/09/2026') && serieHist.includes('24/08/2026') && serieHist.includes('sistema'),
  );
  await shot(page, 'historico-serie-duas-versoes');

  // Acessibilidade: rótulos associados no form de tipo de torre
  await page.goto(`${BASE}/catalogs/structure-series`);
  await page.locator('tr', { hasText: 'QA Série 500' }).getByRole('link', { name: 'Tipos de torre' }).click();
  await page.getByRole('link', { name: 'Novo tipo de torre' }).click();
  await page.getByRole('button', { name: 'Adicionar ponto' }).click();
  const unlabeled = await page.evaluate(() => {
    const fields = Array.from(document.querySelectorAll('input, select'));
    return fields
      .filter((el) => {
        const id = el.getAttribute('id');
        return !id || !document.querySelector(`label[for="${id}"]`);
      })
      .map((el) => el.getAttribute('formcontrolname') ?? el.tagName);
  });
  record('Todos os campos do form de tipo têm rótulo associado', unlabeled.length === 0, unlabeled.join(','));

  // Navegação por teclado: Tab alcança sigla e Enter no submit dispara validação
  await page.goto(`${BASE}/catalogs/structure-series/new`);
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => document.activeElement?.getAttribute('id'));
  record('Navegação por teclado alcança o primeiro campo', focused === 'name', `foco em: ${focused}`);

  // Responsividade: listagem e form em 375px
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto(`${BASE}/catalogs/structure-series`);
  await page.getByRole('cell', { name: 'QA Série 500' }).waitFor();
  await shot(page, 'responsivo-375-lista-series');
  await page.goto(`${BASE}/catalogs/structure-series/1/tower-types/new`);
  await page.getByLabel('Sigla *').waitFor();
  await shot(page, 'responsivo-375-tipo-form');
  await page.setViewportSize({ width: 1280, height: 900 });

  // Smoke dos catálogos de cabos existentes
  for (const [path, heading] of [
    ['conductor-cables', 'Catálogo de cabos condutores'],
    ['ground-wires', 'Catálogo de cabos de guarda'],
    ['guy-wires', 'Catálogo de cabos de tirante'],
  ]) {
    await page.goto(`${BASE}/catalogs/${path}`);
    await page.getByRole('heading', { name: heading }).waitFor();
    await shot(page, `smoke-${path}`);
    record(`Smoke ${heading}`, true);
  }
} catch (error) {
  record('EXCEÇÃO na execução', false, String(error));
  await shot(page, 'excecao');
} finally {
  await browser.close();
}

console.log(JSON.stringify(results, null, 2));
if (results.some((r) => !r.ok)) process.exitCode = 1;
