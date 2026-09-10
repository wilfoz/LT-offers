import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { FoundationTypesApi } from '../catalogs/foundation-types-api.service';
import { SoilTypesApi } from '../catalogs/soil-types-api.service';
import { PreliminaryStakingFormComponent } from './preliminary-staking-form.component';
import { StakingApi } from './staking-api.service';

describe('PreliminaryStakingFormComponent', () => {
  const stakingApiMock = {
    getPreliminaryDistribution: vi.fn(),
    savePreliminaryDistribution: vi.fn(),
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
    soilTypesApiMock.list.mockReturnValue(
      of([
        { id: 1, code: 'S1', name: 'Arenoso' },
        { id: 2, code: 'S2', name: 'Argiloso' },
      ]),
    );
    foundationTypesApiMock.list.mockReturnValue(
      of([
        { id: 10, code: 'GRELHA', name: 'Grelha Metálica' },
        { id: 20, code: 'SAPATA', name: 'Sapata de Concreto' },
      ]),
    );
    stakingApiMock.getPreliminaryDistribution.mockReturnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [PreliminaryStakingFormComponent],
      providers: [
        { provide: StakingApi, useValue: stakingApiMock },
        { provide: SoilTypesApi, useValue: soilTypesApiMock },
        { provide: FoundationTypesApi, useValue: foundationTypesApiMock },
        { provide: MatSnackBar, useValue: snackBarMock },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PreliminaryStakingFormComponent);
    fixture.componentRef.setInput('lineId', 1);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads catalogs and calculates totals in real time', async () => {
    const fixture = await mount();
    const comp = fixture.componentInstance;

    expect(comp.soilRows()).toHaveLength(2);
    expect(comp.foundationRows()).toHaveLength(2);
    expect(comp.isValid()).toBe(false); // 0% sum is not 100%

    // Set 60% S1, 40% S2
    comp.soilRows.set([
      { id: 1, code: 'S1', name: 'Arenoso', percentage: '60.00' },
      { id: 2, code: 'S2', name: 'Argiloso', percentage: '40.00' },
    ]);
    // Set 100% GRELHA
    comp.foundationRows.set([
      { id: 10, code: 'GRELHA', name: 'Grelha', percentage: '100.00' },
      { id: 20, code: 'SAPATA', name: 'Sapata', percentage: '0.00' },
    ]);

    expect(comp.isSoilSumValid()).toBe(true);
    expect(comp.isFoundationSumValid()).toBe(true);
    expect(comp.isValid()).toBe(true);
  });

  it('saves valid distribution with API payload', async () => {
    stakingApiMock.savePreliminaryDistribution.mockReturnValue(
      of({
        id: 1,
        transmissionLineId: 1,
        soilPercentages: [],
        foundationPercentages: [],
        createdAt: '',
        updatedAt: '',
      }),
    );

    const fixture = await mount();
    const comp = fixture.componentInstance;

    comp.soilRows.set([
      { id: 1, code: 'S1', name: 'Arenoso', percentage: '100.00' },
      { id: 2, code: 'S2', name: 'Argiloso', percentage: '0.00' },
    ]);
    comp.foundationRows.set([
      { id: 10, code: 'GRELHA', name: 'Grelha', percentage: '100.00' },
      { id: 20, code: 'SAPATA', name: 'Sapata', percentage: '0.00' },
    ]);

    comp.save();

    expect(stakingApiMock.savePreliminaryDistribution).toHaveBeenCalledWith(1, {
      soilPercentages: [
        { id: 1, code: 'S1', name: 'Arenoso', percentage: '100.00' },
      ],
      foundationPercentages: [
        { id: 10, code: 'GRELHA', name: 'Grelha', percentage: '100.00' },
      ],
    });
    expect(snackBarMock.open).toHaveBeenCalledWith(
      'Distribuição paramétrica salva com sucesso!',
      'Fechar',
      expect.anything(),
    );
  });
});
