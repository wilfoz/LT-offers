# Review do Grupo 4 — piloto-catalogo-cabos

**Revisor**: AI Code Reviewer
**Data**: 2026-08-23
**Escopo**: Grupo 4 (Interface de manutenção, tasks 4.1–4.5) — alterações não commitadas
**Status**: Aprovado com observações

## Resumo

O grupo entrega a feature Angular `catalogos` completa: tipos compartilhados em `libs/dominio`, serviço HTTP, listagem com busca e sinalização de pendências, formulário de criação/nova versão com branco→null (RNF-09), tela de histórico e o wiring (rota lazy, `provideHttpClient`, navegação, proxy `/api`→3000). A implementação segue fielmente o design D4 (standalone + signals, `HttpClient` direto, sem NgRx) e D3 (decimais como string ponta a ponta), e os cenários dos dois specs têm correspondência direta na UI e nos testes. Os achados de datas do review anterior foram levados a sério: a vigência (data civil, meia-noite UTC) é exibida com `date: 'dd/MM/yyyy' : 'UTC'`, evitando o off-by-one em BRT, enquanto `criadoEm` (timestamp) é corretamente exibido no fuso local.

Não há problemas críticos. Dois majors impedem o commit como está: os cinco arquivos de componente reprovam no `nx format:check` (o mesmo comando do CI — o push quebraria o pipeline) e as operações de leitura não tratam erro — em particular, a falha silenciosa do pré-preenchimento na edição pode levar o usuário a gravar uma nova versão imutável com todos os valores em branco (null).

Verificação executada: `npx nx test web` → 4 suites, 7 testes, todos verdes. `npx nx run-many -t lint -p web dominio` → limpo. `npx nx format:check` → **5 arquivos reprovados**.

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| `libs/dominio/src/lib/catalogos/cabos-condutores.ts` | ✅ Ok | 1 minor |
| `libs/dominio/src/index.ts` | ✅ Ok | 0 |
| `apps/web/src/app/catalogos/cabos-condutores-api.service.ts` | ✅ Ok | 1 minor |
| `apps/web/src/app/catalogos/catalogos.routes.ts` | ✅ Ok | 0 |
| `apps/web/src/app/catalogos/lista-cabos.component.ts` | ⚠️ Problemas | 2 majors (compartilhados), 3 minors |
| `apps/web/src/app/catalogos/formulario-cabo.component.ts` | ⚠️ Problemas | 2 majors (compartilhados), 2 minors |
| `apps/web/src/app/catalogos/historico-cabo.component.ts` | ⚠️ Problemas | 2 majors (compartilhados), 1 minor |
| `apps/web/src/app/catalogos/lista-cabos.component.spec.ts` | ✅ Ok | 0 |
| `apps/web/src/app/catalogos/formulario-cabo.component.spec.ts` | ✅ Ok | 1 minor |
| `apps/web/src/app/catalogos/historico-cabo.component.spec.ts` | ✅ Ok | 0 |
| `apps/web/src/app/app.routes.ts` | ✅ Ok | 0 |
| `apps/web/src/app/app.config.ts` | ✅ Ok | 0 |
| `apps/web/src/app/app.html` | ✅ Ok | 0 |
| `apps/web/src/app/app.spec.ts` | ✅ Ok | 0 |
| `apps/web/proxy.conf.json` | ✅ Ok | 0 |
| `apps/web/project.json` | ✅ Ok | 0 |

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

**M1 — Formatação fora do padrão quebra o CI (`nx format:check`)**

- Arquivos: `lista-cabos.component.ts`, `formulario-cabo.component.ts`, `historico-cabo.component.ts`, `formulario-cabo.component.spec.ts`, `historico-cabo.component.spec.ts`
- `npx nx format:check` — exatamente o passo do CI (`.github/workflows/ci.yml:46`) — reprova os cinco arquivos (linhas acima do limite do Prettier, ex.: `formulario-cabo.component.ts:20` e `:171`). O commit do grupo 4 como está deixaria o CI vermelho, contrariando a rotina da change (task 5.2 exige CI verde) e o padrão do projeto ("Use Prettier para formatação consistente").
- **Correção sugerida**: `npx nx format:write` antes do commit e conferir com `npx nx format:check`.

**M2 — Operações de leitura sem tratamento de erro: estado enganoso e risco de "apagar" valores por versão em branco**

