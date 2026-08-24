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
  GroundWireType,
  GroundWireVersionInput,
  POSITIVE_DECIMAL_PATTERN,
  POSITIVE_INT_PATTERN,
} from '@lt-offers/domain';
import { intOrNull, orNull } from './form-utils';
import { GROUND_WIRE_TYPE_LABELS } from './ground-wire-labels';
import { GroundWiresApi } from './ground-wires-api.service';

@Component({
  selector: 'app-ground-wire-form',
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
        {{ editId() ? 'Nova versão do cabo de guarda' : 'Novo cabo de guarda' }}
      </h2>
      <p>
        Campos numéricos usam ponto como separador decimal. Campo em branco
        significa "não informado" — diferente de zero.
      </p>

      <form class="form-grid" [formGroup]="form" (ngSubmit)="save()">
        @if (!editId()) {
          <mat-form-field
            appearance="outline"
            floatLabel="always"
            subscriptSizing="dynamic"
            class="col-6"
          >
            <mat-label>Código *</mat-label>
            <input matInput id="code" formControlName="code" maxlength="50" />
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
            <mat-label>Tipo * (fixo após a criação)</mat-label>
            <mat-select id="type" formControlName="type">
              <mat-option value="">Selecione…</mat-option>
              <mat-option value="STEEL">Aço</mat-option>
              <mat-option value="OPGW">OPGW</mat-option>
            </mat-select>
            @if (errorFor('type')) {
              <mat-error>{{ errorFor('type') }}</mat-error>
            }
          </mat-form-field>
        } @else {
          <p class="col-12">
            Código: <strong class="mono">{{ currentCode() }}</strong> · Tipo:
            <strong>{{ typeLabel() }}</strong> (fixo desde a criação)
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

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>Peso (ton/km)</mat-label>
          <input
            matInput
            id="weightTonPerKm"
            formControlName="weightTonPerKm"
            inputmode="decimal"
          />
          <mat-hint>Em branco = não informado</mat-hint>
          @if (errorFor('weightTonPerKm')) {
            <mat-error>{{ errorFor('weightTonPerKm') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>Bobina (m)</mat-label>
          <input
            matInput
            id="reelLengthM"
            formControlName="reelLengthM"
            inputmode="decimal"
          />
          <mat-hint>Em branco = não informado</mat-hint>
          @if (errorFor('reelLengthM')) {
            <mat-error>{{ errorFor('reelLengthM') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>Diâmetro (mm)</mat-label>
          <input
            matInput
            id="diameterMm"
            formControlName="diameterMm"
            inputmode="decimal"
          />
          <mat-hint>Em branco = não informado</mat-hint>
          @if (errorFor('diameterMm')) {
            <mat-error>{{ errorFor('diameterMm') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>UTS — carga de ruptura (kN)</mat-label>
          <input
            matInput
            id="utsKn"
            formControlName="utsKn"
            inputmode="decimal"
          />
          <mat-hint>Em branco = não informado</mat-hint>
          @if (errorFor('utsKn')) {
            <mat-error>{{ errorFor('utsKn') }}</mat-error>
          }
        </mat-form-field>

        @if (selectedType() === 'STEEL') {
          <div class="col-12 form-grid type-fields">
            <h3 class="col-12">Atributos do tipo aço</h3>
            <mat-form-field
              appearance="outline"
              floatLabel="always"
              subscriptSizing="dynamic"
              class="col-6"
            >
              <mat-label>Classe de galvanização</mat-label>
              <input
                matInput
                id="galvanizationClass"
                formControlName="galvanizationClass"
                maxlength="50"
              />
              <mat-hint>Em branco = não informado</mat-hint>
            </mat-form-field>
            <mat-form-field
              appearance="outline"
              floatLabel="always"
              subscriptSizing="dynamic"
              class="col-6"
            >
              <mat-label>Grau de resistência</mat-label>
              <input
                matInput
                id="strengthGrade"
                formControlName="strengthGrade"
                maxlength="50"
              />
              <mat-hint>Em branco = não informado</mat-hint>
            </mat-form-field>
            <mat-form-field
              appearance="outline"
              floatLabel="always"
              subscriptSizing="dynamic"
              class="col-6"
            >
              <mat-label>Número de fios</mat-label>
              <input
                matInput
                id="wireCount"
                formControlName="wireCount"
                inputmode="numeric"
              />
              <mat-hint>Em branco = não informado</mat-hint>
              @if (errorFor('wireCount')) {
                <mat-error>{{ errorFor('wireCount') }}</mat-error>
              }
            </mat-form-field>
          </div>
        } @else if (selectedType() === 'OPGW') {
          <div class="col-12 form-grid type-fields">
            <h3 class="col-12">Atributos do tipo OPGW</h3>
            <mat-form-field
              appearance="outline"
              floatLabel="always"
              subscriptSizing="dynamic"
              class="col-6"
            >
              <mat-label>Fabricante</mat-label>
              <input
                matInput
                id="manufacturer"
                formControlName="manufacturer"
                maxlength="100"
              />
              <mat-hint>Em branco = não informado</mat-hint>
            </mat-form-field>
            <mat-form-field
              appearance="outline"
              floatLabel="always"
              subscriptSizing="dynamic"
              class="col-6"
            >
              <mat-label>I²t (kA²·s)</mat-label>
              <input
                matInput
                id="i2tKa2s"
                formControlName="i2tKa2s"
                inputmode="decimal"
              />
              <mat-hint>Em branco = não informado</mat-hint>
              @if (errorFor('i2tKa2s')) {
                <mat-error>{{ errorFor('i2tKa2s') }}</mat-error>
              }
            </mat-form-field>
            <mat-form-field
              appearance="outline"
              floatLabel="always"
              subscriptSizing="dynamic"
              class="col-6"
            >
              <mat-label>Número de fibras</mat-label>
              <input
                matInput
                id="fiberCount"
                formControlName="fiberCount"
                inputmode="numeric"
              />
              <mat-hint>Em branco = não informado</mat-hint>
              @if (errorFor('fiberCount')) {
                <mat-error>{{ errorFor('fiberCount') }}</mat-error>
              }
            </mat-form-field>
          </div>
        }

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
          <a matButton routerLink="/catalogs/ground-wires">Cancelar</a>
        </div>
      </form>
    </section>
  `,
  styles: `
    form {
      max-width: 48rem;
    }
    h3 {
      margin: 0;
      font: var(--mat-sys-title-small);
      color: var(--mat-sys-on-surface-variant);
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
export class GroundWireFormComponent {
  private readonly api = inject(GroundWiresApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly editId = signal<number | null>(null);
  readonly currentCode = signal('');
  readonly selectedType = signal<'' | GroundWireType>('');
  readonly serverError = signal('');
  readonly saving = signal(false);

  readonly form = new FormGroup({
    code: new FormControl('', { nonNullable: true }),
    type: new FormControl<'' | GroundWireType>('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
    weightTonPerKm: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(POSITIVE_DECIMAL_PATTERN)],
    }),
    reelLengthM: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(POSITIVE_DECIMAL_PATTERN)],
    }),
    diameterMm: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(POSITIVE_DECIMAL_PATTERN)],
    }),
    utsKn: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(POSITIVE_DECIMAL_PATTERN)],
    }),
    galvanizationClass: new FormControl('', { nonNullable: true }),
    strengthGrade: new FormControl('', { nonNullable: true }),
    wireCount: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(POSITIVE_INT_PATTERN)],
    }),
    manufacturer: new FormControl('', { nonNullable: true }),
    i2tKa2s: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(POSITIVE_DECIMAL_PATTERN)],
    }),
    fiberCount: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(POSITIVE_INT_PATTERN)],
    }),
    effectiveFrom: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(DATE_PATTERN)],
    }),
  });

  constructor() {
    // Espelha o tipo selecionado para o bloco condicional de campos
    this.form.controls.type.valueChanges.subscribe((value) =>
      this.selectedType.set(value),
    );

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam === null) {
      this.form.controls.code.addValidators(Validators.required);
      this.form.controls.type.addValidators(Validators.required);
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

  typeLabel(): string {
    const type = this.selectedType();
    return type === '' ? '—' : GROUND_WIRE_TYPE_LABELS[type];
  }

  errorFor(field: keyof typeof this.form.controls): string {
    const control = this.form.controls[field];
    if (!control.touched || control.valid) {
      return '';
    }
    if (control.hasError('required')) {
      return field === 'type' ? 'Selecione o tipo' : 'Campo obrigatório';
    }
    if (field === 'effectiveFrom') {
      return 'Informe uma data no formato AAAA-MM-DD';
    }
    if (field === 'wireCount' || field === 'fiberCount') {
      return 'Informe um número inteiro positivo (ex.: 24)';
    }
    return 'Informe um número decimal positivo com ponto (ex.: 12.34)';
  }

  save(): void {
    // Formulário desabilitado = prefill da edição pendente ou falho; salvar
    // aqui gravaria uma versão toda nula por cima dos valores vigentes.
    if (this.form.disabled) {
      return;
    }
    // Valor inválido digitado antes de trocar o tipo ficaria oculto no
    // fieldset não renderizado e travaria o salvar sem feedback — os campos
    // do tipo inativo são limpos antes da validação (review grupo-4, M1).
    this.clearInactiveTypeFields();
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
          type: this.form.controls.type.value as GroundWireType,
        });

    operation.subscribe({
      next: () => {
        this.snackBar.open('Cabo de guarda salvo', 'Fechar', {
          duration: 4000,
        });
        this.router.navigate(['/catalogs/ground-wires']);
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

  private clearInactiveTypeFields(): void {
    const type = this.selectedType();
    const inactive: (keyof typeof this.form.controls)[] =
      type === 'STEEL'
        ? ['manufacturer', 'i2tKa2s', 'fiberCount']
        : type === 'OPGW'
          ? ['galvanizationClass', 'strengthGrade', 'wireCount']
          : [
              'manufacturer',
              'i2tKa2s',
              'fiberCount',
              'galvanizationClass',
              'strengthGrade',
              'wireCount',
            ];
    for (const field of inactive) {
      this.form.controls[field].reset('');
    }
  }

  private prepareEdit(id: number): void {
    this.editId.set(id);
    this.form.controls.effectiveFrom.addValidators(Validators.required);
    this.form.disable({ emitEvent: false });
    this.api.history(id).subscribe({
      next: (history) => {
        this.currentCode.set(history.code);
        this.selectedType.set(history.type);
        const latest = history.versions[0];
        if (latest) {
          this.form.patchValue({
            description: latest.description ?? '',
            weightTonPerKm: latest.weightTonPerKm ?? '',
            reelLengthM: latest.reelLengthM ?? '',
            diameterMm: latest.diameterMm ?? '',
            utsKn: latest.utsKn ?? '',
            galvanizationClass: latest.galvanizationClass ?? '',
            strengthGrade: latest.strengthGrade ?? '',
            wireCount: latest.wireCount?.toString() ?? '',
            manufacturer: latest.manufacturer ?? '',
            i2tKa2s: latest.i2tKa2s ?? '',
            fiberCount: latest.fiberCount?.toString() ?? '',
          });
        }
        this.form.enable({ emitEvent: false });
      },
      error: () =>
        this.serverError.set(
          'Não foi possível carregar os dados atuais do cabo; recarregue a página antes de criar uma nova versão',
        ),
    });
  }

  /**
   * Campo em branco vira null (não informado) — nunca "0" implícito (RNF-09).
   * Só os campos do tipo selecionado são enviados; os do outro tipo vão como
   * null, coerente com a validação de aplicabilidade da API.
   */
  private toInput(): GroundWireVersionInput {
    const value = this.form.getRawValue();
    const isSteel = this.selectedType() === 'STEEL';
    return {
      description: orNull(value.description),
      weightTonPerKm: orNull(value.weightTonPerKm),
      reelLengthM: orNull(value.reelLengthM),
      diameterMm: orNull(value.diameterMm),
      utsKn: orNull(value.utsKn),
      galvanizationClass: isSteel ? orNull(value.galvanizationClass) : null,
      strengthGrade: isSteel ? orNull(value.strengthGrade) : null,
      wireCount: isSteel ? intOrNull(value.wireCount) : null,
      manufacturer: isSteel ? null : orNull(value.manufacturer),
      i2tKa2s: isSteel ? null : orNull(value.i2tKa2s),
      fiberCount: isSteel ? null : intOrNull(value.fiberCount),
      ...(value.effectiveFrom.trim() !== ''
        ? { effectiveFrom: value.effectiveFrom.trim() }
        : {}),
    };
  }
}
