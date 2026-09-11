## Why

Na planilha original ("Calculo LT"), inexiste segregação de funções ou controle de acesso: qualquer usuário com acesso ao arquivo podia alterar simultaneamente quantitativos de engenharia, cotações de suprimentos, coeficientes de BDI ou margens de lucro sem qualquer registro de autoria (AQ-09). Para atender à governança corporativa, segurança e auditabilidade requeridas pelo setor elétrico (M12, RF-64, RF-65, RNF-12, RNF-17), esta mudança (Fase F6.2 do roadmap) introduz controle de acesso baseado em funções (RBAC), restrição de visibilidade de margens comerciais e trilha de auditoria imutável de todas as alterações em dados de ofertas e catálogos.

## What Changes

- **Perfis de Acesso Canônicos (RBAC - RF-64):** Definição formal dos papéis `ENGINEERING` (Engenharia/Quantitativos), `PROCUREMENT` (Suprimentos/Preços/Tributos), `PLANNING` (Planejamento/Cronograma/Histogramas), `COMMERCIAL` (Comercial/Coeficientes K/Margem/Riscos) e `ADMIN` (Administrador de Catálogos e Sistema).
- **Autorização Granular e Restrição de Dados Confidenciais (RNF-17):** Bloqueio de edição por rota/módulo de acordo com o perfil e ocultação de campos confidenciais (margem líquida, preço de venda e composição de lucro) para perfis técnicos.
- **Trilha de Auditoria Imutável (RF-65, RNF-12):** Captura automática de eventos de mutação em ofertas, revisões e catálogos, registrando autor, timestamp UTC, recurso, campo alterado, valor anterior e valor novo.
- **Painel e Consulta de Auditoria:** Visualização cronológica do histórico de modificações de uma proposta, permitindo filtrar por módulo, usuário e intervalo de datas.
- **Contexto de Sessão e Simulação de Usuário na UI:** Cabeçalho com indicador de usuário/perfil ativo e alternador de perfil para validação de escopos em ambiente de homologação.

## Capabilities

### New Capabilities

- `governanca-rbac`: Define as regras de controle de acesso por perfil (RBAC), autorização por módulo e proteção de dados comerciais confidenciais (RF-64, RNF-17).
- `trilha-auditoria`: Define o registro imutável e a consulta cronológica de alterações em ofertas, revisões e catálogos corporativos (RF-65, RNF-12).

### Modified Capabilities

- `ofertas/cadastro-revisoes-linhas`: Modifica a gestão de revisões para associar o autor logado às alterações e alimentar a trilha de auditoria na criação e transição de revisões (RF-65).

## Impact

- **libs/domain:** Novos modelos `UserProfile`, `UserRole`, `PermissionScope`, `AuditEvent`, `AuditDiff` e contratos de governança.
- **apps/api:** Guards de autorização (`RolesGuard`), decoradores (`@Roles`, `@CurrentUser`), interceptor global de auditoria (`AuditInterceptor`), serviço e controlador de auditoria (`AuditService`, `AuditController`).
- **apps/web:** Serviço de autenticação/perfil simulado (`AuthService`), guard de rotas, diretivas/pipes de permissão e componente visual de trilha de auditoria (`OfferAuditComponent`).
- **Compatibilidade:** Sem quebra em módulos de cálculo existentes (`libs/calc-engine`), estendendo apenas a camada de controle e persistência.
