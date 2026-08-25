# Tasks: reavaliacao-base-catalogos

## 1. Extração do predicado de escala (refit sem mudança de comportamento)

- [x] 1.1 Adicionar `decimalScaleViolation(value, maxScale, { nonZero? })` em `libs/domain/src/lib/catalogs/validation.ts` (design D1) com testes diretos em `validation.spec.ts` cobrindo os 4 contratos: zero permitido/proibido × violação de formato/escala, mais branco/`null`-safe e casos limite ("24"≡"24.000" não é desta função; escala exata no limite passa)
- [x] 1.2 Refit da API (design D2): mover `PositiveNonZeroDecimal` e `DecimalWithScale` para `apps/api/src/catalogs/dto/decimal-scale.validators.ts` delegando ao predicado da domain; `tower-weight-point.dto.ts` e `insulator-version-fields.dto.ts` só trocam import — nenhuma asserção de teste alterada
- [x] 1.3 Refit do web (design D3): `decimalScaleValidator(maxScale, options?)` em `catalogs/form-utils.ts` mapeando violação→error keys atuais; `tower-type-form` e `insulator-form` trocam as funções locais pelo import — nenhuma asserção de teste alterada
- [x] 1.4 Regressão da extração: `npx nx run-many -t test lint build --skip-nx-cache` e `npx nx format:check --all` limpos; diff dos specs pré-existentes contendo apenas fiação; sem BOM nos arquivos novos (`head -c3 | od`)

## 2. Retrofit do piloto e dívidas de teste

- [x] 2.1 Guarda de id malformado no `conductor-cable-form` (design D4): id não numérico/não positivo → "Identificador inválido" + `form.disable({ emitEvent: false })`, sem degradar para modo criação; teste de regressão espelhando o caso do insulator-form (e confirmando criação/edição válidas intactas)
- [x] 2.2 Testes da guarda de id malformado nos históricos de `conductor-cable` e `ground-wire` ("rejeita identificador malformado sem consultar a API" — guarda já existe no código)
- [x] 2.3 Fortalecer as asserções do termo de busca nos service specs da API que hoje só fazem `where.OR` `toBeDefined` (design D5): igualdade completa do `where.OR` com o termo, conferindo os campos reais de cada service antes de assertar (cabos: código+descrição; série/tipo de torre: campos próprios); divergência real encontrada é bug a corrigir na causa

## 3. Verificação e fechamento

- [x] 3.1 Validar ao vivo o único comportamento novo (form do piloto com id malformado mostra erro e bloqueia o Salvar; fluxos válidos de criação/edição do piloto intactos) e smoke dos 2 forms refitados (escala rejeitada em tower-type e insulator); registrar evidências em `qa/qa.md` (change sem specs delta — QA enxuto de regressão)
- [x] 3.2 Rodar a suíte completa (`npx nx run-many -t lint test build` e `npx nx format:check --all`) limpa e confirmar o CI verde no push
