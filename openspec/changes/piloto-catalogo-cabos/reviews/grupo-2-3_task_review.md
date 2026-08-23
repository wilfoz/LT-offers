# Review dos Grupos 2 e 3 — piloto-catalogo-cabos

**Revisor**: AI Code Reviewer
**Data**: 2026-08-23
**Escopo**: Grupo 2 (Modelo de dados, commit `8353e7a`) + Grupo 3 (API de cabos condutores, alterações pendentes de commit) — revisados juntos por acoplamento modelo/API
**Status**: Mudanças solicitadas

## Resumo

Os grupos entregam o modelo `CaboCondutor`/`CaboCondutorVersao` com versionamento por vigência (design D1) e o módulo NestJS `catalogos` completo: criação, nova versão, listagem com busca e pendências, resolução de vigência por data, histórico e bloqueio de alteração de versões. A arquitetura segue fielmente as decisões do design: funções puras de vigência com data como parâmetro (D2), decimais como string ponta a ponta (D3, RNF-08), `null` distinto de zero (RNF-09) e autor via `X-Usuario` com fallback (D6). Testes (27) e lint passam limpos.

A qualidade geral é alta, mas o **tratamento de datas** — o coração do contrato de vigência (RNF-05) — tem dois defeitos que persistem ou resolvem datas erradas em cenários reais, e por isso o veredito é mudanças solicitadas. As correções são pequenas e localizadas na borda (controller) e na validação de data.

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| `prisma/schema.prisma` | ✅ Ok | 1 minor |
| `prisma/migrations/20260823200637_catalogo_cabos_condutores/migration.sql` | ✅ Ok | 0 |
| `apps/api/src/catalogos/cabos-condutores.controller.ts` | ❌ Crítico | 2 críticos, 1 major, 2 minor |
| `apps/api/src/catalogos/cabos-condutores.service.ts` | ⚠️ Problemas | 1 major (compartilhado), 2 minor |
| `apps/api/src/catalogos/dto/campos-versao.dto.ts` | ⚠️ Problemas | 1 crítico (compartilhado), 1 minor |
| `apps/api/src/catalogos/dto/criar-cabo-condutor.dto.ts` | ✅ Ok | 0 |
| `apps/api/src/catalogos/dto/criar-versao.dto.ts` | ✅ Ok | 0 |
| `apps/api/src/catalogos/vigencia.ts` | ✅ Ok | 1 minor |
| `apps/api/src/catalogos/catalogos.module.ts` | ✅ Ok | 0 |
| `apps/api/src/app/prisma.module.ts` | ✅ Ok | 0 |
| `apps/api/src/app/app.module.ts` | ✅ Ok | 0 |
| `apps/api/src/main.ts` | ✅ Ok | 0 |
| `apps/api/src/catalogos/vigencia.spec.ts` | ✅ Ok | 0 |
| `apps/api/src/catalogos/cabos-condutores.service.spec.ts` | ✅ Ok | 1 minor |
| `apps/api/src/catalogos/cabos-condutores.controller.spec.ts` | ✅ Ok | 1 minor |

Verificação executada: `npx nx test api` → 5 suites, 27 testes, todos verdes. `npx nx lint api` → limpo.

## Problemas Encontrados

### ⛔ Problemas Críticos

**C1 — Fuso horário: "hoje" resolvido como timestamp UTC grava vigência no dia errado**

- Arquivos: `apps/api/src/catalogos/cabos-condutores.controller.ts:31` e `:73-83`; `apps/api/src/catalogos/cabos-condutores.service.ts:27-29`
- `criar()` passa `new Date()` (instante completo) como `hoje`, e o service o usa diretamente como `vigenciaInicio` quando o DTO não informa data. A coluna é `@db.Date` e o Prisma trunca pela data **em UTC**. No Brasil (UTC-3), qualquer criação entre 21:00 e 23:59 grava `vigencia_inicio` no **dia seguinte**: o usuário cria o cabo "hoje" e a vigência registrada é amanhã. Consequências: consulta com `?vigenteEm=<dia da criação>` retorna 404 para um item criado naquele dia, e a data de vigência exibida no histórico contradiz `criado_em` — exatamente o tipo de inconsistência que a reprodutibilidade histórica (RNF-05) não tolera. O mesmo `new Date()` em `dataReferencia()` mistura timestamp com datas-somente-dia na comparação de `resolverVersaoVigente`, fazendo uma versão com vigência "amanhã" aparecer vigente a partir das 21:00 de hoje.
- **Correção sugerida**: resolver "hoje" na borda como data civil normalizada, nunca como instante:

