// QA E2E da change catalogo-isoladores — executa os fluxos de interface dos
// cenários do spec e salva evidências. Saída: JSON de resultados no stdout.
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
  // Navegação pela casca + estado vazio da listagem
  await page.goto(BASE);
  await page.getByRole('link', { name: 'Isoladores' }).click();
  await page.waitForURL('**/catalogs/insulators');
  await page.getByText('Nenhum isolador encontrado.').waitFor();
  await shot(page, 'lista-isoladores-vazia');
  record('Navegação pelo menu e estado vazio da listagem', true);

  // Cenário: valores numéricos inválidos rejeitados
  await page.getByRole('link', { name: 'Novo isolador' }).first().click();
  await page.getByLabel('Código *').fill('ISO-QA-120');
  await page.getByLabel('Carga de ruptura (kN)').fill('-1');
  await page.getByLabel('Diâmetro (mm)').fill('abc');
  await page.getByRole('button', { name: 'Salvar' }).click();
  const invalidText = await page.locator('section').innerText();
  record(
    'Valores numéricos inválidos rejeitados em pt-BR',
    invalidText.includes('número decimal positivo com ponto'),
  );
  await shot(page, 'form-valores-invalidos');

  // Escala além da precisão da coluna rejeitada (comportamento novo da UI)
  await page.getByLabel('Carga de ruptura (kN)').fill('120.505');
  await page.getByLabel('Diâmetro (mm)').fill('255');
  await page.getByRole('button', { name: 'Salvar' }).click();
  const scaleText = await page.locator('section').innerText();
  record(
    'Escala excedente rejeitada apontando o limite de casas',
    scaleText.includes('Use no máximo 2 casas decimais'),
  );
  await shot(page, 'form-escala-excedente');

  // Cenário: criação com dados válidos (sem linha de fuga, p/ pendência)
  await page.getByLabel('Carga de ruptura (kN)').fill('120.5');
  await page.getByLabel('Tipo').fill('vidro');
  await page.getByLabel('Fabricante').fill('Sediver');
  await page.getByLabel('Perfil').fill('antipoluição');
  await page.getByLabel('Passo (mm)').fill('146');
  await page.locator('#effectiveFrom').fill('2026-08-01');
  await shot(page, 'form-preenchido');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.getByText('Isolador salvo').waitFor();
  record('Confirmação transitória ao salvar (snackbar)', true);
  await page.waitForURL('**/catalogs/insulators');
  await page.getByRole('cell', { name: 'ISO-QA-120' }).waitFor();
  record('Isolador criado aparece na listagem como primeira versão', true);

  // Cenário: item sem linha de fuga aparece sinalizado
  const listText1 = await page.locator('table').innerText();
  record(
    'Pendência identifica o campo ausente (linha de fuga)',
    listText1.includes('Pendente: linha de fuga (mm)'),
  );
  await shot(page, 'lista-pendencia-linha-fuga');

  // Segundo isolador completo (p/ busca e ausência de pendência)
  await page.getByRole('link', { name: 'Novo isolador' }).first().click();
  await page.getByLabel('Código *').fill('ISO-QA-P-160');
  await page.getByLabel('Descrição').fill('Isolador polimérico 160 kN');
  await page.getByLabel('Tipo').fill('polimérico');
  await page.getByLabel('Fabricante').fill('Balestro');
  await page.getByLabel('Perfil').fill('standard');
  await page.getByLabel('Carga de ruptura (kN)').fill('160');
  await page.getByLabel('Diâmetro (mm)').fill('110');
  await page.getByLabel('Passo (mm)').fill('1200');
  await page.getByLabel('Linha de fuga (mm)').fill('3150.5');
  await page.locator('#effectiveFrom').fill('2026-08-01');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.waitForURL('**/catalogs/insulators');
  await page.getByRole('cell', { name: 'ISO-QA-P-160' }).waitFor();
  const completeRow = page.locator('tr', { hasText: 'ISO-QA-P-160' });
  record(
    'Isolador completo listado sem pendência',
    (await completeRow.innerText()).includes('Completo'),
  );
  await shot(page, 'lista-dois-itens');

  // Cenário: código duplicado rejeitado
  await page.getByRole('link', { name: 'Novo isolador' }).first().click();
  await page.getByLabel('Código *').fill('ISO-QA-120');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.getByRole('alert').filter({ hasText: 'já está em uso' }).waitFor();
  record('Código duplicado rejeitado com mensagem em pt-BR', true);
  await shot(page, 'form-codigo-duplicado-409');
  await page.getByRole('link', { name: 'Cancelar' }).click();

  // Cenário: busca por código
  await page.waitForURL('**/catalogs/insulators');
  await page.getByLabel('Buscar por código ou descrição').fill('P-160');
  await page.getByRole('button', { name: 'Buscar' }).click();
  // Aguarda a linha não filtrada SAIR do DOM (o cell buscado já estava
  // renderizado antes da resposta filtrada — corrida de render do script,
  // mesmo falso negativo do QA de catalogo-series-torres)
  await page
    .locator('tr', { hasText: 'ISO-QA-120' })
    .waitFor({ state: 'detached' });
  await page.getByRole('cell', { name: 'ISO-QA-P-160' }).waitFor();
  const searchText = await page.locator('table').innerText();
  record(
    'Busca por código filtra a listagem pela versão vigente',
    searchText.includes('ISO-QA-P-160') && !searchText.includes('ISO-QA-120'),
  );
  await shot(page, 'lista-busca-codigo');
  await page.getByLabel('Buscar por código ou descrição').fill('');
  await page.getByRole('button', { name: 'Buscar' }).click();

  // Edição: prefill e nova versão com vigência própria
  await page.locator('tr', { hasText: 'ISO-QA-120' }).getByRole('link', { name: 'Editar' }).click();
  await page.getByText('Código: ISO-QA-120').waitFor();
  const prefill = await page.getByLabel('Carga de ruptura (kN)').inputValue();
  record('Prefill da edição carrega a última versão', prefill === '120.5', `valor: ${prefill}`);
  await shot(page, 'form-edicao-prefill');
  await page.getByLabel('Linha de fuga (mm)').fill('320.125');
  await page.locator('#effectiveFrom').fill('2026-09-01');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.waitForURL('**/catalogs/insulators');

  // Cenário: histórico após edição
  await page.locator('tr', { hasText: 'ISO-QA-120' }).getByRole('link', { name: 'Histórico' }).click();
  await page.getByText('Histórico de versões — ISO-QA-120').waitFor();
  await page.getByText('01/09/2026').waitFor();
  const histText = await page.locator('section').innerText();
  record(
    'Histórico lista as versões com vigência (data civil), autor e valores da época',
    histText.includes('01/09/2026') &&
      histText.includes('01/08/2026') &&
      histText.includes('sistema') &&
      histText.includes('320.125') &&
      histText.includes('—'),
  );
  await shot(page, 'historico-duas-versoes');

  // Estado de erro da listagem (API indisponível não vira catálogo vazio)
  await page.route('**/api/catalogs/insulators*', (route) => route.abort());
  await page.goto(`${BASE}/catalogs/insulators`);
  await page.getByRole('alert').filter({ hasText: 'Não foi possível carregar o catálogo' }).waitFor();
  await shot(page, 'lista-estado-erro');
  record('Falha da API exibe erro em vez de catálogo vazio', true);
  await page.unroute('**/api/catalogs/insulators*');

  // Acessibilidade: rótulos associados a todos os campos do form
  await page.goto(`${BASE}/catalogs/insulators/new`);
  await page.getByLabel('Código *').waitFor();
  const unlabeled = await page.evaluate(() => {
    const fields = Array.from(document.querySelectorAll('input, select'));
    return fields
      .filter((el) => {
        const id = el.getAttribute('id');
        return !id || !document.querySelector(`label[for="${id}"]`);
      })
      .map((el) => el.getAttribute('formcontrolname') ?? el.tagName);
  });
  record('Todos os campos do form têm rótulo associado', unlabeled.length === 0, unlabeled.join(','));

  // Navegação por teclado dentro do form: Tab percorre os campos na ordem
  await page.getByLabel('Código *').focus();
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => document.activeElement?.getAttribute('id'));
  record('Tab avança do código para a descrição', focused === 'description', `foco em: ${focused}`);

  // Responsividade: 375px sem overflow horizontal (lista e form)
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto(`${BASE}/catalogs/insulators`);
  await page.getByRole('cell', { name: 'ISO-QA-120' }).waitFor();
  const overflowList = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  record('Listagem em 375px sem overflow horizontal da página', overflowList <= 0, `delta: ${overflowList}px`);
  await shot(page, 'responsivo-375-lista');
  await page.goto(`${BASE}/catalogs/insulators/new`);
  await page.getByLabel('Código *').waitFor();
  const overflowForm = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  record('Formulário em 375px sem overflow horizontal da página', overflowForm <= 0, `delta: ${overflowForm}px`);
  await shot(page, 'responsivo-375-form');
  await page.setViewportSize({ width: 1280, height: 900 });

  // Smoke dos demais catálogos (o menu da casca mudou nesta change)
  for (const [path, heading] of [
    ['conductor-cables', 'Catálogo de cabos condutores'],
    ['ground-wires', 'Catálogo de cabos de guarda'],
    ['guy-wires', 'Catálogo de cabos de tirante'],
    ['structure-series', 'Catálogo de séries de estruturas'],
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
