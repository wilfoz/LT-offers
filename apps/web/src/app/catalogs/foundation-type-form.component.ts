import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  DATE_PATTERN,
  FOUNDATION_ELEMENT_COUNT_FIELDS,
  FoundationApplication,
  FoundationElementCountField,
  FoundationTypeVersionInput,
  NON_NEGATIVE_INT_PATTERN,
} from '@lt-offers/domain';
import {
  FOUNDATION_APPLICATION_LABELS,
  FOUNDATION_ELEMENT_COUNT_LABELS,
  FOUNDATION_ELEMENT_GROUPS,
} from './foundation-labels';
import { FoundationTypesApi } from './foundation-types-api.service';
import { intOrNull, orNull } from './form-utils';

type CountControls = Record<FoundationElementCountField, FormControl<string>>;

// Um controle de texto por elemento (branco = não informado, RNF-09); a
// lista vem da domain — se um elemento novo entrar no contrato, o formulário
// o incorpora sem edição manual.
function buildCountControls(): CountControls {
  return Object.fromEntries(
    FOUNDATION_ELEMENT_COUNT_FIELDS.map((field) => [
      field,
      new FormControl('', {
        nonNullable: true,
        validators: [Validators.pattern(NON_NEGATIVE_INT_PATTERN)],
      }),
    ]),
  ) as CountControls;
}

