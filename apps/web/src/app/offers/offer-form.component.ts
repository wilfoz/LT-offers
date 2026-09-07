import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  CreateOfferPayload,
  DATE_PATTERN,
  POSITIVE_DECIMAL_PATTERN,
  UpdateOfferGeneralPayload,
} from '@lt-offers/domain';
import { decimalScaleValidator, orNull } from '../catalogs/form-utils';
import { OffersApi } from './offers-api.service';

@Component({
  selector: 'app-offer-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  template: `
    <section>
      <h2>{{ editId() ? 'Editar dados gerais da proposta' : 'Nova proposta de oferta' }}</h2>
      <p class="subtitle">
        {{
          editId()
            ? 'Alteração dos metadados globais da proposta (código, nome, cliente e moeda).'
            : 'Cadastro da proposta e configuração dos parâmetros da revisão inicial (R0).'
        }}
      </p>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" aria-label="Carregando" />
        <p>Carregando dados…</p>
      } @else {
        <form class="form-grid" [formGroup]="form" (ngSubmit)="save()">
          <h3 class="col-12 section-title">Identificação da proposta</h3>

          <mat-form-field
            appearance="outline"
            floatLabel="always"
            subscriptSizing="dynamic"
            class="col-4"
          >
            <mat-label>Código da proposta *</mat-label>
            <input
              matInput
              id="code"
              formControlName="code"
              placeholder="ex.: OF-2026-L1"
              maxlength="50"
            />
            @if (errorFor('code')) {
              <mat-error>{{ errorFor('code') }}</mat-error>
            }
          </mat-form-field>

          <mat-form-field
            appearance="outline"
            floatLabel="always"
            subscriptSizing="dynamic"
            class="col-8"
          >
            <mat-label>Nome da proposta / lote *</mat-label>
            <input
              matInput
              id="name"
              formControlName="name"
              placeholder="ex.: Lote 1 - Linhas de Transmissão Sul"
              maxlength="200"
            />
            @if (errorFor('name')) {
              <mat-error>{{ errorFor('name') }}</mat-error>
            }
          </mat-form-field>

          <mat-form-field
            appearance="outline"
            floatLabel="always"
            subscriptSizing="dynamic"
            class="col-8"
          >
            <mat-label>Cliente / Concessionária *</mat-label>
            <input
              matInput
              id="clientName"
              formControlName="clientName"
              placeholder="ex.: Axia Energia Transmissão S.A."
              maxlength="200"
            />
            @if (errorFor('clientName')) {
              <mat-error>{{ errorFor('clientName') }}</mat-error>
            }
          </mat-form-field>

          <mat-form-field
            appearance="outline"
            floatLabel="always"
            subscriptSizing="dynamic"
            class="col-4"
          >
            <mat-label>Moeda base *</mat-label>
            <mat-select id="baseCurrency" formControlName="baseCurrency">
              <mat-option value="BRL">BRL (Real Brasileiro)</mat-option>
              <mat-option value="USD">USD (Dólar Americano)</mat-option>
              <mat-option value="EUR">EUR (Euro)</mat-option>
            </mat-select>
          </mat-form-field>

          @if (!editId()) {
            <h3 class="col-12 section-title">Parâmetros da revisão inicial (R0)</h3>

            <mat-form-field
              appearance="outline"
              floatLabel="always"
              subscriptSizing="dynamic"
              class="col-6"
            >
              <mat-label>Edital / Leilão *</mat-label>
              <input
                matInput
                id="auctionName"
                formControlName="auctionName"
                placeholder="ex.: Leilão 01/2026 - ANEEL"
                maxlength="100"
              />
              @if (errorFor('auctionName')) {
                <mat-error>{{ errorFor('auctionName') }}</mat-error>
              }
            </mat-form-field>

            <mat-form-field
              appearance="outline"
              floatLabel="always"
              subscriptSizing="dynamic"
              class="col-6"
            >
              <mat-label>Lote *</mat-label>
              <input
                matInput
                id="lotName"
                formControlName="lotName"
                placeholder="ex.: Lote 1"
                maxlength="100"
              />
              @if (errorFor('lotName')) {
                <mat-error>{{ errorFor('lotName') }}</mat-error>
              }
            </mat-form-field>

            <mat-form-field
              appearance="outline"
              floatLabel="always"
              subscriptSizing="dynamic"
              class="col-3"
            >
              <mat-label>Data da oferta *</mat-label>
              <input
                matInput
                id="offerDate"
                formControlName="offerDate"
                placeholder="AAAA-MM-DD"
              />
              @if (errorFor('offerDate')) {
                <mat-error>{{ errorFor('offerDate') }}</mat-error>
              }
            </mat-form-field>

            <mat-form-field
              appearance="outline"
              floatLabel="always"
              subscriptSizing="dynamic"
              class="col-3"
            >
              <mat-label>Data do leilão</mat-label>
              <input
                matInput
                id="auctionDate"
                formControlName="auctionDate"
                placeholder="AAAA-MM-DD"
              />
              @if (errorFor('auctionDate')) {
                <mat-error>{{ errorFor('auctionDate') }}</mat-error>
              }
            </mat-form-field>

            <mat-form-field
              appearance="outline"
              floatLabel="always"
              subscriptSizing="dynamic"
              class="col-3"
            >
              <mat-label>Início do cronograma</mat-label>
              <input
                matInput
                id="scheduleStartDate"
                formControlName="scheduleStartDate"
                placeholder="AAAA-MM-DD"
              />
              @if (errorFor('scheduleStartDate')) {
                <mat-error>{{ errorFor('scheduleStartDate') }}</mat-error>
              }
            </mat-form-field>

            <mat-form-field
              appearance="outline"
              floatLabel="always"
              subscriptSizing="dynamic"
              class="col-3"
            >
              <mat-label>Entrada em operação (Edital)</mat-label>
              <input
                matInput
                id="commercialOperationDate"
                formControlName="commercialOperationDate"
                placeholder="AAAA-MM-DD"
              />
              @if (errorFor('commercialOperationDate')) {
                <mat-error>{{ errorFor('commercialOperationDate') }}</mat-error>
              }
            </mat-form-field>

            @if (hasScheduleInconsistency()) {
              <div class="col-12 alert-schedule" role="alert">
                <mat-icon>warning</mat-icon>
                <span>
                  <strong>Alerta de Cronograma (RN-02):</strong> A data de início do cronograma é posterior à data prevista de entrada em operação do edital.
                </span>
              </div>
            }

            <mat-form-field
              appearance="outline"
              floatLabel="always"
              subscriptSizing="dynamic"
              class="col-4"
            >
              <mat-label>CAPEX estimado ANEEL</mat-label>
              <input
                matInput
                id="estimatedCapex"
                formControlName="estimatedCapex"
                inputmode="decimal"
                placeholder="ex.: 150000000.00"
              />
              <mat-hint>Em branco = não informado</mat-hint>
              @if (errorFor('estimatedCapex')) {
                <mat-error>{{ errorFor('estimatedCapex') }}</mat-error>
              }
            </mat-form-field>

            <mat-form-field
              appearance="outline"
              floatLabel="always"
              subscriptSizing="dynamic"
              class="col-4"
            >
              <mat-label>RAP Máxima do edital</mat-label>
              <input
                matInput
                id="maxRap"
                formControlName="maxRap"
                inputmode="decimal"
                placeholder="ex.: 25000000.00"
              />
              <mat-hint>Em branco = não informado</mat-hint>
              @if (errorFor('maxRap')) {
                <mat-error>{{ errorFor('maxRap') }}</mat-error>
              }
            </mat-form-field>

            <mat-form-field
              appearance="outline"
              floatLabel="always"
              subscriptSizing="dynamic"
              class="col-4"
            >
              <mat-label>RAP Vencedora estimada</mat-label>
              <input
                matInput
                id="winningRap"
                formControlName="winningRap"
                inputmode="decimal"
                placeholder="ex.: 21000000.00"
              />
              <mat-hint>Em branco = não informado</mat-hint>
              @if (errorFor('winningRap')) {
                <mat-error>{{ errorFor('winningRap') }}</mat-error>
              }
            </mat-form-field>

            <mat-form-field
              appearance="outline"
              floatLabel="always"
              subscriptSizing="dynamic"
              class="col-12"
            >
              <mat-label>Notas descritivas da revisão inicial</mat-label>
              <textarea
                matInput
                id="notes"
                formControlName="notes"
                rows="2"
                placeholder="Observações, premissas contratuais e escopo inicial"
                maxlength="1000"
              ></textarea>
            </mat-form-field>
          }

          <div class="col-12 actions">
            <a matButton="outlined" [routerLink]="cancelLink()">Cancelar</a>
            <button
              matButton="filled"
              type="submit"
              [disabled]="saving() || form.invalid"
            >
              {{ saving() ? 'Salvando…' : editId() ? 'Salvar alterações' : 'Criar proposta' }}
            </button>
          </div>
        </form>
      }
    </section>
  `,
  styles: `
    .subtitle {
      color: var(--mat-sys-on-surface-variant);
      margin-top: -0.25rem;
      font: var(--mat-sys-body-medium);
      margin-bottom: 1.5rem;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 1rem;
      max-width: 54rem;
    }
    .col-12 { grid-column: span 12; }
    .col-8 { grid-column: span 8; }
    .col-6 { grid-column: span 6; }
    .col-4 { grid-column: span 4; }
    .col-3 { grid-column: span 3; }
    .section-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--mat-sys-primary);
      margin-top: 1rem;
      margin-bottom: 0.25rem;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      padding-bottom: 0.35rem;
    }
    .alert-schedule {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
    }
    .alert-schedule mat-icon {
      color: #b45309;
    }
    .actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 1.5rem;
    }
  `,
})
export class OfferFormComponent {
  private readonly api = inject(OffersApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  readonly editId = signal<number | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);

  private readonly todayStr = new Date().toISOString().slice(0, 10);

  readonly form = new FormGroup({
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(50)],
    }),
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(200)],
    }),
    clientName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(200)],
    }),
    baseCurrency: new FormControl('BRL', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(10)],
    }),
    // Initial revision fields
    auctionName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(100)],
    }),
    lotName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(100)],
    }),
    offerDate: new FormControl(this.todayStr, {
      nonNullable: true,
      validators: [Validators.pattern(DATE_PATTERN)],
    }),
    auctionDate: new FormControl('', [Validators.pattern(DATE_PATTERN)]),
    scheduleStartDate: new FormControl('', [Validators.pattern(DATE_PATTERN)]),
    commercialOperationDate: new FormControl('', [
      Validators.pattern(DATE_PATTERN),
    ]),
    estimatedCapex: new FormControl('', [
      Validators.pattern(POSITIVE_DECIMAL_PATTERN),
      decimalScaleValidator(2),
    ]),
    maxRap: new FormControl('', [
      Validators.pattern(POSITIVE_DECIMAL_PATTERN),
      decimalScaleValidator(2),
    ]),
    winningRap: new FormControl('', [
      Validators.pattern(POSITIVE_DECIMAL_PATTERN),
      decimalScaleValidator(2),
    ]),
    notes: new FormControl('', [Validators.maxLength(1000)]),
  });

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const parsedId = Number(idParam);
      this.editId.set(parsedId);
      this.loadOffer(parsedId);
    } else {
      // In create mode, auctionName, lotName and offerDate are required
      this.form.controls.auctionName.addValidators(Validators.required);
      this.form.controls.lotName.addValidators(Validators.required);
      this.form.controls.offerDate.addValidators(Validators.required);
      this.form.updateValueAndValidity();
    }
  }

  cancelLink(): string[] {
    const id = this.editId();
    return id ? ['/offers', String(id)] : ['/offers'];
  }

  hasScheduleInconsistency(): boolean {
    const start = this.form.controls.scheduleStartDate.value;
    const end = this.form.controls.commercialOperationDate.value;
    return !!(start && end && start > end);
  }

  errorFor(controlName: string): string | null {
    const c = this.form.get(controlName);
    if (!c || !c.touched || !c.errors) return null;
    if (c.errors['required']) return 'Campo obrigatório';
    if (c.errors['maxlength']) return 'Texto muito longo';
    if (c.errors['pattern']) {
      if (controlName.includes('Date')) return 'Data inválida (formato AAAA-MM-DD)';
      return 'Valor decimal inválido (ex.: 1500.00)';
    }
    if (c.errors['decimalScale']) return 'Máximo de 2 casas decimais';
    return 'Valor inválido';
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const raw = this.form.getRawValue();
    const id = this.editId();

    if (id) {
      const payload: UpdateOfferGeneralPayload = {
        code: raw.code.trim(),
        name: raw.name.trim(),
        clientName: raw.clientName.trim(),
        baseCurrency: raw.baseCurrency.trim(),
      };
      this.api.updateGeneral(id, payload).subscribe({
        next: (updated) => {
          this.snackBar.open('Dados gerais atualizados com sucesso!', 'OK', {
            duration: 3000,
          });
          this.router.navigate(['/offers', updated.id]);
        },
        error: (err) => {
          this.saving.set(false);
          const msg =
            err.error?.message ||
            'Não foi possível atualizar a proposta. Verifique os campos.';
          this.snackBar.open(msg, 'Fechar', { duration: 5000 });
        },
      });
    } else {
      const payload: CreateOfferPayload = {
        code: raw.code.trim(),
        name: raw.name.trim(),
        clientName: raw.clientName.trim(),
        baseCurrency: raw.baseCurrency.trim(),
        auctionName: raw.auctionName.trim(),
        lotName: raw.lotName.trim(),
        offerDate: raw.offerDate.trim(),
        auctionDate: orNull(raw.auctionDate),
        scheduleStartDate: orNull(raw.scheduleStartDate),
        commercialOperationDate: orNull(raw.commercialOperationDate),
        estimatedCapex: orNull(raw.estimatedCapex),
        maxRap: orNull(raw.maxRap),
        winningRap: orNull(raw.winningRap),
        notes: orNull(raw.notes),
      };

      this.api.create(payload).subscribe({
        next: (created) => {
          this.snackBar.open('Proposta criada com sucesso!', 'OK', {
            duration: 4000,
          });
          this.router.navigate(['/offers', created.id]);
        },
        error: (err) => {
          this.saving.set(false);
          const msg =
            err.error?.message ||
            'Não foi possível criar a proposta. Verifique se o código já existe.';
          this.snackBar.open(msg, 'Fechar', { duration: 5000 });
        },
      });
    }
  }

  private loadOffer(id: number): void {
    this.loading.set(true);
    this.api.getById(id).subscribe({
      next: (detail) => {
        this.form.patchValue({
          code: detail.code,
          name: detail.name,
          clientName: detail.clientName,
          baseCurrency: detail.baseCurrency,
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open(
          'Não foi possível carregar a proposta para edição.',
          'Fechar',
          { duration: 5000 },
        );
        this.router.navigate(['/offers']);
      },
    });
  }
}
