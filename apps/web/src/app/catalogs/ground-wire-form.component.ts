import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
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
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section>
      <h2>
        {{ editId() ? 'Nova versão do cabo de guarda' : 'Novo cabo de guarda' }}
      </h2>
      <p>
        Campos numéricos usam ponto como separador decimal. Campo em branco
        significa "não informado" — diferente de zero.
      </p>

      <form [formGroup]="form" (ngSubmit)="save()">
        @if (!editId()) {
          <div>
            <label for="code">Código *</label>
            <input id="code" formControlName="code" maxlength="50" />
            @if (errorFor('code')) {
              <p class="error" role="alert">{{ errorFor('code') }}</p>
            }
          </div>

          <div>
            <label for="type">Tipo * (fixo após a criação)</label>
            <select id="type" formControlName="type">
              <option value="">Selecione…</option>
              <option value="STEEL">Aço</option>
              <option value="OPGW">OPGW</option>
            </select>
            @if (errorFor('type')) {
              <p class="error" role="alert">{{ errorFor('type') }}</p>
            }
          </div>
        } @else {
          <p>
            Código: <strong>{{ currentCode() }}</strong> · Tipo:
            <strong>{{ typeLabel() }}</strong> (fixo desde a criação)
          </p>
        }

        <div>
          <label for="description">Descrição</label>
          <input
            id="description"
            formControlName="description"
            maxlength="200"
          />
        </div>

        <div>
          <label for="weightTonPerKm">Peso (ton/km)</label>
          <input
            id="weightTonPerKm"
            formControlName="weightTonPerKm"
            inputmode="decimal"
          />
          @if (errorFor('weightTonPerKm')) {
            <p class="error" role="alert">{{ errorFor('weightTonPerKm') }}</p>
          }
        </div>

        <div>
          <label for="reelLengthM">Bobina (m)</label>
          <input
            id="reelLengthM"
            formControlName="reelLengthM"
            inputmode="decimal"
          />
          @if (errorFor('reelLengthM')) {
            <p class="error" role="alert">{{ errorFor('reelLengthM') }}</p>
          }
        </div>

        <div>
          <label for="diameterMm">Diâmetro (mm)</label>
          <input
            id="diameterMm"
            formControlName="diameterMm"
            inputmode="decimal"
          />
          @if (errorFor('diameterMm')) {
            <p class="error" role="alert">{{ errorFor('diameterMm') }}</p>
          }
        </div>

        <div>
          <label for="utsKn">UTS — carga de ruptura (kN)</label>
          <input id="utsKn" formControlName="utsKn" inputmode="decimal" />
          @if (errorFor('utsKn')) {
            <p class="error" role="alert">{{ errorFor('utsKn') }}</p>
          }
        </div>

        @if (selectedType() === 'STEEL') {
          <fieldset>
            <legend>Atributos do tipo aço</legend>
            <div>
              <label for="galvanizationClass">Classe de galvanização</label>
              <input
                id="galvanizationClass"
                formControlName="galvanizationClass"
                maxlength="50"
              />
            </div>
            <div>
              <label for="strengthGrade">Grau de resistência</label>
              <input
                id="strengthGrade"
                formControlName="strengthGrade"
                maxlength="50"
              />
            </div>
            <div>
              <label for="wireCount">Número de fios</label>
              <input
                id="wireCount"
                formControlName="wireCount"
                inputmode="numeric"
              />
              @if (errorFor('wireCount')) {
                <p class="error" role="alert">{{ errorFor('wireCount') }}</p>
              }
            </div>
          </fieldset>
        } @else if (selectedType() === 'OPGW') {
          <fieldset>
            <legend>Atributos do tipo OPGW</legend>
            <div>
              <label for="manufacturer">Fabricante</label>
              <input
                id="manufacturer"
                formControlName="manufacturer"
                maxlength="100"
              />
            </div>
            <div>
              <label for="i2tKa2s">I²t (kA²·s)</label>
              <input
                id="i2tKa2s"
                formControlName="i2tKa2s"
                inputmode="decimal"
              />
              @if (errorFor('i2tKa2s')) {
                <p class="error" role="alert">{{ errorFor('i2tKa2s') }}</p>
              }
            </div>
            <div>
              <label for="fiberCount">Número de fibras</label>
              <input
                id="fiberCount"
                formControlName="fiberCount"
                inputmode="numeric"
              />
              @if (errorFor('fiberCount')) {
                <p class="error" role="alert">{{ errorFor('fiberCount') }}</p>
              }
            </div>
          </fieldset>
        }

        <div>
          <label for="effectiveFrom">
            Início de vigência
            {{ editId() ? '*' : '(opcional; padrão hoje)' }}
          </label>
          <input
            id="effectiveFrom"
            formControlName="effectiveFrom"
            type="date"
          />
          @if (errorFor('effectiveFrom')) {
            <p class="error" role="alert">{{ errorFor('effectiveFrom') }}</p>
          }
        </div>

        @if (serverError()) {
          <p class="error" role="alert">{{ serverError() }}</p>
        }

        <button type="submit" [disabled]="saving() || form.disabled">
          Salvar
        </button>
        <a routerLink="/catalogs/ground-wires">Cancelar</a>
      </form>
    </section>
  `,
  styles: `
    form {
      display: grid;
      gap: 0.75rem;
      max-width: 28rem;
    }
    label {
      display: block;
      font-weight: 600;
    }
    input,
    select {
      width: 100%;
      padding: 0.35rem;
    }
    fieldset {
      display: grid;
      gap: 0.75rem;
      border: 1px solid #ddd;
      padding: 0.75rem;
    }
    .error {
      color: #b91c1c;
      margin: 0.15rem 0 0;
    }
  `,
})
export class GroundWireFormComponent {
  private readonly api = inject(GroundWiresApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

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
      next: () => this.router.navigate(['/catalogs/ground-wires']),
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
