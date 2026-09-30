import {
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import {
  CATALOG_IMPORT_KEYS,
  CATALOG_IMPORT_MAX_FILE_BYTES,
  CATALOG_IMPORT_REGISTRY,
  CatalogImportCommitResult,
  CatalogImportInspectResult,
  CatalogImportKey,
  CatalogImportPreviewResult,
  ImportPayload,
  isSupportedImportFileName,
} from '@lt-offers/domain';
import { AuthService } from '../auth/auth.service';
import { civilDateValidator } from '../catalogs/form-utils';
import {
  ACCEPT_ATTRIBUTE,
  ACCEPTED_LABEL,
  COMMIT_STATUS_LABELS,
  FILE_TOO_LARGE_MESSAGE,
  MAX_FILE_MB,
  STATUS_BADGES,
  STATUS_LABELS,
  STEPS,
  UNSUPPORTED_FILE_MESSAGE,
  apiMessage,
  buildImportReport,
  columnLetter,
  rowSummary,
} from './analytic-import.helpers';
import { CatalogImportApi } from './catalog-import-api.service';
import { ImportMappingState, enumOptions } from './import-mapping.state';

/**
 * Importação Analítica (spec catalogos/importacao-analitica, design D5):
 * assistente em etapas arquivo → catálogo → aba/cabeçalho → mapeamento e
 * vigência → prévia → relatório. Campos e obrigatoriedade vêm do registro
 * da domain; nada é gravado antes da confirmação na prévia.
 */
@Component({
  selector: 'app-analytic-import',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
  ],
  templateUrl: './analytic-import.component.html',
  styleUrl: './analytic-import.component.scss',
})
export class AnalyticImportComponent {
  private readonly api = inject(CatalogImportApi);
  private readonly auth = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  readonly steps = STEPS;
  readonly acceptedLabel = ACCEPTED_LABEL;
  readonly acceptAttribute = ACCEPT_ATTRIBUTE;
  readonly maxFileMb = MAX_FILE_MB;
  readonly enumOptions = enumOptions;
  readonly rowSummary = rowSummary;
  readonly statusLabels = STATUS_LABELS;
  readonly commitStatusLabels = COMMIT_STATUS_LABELS;
  readonly statusBadges = STATUS_BADGES;
  readonly catalogOptions = CATALOG_IMPORT_KEYS.map((key) => ({
    key,
    label: CATALOG_IMPORT_REGISTRY[key].label,
  }));

  readonly step = signal(0);
  readonly busy = signal(false);
  readonly busyLabel = signal('');
  readonly serverError = signal('');
  readonly isDragging = signal(false);

  readonly file = signal<File | null>(null);
  readonly inspection = signal<CatalogImportInspectResult | null>(null);
  readonly catalogKey = signal<CatalogImportKey | null>(null);
  readonly sheetName = signal('');
  readonly headerRow = signal<number | null>(null);
  readonly preview = signal<CatalogImportPreviewResult | null>(null);
  readonly commitResult = signal<CatalogImportCommitResult | null>(null);

  private readonly stepHeading =
    viewChild<ElementRef<HTMLElement>>('stepHeading');
  private lastFocusedStep = 0;

  // A troca de etapa destrói o botão clicado (@switch): o foco vai para o
  // título da nova etapa, para leitores de tela e teclado (não no carregamento)
  private readonly focusOnStepChange = afterRenderEffect(() => {
    const step = this.step();
    if (step !== this.lastFocusedStep) {
      this.lastFocusedStep = step;
      this.stepHeading()?.nativeElement.focus();
    }
  });

