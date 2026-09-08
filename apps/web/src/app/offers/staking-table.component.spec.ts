import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PaginatedStakingTowers } from '@lt-offers/domain';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { FoundationTypesApi } from '../catalogs/foundation-types-api.service';
import { SoilTypesApi } from '../catalogs/soil-types-api.service';
import { StakingApi } from './staking-api.service';
import { StakingTableComponent } from './staking-table.component';

const mockPaginatedResponse: PaginatedStakingTowers = {
  items: [
    {
      id: 1,
      transmissionLineId: 1,
      towerNumber: 'T01',
      stationMeters: '0.00',
      bodyExtensionMeters: '0.00',
      deflectionAngleDeg: '0.00',
      lateralOffsetMeters: '0.00',
      utmEast: '500000.00',
      utmNorth: '7500000.00',
      elevationMeters: '650.00',
      towerTypeId: null,
      soilTypeId: 1,
      foundationTypeId: 10,
      accessDifficulty: 'NORMAL',
      notes: null,
      soilType: { id: 1, code: 'S1', name: 'Arenoso' },
      foundationType: { id: 10, code: 'GRELHA', name: 'Grelha' },
    },
    {
      id: 2,
      transmissionLineId: 1,
      towerNumber: 'T02',
      stationMeters: '450.00',
      bodyExtensionMeters: '3.00',
      deflectionAngleDeg: '12.00',
      lateralOffsetMeters: '0.00',
      utmEast: '500400.00',
      utmNorth: '7500200.00',
      elevationMeters: '655.00',
      towerTypeId: null,
      soilTypeId: null,
      foundationTypeId: null,
      accessDifficulty: 'DIFFICULT',
      notes: null,
      soilType: null,
      foundationType: null,
    },
  ],
  totalCount: 2,
  page: 1,
  pageSize: 50,
  totalPages: 1,
  summary: {
    totalTowers: 2,
    minStationMeters: '0.00',
    maxStationMeters: '450.00',
    unassignedSoilCount: 1,
    unassignedFoundationCount: 1,
    invalidCombinationsCount: 0,
  },
};

describe('StakingTableComponent', () => {
  const stakingApiMock = {
    getPaginated: vi.fn(),
    getIntegritySummary: vi.fn(),
    getPreliminaryDistribution: vi.fn(),
    batchAssign: vi.fn(),
    createTower: vi.fn(),
    updateTower: vi.fn(),
    deleteTower: vi.fn(),
  };

  const soilTypesApiMock = {
    list: vi.fn(),
  };

  const foundationTypesApiMock = {
    list: vi.fn(),
  };

  const snackBarMock = {
    open: vi.fn(),
  };

  async function mount() {
    stakingApiMock.getPaginated.mockReturnValue(of(mockPaginatedResponse));
    stakingApiMock.getIntegritySummary.mockReturnValue(
      of({
        hasErrors: true,
        totalTowers: 2,
        unassignedSoilCount: 1,
        unassignedFoundationCount: 1,
        invalidCombinationsCount: 0,
        invalidCombinations: [],
        totalStationLengthKm: '0.450',
        lineRefinedLengthKm: '0.450',
        lengthDiscrepancyKm: null,
      }),
    );
    soilTypesApiMock.list.mockReturnValue(of([{ id: 1, code: 'S1' }]));
    foundationTypesApiMock.list.mockReturnValue(
      of([{ id: 10, code: 'GRELHA' }]),
    );

    await TestBed.configureTestingModule({
      imports: [StakingTableComponent],
      providers: [
        { provide: StakingApi, useValue: stakingApiMock },
        { provide: SoilTypesApi, useValue: soilTypesApiMock },
        { provide: FoundationTypesApi, useValue: foundationTypesApiMock },
        { provide: MatSnackBar, useValue: snackBarMock },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(StakingTableComponent);
    fixture.componentRef.setInput('lineId', 1);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders towers list and metrics summary', async () => {
    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Total de Estruturas');
    expect(text).toContain('T01');
    expect(text).toContain('T02');
    expect(text).toContain('0.00 m → 450.00 m');
    expect(text).toContain('Solos Pendentes');
  });

  it('filters towers when search query changes', async () => {
    const fixture = await mount();
    fixture.componentInstance.searchQuery = 'T02';
    fixture.componentInstance.onFilterChanged();

    expect(stakingApiMock.getPaginated).toHaveBeenCalledWith(1, {
      page: 1,
      pageSize: 50,
      search: 'T02',
      soilTypeId: undefined,
      foundationTypeId: undefined,
      accessDifficulty: undefined,
      sortBy: 'stationMeters',
      sortDirection: 'asc',
    });
  });

  it('applies batch assignment to station range', async () => {
    stakingApiMock.batchAssign.mockReturnValue(of({ updatedCount: 2 }));

    const fixture = await mount();
    fixture.componentInstance.openBatchAssignModal();
    fixture.componentInstance.batchStartStation = 0;
    fixture.componentInstance.batchEndStation = 1000;
    fixture.componentInstance.batchSoilTypeId = 1;

    fixture.componentInstance.applyBatchAssign();

    expect(stakingApiMock.batchAssign).toHaveBeenCalledWith(1, {
      startStationMeters: 0,
      endStationMeters: 1000,
      assignSoilTypeId: 1,
      assignFoundationTypeId: undefined,
      assignAccessDifficulty: undefined,
    });
    expect(snackBarMock.open).toHaveBeenCalledWith(
      'Atribuição em lote aplicada a 2 estruturas com sucesso!',
      'Fechar',
      expect.anything(),
    );
  });
});
