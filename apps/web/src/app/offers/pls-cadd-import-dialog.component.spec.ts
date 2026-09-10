import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PlsCaddImportPreview } from '@lt-offers/domain';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { PlsCaddImportDialogComponent } from './pls-cadd-import-dialog.component';
import { StakingApi } from './staking-api.service';

const mockPreview: PlsCaddImportPreview = {
  fileName: 'teste.csv',
  totalRows: 2,
  validRowsCount: 2,
  invalidRowsCount: 0,
  newTowersCount: 2,
  existingTowersCount: 0,
  removedTowersCount: 0,
  preservedAttributesCount: 0,
  totalLengthKm: '0.900',
  lineLengthDifferenceKm: null,
  globalErrors: [],
  rows: [
    {
      rowNumber: 2,
      towerNumber: 'T01',
      stationMeters: 0,
      bodyExtensionMeters: 0,
      deflectionAngleDeg: 0,
      lateralOffsetMeters: 0,
      utmEast: 500000,
      utmNorth: 7500000,
      elevationMeters: 600,
      towerTypeCode: 'SUSP',
      soilTypeCode: null,
      foundationTypeCode: null,
      isValid: true,
      errors: [],
    },
    {
      rowNumber: 3,
      towerNumber: 'T02',
      stationMeters: 900,
      bodyExtensionMeters: 3,
      deflectionAngleDeg: 12.5,
      lateralOffsetMeters: 0,
      utmEast: 500500,
      utmNorth: 7500400,
      elevationMeters: 610,
      towerTypeCode: 'ANG',
      soilTypeCode: null,
      foundationTypeCode: null,
      isValid: true,
      errors: [],
    },
  ],
};

describe('PlsCaddImportDialogComponent', () => {
  const stakingApiMock = {
    previewImport: vi.fn(),
    commitImport: vi.fn(),
  };

  const snackBarMock = {
    open: vi.fn(),
  };

  async function mount() {
    await TestBed.configureTestingModule({
      imports: [PlsCaddImportDialogComponent],
      providers: [
        { provide: StakingApi, useValue: stakingApiMock },
        { provide: MatSnackBar, useValue: snackBarMock },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PlsCaddImportDialogComponent);
    fixture.componentRef.setInput('lineId', 1);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with file selection area', async () => {
    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Importar Estaqueamento PLS-CADD');
    expect(text).toContain('Arraste a planilha PLS-CADD aqui');
  });

  it('previews file and displays summary metrics on valid file selection', async () => {
    stakingApiMock.previewImport.mockReturnValue(of(mockPreview));

    const fixture = await mount();
    const file = new File(['csv content'], 'teste.csv', { type: 'text/csv' });
    fixture.componentInstance.loadPreview(file);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(stakingApiMock.previewImport).toHaveBeenCalledWith(1, file);
    expect(text).toContain('Total de Estruturas');
    expect(text).toContain('0.900 km');
    expect(fixture.componentInstance.canCommit()).toBe(true);
  });

  it('shows error banner when preview fails', async () => {
    stakingApiMock.previewImport.mockReturnValue(
      throwError(() => ({ error: { message: 'Arquivo corrompido' } })),
    );

    const fixture = await mount();
    const file = new File(['invalid'], 'teste.csv', { type: 'text/csv' });
    fixture.componentInstance.loadPreview(file);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Arquivo corrompido');
    expect(fixture.componentInstance.canCommit()).toBe(false);
  });

  it('commits import and emits completed event', async () => {
    stakingApiMock.previewImport.mockReturnValue(of(mockPreview));
    stakingApiMock.commitImport.mockReturnValue(
      of({ importedCount: 2, updatedCount: 0, preservedCount: 0 }),
    );

    const fixture = await mount();
    const file = new File(['csv content'], 'teste.csv', { type: 'text/csv' });
    fixture.componentInstance.loadPreview(file);
    fixture.detectChanges();

    const emitSpy = vi.spyOn(fixture.componentInstance.importCompleted, 'emit');
    fixture.componentInstance.commitImport();

    expect(stakingApiMock.commitImport).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalledWith({
      importedCount: 2,
      updatedCount: 0,
      preservedCount: 0,
    });
  });
});