  readonly effectiveFrom = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, civilDateValidator],
  });

  readonly definition = computed(() => {
    const key = this.catalogKey();
    return key ? CATALOG_IMPORT_REGISTRY[key] : null;
  });

  readonly mapping = new ImportMappingState(this.definition);

  readonly currentSheet = computed(
    () =>
      this.inspection()?.sheets.find((s) => s.name === this.sheetName()) ??
      null,
  );

  /** Largura da tabela de amostra: a linha mais longa da aba. */
  readonly sampleColumns = computed(() => {
    const width = Math.max(
      0,
      ...(this.currentSheet()?.rows.map((r) => r.length) ?? []),
    );
    return Array.from({ length: width }, (_, i) => columnLetter(i));
  });

  readonly headerCells = computed(() => {
    const row = this.headerRow();
    return row ? (this.currentSheet()?.rows[row - 1] ?? []) : [];
  });

  readonly columnOptions = computed(() =>
    this.headerCells().map((header, index) => ({
      index,
      label: `${columnLetter(index)} · ${header || '(sem título)'}`,
    })),
  );

  readonly toImport = computed(() =>
    (this.preview()?.rows ?? []).flatMap((row) =>
      row.status === 'TO_IMPORT' && row.payload ? [row.payload] : [],
    ),
  );

  readonly report = computed(() => {
    const preview = this.preview();
    const result = this.commitResult();
    return preview && result ? buildImportReport(preview, result) : null;
  });

  readonly catalogRoute = computed(() => this.definition()?.route ?? '/');

  // --- Etapa 1: arquivo -----------------------------------------------------

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.pickFile(file);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.pickFile(file);
    }
    // Permite escolher o mesmo arquivo de novo depois de um erro
    input.value = '';
  }

  pickFile(file: File): void {
    if (this.busy()) {
      return;
    }
    if (!isSupportedImportFileName(file.name)) {
      this.serverError.set(UNSUPPORTED_FILE_MESSAGE);
      return;
    }
    if (file.size > CATALOG_IMPORT_MAX_FILE_BYTES) {
      this.serverError.set(FILE_TOO_LARGE_MESSAGE);
      return;
    }
    this.start('Lendo a planilha…');
    this.api.inspect(file).subscribe({
      next: (inspection) => {
        this.busy.set(false);
        this.file.set(file);
        this.inspection.set(inspection);
        this.sheetName.set(inspection.sheets[0]?.name ?? '');
        this.headerRow.set(null);
        this.step.set(1);
      },
      error: (error) =>
        this.fail(error, 'Não foi possível ler o arquivo; tente novamente'),
    });
  }

  // --- Etapas 2 e 3: catálogo, aba e cabeçalho --------------------------------

  selectCatalog(key: CatalogImportKey): void {
    if (key !== this.catalogKey()) {
      this.catalogKey.set(key);
      this.mapping.reset();
    }
  }

  selectSheet(name: string): void {
    this.sheetName.set(name);
    this.headerRow.set(null);
    this.mapping.reset();
  }

  selectHeaderRow(row: number): void {
    this.headerRow.set(row);
    this.mapping.reset();
  }

  goToMapping(): void {
    const definition = this.definition();
    if (!definition || this.headerRow() === null) {
      return;
    }
    if (Object.keys(this.mapping.values()).length === 0) {
      this.mapping.suggest(definition.fields, this.headerCells());
    }
    this.step.set(3);
  }

  // --- Etapa 4: mapeamento e vigência -----------------------------------------

  effectiveFromError(): string | null {
    const control = this.effectiveFrom;
    if (!control.touched || !control.errors) {
      return null;
    }
    return control.errors['required']
      ? 'Informe a data de início de vigência das versões importadas'
      : 'Informe uma data real no formato AAAA-MM-DD';
  }

  requestPreview(): void {
    const definition = this.definition();
    const file = this.file();
    const headerRow = this.headerRow();
    if (!definition || !file || headerRow === null || this.busy()) {
      return;
    }
    if (!this.mapping.validate()) {
      return;
    }
    if (this.effectiveFrom.invalid) {
      this.effectiveFrom.markAsTouched();
      return;
    }
    this.start('Validando as linhas…');
    this.api
      .preview(file, {
        catalogKey: definition.catalogKey,
        sheetName: this.sheetName(),
        headerRow,
        columns: this.mapping.columns(),
        fixedValues: this.mapping.fixedValues(),
        effectiveFrom: this.effectiveFrom.value.trim(),
      })
      .subscribe({
        next: (preview) => {
          this.busy.set(false);
          this.preview.set(preview);
          this.step.set(4);
        },
        error: (error) =>
          this.fail(error, 'Não foi possível gerar a prévia; tente novamente'),
      });
  }

  // --- Etapas 5 e 6: prévia e relatório ---------------------------------------

  confirmImport(): void {
    const preview = this.preview();
    const items: ImportPayload[] = this.toImport();
    if (!preview || items.length === 0 || this.busy()) {
      return;
    }
    this.start('Importando os itens…');
    this.api
      .commit(
        {
          catalogKey: preview.catalogKey,
          effectiveFrom: this.effectiveFrom.value.trim(),
          items,
        },
        this.auth.activeUserEmail(),
      )
      .subscribe({
        next: (result) => {
          this.busy.set(false);
          this.commitResult.set(result);
          this.step.set(5);
          this.snackBar.open('Importação concluída', 'Fechar', {
            duration: 4000,
          });
        },
        error: (error) =>
          this.fail(
            error,
            'Não foi possível concluir a importação; nenhum relatório foi gerado',
          ),
      });
  }

  back(): void {
    if (!this.busy() && this.step() > 0 && this.step() < 5) {
      this.serverError.set('');
      this.step.update((s) => s - 1);
    }
  }

  restart(): void {
    this.step.set(0);
    this.serverError.set('');
    this.file.set(null);
    this.inspection.set(null);
    this.catalogKey.set(null);
    this.sheetName.set('');
    this.headerRow.set(null);
    this.mapping.reset();
    this.preview.set(null);
    this.commitResult.set(null);
    this.effectiveFrom.reset('');
  }

  private start(label: string): void {
    this.busy.set(true);
    this.busyLabel.set(label);
    this.serverError.set('');
  }

  // Erro de servidor: mensagem persistente na tela + aviso rápido
  private fail(error: unknown, fallback: string): void {
    this.busy.set(false);
    const message = apiMessage(error, fallback);
    this.serverError.set(message);
    this.snackBar.open(message, 'Fechar', { duration: 6000 });
  }
}
