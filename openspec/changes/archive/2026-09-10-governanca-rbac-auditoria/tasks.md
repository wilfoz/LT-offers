## 1. Modelos de Domínio e Contratos (libs/domain)

- [x] 1.1 Adicionar modelos de perfis e escopos de permissão (`UserRole`, `PermissionScope`, `UserProfile`, `ROLE_PERMISSIONS_MAP`) em `libs/domain`
- [x] 1.2 Adicionar modelos de eventos e registros de auditoria imutável (`AuditEvent`, `AuditAction`, `AuditResource`, `AuditDiff`, `AuditFilter`) em `libs/domain`
- [x] 1.3 Exportar contratos de governança e auditoria no ponto de entrada `libs/domain/src/index.ts`

## 2. Governança e Auditoria no Backend (apps/api)

- [x] 2.1 Implementar decoradores de autorização e auditoria (`@Roles`, `@CurrentUser`, `@Audited`) e serviço de contexto de sessão
- [x] 2.2 Implementar `RolesGuard` no NestJS para proteção declarativa de endpoints baseada em escopos de permissão (RF-64)
- [x] 2.3 Implementar `AuditService`, `AuditController` e `AuditInterceptor` para registro append-only de mutações com diff estruturado (RF-65, RNF-12)
- [x] 2.4 Proteger rotas de ofertas, cotações, cronogramas e mascaramento de resultado econômico confidencial para perfis técnicos (RNF-17)
- [x] 2.5 Adicionar suite de testes unitários para `RolesGuard`, `AuditService`, `AuditInterceptor` e controle de permissões no NestJS

## 3. Interface de Governança e Auditoria no Frontend (apps/web)

- [x] 3.1 Implementar `AuthService` reativo com lista de usuários canônicos simulados e controle de perfil ativo
- [x] 3.2 Implementar `AuditApiService` e o componente `OfferAuditComponent` para visualização e filtragem da trilha histórica da proposta
- [x] 3.3 Integrar o alternador de perfil de usuário ao cabeçalho da aplicação e aplicar restrições de edição e visibilidade de abas/margens no `OfferDetailComponent`
- [x] 3.4 Adicionar testes automatizados no Angular para `AuthService`, `OfferAuditComponent` e proteção de abas/margens confidenciais

## 4. Validação e Aceite

- [x] 4.1 Executar bateria completa de testes no monorepo Nx (`nx run-many -t test`)
- [x] 4.2 Validar conformidade dos requisitos RF-64, RF-65, RNF-12 e RNF-17