- Arquivos: `apps/web/src/app/catalogos/lista-cabos.component.ts:100-108`, `historico-cabo.component.ts:63-66`, `formulario-cabo.component.ts:187-203`
- Três manifestações do mesmo gap:
  1. **Listagem** (`recarregar`): no erro, apenas `carregando.set(false)` — a tela cai no ramo `itens().length === 0` e afirma **"Nenhum cabo condutor encontrado."** com a API fora do ar: informação falsa para o usuário.
  2. **Histórico**: `subscribe` sem callback de erro — a tela fica em "Carregando…" para sempre (inclusive num `:id` inexistente → 404).
  3. **Formulário em edição** (`prepararEdicao`): a falha do `historico(id)` é silenciosa — o formulário abre **vazio e utilizável**. Como campo em branco significa `null` (RNF-09) e o botão Salvar fica habilitado, o usuário pode gravar uma nova versão com **todos os valores null**, sobrescrevendo na prática os dados vigentes — e versões são imutáveis por design, exigindo outra versão corretiva. O mesmo risco existe na janela em que o prefill ainda está em voo (corrida entre o carregamento e um submit rápido).
- **Correção sugerida**: sinal de erro por componente + mensagem com `role="alert"`; na listagem, distinguir "erro ao carregar" de "lista vazia"; no formulário em edição, manter o form desabilitado (ou o Salvar bloqueado) até o prefill concluir, e bloquear com mensagem se falhar:

```ts
readonly erroCarregamento = signal('');
readonly prontoParaEditar = signal(false);

private prepararEdicao(id: number): void {
  this.idEdicao.set(id);
  this.formulario.disable();
  this.formulario.controls.vigenciaInicio.addValidators(Validators.required);
  this.api.historico(id).subscribe({
    next: (historico) => {
      // ...patchValue como hoje...
      this.formulario.enable();
      this.prontoParaEditar.set(true);
    },
    error: () =>
      this.erroCarregamento.set(
        'Não foi possível carregar o cabo; recarregue a página antes de editar',
      ),
  });
}
```

  Acrescentar testes de componente cobrindo os três estados de erro (regressão).

### 🟢 Problemas Minor

1. **`role="status"` como badge estático** — `lista-cabos.component.ts:57` e `:59`: `role="status"` cria uma live region (aria-live implícito), destinada a atualizações dinâmicas — usar em conteúdo estático repetido por linha da tabela é semanticamente incorreto e ruidoso para leitores de tela. Usar `<span>`/`<strong>` com a classe visual (o texto "Pendente: …" já identifica o campo). Complementarmente, o "Carregando…" (`:28`) ficaria melhor num contêiner `aria-live="polite"`.
2. **Coluna "Bobina (m)" ausente na listagem** — `lista-cabos.component.ts:36-45`: a pendência pode apontar "bobina (m)" e o histórico exibe a coluna, mas a listagem não — o usuário vê a pendência sem conseguir conferir o valor na mesma tela, e o cenário de busca pede "os valores da versão vigente". Incluir a coluna (ou registrar a decisão de omiti-la).
3. **Código morto no serviço HTTP** — `cabos-condutores-api.service.ts:12-14` (`CaboCondutorDetalhe`) e `:26-28` (`obter`): nenhum componente consome; remover até existir uso (YAGNI), ou usar `obter()` no prefill da edição (resolveria também a nuance do minor 5).
4. **Tipo permite omitir `vigenciaInicio` obrigatória na nova versão** — `libs/dominio/src/lib/catalogos/cabos-condutores.ts:38` + `cabos-condutores-api.service.ts:38`: `POST /:id/versoes` exige `vigenciaInicio` (`CriarVersaoDto`), mas `DadosVersaoCaboCondutor.vigenciaInicio?` é opcional — o compilador não protege o chamador. Criar `DadosNovaVersaoCaboCondutor` com o campo obrigatório para o `criarVersao`.
5. **Prefill da edição usa a versão mais recente chamando-a de `vigente`** — `formulario-cabo.component.ts:192`: `historico.versoes[0]` é a versão de **maior vigência**, que pode ser futura (ainda não vigente). Pré-preencher com o estado mais recente é uma escolha defensável, mas o nome `vigente` é enganoso — renomear para `maisRecente` e registrar a escolha (vira precedente dos próximos catálogos).
6. **Espelhamento parcial da validação da API** — `formulario-cabo.component.ts:112-135`: `MaxLength(50)` do código e `MaxLength(200)` da descrição existem na API mas não no formulário; o usuário só descobre no erro do servidor. `Validators.maxLength` + mensagem pt-BR é de baixo custo.
7. **`Number(paramMap.get('id'))` sem guarda** — `historico-cabo.component.ts:64`: `id` ausente/não numérico vira `0`/`NaN` e dispara `GET .../NaN/historico` (400 da API que hoje ninguém trata — ver M2). Guarda barata junto com a correção de erro.
8. **Higiene do spec do formulário** — `formulario-cabo.component.spec.ts:33-37`: `TestBed.resetTestingModule()` manual é redundante (o TestBed se reinicializa entre testes) e `apiMock.criar.mockReturnValue(of({}))` repete o valor já definido na declaração (`:10`); inofensivo, mas ruído.
9. **Web nunca envia `X-Usuario`** — toda versão criada pela UI terá autor `"sistema"`. Coerente com o D6 (dívida até a change de autenticação), mas vale registrar que a change de autenticação precisará de um interceptor/header no `CabosCondutoresApi`, para a dívida não se perder.

