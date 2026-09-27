import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  BRAZILIAN_UFS,
  DATE_PATTERN,
  isValidCivilDate,
} from '@lt-offers/domain';
import { decimalScaleValidator, orNull } from './form-utils';
import {
  ScheduleParametersApi,
  WorkCalendarVersion,
} from './schedule-parameters-api.service';

export const WEEKDAY_LABELS = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
];

/** Data civil existente (rejeita 2027-02-30 sem rollover — RNF-05). */
function civilDateValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  if (value === '') {
    return null;
  }
  return isValidCivilDate(value) ? null : { civilDate: true };
}

/** UF brasileira válida; em branco = feriado nacional. */
function ufValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  if (value === '') {
    return null;
  }
  return (BRAZILIAN_UFS as readonly string[]).includes(value.toUpperCase())
    ? null
    : { unknownUf: true };
}

interface HolidayGroup {
  date: FormControl<string>;
  name: FormControl<string>;
  recurring: FormControl<boolean>;
  uf: FormControl<string>;
}

@Component({
  selector: 'app-work-calendar',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
  ],
  template: `
    <section>
      <h2>Calendário de trabalho</h2>
      <p>
        Feriados e dias não laborais penalizam a produção mensal das equipes no
        cronograma. Editar cria uma nova versão com vigência; versões anteriores
        permanecem imutáveis.
      </p>

      @if (currentVersion()) {
        <p class="mono">
          Versão vigente desde {{ currentVersion()!.effectiveFrom }} (por
          {{ currentVersion()!.createdBy }})
        </p>
      }

      <form [formGroup]="form" (ngSubmit)="save()">
        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="field"
        >
          <mat-label>Dias úteis padrão por mês *</mat-label>
          <input
            matInput
            formControlName="standardWorkingDaysPerMonth"
            inputmode="decimal"
          />
          <mat-hint>Denominador do fator de calendário (ex.: 22.00)</mat-hint>
          @if (standardDaysError()) {
            <mat-error>{{ standardDaysError() }}</mat-error>
          }
        </mat-form-field>

        <h3>Dias não laborais da semana</h3>
        <div class="weekdays" formArrayName="nonWorkingWeekdays">
          @for (day of weekdayLabels; track day; let index = $index) {
            <mat-checkbox [formControlName]="index">{{ day }}</mat-checkbox>
          }
        </div>
        @if (allNonWorkingError()) {
          <p class="error" role="alert">{{ allNonWorkingError() }}</p>
        }

        <h3>Feriados</h3>
        <p>
          Feriado recorrente repete todo ano pelo par mês-dia
          @if (recurringPreview()) {
            (ex.: {{ recurringPreview() }})
          }
          ; feriados móveis como Carnaval são cadastrados por ano. UF em branco
          = feriado nacional.
        </p>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Nome</th>
                <th>Recorrente (todo ano)</th>
                <th>UF</th>
                <th></th>
              </tr>
            </thead>
            <tbody formArrayName="holidays">
              @for (holiday of holidays.controls; track $index) {
                <tr [formGroupName]="$index">
                  <td>
                    <input
                      formControlName="date"
                      type="date"
                      [attr.aria-label]="'Data do feriado ' + ($index + 1)"
                    />
                    @if (holidayError($index, 'date')) {
                      <p class="error" role="alert">
                        {{ holidayError($index, 'date') }}
                      </p>
                    }
                  </td>
                  <td>
                    <input
                      formControlName="name"
                      maxlength="120"
                      [attr.aria-label]="'Nome do feriado ' + ($index + 1)"
                    />
                    @if (holidayError($index, 'name')) {
                      <p class="error" role="alert">
                        {{ holidayError($index, 'name') }}
                      </p>
                    }
                  </td>
                  <td class="center">
                    <mat-checkbox formControlName="recurring">
                      @if (holiday.controls.recurring.value) {
                        {{ monthDayOf(holiday.controls.date.value) }}
                      }
                    </mat-checkbox>
                  </td>
                  <td>
                    <input
                      class="uf"
                      formControlName="uf"
                      maxlength="2"
                      placeholder="BR"
                      [attr.aria-label]="'UF do feriado ' + ($index + 1)"
                    />
                    @if (holidayError($index, 'uf')) {
                      <p class="error" role="alert">
                        {{ holidayError($index, 'uf') }}
                      </p>
                    }
                  </td>
                  <td>
                    <button
                      matButton
                      type="button"
                      (click)="removeHoliday($index)"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <button matButton type="button" (click)="addHoliday()">
          Adicionar feriado
        </button>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="field effective-from"
        >
          <mat-label>Início de vigência da nova versão *</mat-label>
          <input matInput formControlName="effectiveFrom" type="date" />
          @if (effectiveFromError()) {
            <mat-error>{{ effectiveFromError() }}</mat-error>
          }
        </mat-form-field>

        @if (serverError()) {
          <p class="error" role="alert">{{ serverError() }}</p>
        }

        <div class="actions">
          <button
            matButton="filled"
            type="submit"
            [disabled]="saving() || form.disabled"
          >
            Salvar nova versão
          </button>
        </div>
      </form>
    </section>
  `,
  styles: `
    .field {
      display: block;
      max-width: 20rem;
    }
    .weekdays {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem 1.5rem;
    }
    table input {
      padding: 0.25rem;
    }
    table input.uf {
      width: 3rem;
      text-transform: uppercase;
    }
    .center {
      text-align: center;
    }
    .error {
      color: var(--mat-sys-error);
      margin: 0.15rem 0 0;
    }
    .effective-from {
      margin-top: 1rem;
    }
    .actions {
      margin-top: 1rem;
    }
    h3 {
      margin-top: 1.5rem;
    }
  `,
})
export class WorkCalendarComponent {
  private readonly api = inject(ScheduleParametersApi);
  private readonly snackBar = inject(MatSnackBar);

