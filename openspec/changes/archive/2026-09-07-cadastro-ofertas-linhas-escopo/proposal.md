## Why

A orçamentação de propostas EPC de linhas de transmissão depende fundamentalmente da definição do lote, das linhas de transmissão que o compõem, das premissas de prazo/leilão e da matriz de responsabilidade de escopo (origem: abas `Info&Cond`, `Datos` e `Aux` da planilha — Módulo M01, requisitos RF-01 a RF-06, regras RN-01 a RN-04). Na planilha original, a estrutura é restrita a 10 linhas pré-alocadas com fórmulas voláteis e sem histórico estruturado de revisões. Esta change implementa o núcleo de gestão de ofertas, revisões versionadas, linhas de transmissão ilimitadas (1 a $n$) e matriz de responsabilidade de escopo com 4 eixos, servindo de fundação para o estaqueamento (M04) e os cálculos de quantitativos e custos (M05+).

## What Changes

- **Modelo de Dados e Entidades (`prisma/schema.prisma`)**:
  - `Offer`: entidade raiz com identificação do leilão, lote, cliente, datas-chave (oferta, leilão, início de cronograma, entrada em operação), CAPEX estimado ANEEL, RAP máxima e vencedora, moeda base e metadados de auditoria (RF-01, RF-03).
  - `OfferRevision`: versionamento imutável de propostas (R0, R1, R2...) com número da revisão, data de fechamento, data de entrega, autor e notas de revisão (RF-02, RF-03).
  - `TransmissionLine`: parametrização de linhas do lote (1 a $n$, sem o limite de 10 — RNF-03) com nome, tensão nominal, extensão refinada e de relatório (km), número de circuitos, condutores por fase e até duas UFs de destino com percentual de rateio (RF-05, RN-01).
  - `ScopeMatrixItem`: matriz de responsabilidade com itens padronizados de escopo e os quatro eixos de avaliação: responsável (*Contratada* vs *Cliente*), aceite de faturamento direto com REIDI, alocação de risco cambial e risco de commodity (RF-04, RN-03, RN-04).
  - Suporte à clonagem completa de oferta para nova proposta com rastreabilidade da origem (RF-06).
- **Contratos de Domínio (`libs/domain`)**:
  - Tipos e interfaces de `Offer`, `OfferRevision`, `TransmissionLine`, `ScopeMatrixItem`, enums de escopo e DTOs de criação, atualização e clonagem.
- **Backend API (`apps/api`)**:
  - Módulo `offers` com serviços, controllers REST, DTOs validados via `class-validator` com mensagens em pt-BR, transações atômicas de revisão/linhas/escopo e testes unitários/integração.
- **Frontend Web (`apps/web`)**:
  - Interface no padrão Swiss Design System / Angular Material (Material 3 tokens, densidade -1) com listagem de ofertas, visualizador de revisões, configurador de linhas e editor dinâmico da matriz de responsabilidade.
  - Atualização da casca de navegação (`app.ts` / `app.html`).

## Capabilities

### New Capabilities

- `ofertas/cadastro-revisoes-linhas`: Cadastro e gestão de ofertas de leilão, histórico de revisões com auditoria, configuração de linhas de transmissão do lote (1..n) e matriz de responsabilidade de escopo (RF-01 a RF-06, RN-01 a RN-04, RNF-03, RNF-05, RNF-08, RNF-09).

### Modified Capabilities

*(Nenhuma capacidade existente alterada; esta change introduz o domínio de ofertas).*

## Impact

- **Banco de Dados**: Novas tabelas `Offer`, `OfferRevision`, `TransmissionLine`, `ScopeMatrixItem` e relações associadas.
- **Contratos `@lt-offers/domain`**: Novos contratos exportados para consumo compartilhado entre backend, motor de cálculo e web.
- **API NestJS**: Novo módulo `OffersModule` registrado em `AppModule`.
- **Frontend Angular**: Novas rotas `/offers` e item de navegação no menu lateral.
- **Roadmap**: Conclui o Módulo M01 e estabelece a ponte para a Fase F2 (Estaqueamento M04 e Quantitativos M05).
