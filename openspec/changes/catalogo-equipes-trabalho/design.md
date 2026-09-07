# Design Técnico: catalogo-equipes-trabalho

## Context

O catálogo de equipes de trabalho conecta os cargos de mão de obra (`LaborRole`) e equipamentos (`Equipment`) já implementados e persistidos no banco de dados com versionamento por vigência (RNF-05). Na planilha original, a composição analítica das equipes era mantida na aba `DesEquipos` (a maior do modelo, com 920 mil células) e alimentava a aba `Equipos` com os custos diários e taxas de produção teórica para o cronograma (M07). Veja a motivação detalhada em [proposal.md](file:///c:/Users/wilwa/Desktop/Developer/offer/openspec/changes/catalogo-equipes-trabalho/proposal.md).

## Goals / Non-Goals

**Goals:**
- Implementar a persistência relacional de `WorkCrew` com versões imutáveis (`WorkCrewVersion`) e listas filhas de composição (`WorkCrewLaborRole` e `WorkCrewEquipment`).
- Suportar a declaração de taxas de produção teórica máxima com unidade e período (`HOUR`, `DAY`, `WEEK`, `MONTH`) para posterior validação no cronograma M07 (RF-15, RN-15).
- Garantir estabilidade de vínculos relacionais por chaves primárias numéricas estáveis, evitando qualquer quebra em renomeações (RF-16).
- Proteger contra exclusão de cargos ou equipamentos vinculados a versões de equipes (RF-11).
- Entregar interface web rica e responsiva seguindo o padrão Swiss / Angular Material, com tabelas dinâmicas de composição.

**Non-Goals:**
- Alocação de equipes mês a mês no cronograma físico (escopo de M07 — Fase F4).
- Ajuste de produtividade climática por índice pluviométrico (escopo de M07 — Fase F4, RN-16).
- Cálculo consolidado de folha de pagamento ou custos regionais de canteiro (M07 / M08).

## Decisions

### D1: Estrutura de Modelagem e Versionamento (Mestre-Detalhe em Dois Níveis com Listas Filhas)
- **Decisão:** A versão da equipe (`WorkCrewVersion`) contém os metadados de vigência e produção teórica, além de possuir tabelas de junção filhas (`WorkCrewLaborRole` e `WorkCrewEquipment`) que são criadas atomicamente com a versão e imutáveis com ela.
- **Rationale:** Segue a decisão arquitetural RNF-05 (versões imutáveis). Uma nova vigência de equipe cria um novo registro de `WorkCrewVersion` e copia/cria os itens de composição associados, garantindo que propostas antigas referenciando a versão anterior não sofram mutação retroativa.
- **Alternativas consideradas:**
  - *Composição em JSON no corpo da versão:* Rejeitado porque impede integridade referencial via Foreign Key com `LaborRole` e `Equipment` e dificulta consultas de dependência reversa (RF-11).

### D2: Precisão Numérica das Quantidades de Recursos
- **Decisão:** As quantidades de mão de obra e equipamentos na composição serão armazenadas como `Decimal(6, 2)` (`quantity`), com validação de valor estritamente positivo ($> 0$).
- **Rationale:** Permite equipes com compartilhamento de profissionais ou máquinas fracionadas (ex.: $0{,}5$ encarregado para duas frentes de trabalho ou maquinário compartilhado).
- **Alternativas consideradas:**
  - *Inteiro puro (`Int`):* Rejeitado porque engessaria composições de equipes com funções compartilhadas ou dedicadas em tempo parcial.

### D3: Integração e Bloqueio de Exclusão (RF-11)
- **Decisão:** Nos serviços de `LaborRolesService` e `EquipmentService`, antes de excluir um item do catálogo, verificar a existência de vínculos em `WorkCrewLaborRole` e `WorkCrewEquipment`. Se existir vínculo, retornar `ConflictException` (HTTP 409) com mensagem explicativa em português.
- **Rationale:** Atende explicitamente a RF-11 e garante que o catálogo corporativo mantenha sua integridade.

### D4: Interface Web com Formulário de Composição Dinâmica
- **Decisão:** No formulário `WorkCrewFormComponent`, as composições de cargos e equipamentos serão gerenciadas como `FormArray` do Reactive Forms do Angular, com autocomplete/select dos recursos cadastrados, campo de quantidade com máscara decimal e botões rápidos de adicionar/remover linha.
- **Rationale:** Proporciona ergonomia superior ao preenchimento de composições analíticas sem exigir navegação em múltiplas telas.

## Risks / Trade-offs

- **[Risco: Volume de itens ao duplicar versões]** $\rightarrow$ *Mitigação:* Cada equipe tem em média 3 a 10 itens de composição; a criação de novas versões ocorre com baixa frequência (apenas em reajustes ou revisões de produtividade), gerando impacto desprezível de armazenamento no PostgreSQL.
- **[Risco: Deleção acidental de linhas de composição no frontend]** $\rightarrow$ *Mitigação:* As alterações só são persistidas no backend ao clicar explicitamente em "Salvar", com validações bloqueantes no cliente e no servidor.

## Migration Plan

1. Atualização do `prisma/schema.prisma` com os novos modelos e enums (`WorkCrew`, `WorkCrewVersion`, `WorkCrewLaborRole`, `WorkCrewEquipment`, `ProductionPeriod`).
2. Execução de migration Prisma: `npx prisma migrate dev --name add-work-crews-catalog`.
3. Adição das relações reversas nos modelos existentes (`LaborRole` e `Equipment`).
