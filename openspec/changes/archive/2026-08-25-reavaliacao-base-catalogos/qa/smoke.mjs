// QA de regressão da change reavaliacao-base-catalogos (sem specs delta):
// valida ao vivo o único comportamento novo (guarda de id malformado no form
// do piloto) e o smoke dos 2 forms refitados pela extração de escala.
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
  await page.screenshot({ path: `${EVID}/${String(step).padStart(2, '0')}-${name}.png`, fullPage: true });
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.setDefaultTimeout(10000);

try {
  // Comportamento novo: form do piloto com id malformado mostra erro e bloqueia
  await page.goto(`${BASE}/catalogs/conductor-cables/abc/edit`);
  await page.getByRole('alert').filter({ hasText: 'Identificador inválido' }).waitFor();
  const saveDisabled = await page.getByRole('button', { name: 'Salvar' }).isDisabled();
  record('Piloto: id malformado exibe erro em vez de modo criação', true);
  record('Piloto: botão Salvar bloqueado com id malformado', saveDisabled);
  await shot(page, 'piloto-id-malformado');

  // Fluxo válido do piloto intacto: criação abre normal e valida decimal
  await page.goto(`${BASE}/catalogs/conductor-cables/new`);
  await page.getByLabel('Código *').fill('QA-REGRESSAO');
  await page.getByLabel('Peso (ton/km)').fill('abc');
  await page.getByRole('button', { name: 'Salvar' }).click();
  // waitFor evita a corrida de ler o texto antes do mat-error renderizar
  await page.getByText('número decimal positivo').first().waitFor();
  record('Piloto: criação abre e valida decimal como antes', true);
  await shot(page, 'piloto-criacao-validacao');

  // Série de apoio p/ o smoke do tower-type (409 se já existir é aceitável)
  const seriesName = 'QA Reavaliação';
  await page.request.post('http://localhost:3000/api/catalogs/structure-series', {
    data: { name: seriesName },
  });

  // Refit tower-type: zero e escala rejeitados com as mesmas mensagens
  await page.goto(`${BASE}/catalogs/structure-series`);
  await page
    .locator('tr', { hasText: seriesName })
    .getByRole('link', { name: 'Tipos de torre' })
    .click();
  await page.getByRole('link', { name: 'Novo tipo de torre' }).click();
  await page.getByLabel('Sigla *').fill('QA-X');
  await page.getByRole('button', { name: 'Adicionar ponto' }).click();
  await page.getByLabel('Altura (m)').nth(0).fill('0');
  await page.getByLabel('Peso (kg)').nth(0).fill('5200.125');
  await page.getByRole('button', { name: 'Salvar' }).click();
  // Cada mensagem renderiza no seu próprio tick — esperar pelas duas antes de ler
  await page.getByText('número decimal positivo').first().waitFor();
  await page.getByText('no máximo 2 casas decimais').first().waitFor();
  const pointErr = await page.locator('fieldset').innerText();
  record(
    'Refit tower-type: zero → mesma mensagem de decimal inválido',
    pointErr.includes('número decimal positivo'),
  );
  record(
    'Refit tower-type: escala excedente → mesma mensagem de casas',
    pointErr.includes('no máximo 2 casas decimais'),
  );
  await shot(page, 'tower-type-zero-e-escala');

  // Refit insulator: escala rejeitada com a mesma mensagem
  await page.goto(`${BASE}/catalogs/insulators/new`);
  await page.getByLabel('Código *').fill('QA-X');
  await page.getByLabel('Carga de ruptura (kN)').fill('120.505');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.getByText('Use no máximo 2 casas decimais').waitFor();
  record('Refit insulator: escala excedente → mesma mensagem de casas', true);
  await shot(page, 'insulator-escala');
} catch (error) {
  record('EXCEÇÃO na execução', false, String(error));
  await shot(page, 'excecao');
} finally {
  await browser.close();
}

console.log(JSON.stringify(results, null, 2));
if (results.some((r) => !r.ok)) process.exitCode = 1;