@Component({
  selector: 'app-foundation-type-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
    <section>
      <h2>
        {{
          editId() ? 'Nova versão do tipo de fundação' : 'Novo tipo de fundação'
        }}
      </h2>
      <p>
        Contagens em branco significam "não informado" — diferente de zero. A
        aplicação é fixa desde a criação.
      </p>

      <form class="form-grid" [formGroup]="form" (ngSubmit)="save()">
        @if (!editId()) {
          <mat-form-field
            appearance="outline"
            floatLabel="always"
            subscriptSizing="dynamic"
            class="col-6"
          >
            <mat-label>Sigla *</mat-label>
            <input matInput id="code" formControlName="code" maxlength="50" />
            <mat-hint>Ex.: 4FZ, 1PR - 4P</mat-hint>
            @if (errorFor('code')) {
              <mat-error>{{ errorFor('code') }}</mat-error>
            }
          </mat-form-field>

          <mat-form-field
            appearance="outline"
            floatLabel="always"
            subscriptSizing="dynamic"
            class="col-6"
          >
            <mat-label>Aplicação *</mat-label>
            <mat-select id="application" formControlName="application">
              <mat-option value="SELF_SUPPORTING">Autoportante</mat-option>
              <mat-option value="GUYED">Estaiada</mat-option>
              <mat-option value="CROSS_ROPE">Cross-rope</mat-option>
            </mat-select>
            @if (errorFor('application')) {
              <mat-error>{{ errorFor('application') }}</mat-error>
            }
          </mat-form-field>
        } @else {
          <p class="col-12">
            Sigla: <strong class="mono">{{ currentCode() }}</strong> ·
            Aplicação: <strong>{{ currentApplicationLabel() }}</strong>
          </p>
        }

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-12"
        >
          <mat-label>Descrição</mat-label>
          <input
            matInput
            id="description"
            formControlName="description"
            maxlength="200"
          />
          <mat-hint>Em branco = não informado</mat-hint>
        </mat-form-field>

        <div class="col-12" formGroupName="counts">
          <div class="form-grid">
            @for (group of elementGroups; track group.legend) {
              <h3 class="col-12">{{ group.legend }}</h3>
              @for (field of group.fields; track field) {
                <mat-form-field
                  appearance="outline"
                  floatLabel="always"
                  subscriptSizing="dynamic"
                  class="col-3"
                >
                  <mat-label>{{ countLabel(field) }}</mat-label>
                  <input
                    matInput
                    [id]="field"
                    [formControlName]="field"
                    inputmode="numeric"
                  />
                  @if (countError(field)) {
                    <mat-error>{{ countError(field) }}</mat-error>
                  }
                </mat-form-field>
              }
            }
          </div>
        </div>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>
            Início de vigência {{ editId() ? '*' : '(opcional; padrão hoje)' }}
          </mat-label>
          <input
            matInput
            id="effectiveFrom"
            formControlName="effectiveFrom"
            type="date"
          />
          @if (errorFor('effectiveFrom')) {
            <mat-error>{{ errorFor('effectiveFrom') }}</mat-error>
          }
        </mat-form-field>

        @if (serverError()) {
          <p class="error col-12" role="alert">{{ serverError() }}</p>
        }

        <div class="actions col-12">
          <button
            matButton="filled"
            type="submit"
            [disabled]="saving() || form.disabled"
          >
            Salvar
          </button>
          <a matButton routerLink="/catalogs/foundation-types">Cancelar</a>
        </div>
      </form>
    </section>
  `,
  styles: `
    form {
      max-width: 56rem;
    }
    h3 {
      margin: 0.5rem 0 0;
      font: var(--mat-sys-title-small);
    }
    .error {
      color: var(--mat-sys-error);
      margin: 0.15rem 0 0;
    }
    .actions {
      display: flex;
      gap: 1rem;
      align-items: center;
    }
  `,
})
export class FoundationTypeFormComponent {
  private readonly api = inject(FoundationTypesApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly elementGroups = FOUNDATION_ELEMENT_GROUPS;

  readonly editId = signal<number | null>(null);
  readonly currentCode = signal('');
  readonly currentApplication = signal<FoundationApplication | null>(null);
  readonly serverError = signal('');
  readonly saving = signal(false);

  readonly form = new FormGroup({
    code: new FormControl('', { nonNullable: true }),
    application: new FormControl<'' | FoundationApplication>('', {
      nonNullable: true,
    }),
    description: new FormControl('', { nonNullable: true }),
    counts: new FormGroup(buildCountControls()),
    effectiveFrom: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(DATE_PATTERN)],
    }),
  });

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam === null) {
      this.form.controls.code.addValidators(Validators.required);
      this.form.controls.application.addValidators(Validators.required);
    } else {
      const id = Number(idParam);
      if (Number.isInteger(id) && id > 0) {
        this.prepareEdit(id);
      } else {
        this.serverError.set('Identificador inválido');
        this.form.disable({ emitEvent: false });
      }
    }
  }

  countLabel(field: FoundationElementCountField): string {
    return FOUNDATION_ELEMENT_COUNT_LABELS[field];
  }

  countError(field: FoundationElementCountField): string {
    const control = this.form.controls.counts.controls[field];
    if (!control.touched || control.valid) {
      return '';
    }
    return 'Informe um número inteiro maior ou igual a zero';
  }

  currentApplicationLabel(): string {
    const application = this.currentApplication();
    return application ? FOUNDATION_APPLICATION_LABELS[application] : '';
  }

  errorFor(field: 'code' | 'application' | 'effectiveFrom'): string {
    const control = this.form.controls[field];
    if (!control.touched || control.valid) {
      return '';
    }
    if (control.hasError('required')) {
      return 'Campo obrigatório';
    }
    return 'Informe uma data no formato AAAA-MM-DD';
  }

  save(): void {
    // Formulário desabilitado = prefill da edição pendente ou falho; salvar
    // aqui gravaria uma versão toda nula por cima dos valores vigentes.
    if (this.form.disabled) {
      return;
    }
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    this.saving.set(true);
    this.serverError.set('');

    const id = this.editId();
    const input = this.toInput();
    const operation = id
      ? this.api.createVersion(id, {
          ...input,
          effectiveFrom: this.form.getRawValue().effectiveFrom.trim(),
        })
      : this.api.create({
          ...input,
          code: this.form.controls.code.value.trim(),
          application: this.form.controls.application
            .value as FoundationApplication,
        });

    operation.subscribe({
      next: () => {
        this.snackBar.open('Tipo de fundação salvo', 'Fechar', {
          duration: 4000,
        });
        this.router.navigate(['/catalogs/foundation-types']);
      },
      error: (error) => {
        this.saving.set(false);
        const message = error?.error?.message;
        this.serverError.set(
          Array.isArray(message)
            ? message.join('; ')
            : (message ?? 'Não foi possível salvar; tente novamente'),
        );
      },
    });
  }

  private prepareEdit(id: number): void {
    this.editId.set(id);
    this.form.controls.effectiveFrom.addValidators(Validators.required);
    this.form.disable({ emitEvent: false });
    this.api.history(id).subscribe({
      next: (history) => {
        this.currentCode.set(history.code);
        this.currentApplication.set(history.application);
        const latest = history.versions[0];
        if (latest) {
          this.form.controls.description.setValue(latest.description ?? '');
          for (const field of FOUNDATION_ELEMENT_COUNT_FIELDS) {
            this.form.controls.counts.controls[field].setValue(
              latest[field] === null ? '' : String(latest[field]),
            );
          }
        }
        this.form.enable({ emitEvent: false });
      },
      error: () =>
        this.serverError.set(
          'Não foi possível carregar os dados atuais do tipo de fundação; recarregue a página antes de criar uma nova versão',
        ),
    });
  }

  /** Contagem em branco vira null (não informado) — nunca "0" implícito (RNF-09). */
  private toInput(): FoundationTypeVersionInput {
    const value = this.form.getRawValue();
    const counts = Object.fromEntries(
      FOUNDATION_ELEMENT_COUNT_FIELDS.map((field) => [
        field,
        intOrNull(value.counts[field]),
      ]),
    );
    return {
      description: orNull(value.description),
      ...counts,
      ...(value.effectiveFrom.trim() !== ''
        ? { effectiveFrom: value.effectiveFrom.trim() }
        : {}),
    };
  }
}
