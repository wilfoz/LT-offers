# Proposta: catalogo-equipes-trabalho

## Why

As equipes de trabalho (`Equipos`) e suas composições analíticas (`DesEquipos`) constituem o núcleo operacional do módulo de recursos (M03). Elas agrupam cargos de mão de obra (`DB_MO`) e equipamentos (`DB_EQ`) em células produtivas com taxas de produção teórica máxima para alimentar o dimensionamento do cronograma físico (M07) e os histogramas de recursos (M08). Na planilha original, `DesEquipos` continha mais de 920 mil células e 795 mil fórmulas com buscas voláteis via `OFFSET`/`COUNTIFS`, tornando a manutenção lenta e propensa a erros de vínculo. Esta mudança entrega a persistência relacional das equipes e suas composições versionadas por vigência (RNF-05), manutenção completa (CRUD), integridade referencial estável (RF-16), declaração de produções teóricas (RF-15, RN-15), precisão decimal (RNF-08), distinção de nulos/zeros (RNF-09) e interface web integrada.

## What Changes

- **Catálogo de Equipes de Trabalho (blocos `Equipos` e `DesEquipos` da planilha):**
  - Identidade corporativa da equipe (`WorkCrew`): código único (ex.: `EQ-CIV-01`, `EQ-MON-01`, `EQ-CAB-01`) e nome descritivo.
  - Versão da equipe com vigência (`WorkCrewVersion`): data de vigência (`effectiveFrom`), taxa de produção teórica padrão (`standardProductionRate`), unidade de medida da produção (`productionUnit` — ex.: `m3`, `torre`, `km`, `un`, `m`) e período base da produção (`productionPeriod` — enum: `HOUR`, `DAY`, `WEEK`, `MONTH`).
  - Composição de Mão de Obra (`WorkCrewLaborRole`): vínculo por chave estrangeira estável para `LaborRole` com quantidade decimal (`quantity` com precisão de 2 casas para alocações fracionadas ou inteiras).
  - Composição de Equipamentos (`WorkCrewEquipment`): vínculo por chave estrangeira estável para `Equipment` com quantidade decimal (`quantity`).
- **Integridade e Validações:**
  - Bloqueio de exclusão para cargos de mão de obra ou equipamentos vinculados a versões ativas de equipes (RF-11).
  - Garantia de que renomeações de cargos ou equipamentos não corrompam o vínculo das composições existentes (RF-16).
  - Sinalização de pendências em equipes sem itens de composição ou sem taxa de produção definida.
- **Interfaces Web e Contratos Compartilhados:**
  - Telas de listagem com busca, contadores agregados (total de funções e equipamentos), badges de vigência e pendências.
  - Formulário com edição dinâmica de linhas de composição (mão de obra e equipamentos), seleção via autocomplete/select e parâmetros de produção teórica.
  - Tela de histórico de versões da equipe com visualização das composições vigentes em cada data.
  - Atualização do menu de navegação lateral na seção de Catálogos.

Fase do roadmap: **F1 (M03 — Recursos de Obra: Equipes e Composições)**. Requisitos cobertos: RF-14 (composição de equipes a partir de cargos e equipamentos), RF-15 (produção teórica máxima em múltiplas unidades/períodos), RF-16 (propagação e estabilidade de vínculos ao renomear recursos), RF-11 (impedir exclusão com dependência e sinalizar pendências), RF-03 (trilha de auditoria com autor/data); RN-15; RNF-05, RNF-08, RNF-09, RNF-14.

## Capabilities

### New Capabilities

- `catalogos/equipes-trabalho`: catálogo corporativo de equipes de trabalho (`WorkCrew`), composições versionadas por vigência em cargos de mão de obra (`WorkCrewLaborRole`) e equipamentos (`WorkCrewEquipment`), e parâmetros de taxa de produção teórica máxima.

### Modified Capabilities

Nenhuma — `catalogos/versionamento-vigencia` aplica-se integralmente às equipes e composições sem alteração dos seus requisitos fundamentais.

## Impact

- **Código:**
  - Modelos Prisma: `WorkCrew`, `WorkCrewVersion`, `WorkCrewLaborRole`, `WorkCrewEquipment`; enum `ProductionPeriod`; migration aditiva correspondente.
  - Contratos na `libs/domain` (`libs/domain/src/lib/catalogs/work-crews.ts`).
  - Backend API (`apps/api/src/catalogs/work-crews/`): controller, service, module, DTOs e testes unitários.
  - Frontend Web (`apps/web/src/app/catalogs/`): API client, componentes de lista, formulário com tabela dinâmica e histórico de versões, rotas e navegação.
- **Nomenclatura (README.md):** Adicionar termos de equipes de trabalho e composições ao mapa canônico.
- **Dependências:** Nenhuma biblioteca externa nova.
