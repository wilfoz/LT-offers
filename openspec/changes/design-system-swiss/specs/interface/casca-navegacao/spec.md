# interface/casca-navegacao

## Purpose

Casca da aplicação e comportamentos transversais de interface: navegação lateral entre os catálogos com indicação da seção ativa, responsividade da navegação e do conteúdo, tema claro/escuro conforme a preferência do sistema e feedback de operação (confirmação ao salvar, carregamento visível, erro de leitura inline). A identidade visual segue o design system oficial em `openspec/DESIGN.md` (RNF-14: toda a interface em pt-BR).

## ADDED Requirements

### Requirement: Navegar entre catálogos pela navegação lateral

O sistema SHALL exibir uma navegação lateral com um item por catálogo disponível, destacando visualmente o item correspondente à rota ativa. Todos os catálogos SHALL permanecer acessíveis a partir de qualquer tela.

#### Scenario: Item ativo destacado

- **WHEN** um usuário está em uma tela de um catálogo
- **THEN** o item desse catálogo aparece destacado na navegação lateral e os demais permanecem acessíveis

#### Scenario: Troca de catálogo pela navegação

- **WHEN** um usuário aciona outro item da navegação lateral
- **THEN** o sistema exibe a listagem do catálogo escolhido e move o destaque para o novo item

### Requirement: Adaptar a navegação e o conteúdo à largura da tela

Em telas largas a navegação lateral SHALL permanecer fixa ao lado do conteúdo; em telas estreitas ela SHALL ficar oculta e abrir sobreposta por um botão de menu na barra superior. O conteúdo NUNCA SHALL provocar rolagem horizontal da página — tabelas largas rolam dentro do próprio contêiner.

#### Scenario: Tela estreita com menu recolhido

- **WHEN** um usuário abre a aplicação em uma tela estreita
- **THEN** a navegação lateral inicia oculta e o botão de menu na barra superior a abre sobreposta ao conteúdo

#### Scenario: Tabela larga em tela estreita

- **WHEN** um usuário abre uma listagem com muitas colunas em uma tela estreita
- **THEN** a tabela rola horizontalmente dentro do seu contêiner, sem rolagem horizontal da página

### Requirement: Seguir o tema claro ou escuro do sistema

O sistema SHALL apresentar a interface nos esquemas claro e escuro conforme a preferência do sistema operacional do usuário, mantendo contraste mínimo AA (4.5:1) nos textos em ambos os esquemas.

#### Scenario: Preferência escura do sistema

- **WHEN** o sistema operacional do usuário está configurado com tema escuro
- **THEN** a aplicação apresenta superfícies escuras com textos legíveis, sem áreas ilegíveis ou invertidas

### Requirement: Confirmar operações de gravação

O sistema SHALL exibir uma confirmação transitória (em pt-BR) após salvar com sucesso um item ou uma nova versão em qualquer catálogo. Falhas de gravação continuam exibidas junto ao formulário, como já especificado por catálogo.

#### Scenario: Confirmação após salvar

- **WHEN** um usuário salva um item ou uma nova versão com sucesso
- **THEN** o sistema navega para a listagem e exibe uma confirmação transitória da gravação

### Requirement: Indicar carregamento e falha de leitura sem bloquear a navegação

Durante leituras, o sistema SHALL exibir um indicador de progresso; quando uma leitura falha, o erro SHALL aparecer inline na região correspondente da página (nunca apenas em aviso transitório), preservando a navegação e as demais regiões já carregadas.

#### Scenario: Falha de leitura exibida inline

- **WHEN** uma leitura de dados falha em uma tela
- **THEN** a região correspondente exibe a mensagem de erro em pt-BR no próprio lugar do conteúdo e a navegação continua utilizável