```ts
private hojeComoData(): Date {
  const dia = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
  }).format(new Date()); // "YYYY-MM-DD"
  return new Date(dia);
}
```

  Usar `hojeComoData()` tanto no default de `criar()` quanto no default de `dataReferencia()`. Assim todas as datas do domínio ficam em meia-noite UTC do dia civil correto, coerentes entre si. Adicionar testes cobrindo criação/consulta próximas à virada do dia.

**C2 — Datas bem formadas mas inválidas passam na validação: rollover silencioso e erro 500**

- Arquivos: `apps/api/src/catalogos/dto/campos-versao.dto.ts:4` (`PADRAO_DATA`), `apps/api/src/catalogos/cabos-condutores.service.ts:28` e `:45`, `apps/api/src/catalogos/cabos-condutores.controller.ts:77-82`
- `PADRAO_DATA = /^\d{4}-\d{2}-\d{2}$/` aceita `"2026-02-30"` e `"2026-13-45"`. Verificado em runtime:
  - `new Date('2026-02-30')` → **2026-03-02** (rollover silencioso): o sistema **persiste uma vigência diferente da enviada, sem nenhum erro** — corrupção silenciosa de dado de negócio.
  - `new Date('2026-13-45')` → `Invalid Date`: em `criar`/`criarVersao` o Prisma lança exceção → **500 Internal Server Error** para erro de entrada do usuário; em `?vigenteEm=` o `getTime()` vira `NaN`, todas as comparações falham e o cliente recebe um 404 enganoso ("Não há versão vigente") em vez de 400.
- **Correção sugerida**: após o regex, validar o calendário fazendo o round-trip:

```ts
export function converterDataValida(texto: string): Date | undefined {
  const data = new Date(texto);
  const valida =
    !Number.isNaN(data.getTime()) &&
    data.toISOString().slice(0, 10) === texto;
  return valida ? data : undefined;
}
```

  Usar no `dataReferencia()` do controller (lançando `BadRequestException` em pt-BR) e num validador customizado do DTO (`@Validate`/`registerDecorator` ou transform), para que `vigenciaInicio` inválida seja 400 com mensagem clara — nunca 500 nem data trocada.

### 🟡 Problemas Major

**M1 — `PATCH` em versão retorna 404, não 405 com orientação (cenário "Versão histórica é imutável" parcialmente descoberto)**

- Arquivo: `apps/api/src/catalogos/cabos-condutores.controller.ts:64-70`
- Empilhar `@Put(...)` e `@Patch(...)` no mesmo método não registra duas rotas no Nest: os decoradores gravam `METHOD_METADATA` no mesmo handler e o último aplicado (`@Put`, o mais externo) sobrescreve o outro. Verificado em runtime: o metadata final é `4` (PUT). Resultado: `PUT` responde 405 com a orientação correta, mas `PATCH /:id/versoes/:versaoId` cai em rota inexistente → 404 genérico, sem a orientação exigida pelo cenário do spec `versionamento-vigencia`.
- **Correção sugerida**: dois métodos separados delegando a um privado, ou `@All(':id/versoes/:versaoId')` com allowlist — e um teste de rota (e2e leve ou `supertest`) cobrindo ambos os verbos:

```ts
@Put(':id/versoes/:versaoId')
substituirVersao(): never {
  return this.rejeitarAlteracaoDeVersao();
}

@Patch(':id/versoes/:versaoId')
alterarVersao(): never {
  return this.rejeitarAlteracaoDeVersao();
}
```

