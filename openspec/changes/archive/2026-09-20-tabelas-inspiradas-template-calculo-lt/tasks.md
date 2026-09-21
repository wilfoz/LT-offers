## 1. Tipagens e DTOs de Apresentação

- [x] 1.1 Enriquecer modelos de visualização de cotação de materiais em `@lt-offers/domain` para suportar matriz comparativa multi-fornecedor e UF de origem
- [x] 1.2 Adicionar tipos para detalhamento de travessias especiais, acessos e limpeza de faixa em `@lt-offers/domain`
- [x] 1.3 Adicionar tipos para detalhamento analítico de indiretos de obra com suporte operacional e benefícios por cargo


## 2. Refatoração da Tabela de Preços e Tributos (`material-pricing.component.ts`)

- [x] 2.1 Implementar cabeçalhos multi-nível (*multi-tier headers*) na tabela de materiais com agrupamento de cotações e tributos
- [x] 2.2 Implementar seletor em formato *pills* para alternância entre trechos específicos (E1, E2, E3...) e consolidado do Lote Total
- [x] 2.3 Implementar colunas comparativas de fabricantes (*Brametal*, *Brafer*, *Incomisa*, *SAE*) com destaque visual da empresa selecionada (*ELEGIDA*)
- [x] 2.4 Ajustar rodapé fixo (*sticky footer*) com totalizadores de custo líquido, IPI, ICMS, DIFAL, PIS/COFINS e total com tributos


## 3. Refatoração das Tabelas de Engenharia Civil & Canteiros (`foundation-quantities` & `camps-management`)

- [x] 3.1 Adicionar sub-tabela de Travessias Especiais (`Travesias`) com tipologia de obstáculo, extensão e custos na tela de fundações
- [x] 3.2 Adicionar sub-tabela de Acessos e Limpeza de Faixa (`Accesos` / `Limpieza`) com quantitativos por tipo de solo e relevo
- [x] 3.3 Adicionar tabela analítica de Indiretos de Obra (`Indirectos`) cruzando equipe local com veículos 4x4, telefonia, EPIs e exames


## 4. Refatoração das Tabelas de Orçamento e Venda (`service-budget` & `economic-result`)

- [x] 4.1 Reestruturar tabela de Resultado Econômico no padrão `RT` com separadores visuais por macro-disciplinas e faturamento direto REIDI
- [x] 4.2 Alinhar tabela de Folha de Variações de Preço Unitário no padrão `PU1` com colunas contratuais de medição e aditivos

## 5. Refatoração da Grade Matricial de Desembolso (`cashflow.component.ts`)

- [x] 5.1 Implementar tabela matricial multi-mês (`DT`) com cabeçalho de períodos M1..M24 e coluna de disciplinas fixa (*sticky*)
- [x] 5.2 Adicionar totalizadores mensais e acumulados de saídas de materiais, serviços, indiretos e faturamento

## 6. Verificação e Testes de Regressão

- [x] 6.1 Executar testes unitários do frontend Angular (`nx test web`)
- [x] 6.2 Executar testes de todos os pacotes do monorepo (`nx run-many -t test`)
- [x] 6.3 Validar integridade da navegação e visualização responsiva de todas as tabelas
