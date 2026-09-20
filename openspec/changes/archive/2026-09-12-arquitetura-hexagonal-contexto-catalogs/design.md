## Context

O bounded context de Catálogos de Engenharia (`apps/api/src/catalogs/`, Fase F1, Módulo M01) fornece os parâmetros técnicos e quantitativos de referência para todo o motor de cálculo da aplicação (torres, cabos condutores, cabos para-raios/OPGW, contrapeso, isoladores, solo, fundações, volumes, custos fixos, equipes, cargos e equipamentos).

Todas as entidades de catálogo seguem o princípio de **Imutabilidade e Vigência Temporal** (**RNF-05**):
1. Um item de catálogo possui um código único e imutável (ex.: `GROSBEAK`, `ESTAIADO-V1`, `TUBULAO-ROCHA`).
2. O item possui um histórico cronológico de versões (`ItemVersion`), onde cada versão tem uma data inicial de vigência (`effectiveFrom`) e data final opcional (`effectiveTo`).
3. Uma versão é considerada ativa para uma proposta se `effectiveFrom <= offerDate <= (effectiveTo ?? Infinity)`.
4. Valores técnicos não informados devem ser explicitamente identificados como pendentes (**RNF-09**), nunca convertidos silenciosamente para zero.

A refatoração segue a estrutura adotada com sucesso no contexto `offers`, organizando `apps/api/src/contexts/catalogs/` em três camadas estritas: `domain/`, `application/` e `infrastructure/`.

## Goals / Non-Goals

**Goals:**
- **Isolamento de Domínio Puro (`domain/`)**: Entidades com encapsulamento de invariantes, vigência temporal (`isEffectiveAt`, `closeEffectiveness`), detecção de pendências e criação de novas versões.
- **Portas Abstratas (`domain/ports/`)**: Interfaces desacopladas para repositórios e Unit of Work (`CatalogsUnitOfWork`), expostas via tokens `Symbol`.
- **Casos de Uso Independentes (`application/usecases/`)**: Implementação de fluxos de consulta e mutação desacoplados do NestJS e Prisma, validados por testes unitários com repositórios em memória.
- **Adaptadores de Infraestrutura (`infrastructure/`)**:
  - Repositórios Prisma encapsulados com mappers bidirecionais.
  - Controllers NestJS delegando para os Casos de Uso e DTOs tipados com `class-validator`.
  - Presenters HTTP garantindo formatação de strings decimais e datas ISO.
- **100% de Compatibilidade Contratual**: Nenhuma alteração nas rotas HTTP (`/api/catalogs/*`), schemas de payload ou respostas JSON.

**Non-Goals:**
- Não alterar o schema do Prisma (`schema.prisma`) ou criar novas tabelas/migrations no banco de dados.
- Não alterar a interface visual Angular nem os serviços de cliente HTTP do frontend (`apps/web`).
- Não alterar as regras matemáticas do motor de cálculo (`@lt-offers/calc-engine`).

## Decisions

### 1. Organização dos 12 Catálogos em Sub-agrupamentos Coesos
- **Decisão**: Organizar as entidades e portas de repositório em 4 famílias conceituais de catálogos dentro do domínio:
  1. `cables/`: Cabos Condutores (`ConductorCable`), Cabos Para-Raios (`GroundWire`), Cabos Contrapeso (`GuyWire`), Isoladores (`Insulator`).
  2. `structures/`: Séries Estruturais (`StructureSeries`), Tipos de Torre (`TowerType`).
  3. `geotech/`: Tipos de Solo (`SoilType`), Tipos de Fundação (`FoundationType`), Volumes de Fundação (`FoundationVolume`).
  4. `operational/`: Custos Fixos (`FixedCost`), Equipes de Montagem (`WorkCrew`), Cargos de Mão de Obra (`LaborRole`), Equipamentos (`Equipment`).
- **Racional**: Evita a criação de 12 subpastas excessivamente fragmentadas, mantendo coesão de domínio por disciplina de engenharia e permitindo casos de uso genéricos ou especializados reutilizáveis.
- **Alternativa Considerada**: Criar uma única pasta plana com 12 arquivos de entidade ou criar 12 módulos NestJS separados (rejeitado por dispersão e complexidade desnecessária).

### 2. Value Object de Vigência Temporal (`EffectivePeriod` e `CivilDate`)
- **Decisão**: Criar o Value Object `EffectivePeriod` no domínio puro contendo a data inicial `effectiveFrom` e data final `effectiveTo` (como string ISO `YYYY-MM-DD` ou `CivilDate`), com o método `isEffectiveAt(date: string): boolean`.
- **Racional**: Centraliza a lógica de vigência temporal de **RNF-05** no domínio, tornando impossível criar versões com intervalos inválidos (`effectiveTo < effectiveFrom`) ou falhas de sobreposição.
- **Alternativa Considerada**: Manter funções auxiliares soltas como em `civil-date.ts` (rejeitado para garantir orientação a objetos rica).

### 3. Padrão Unit of Work (`CatalogsUnitOfWork`)
- **Decisão**: Definir a porta `CatalogsUnitOfWork` com token `Symbol('CATALOGS_UNIT_OF_WORK_TOKEN')`, implementada no Prisma via `prisma.$transaction`.
- **Racional**: Permite que a criação de uma nova versão e o encerramento da vigência da versão anterior (`closeEffectiveness`) ocorram de forma atômica, prevenindo inconsistências temporais no catálogo.
- **Alternativa Considerada**: Deixar transações abertas nos serviços (rejeitado por acoplar o domínio ao Prisma).

### 4. Mapeamento Prisma <-> Domínio (`PrismaCatalogMappers`)
- **Decisão**: Mappers dedicados que convertem tipos `Prisma.Decimal` em instâncias ricas ou strings formatadas, tratando campos nulos vs zero de forma determinística conforme **RNF-09**.
- **Racional**: Garante que o domínio e os casos de uso nunca dependam de classes ou tipos proprietários do Prisma Client.

## Risks / Trade-offs

- **[Risco] Volume de código e arquivos**: 12 tipos de catálogos podem gerar repetição de boilerplate caso cada um possua dezenas de classes idênticas.
  - **Mitigação**: Utilizar padrões de fábrica genéricos ou interfaces base compartilhadas de catálogo versionado (`BaseCatalogEntity<TVersion>`), mantendo tipagem estrita para cada disciplina.
- **[Risco] Regressão nas rotas HTTP do frontend**: Se algum campo JSON ou formato de data for alterado, o frontend e os testes E2E falhariam.
  - **Mitigação**: Testar a compatibilidade contra a suíte de 534 testes da API e 10 testes E2E do Playwright a cada etapa.