  readonly weekdayLabels = WEEKDAY_LABELS;
  readonly currentVersion = signal<WorkCalendarVersion | null>(null);
  readonly serverError = signal('');
  readonly saving = signal(false);

  readonly form = new FormGroup({
    standardWorkingDaysPerMonth: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        decimalScaleValidator(2, { nonZero: true }),
      ],
    }),
    nonWorkingWeekdays: new FormArray<FormControl<boolean>>(
      WEEKDAY_LABELS.map(() => new FormControl(false, { nonNullable: true })),
    ),
    holidays: new FormArray<FormGroup<HolidayGroup>>([]),
    effectiveFrom: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(DATE_PATTERN)],
    }),
  });

  constructor() {
    this.loadCurrent();
  }

  get holidays(): FormArray<FormGroup<HolidayGroup>> {
    return this.form.controls.holidays;
  }

  addHoliday(holiday = { date: '', name: '', recurring: false, uf: '' }): void {
    this.holidays.push(
      new FormGroup<HolidayGroup>({
        date: new FormControl(holiday.date, {
          nonNullable: true,
          validators: [
            Validators.required,
            Validators.pattern(DATE_PATTERN),
            civilDateValidator,
          ],
        }),
        name: new FormControl(holiday.name, {
          nonNullable: true,
          validators: [Validators.required],
        }),
        recurring: new FormControl(holiday.recurring, { nonNullable: true }),
        uf: new FormControl(holiday.uf, {
          nonNullable: true,
          validators: [ufValidator],
        }),
      }),
      { emitEvent: false },
    );
  }

  removeHoliday(index: number): void {
    this.holidays.removeAt(index);
  }

  /** Recorrente vale pelo par mês-dia; exibição sem o ano de referência. */
  monthDayOf(date: string): string {
    if (!DATE_PATTERN.test(date)) {
      return '';
    }
    return `${date.slice(8, 10)}/${date.slice(5, 7)} (todo ano)`;
  }

  recurringPreview(): string {
    const first = this.holidays.controls.find(
      (holiday) => holiday.controls.recurring.value,
    );
    return first ? this.monthDayOf(first.controls.date.value) : '';
  }

  standardDaysError(): string {
    const control = this.form.controls.standardWorkingDaysPerMonth;
    if (!control.touched || control.valid) {
      return '';
    }
    if (control.hasError('required')) {
      return 'Campo obrigatório';
    }
    if (control.hasError('decimalScale')) {
      return 'Use no máximo 2 casas decimais';
    }
    return 'Informe um número decimal maior que zero com ponto (ex.: 22.00)';
  }

  allNonWorkingError(): string {
    const allChecked = this.form.controls.nonWorkingWeekdays.controls.every(
      (control) => control.value,
    );
    return allChecked
      ? 'Os 7 dias da semana não podem ser todos não laborais'
      : '';
  }

  holidayError(index: number, field: 'date' | 'name' | 'uf'): string {
    const control = this.holidays.at(index).controls[field];
    if (!control.touched || control.valid) {
      return '';
    }
    if (control.hasError('required')) {
      return 'Campo obrigatório';
    }
    if (control.hasError('civilDate')) {
      return 'Data de calendário inexistente';
    }
    if (control.hasError('unknownUf')) {
      return 'UF inválida';
    }
    return 'Informe uma data no formato AAAA-MM-DD';
  }

  effectiveFromError(): string {
    const control = this.form.controls.effectiveFrom;
    if (!control.touched || control.valid) {
      return '';
    }
    if (control.hasError('required')) {
      return 'Campo obrigatório';
    }
    return 'Informe uma data no formato AAAA-MM-DD';
  }

  save(): void {
    // Formulário desabilitado = prefill pendente ou falho; salvar aqui
    // gravaria um calendário vazio por cima do vigente.
    if (this.form.disabled) {
      return;
    }
    this.form.markAllAsTouched();
    if (this.form.invalid || this.allNonWorkingError()) {
      return;
    }
    this.saving.set(true);
    this.serverError.set('');

    this.api
      .createWorkCalendarVersion({
        effectiveFrom: this.form.controls.effectiveFrom.value.trim(),
        standardWorkingDaysPerMonth:
          this.form.controls.standardWorkingDaysPerMonth.value.trim(),
        nonWorkingWeekdays: this.form.controls.nonWorkingWeekdays.controls
          .map((control, weekday) => (control.value ? weekday : -1))
          .filter((weekday) => weekday >= 0),
        holidays: this.holidays.controls.map((holiday) => ({
          date: holiday.controls.date.value.trim(),
          name: holiday.controls.name.value.trim(),
          recurring: holiday.controls.recurring.value,
          uf: orNull(holiday.controls.uf.value)?.toUpperCase() ?? null,
        })),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackBar.open('Calendário de trabalho salvo', 'Fechar', {
            duration: 4000,
          });
          this.form.controls.effectiveFrom.reset('');
          this.loadCurrent();
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

  private loadCurrent(): void {
    // Prefill bloqueante: sem os valores vigentes o formulário não salva.
    this.form.disable({ emitEvent: false });
    this.api.getWorkCalendar().subscribe({
      next: (version) => {
        this.currentVersion.set(version);
        this.form.patchValue(
          {
            standardWorkingDaysPerMonth:
              version.calendar.standardWorkingDaysPerMonth,
          },
          { emitEvent: false },
        );
        this.form.controls.nonWorkingWeekdays.controls.forEach(
          (control, weekday) =>
            control.setValue(
              version.calendar.nonWorkingWeekdays.includes(weekday),
              { emitEvent: false },
            ),
        );
        this.holidays.clear({ emitEvent: false });
        for (const holiday of version.calendar.holidays) {
          this.addHoliday({
            date: holiday.date,
            name: holiday.name,
            recurring: holiday.recurring,
            uf: holiday.uf ?? '',
          });
        }
        this.form.enable({ emitEvent: false });
      },
      error: () =>
        this.serverError.set(
          'Não foi possível carregar o calendário vigente; recarregue a página antes de criar uma nova versão',
        ),
    });
  }
}