**M2 — Corrida entre verificação e inserção converte duplicidade em 500**

- Arquivo: `apps/api/src/catalogos/cabos-condutores.service.ts:18-25` e `:46-53`
- `criar` e `criarVersao` fazem check-then-create sem transação. As constraints únicas (`codigo`; `caboCondutorId+vigenciaInicio`) protegem o dado, mas em requisições concorrentes a segunda estoura `P2002` do Prisma → 500, em vez do 409 com mensagem em pt-BR. 
- **Correção sugerida**: manter a pré-checagem (mensagem amigável) e envolver o `create` em `try/catch` mapeando `Prisma.PrismaClientKnownRequestError` com `code === 'P2002'` para a mesma `ConflictException`.

### 🟢 Problemas Minor

1. **Busca por descrição varre versões históricas** — `cabos-condutores.service.ts:69-75`: `versoes: { some: ... }` encontra itens cuja descrição só existia em versão antiga, embora a listagem exiba a versão vigente (o termo buscado pode nem aparecer no resultado). Alinhar a busca à versão vigente ou documentar o comportamento.
2. **`X-Usuario` vazio vira autor `""`** — `cabos-condutores.controller.ts:31` e `:61`: `usuario ?? USUARIO_PADRAO` não cobre string vazia/espaços. Usar `usuario?.trim() || USUARIO_PADRAO`.
3. **`ParseIntPipe` responde em inglês** — `cabos-condutores.controller.ts:44,51,57`: "Validation failed (numeric string is expected)" viola a convenção pt-BR (RNF-14). Usar `new ParseIntPipe({ exceptionFactory: () => new BadRequestException('O identificador deve ser um número inteiro') })` (extraível para constante do módulo).
4. **Item sem versão vigente lista `camposPendentes: []`** — `cabos-condutores.service.ts:85-93`: item cuja primeira vigência é futura aparece com `versaoVigente: null` e sem pendência alguma — na listagem "em suas versões vigentes" isso pode mascarar o estado. Decidir: excluir da listagem ou sinalizar explicitamente ("sem versão vigente").
5. **`descricao: ""` conta como informada** — `campos-versao.dto.ts:15-18` + `vigencia.ts:38-42`: string vazia passa na validação e não é apontada como pendência, uma nuance do RNF-09 (vazio ≠ informado). Normalizar `"" → null` no service ou validar `@IsNotEmpty` quando presente.
6. **Tipo `unknown | null` colapsa para `unknown`** — `vigencia.ts:21-27`: a união é inócua e o `=== null` funciona por sorte de tipagem. Tipar como `Decimal | string | null` (ou genérico) para o compilador ajudar.
7. **Índice redundante no schema** — `prisma/schema.prisma`: `@@index([caboCondutorId, vigenciaInicio(sort: Desc)])` é redundante com o índice do `@@unique([caboCondutorId, vigenciaInicio])` — o Postgres percorre índices b-tree nos dois sentidos. Inofensivo, mas duplica escrita/armazenamento.
8. **Lacunas de teste** — `historico()` (ordenação decrescente) não tem teste no service spec; o default de `dataReferencia` sem `vigenteEm` (cenário "Consulta na data atual") não é assertado em unidade — ambos ficariam cobertos junto com as correções C1/M1.
9. **Nomenclatura de método** — `historico()` (controller e service) não inicia com verbo (padrão do projeto: funções começam com verbo). `obterHistorico()` resolve sem perder o domínio pt-BR.

## ✅ Destaques Positivos

