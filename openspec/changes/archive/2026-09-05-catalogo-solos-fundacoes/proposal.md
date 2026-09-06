# Proposta: catalogo-solos-fundacoes

## Why

O catálogo de solos e fundações (`DB_FUN`) é o sexto catálogo corporativo do M02 e o único com requisito funcional dedicado ainda não coberto: o RF-09 (obrigatório) pede o catálogo de tipos de solo com parâmetros geotécnicos e faixa de NSPT **e** a matriz solo × tipo de fundação com volumes e armaduras — a tabela paramétrica que alimenta o motor de fundações (RN-13) e é hoje "atualizada a mão" a partir do projeto de fundações (§10). A inspeção direta da aba `DB_FUN` (2.070 linhas) revelou três blocos: 10 tipos de solo com parâmetros geotécnicos, ~52 tipos de fundação com aplicação e composição por elemento, e a matriz de volumes com ~2.010 combinações **torre × solo × fundação** — ou seja, a matriz referencia também o catálogo de séries/torres já entregue, não apenas solo × fundação como o resumo do levantamento sugere. Decisão do usuário nesta proposta: **RF-09 completo**, incluindo a matriz.

## What Changes

- **Catálogo de tipos de solo (bloco `SUELOS` da `DB_FUN`):**
  - Catálogo plano, um par item + versões (precedente `Insulator`), identidade = código (I, II, III, IV, IVS, R, E, IA, IIA, IIIA — texto livre, a planilha não fecha a lista).
  - Atributos versionados: descrição, submerso, tensão admissível à compressão (kgf/cm²), peso específico (kgf/m³), ângulo de atrito interno (°), coesão (kg/cm²) e faixa de NSPT como par mínimo/máximo inteiro (os dados são uniformemente `x≤N<y`; rocha sem faixa → não informado).
- **Catálogo de tipos de fundação (bloco `TIPOS FUNDACIONES`):**
  - Catálogo plano com identidade = sigla (obrigatória, única no catálogo — ex.: `4FZ`, `1PR - 4P`) e **aplicação como atributo de identidade imutável** (enum `Autoportante | Estaiada | Crossrope`, enumerado nos ~52 tipos da planilha; imutável após criação, precedente `GroundWire.type`/`TowerType.function` — a unicidade é da sigla sozinha).
  - Atributos versionados: descrição e a composição em contagens por elemento de fundação (17 elementos da planilha: fuste sapata, preformado mastro/tirante, pilas reta/campana/com laje e variantes tirante, ancoragem em rocha, estacas concreto/metálica/raiz, helicoidal mastro/tirante, tricone, micropilote, hélice contínua) — inteiros ≥ 0 anuláveis, null ≠ zero (RNF-09).
- **Matriz de volumes por combinação (bloco `VOLUMENES POR TORRE`):**
  - Item = combinação única **tipo de torre (FK ao catálogo `series-torres`) × tipo de solo × tipo de fundação**; versões por vigência com ~34 quantidades decimais anuláveis (escavação por dureza × elemento, perfuração de pernos, aço por elemento, concreto por elemento, regeneração, grout, reaterro e reaterro solo-cimento, formas, metragens de estacas especiais).
  - Manutenção por combinação: listagem com filtros por torre/solo/fundação, formulário agrupado por família de quantidade, histórico. Cadastro manual (importação em massa fica fora — ver abaixo).
- **Reuso integral da base extraída** (patterns de validação e `decimalScaleViolation` da `domain`, helpers `catalogs/*` da API, mappers tipados, `VersionedCatalogApi`/`form-utils` no web) nos dois catálogos planos; a matriz segue o padrão com API própria (três FKs na identidade — variação registrada no design).
- **Fora do escopo:** importação Excel das ~2.010 linhas da matriz (cadastro manual das combinações necessárias às primeiras ofertas; importação em massa é change futura — risco registrado no design); o cruzamento solo × estrutura → fundação do estaqueamento (RF-19/RF-20) e o cálculo de volumes com sobre-escavação e desperdício (RF-24, RN-12 — parâmetros vivem em `Datos`, não na `DB_FUN`); validação de aplicabilidade coluna × composição na matriz (a própria planilha mistura zero e vazio sem regra); demais catálogos M03 (cargos, equipamentos, custos fixos); a parte de RF-11 "impedir exclusão de item referenciado por oferta ativa" (não há ofertas); autenticação (segue `X-User`, dívida D6 do piloto).

