# Design - Arquitetura Hexagonal no Contexto Electromechanical

## Context

O contexto calcula quantitativos eletromecânicos por linha (torres por tipo, cabos condutores/para-raios por vão com flechas e perdas, ferragens, cadeias de isoladores, acessos) a partir do estaqueamento (torres cadastradas ou distribuição preliminar) e dos catálogos vigentes, com rastreabilidade item a item. Estruturalmente é um gêmeo de `foundations`: leitura por portas, cálculo 100% no motor, sem escrita própria. O design replica as decisões da change de foundations, que passou por review e QA sem críticos.

## Goals / Non-Goals

**Goals:**
- Bounded context em `contexts/electromechanical/` com as três camadas e portas de consulta separadas por origem (dados da linha × catálogos), espelhando `LineFoundationsQueryPort`/`FoundationVolumeMatricesQueryPort`.
- Casos de uso puros testados com dublês em memória; datas de vigência de catálogo recebidas como parâmetro (RNF-04/RNF-05).
- Contratos HTTP preservados byte a byte.

**Non-Goals:**
- Não alterar fórmulas do motor nem schema/migrations.
- Não criar fachada — nenhum módulo interno consome `electromechanical` hoje; a fachada nasce quando houver consumidor.

## Decisions

### 1. Duas portas de consulta, separadas por origem do dado
`LineElectromechanicalQueryPort` (linha, torres, distribuição preliminar) e `ElectromechanicalCatalogsQueryPort` (cabos, isoladores, séries vigentes na data de referência). Precedente direto de foundations (decisão 1 daquela change): portas por origem mantêm os dublês de teste pequenos e o adaptador Prisma coeso.

### 2. Sem fachada e sem unit of work
Contexto somente-leitura sem consumidores internos: exportar fachada agora seria superfície sem contrato. Se `pricing` ou `export` vierem a precisar de quantitativos eletromecânicos consolidados, a fachada entra na change do consumidor.

### 3. Rastreabilidade como caso de uso próprio
`GetLineElectromechanicalTraceabilityUseCase` separado do cálculo principal, espelhando `GetLineFoundationTraceabilityUseCase` — a memória de cálculo (RF-27) tem envelope e consumidor próprios na web.

## Risks / Trade-offs

- **Risco**: catálogos consultados por vigência — regressão silenciosa se o adaptador não repassar a data de referência da borda. **Mitigação**: teste de use case fixando data e assertando o repasse à porta.
- **Risco**: erros de infraestrutura invisíveis aos testes puros — `npx nx build api` obrigatório na integração.
