# Trilha de Auditoria Specification

## Purpose

Define os requisitos e regras para a Trilha de Auditoria Imutável (Audit Trail) de modificações realizadas em dados de propostas comerciais e catálogos corporativos de Linhas de Transmissão (Módulo M12, RF-65, RNF-12).

## Requirements

### Requirement: Registro Imutável de Eventos de Mutação (RF-65, RNF-12)
O sistema SHALL registrar automaticamente e de forma append-only um evento de auditoria para toda operação de criação, alteração ou exclusão realizada em propostas, revisões, linhas, quantitativos, cotações, coeficientes ou catálogos corporativos. Cada registro de auditoria SHALL conter:
1. `id` único do evento;
2. `timestamp` em horário UTC ISO 8601;
3. `userId` e `userName` do autor da alteração;
4. `userRole` do autor no momento da ação;
5. `resource` (ex.: `OFFER`, `REVISION`, `TOWER_QUANTITY`, `PRICING_QUOTE`, `CATALOG_VIGENCY`);
6. `resourceId` e `offerId` vinculado;
7. `action` (`CREATE`, `UPDATE`, `DELETE`, `FREEZE`, `CLONE`);
8. `diff` estruturado com o estado anterior (`previousValue`) e o novo estado (`newValue`).

#### Scenario: Registro de alteração de preço unitário de fornecedor
- **WHEN** um comprador com perfil `PROCUREMENT` altera o preço do cabo condutor de R$ 45,00/m para R$ 48,50/m na cotação de uma oferta
- **THEN** o sistema grava o evento de auditoria imutável registrando autor, data UTC, recurso `PRICING_QUOTE`, valor anterior 45.00 e novo valor 48.50

---

### Requirement: Painel e Consulta Filtrada de Auditoria da Proposta (RF-65)
O sistema SHALL disponibilizar uma visualização cronológica da trilha de auditoria no contexto da proposta, permitindo ao usuário filtrar os eventos por: módulo/recurso, usuário autor, tipo de ação e intervalo de datas.

#### Scenario: Filtragem do histórico de alterações por módulo de coeficientes
- **WHEN** o gestor comercial filtra a trilha de auditoria pelo módulo "Comercial / BDI"
- **THEN** o sistema exibe a lista cronológica de todas as mudanças de taxas de BDI e margem realizadas na oferta, destacando os valores anteriores e novos