## ✅ Destaques Positivos

- **Lição de datas do review anterior aplicada na UI**: a vigência (data civil em meia-noite UTC) é formatada com `date: 'dd/MM/yyyy' : 'UTC'` (`historico-cabo.component.ts:35`), imune ao off-by-one em BRT, enquanto `criadoEm` (timestamp real) é exibido no fuso local (`:42`) — distinção exata entre data civil e instante.
- **RNF-09 de ponta a ponta no formulário**: helper `ouNulo` (branco→`null`, nunca `"0"` implícito), aviso explícito na tela ("Campo em branco significa 'não informado' — diferente de zero") e teste dedicado assertando o payload (`utsKn: null`).
- **Contratos compartilhados em `libs/dominio`** com documentação das decisões (D3/RNF-08/RNF-09) no próprio arquivo — o padrão certo para os próximos catálogos consumirem.
- **Cobertura fiel aos cenários dos specs**: pendência com rótulo do campo ("Pendente: bobina (m), UTS (kN)"), item sem versão vigente sinalizado (fechando o minor 4 do review anterior), validação pt-BR de obrigatório e de decimal, histórico com autor/vigência/valores — cada cenário de UI tem um teste correspondente com asserções no DOM e no payload.
- **Acessibilidade básica bem cuidada**: todo input com `label for`/`id`, `role="search"` no form de busca, `role="alert"` nas mensagens de erro de validação, `caption` e `scope="col"` nas tabelas, `nav` com `aria-label`, `inputmode="decimal"` nos numéricos, `header`/`main` semânticos no shell.
- **Wiring correto e enxuto**: rota lazy (`loadChildren`), `provideHttpClient()` no config, proxy dev `/api`→3000 no `project.json` (dev-server), fix mínimo do `app.spec.ts` com `provideRouter([])`.
- **D4 seguido à risca**: standalone components + signals + control flow `@if`/`@for`, `HttpClient` direto, zero NgRx — estado local mínimo (3–4 signals por componente).
- **Erros do servidor exibidos em pt-BR**: o formulário mostra as mensagens do `ValidationPipe` (array → `join('; ')`), incluindo o 409 de código duplicado — os cenários de rejeição da API chegam legíveis ao usuário.

## Conformidade com Padrões

| Padrão | Status |
|-------|--------|
| Padrões de Código | ⚠️ Problemas (formatação Prettier — M1) |
| TypeScript/Node.js | ✅ Ok (minor de tipo em `DadosVersaoCaboCondutor`) |
| Angular (standalone + signals, D4) | ✅ Ok |
| REST/HTTP (consumo) | ⚠️ Problemas (leituras sem tratamento de erro — M2) |
| Domínio pt-BR (RNF-14) | ✅ Ok |
| Decimal como string (D3/RNF-08) | ✅ Ok |
| Null ≠ zero (RNF-09) | ✅ Ok |
| Acessibilidade básica | ✅ Ok (minor do `role="status"`) |
| Testes | ✅ Ok (7 verdes; faltam estados de erro — cobertos junto com M2) |
| Logging/Monitoramento | ✅ Ok (nada exigido no grupo) |

## Recomendações

1. **(M1)** Rodar `npx nx format:write` e conferir `npx nx format:check` limpo antes do commit do grupo — é o mesmo gate do CI.
2. **(M2)** Adicionar tratamento de erro nas três leituras (listagem, histórico, prefill da edição) com mensagem `role="alert"`; no formulário em edição, desabilitar o form até o prefill concluir e bloquear em caso de falha — com testes de regressão dos três estados.
3. Corrigir os minors de baixo custo junto: trocar `role="status"` por badge comum, `maxLength` espelhado no formulário, guarda do `id` no histórico, renomear `vigente` → `maisRecente` no prefill.
4. Decidir sobre a coluna "Bobina (m)" na listagem e sobre remover (ou passar a usar) `obter()`/`CaboCondutorDetalhe`; tornar `vigenciaInicio` obrigatória no tipo da nova versão.
5. Registrar a dívida do `X-Usuario` no web (interceptor futuro) junto à dívida já documentada do D6, para a change de autenticação fechar as duas pontas.

## Veredito

**APROVADO COM OBSERVAÇÕES.** O grupo 4 entrega a interface completa, aderente ao design D4/D3, com os cenários dos specs cobertos por testes e as lições de datas do review anterior corretamente aplicadas na exibição. Não há defeito crítico. Antes do commit do grupo, corrigir M1 (formatação — o CI quebraria no push) e M2 (tratamento de erro nas leituras — a falha silenciosa do prefill pode levar a uma versão imutável gravada em branco); os minors podem entrar no mesmo commit ou ficar registrados para o QA da change (task 5.1).
