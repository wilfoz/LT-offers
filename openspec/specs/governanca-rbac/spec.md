# Governança & RBAC Specification

## Purpose

Define os requisitos e regras de controle de acesso baseado em funções (RBAC), autorização por módulo orçamentário e proteção contra vazamento de margens comerciais e dados confidenciais na elaboração de propostas de Linhas de Transmissão (Módulo M12, RF-64, RNF-17).

## Requirements

### Requirement: Controle de Acesso e Perfis Funcionais (RF-64)
O sistema SHALL implementar controle de acesso por perfil (RBAC) com suporte aos seguintes papéis canônicos:
1. `ENGINEERING` (Engenharia): permissão de edição em parâmetros técnicos, estaqueamento, torres, cabos e fundações;
2. `PROCUREMENT` (Suprimentos): permissão de edição em cotações, fornecedores, fretes e parâmetros tributários;
3. `PLANNING` (Planejamento): permissão de edição em cronogramas, histogramas de mão de obra/equipamentos e canteiros;
4. `COMMERCIAL` (Comercial): permissão de edição em coeficientes de venda $K$, BDI, matriz de riscos e margem de lucro líquido alvo;
5. `ADMIN` (Administrador): permissão irrestrita de gestão de catálogos corporativos, configurações globais e atribuição de perfis.

#### Scenario: Engenheiro tenta editar cotações de fornecedores
- **WHEN** um usuário autenticado com perfil `ENGINEERING` tenta atualizar preços unitários na aba de suprimentos/cotações
- **THEN** o sistema rejeita a operação com status de acesso não autorizado e mantém o dado inalterado

#### Scenario: Planejador edita dados de cronograma com sucesso
- **WHEN** um usuário autenticado com perfil `PLANNING` atualiza os turnos e a produtividade de equipes de montagem
- **THEN** o sistema autoriza a gravação e atualiza o cronograma da oferta

---

### Requirement: Proteção e Segregação de Dados Comerciais Confidenciais (RNF-17)
O sistema SHALL restringir a visualização de margens de lucro líquido, taxas de BDI e preços de venda finais exclusivamente aos perfis `COMMERCIAL` e `ADMIN`. Usuários com perfis técnicos (`ENGINEERING`, `PROCUREMENT`, `PLANNING`) terão acesso apenas aos custos diretos dos seus respectivos módulos, sem exposição da rentabilidade da proposta.

#### Scenario: Visualização do resultado econômico por perfil técnico
- **WHEN** um usuário com perfil `ENGINEERING` acessa a tela de resumo da proposta
- **THEN** o sistema exibe apenas os quantitativos e custos diretos de engenharia, ocultando as colunas de BDI, margem líquida e preço de venda sugerido

#### Scenario: Acesso a margens e BDI por usuário comercial
- **WHEN** um usuário com perfil `COMMERCIAL` acessa a aba de resultado econômico
- **THEN** o sistema apresenta a decomposição completa de margem, coeficientes de venda $K$ e preço final de venda da oferta