Fase do roadmap: **F1 (M02, conclusão dos catálogos de engenharia)**. Requisitos cobertos: RF-09 (integral), RF-10, RF-11 (parcial), RF-03; RN-13 (parcial — esta change entrega a tabela paramétrica; o cruzamento por torre é consumo futuro do estaqueamento); RNF-05, RNF-08, RNF-09, RNF-14.

## Capabilities

### New Capabilities

- `catalogos/solos-fundacoes`: tipos de solo, tipos de fundação e matriz de volumes por combinação torre × solo × fundação — atributos, validações, manutenção (CRUD), busca/filtros, sinalização de pendências e histórico.

### Modified Capabilities

Nenhuma — `catalogos/versionamento-vigencia` aplica-se integralmente aos três recursos novos sem delta; `catalogos/series-torres` não muda de comportamento (a matriz apenas referencia tipos de torre existentes).

## Impact

- **Código:**
  - Modelos Prisma `SoilType`/`SoilTypeVersion`, `FoundationType`/`FoundationTypeVersion`, `FoundationVolume`/`FoundationVolumeVersion` + enum `FoundationApplication`; migration aditiva; FK de `FoundationVolume` para `TowerType`, `SoilType` e `FoundationType`.
  - API: `soil-types.*`, `foundation-types.*` e `foundation-volumes.*` (controller/service/module + DTOs) em `apps/api/src/catalogs/`, reusando `prisma-errors.ts`, `controller-shared.ts`, `effectiveness.ts` (`missingFields`), `dto/decimal-scale.validators.ts` e `dto/validation-messages.ts`.
  - Web: componentes de listagem/formulário/histórico dos três recursos; `SoilTypesApi`/`FoundationTypesApi` estendendo `VersionedCatalogApi`; API própria para a matriz (URL fixa mas identidade composta — limite conhecido da base); rotas lazy em `catalogs.routes.ts`; itens de menu na casca (o teste da casca asserta a lista exata do menu — atualizar).
  - Domain: contratos `soil-types.ts`, `foundation-types.ts`, `foundation-volumes.ts` em `libs/domain` (const-array da aplicação, precedente `GROUND_WIRE_TYPES`).
- **API observável:** apenas rotas novas (`/catalogs/soil-types…`, `/catalogs/foundation-types…`, `/catalogs/foundation-volumes…`); nada existente muda.
- **Nomenclatura:** bloco novo no mapa canônico do README — solo → `SoilType`/`soil-types`; submerso → `submerged`; tensão admissível à compressão → `allowableCompressionStressKgfCm2`; peso específico → `specificWeightKgfM3`; ângulo de atrito interno → `internalFrictionAngleDeg`; coesão → `cohesionKgCm2`; faixa de NSPT → `nsptMin`/`nsptMax`; tipo de fundação → `FoundationType`/`foundation-types`; aplicação → `FoundationApplication {SELF_SUPPORTING, GUYED, CROSS_ROPE}`; matriz de volumes → `FoundationVolume`/`foundation-volumes`; mapa completo dos 17 elementos e ~34 quantidades no design (D5) e no README antes do código.
- **Configuração/dependências:** nenhuma nova.
- **Premissas registradas (hipóteses §02, modelo aditivo como nas changes anteriores):**
  1. Unidades da matriz inferidas e não confirmadas com os autores: escavação/concreto/regeneração/grout/reaterro em m³, aço em kg, formas em m², perfuração de pernos e metragens de estaca em m (a planilha não declara unidades nos cabeçalhos; a nota `3.8 kg/m perforación` sustenta perfuração em metros).
  2. Aplicação do tipo de fundação como enum de três valores — enumerada nos dados reais (52 tipos), diferente do caso isoladores em que enum seria especulativo.
  3. Faixa de NSPT estruturada como `nsptMin`/`nsptMax` (limite inferior inclusivo, superior exclusivo), em vez de texto livre — os 10 solos seguem o mesmo padrão `x≤N<y`.
  4. Composição do tipo de fundação e quantidades da matriz como colunas fixas espelhando a planilha (17 + ~34), não como tabela filha genérica elemento × quantidade.
  5. Submerso como booleano anulável; o solo "Especial" (marcado `Sí/No` na planilha) pode ser cadastrado em duas entradas se as variantes forem necessárias — a planilha já faz isso com I/IA, II/IIA, III/IIIA.
  6. Pendência da matriz = versão sem nenhuma quantidade informada (todas nulas); não há sinalização por coluna, pois a aplicabilidade de cada coluna depende da composição da fundação e a planilha não tem essa regra.