- **Funções puras de vigência com data como parâmetro** (`vigencia.ts`): nenhuma camada interna lê o relógio — fidelidade exemplar ao design D2 e ao contrato de determinismo (RNF-04). Os testes cobrem inclusive imutabilidade da lista de entrada.
- **Decimal nunca vira float**: strings validadas por regex no DTO → Prisma `Decimal` → serialização como string na resposta (decimal.js `toJSON`). RNF-08/D3 respeitados de ponta a ponta, sem nenhuma conversão numérica intermediária.
- **RNF-09 levado a sério no modelo**: colunas Decimal anuláveis, `?? null` explícito no service, `camposPendentes` distinguindo `null` de `"0"` — com teste dedicado ("distingue não informado de zero informado").
- **Imutabilidade estrutural do histórico**: nenhum `update` de versão existe no service; teste assere `update` **não** chamado ao criar versão; FK com `ON DELETE RESTRICT`; unicidade `item+vigência` no banco.
- **Modelo enxuto e aditivo** (D1): identidade separada dos dados versionados, vigência derivada (sem `vigencia_fim` materializada), migration limpa e reversível.
- **Mensagens de validação em pt-BR** consistentes nos DTOs, com fábrica `mensagemDecimal` evitando repetição.
- **`PrismaModule` global** bem aplicado, removendo o provider avulso do `AppModule` — padrão correto para os próximos módulos.
- **Testes com mocks intencionais**: asserções sobre os argumentos passados ao Prisma (autor, vigência, nulos) em vez de apenas "não explodiu".

## Conformidade com Padrões

| Padrão | Status |
|-------|--------|
| Padrões de Código | ✅ Ok (minors de nomenclatura) |
| TypeScript/Node.js | ⚠️ Problemas (tratamento de datas na borda — C1/C2) |
| NestJS | ⚠️ Problemas (rota PATCH não registrada — M1) |
| REST/HTTP | ⚠️ Problemas (500 em erro de entrada; 404 onde caberia 405/400) |
| Domínio pt-BR (RNF-14) | ✅ Ok (exceto mensagem do `ParseIntPipe`) |
| Decimal/RNF-08 | ✅ Ok |
| Null ≠ zero (RNF-09) | ✅ Ok (nuance da string vazia) |
| Testes | ⚠️ Problemas (lacunas: histórico, rotas de imutabilidade, datas-limite) |
| Logging/Monitoramento | ✅ Ok (nada exigido nos grupos) |

## Recomendações

1. **(C1)** Normalizar "hoje" como data civil na borda (`hojeComoData()` com fuso explícito) e usá-la nos defaults de `criar` e `dataReferencia`; testes cobrindo a janela 21:00–23:59 BRT.
2. **(C2)** Validar calendário além do formato (round-trip ISO) no `?vigenteEm=` (→ 400 pt-BR) e no `vigenciaInicio` dos DTOs (validador customizado) — eliminar rollover silencioso e 500.
3. **(M1)** Separar `@Put` e `@Patch` em métodos distintos e cobrir ambos com teste de rota, garantindo 405 + orientação nos dois verbos.
4. **(M2)** Mapear `P2002` para `ConflictException` nos dois pontos de criação.
5. Corrigir os minors de baixo custo junto: `X-Usuario` vazio, `ParseIntPipe` em pt-BR, tipo em `vigencia.ts`, teste de `historico()`.
6. Decidir e registrar (nem que seja no README do módulo): comportamento da busca vs. versões históricas e exibição de itens sem versão vigente — ambos viram precedente para os próximos catálogos.
7. Remover o índice redundante do schema em uma migration futura oportunista (não bloqueia).

## Veredito

**MUDANÇAS SOLICITADAS.** A arquitetura e o padrão estabelecidos pelo piloto estão corretos e bem testados — o precedente para os demais catálogos é bom. Porém, os dois defeitos críticos atingem justamente o núcleo da change (datas de vigência): C1 grava vigência no dia errado para qualquer criação noturna no fuso do Brasil e C2 persiste silenciosamente uma data diferente da enviada (ou responde 500/404 enganoso). Como as versões são imutáveis por design, uma vigência gravada errada exige intervenção manual — corrigir antes de commitar o grupo 3 e de iniciar o grupo 4 (a UI consumirá esses contratos). Após C1, C2 e M1/M2 corrigidos com testes de regressão, o grupo está apto a "Aprovado".
