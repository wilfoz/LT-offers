import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { FoundationVolumeSummary } from '@lt-offers/domain';
import { FoundationVolumeListComponent } from './foundation-volume-list.component';
import { FoundationVolumesApi } from './foundation-volumes-api.service';
import { FoundationTypesApi } from './foundation-types-api.service';
import { SoilTypesApi } from './soil-types-api.service';
import { StructureSeriesApi } from './structure-series-api.service';
import { TowerTypesApi } from './tower-types-api.service';

describe('FoundationVolumeListComponent', () => {
  const sampleVolumes: FoundationVolumeSummary[] = [
    {
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
      effectiveVersion: {
        id: 101,
        effectiveFrom: '2026-01-01',
        createdBy: 'usr',
        createdAt: '2026-01-01T00:00:00Z',
        excavationHardFootingM3: '12.500',
        excavationNormalFootingM3: null,
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
      pendingFields: [],
    },
    {
      id: 2,
      combination: {
        towerTypeId: 11,
        seriesName: 'Série 2',
        towerCode: 'T2',
        soilTypeId: 21,
        soilCode: 'II',
        foundationTypeId: 31,
        foundationCode: '1PR',
      },
      effectiveVersion: {
        id: 102,
        effectiveFrom: '2026-01-01',
        createdBy: 'usr',
        createdAt: '2026-01-01T00:00:00Z',
        excavationHardFootingM3: null,
        excavationNormalFootingM3: null,
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
      pendingFields: ['quantidades'],
    },
  ];

  async function mount(apiMock: Partial<FoundationVolumesApi>) {
    await TestBed.configureTestingModule({
      imports: [FoundationVolumeListComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        {
          provide: FoundationVolumesApi,
          useValue: {
            list: () => of(sampleVolumes),
            ...apiMock,
          },
        },
        {
          provide: StructureSeriesApi,
          useValue: {
            list: () => of([{ id: 1, name: 'Série 1' }]),
          },
        },
        {
          provide: TowerTypesApi,
          useValue: {
            list: () => of([{ id: 10, code: 'T1' }]),
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
    const fixture = TestBed.createComponent(FoundationVolumeListComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('exibe a listagem de volumes com combinações e pendências', async () => {
    const fixture = await mount({});
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Matriz de volumes de fundação');
    expect(text).toContain('Série 1');
    expect(text).toContain('T1');
    expect(text).toContain('I');
    expect(text).toContain('4FZ');
    expect(text).toContain('1 de 34 informadas');
    expect(text).toContain('Completo');
    expect(text).toContain('Pendente: quantidades');
  });

  it('filtra por referências de combinação', async () => {
    const listSpy = vi.fn().mockReturnValue(of([]));
    const fixture = await mount({ list: listSpy });
    const component = fixture.componentInstance;

    component.selectedTowerTypeId.set('10');
    component.selectedSoilTypeId.set('20');
    component.selectedFoundationTypeId.set('30');
    component.search(new Event('submit'));
    fixture.detectChanges();

    expect(listSpy).toHaveBeenCalledWith({
      towerTypeId: 10,
      soilTypeId: 20,
      foundationTypeId: 30,
    });
  });

  it('carrega tipos de torre ao selecionar uma série no filtro', async () => {
    const fixture = await mount({});
    const component = fixture.componentInstance;

    component.onSeriesFilterChange('1');
    fixture.detectChanges();

    expect(component.towersList()).toEqual([{ id: 10, code: 'T1' }]);
  });

  it('exibe mensagem de erro quando a listagem falha', async () => {
    const fixture = await mount({
      list: () => throwError(() => new Error('falha')),
    });
    const text = fixture.nativeElement.textContent;

    expect(text).toContain(
      'Não foi possível carregar a matriz de volumes; verifique a conexão e tente novamente',
    );
  });

  it('exibe empty state quando não há registros', async () => {
    const fixture = await mount({ list: () => of([]) });
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Nenhuma entrada encontrada na matriz de volumes.');
  });
});
