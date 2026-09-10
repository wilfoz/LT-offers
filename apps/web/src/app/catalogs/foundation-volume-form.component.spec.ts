import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { FoundationVolumeHistory } from '@lt-offers/domain';
import { FoundationVolumeFormComponent } from './foundation-volume-form.component';
import { FoundationVolumesApi } from './foundation-volumes-api.service';
import { FoundationTypesApi } from './foundation-types-api.service';
import { SoilTypesApi } from './soil-types-api.service';
import { StructureSeriesApi } from './structure-series-api.service';
import { TowerTypesApi } from './tower-types-api.service';

describe('FoundationVolumeFormComponent', () => {
  const sampleHistory: FoundationVolumeHistory = {
    id: 1,
    combination: {
      towerTypeId: 10,
      seriesName: 'Série 1',
      towerCode: 'T1',
      soilTypeId: 20,
      soilCode: 'I',
      foundationTypeId: 30,
      foundationCode: '4FZ',
    },
    versions: [
      {
        id: 101,
        effectiveFrom: '2026-01-01',
        createdBy: 'usr',
        createdAt: '2026-01-01T00:00:00Z',
        excavationHardFootingM3: '10.500',
        excavationNormalFootingM3: '0',
        excavationWaterFootingM3: null,
        excavationHardPrecastM3: null,
        excavationNormalPrecastM3: null,
        excavationWaterPrecastM3: null,
        excavationHardPileCapM3: null,
        excavationNormalPileCapM3: null,
        excavationWaterPileCapM3: null,
        excavationPierM3: null,
        anchorBoltDrillingM: null,
        steelPiersKg: null,
        steelFootingsKg: null,
        steelPileCapsKg: null,
        steelPrecastKg: null,
        steelRockKg: null,
        steelAnchorBoltsKg: null,
        concretePiersM3: null,
        concreteFootingsM3: null,
        concretePileCapsM3: null,
        concretePrecastM3: null,
        concreteRockM3: null,
        regenerationM3: null,
        groutM3: null,
        backfillSoilM3: null,
        backfillSoilCementM3: null,
        formworkM2: null,
        helicalPileM: null,
        steelPileM: null,
        triconeM: null,
        rootPileM: null,
        continuousAugerPileM: null,
        micropileM: null,
        concretePileM: null,
      },
    ],
  };

  async function mount(options: {
    idParam?: string | null;
    apiMock?: Partial<FoundationVolumesApi>;
    towerApiMock?: Partial<TowerTypesApi>;
    seriesApiMock?: Partial<StructureSeriesApi>;
  }) {
    const routeMock = {
      snapshot: {
        paramMap: convertToParamMap(
          options.idParam !== undefined && options.idParam !== null
            ? { id: options.idParam }
            : {},
        ),
      },
    };

    await TestBed.configureTestingModule({
      imports: [FoundationVolumeFormComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: ActivatedRoute, useValue: routeMock },
        {
          provide: FoundationVolumesApi,
          useValue: {
            create: vi.fn().mockReturnValue(of({ id: 1 })),
            createVersion: vi.fn().mockReturnValue(of({ id: 1 })),
            history: vi.fn().mockReturnValue(of(sampleHistory)),
            ...options.apiMock,
          },
        },
        {
          provide: StructureSeriesApi,
          useValue: {
            list: () => of([{ id: 1, name: 'Série 1' }]),
            ...options.seriesApiMock,
          },
        },
        {
          provide: TowerTypesApi,
          useValue: {
            list: () => of([{ id: 10, code: 'T1' }]),
            ...options.towerApiMock,
          },
        },
        {
          provide: SoilTypesApi,
          useValue: {
            list: () => of([{ id: 20, code: 'I' }]),
          },
        },
        {
          provide: FoundationTypesApi,
          useValue: {
            list: () => of([{ id: 30, code: '4FZ' }]),
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(FoundationVolumeFormComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('exige referências de combinação na criação', async () => {
    const fixture = await mount({});
    const component = fixture.componentInstance;

    component.save();
    fixture.detectChanges();

    expect(component.form.controls.towerTypeId.hasError('required')).toBe(true);
    expect(component.form.controls.soilTypeId.hasError('required')).toBe(true);
    expect(component.form.controls.foundationTypeId.hasError('required')).toBe(
      true,
    );
  });

  it('cascata série -> torre carrega torres da série selecionada', async () => {
    const towerSpy = vi.fn().mockReturnValue(of([{ id: 10, code: 'T1' }]));
    const fixture = await mount({ towerApiMock: { list: towerSpy } });
    const component = fixture.componentInstance;

    component.onSeriesChange('1');
    fixture.detectChanges();

    expect(towerSpy).toHaveBeenCalledWith(1);
    expect(component.towersList()).toEqual([{ id: 10, code: 'T1' }]);
  });

  it('submete criação com payload correto distinguindo zero de null', async () => {
    const createSpy = vi.fn().mockReturnValue(of({ id: 1 }));
    const fixture = await mount({ apiMock: { create: createSpy } });
    const component = fixture.componentInstance;

    component.seriesControl.setValue('1');
    component.form.patchValue({
      towerTypeId: '10',
      soilTypeId: '20',
      foundationTypeId: '30',
      excavationHardFootingM3: '15.250',
      excavationNormalFootingM3: '0',
    });

    component.save();
    fixture.detectChanges();

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        towerTypeId: 10,
        soilTypeId: 20,
        foundationTypeId: 30,
        excavationHardFootingM3: '15.250',
        excavationNormalFootingM3: '0',
        excavationWaterFootingM3: null,
      }),
    );
  });

  it('na edição exibe a combinação imutável e submete nova versão', async () => {
    const createVersionSpy = vi.fn().mockReturnValue(of({ id: 1 }));
    const fixture = await mount({
      idParam: '1',
      apiMock: { createVersion: createVersionSpy },
    });
    const component = fixture.componentInstance;
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Nova versão da entrada da matriz de volumes');
    expect(text).toContain('Série 1');
    expect(text).toContain('T1');
    expect(text).toContain('I');
    expect(text).toContain('4FZ');

    expect(component.form.controls.excavationHardFootingM3.value).toBe(
      '10.500',
    );
    expect(component.form.controls.excavationNormalFootingM3.value).toBe('0');

    component.form.patchValue({
      effectiveFrom: '2026-06-01',
      excavationHardFootingM3: '20.000',
    });

    component.save();
    fixture.detectChanges();

    expect(createVersionSpy).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        effectiveFrom: '2026-06-01',
        excavationHardFootingM3: '20.000',
        excavationNormalFootingM3: '0',
      }),
    );
  });

  it('prefill bloqueante exibe erro caso falhe o carregamento na edição', async () => {
    const fixture = await mount({
      idParam: '1',
      apiMock: { history: () => throwError(() => new Error('falha')) },
    });
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.form.disabled).toBe(true);
    expect(component.serverError()).toContain(
      'Não foi possível carregar os dados atuais da entrada da matriz',
    );
  });

  it('guarda de id inválido desabilita o formulário', async () => {
    const fixture = await mount({ idParam: 'abc' });
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.form.disabled).toBe(true);
    expect(component.serverError()).toBe('Identificador inválido');
  });
});
