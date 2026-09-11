## Context

Ver `proposal.md` para motivação e enquadramento na Fase F6.2 do roadmap (Módulo M12, RF-64, RF-65, RNF-12, RNF-17).
O sistema atual possui todos os motores de cálculo e interfaces de orçamentação operacionais, porém sem restrição de acesso por perfil nem registro histórico de quem alterou cada dado técnico ou comercial.

## Goals / Non-Goals

**Goals:**
- Implementar modelo canônico de perfis de usuário (`UserRole`: `ENGINEERING`, `PROCUREMENT`, `PLANNING`, `COMMERCIAL`, `ADMIN`) e matriz de escopos de permissão (`PermissionScope`).
- Desenvolver `RolesGuard` e decorador `@Roles(...)` no NestJS para proteção declarativa de rotas da API.
- Desenvolver `AuditInterceptor` e `AuditService` no NestJS para captura append-only de eventos de auditoria com diff de valores (`previousValue` vs `newValue`) e timestamp UTC.
- Implementar proteção no frontend Angular com simulação de sessão ativa (`AuthService`), alternador visual de perfil no cabeçalho e ocultação/bloqueio de abas e campos confidenciais de margem (RNF-17).
- Criar a aba e componente `OfferAuditComponent` com listagem e filtragem dos eventos de auditoria da proposta.

**Non-Goals:**
- Integração com provedor externo de autenticação corporativa SAML/OAuth2/Azure AD (o sistema fornecerá a camada de sessão agnóstica a provedores, mantendo a autenticação corporativa aberta para configuração em ambiente de produção).
- Geração de arquivos contratuais XLSX ou integração com layouts de edital (reservado para a Fase F6.3).
- Alteração nas fórmulas ou algoritmos do motor de cálculo (`libs/calc-engine`).

## Decisions

### Decisão 1: Matriz de Permissões baseada em Escopos Funcionais
- **Escolha:** Associar cada `UserRole` a uma lista de `PermissionScope` (`OFFER_WRITE`, `ENGINEERING_WRITE`, `PRICING_WRITE`, `SCHEDULE_WRITE`, `COMMERCIAL_WRITE`, `COMMERCIAL_READ_SENSITIVE`, `CATALOG_WRITE`, `AUDIT_READ`).
- **Alternativa considerada:** Regras *hardcoded* por nome de rota no código.
- **Racional:** Desacopla a camada de proteção de rotas da nomenclatura dos papéis, permitindo evoluções futuras na atribuição de permissões sem refatorar controllers.

### Decisão 2: Captura Não Invasiva de Auditoria via Interceptor NestJS
- **Escolha:** Utilizar um `AuditInterceptor` global que inspeciona requisições mutantes (`POST`, `PUT`, `PATCH`, `DELETE`) em rotas marcadas com o decorador `@Audited({ resource: '...' })`.
- **Alternativa considerada:** Inserir chamadas manuais de `auditService.log(...)` em cada método de cada serviço.
- **Racional:** Garante cobertura integral e consistente da trilha de auditoria (RF-65, RNF-12) sem poluir a lógica de negócio dos serviços.

### Decisão 3: Simulação de Sessão e Seletor de Perfil na Aplicação Web
- **Escolha:** Criar um `AuthService` reativo em `apps/web` com mock de usuários pré-cadastrados para cada papel (`Eng. Carlos`, `Compradora Ana`, `Plan. Roberto`, `Dir. Comercial Marcos`, `Admin Lucas`) e alternador no topo da aplicação.
- **Alternativa considerada:** Forçar login com senha fixa a cada teste de permissão.
- **Racional:** Agiliza a validação funcional e testes manuais da interface, demonstrando imediatamente a reatividade de permissões e o mascaramento de margens confidenciais.

### Decisão 4: Mascaramento Seguro de Margem e BDI (RNF-17)
- **Escolha:** Omitir/mascarar no backend os campos de margem líquida e preço de venda quando a requisição for feita por perfis técnicos, e no frontend aplicar a diretiva/guarda de confidencialidade comercial.
- **Alternativa considerada:** Apenas ocultar via CSS `display: none` no Angular.
- **Racional:** Evita vazamento de informações comerciais estratégicas mesmo se o usuário inspecionar o tráfego HTTP.

## Risks / Trade-offs

- **[Risco] Sobrecarga de auditoria em edições contínuas de estaqueamento** → *Mitigação:* Agrupar mutações em lote por transação de salvamento, registrando o sumário da alteração no evento de auditoria em vez de um evento por célula editada.
- **[Risco] Usuário técnico bloqueado de visualizar o impacto global da obra** → *Mitigação:* Manter acesso de leitura aos totais físicos e custos diretos da linha para todos os perfis, ocultando estritamente os coeficientes de venda, BDI e margem de lucro líquido.
