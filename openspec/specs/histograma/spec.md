## Purpose

Define os requisitos e regras de cálculo para o histograma de recursos de Linhas de Transmissão (Módulo M08), abrangendo a consolidação mensal de efetivo de mão de obra por função/cargo, equipamentos por tipo, segregação de recursos diretos e indiretos, e balanço de equipamentos próprios vs déficit de locação.

## Requirements

### Requirement: Geração Mensal de Histograma de Mão de Obra e Equipamentos (RF-42)
O sistema SHALL consolidar a distribuição temporal mês a mês do quantitativo de profissionais por cargo/função e de equipamentos por tipo/família, derivado da sobreposição das equipes alocadas em todas as atividades ativas do cronograma e da estrutura de canteiros, tanto no detalhe individual por linha quanto de forma consolidada para a oferta/projeto.

#### Scenario: Consolidação de efetivo mensal de múltiplas atividades simultâneas
- **WHEN** no mês 5 da obra estão simultaneamente ativas 2 equipes de fundação (cada uma com 1 encarregado, 4 pedreiros e 8 serventes) e 1 equipe de montagem (1 encarregado, 6 montadores e 4 serventes)
- **THEN** o sistema agrega o histograma do mês 5 com 3 encarregados, 4 pedreiros, 6 montadores e 20 serventes, totalizando 33 profissionais diretos

---

### Requirement: Segregação de Recursos Diretos e Indiretos com Identificação de Picos (RF-43)
O sistema SHALL segregar de forma explícita o efetivo de mão de obra direta (alocada às equipes de produção de campo) da mão de obra indireta (administração de obra, engenharia de campo, segurança do trabalho, meio ambiente, almoxarifado e canteiros), identificando automaticamente as atividades e o mês de ocorrência do pico máximo de demanda de pessoal.

#### Scenario: Identificação do pico de pessoal e atividade crítica
- **WHEN** a linha apresenta demanda de pessoal variando de 15 a 120 colaboradores ao longo de 18 meses, com pico de 120 profissionais no mês 8 durante a sobreposição de montagem e lançamento
- **THEN** o sistema destaca o mês 8 como pico máximo de mobilização e lista as atividades concomitantes que provocaram a concentração de efetivo

---

### Requirement: Balanço de Parque Próprio de Equipamentos vs Déficit de Locação (RF-44, RN-17)
O sistema SHALL confrontar o histograma de demanda mensal de equipamentos por tipo com a disponibilidade de frota própria cadastrada na empresa/oferta, calculando automaticamente para cada mês o número de unidades atendidas por recursos próprios e o déficit que exigirá contratação de locação externa ou aquisição.

#### Scenario: Cálculo de déficit mensal de guindastes para locação
- **WHEN** o cronograma demanda 5 guindastes rodoviários de 70 t no mês 7, e a empresa dispõe de 2 unidades próprias alocáveis para este projeto
- **THEN** o sistema atribui 2 unidades como equipamento próprio e aponta déficit de 3 guindastes para locação comercial externa no mês 7, aplicando as tarifas correspondentes de aluguel (RN-17)

---

### Requirement: Exportação e Visualização Tabular e Gráfica de Recursos (RF-45)
O sistema SHALL gerar gráficos de barras empilhadas e curvas S de alocação de pessoal e equipamentos, permitindo alternar a visualização entre efetivo mensal (homens ou máquinas) e esforço acumulado (homem-mês ou máquina-mês), além de exportar os dados tabulares estruturados para composição do caderno técnico da proposta comercial.

#### Scenario: Geração de curva de homem-mês acumulado
- **WHEN** o orçamentista solicita a curva de esforço acumulado do projeto
- **THEN** o sistema computa o somatório progressivo de homem-mês ao longo dos meses de implantação e plota a curva S correspondente
