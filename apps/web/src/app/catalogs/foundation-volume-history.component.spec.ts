import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { of, throwError } from 'rxjs';
import { FoundationVolumeHistory } from '@lt-offers/domain';
import { FoundationVolumeHistoryComponent } from './foundation-volume-history.component';
import { FoundationVolumesApi } from './foundation-volumes-api.service';

describe('FoundationVolumeHistoryComponent', () => {
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
        id: 102,
        effectiveFrom: '2026-06-01',
        createdBy: 'usr2',
        createdAt: '2026-06-01T10:00:00Z',
        excavationHardFootingM3: '20.000',
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
  }) {
    const routeMock = {
      snapshot: {
        paramMap: convertToParamMap(
          options.idParam !== undefined && options.idParam !== null
            ? { id: options.idParam }
            : { id: '1' },
        ),
      },
    };

    await TestBed.configureTestingModule({
      imports: [FoundationVolumeHistoryComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: ActivatedRoute, useValue: routeMock },
        {
          provide: FoundationVolumesApi,
          useValue: {
            history: () => of(sampleHistory),
            ...options.apiMock,
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(FoundationVolumeHistoryComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('exibe o histórico de versões com dados da combinação e vigência UTC', async () => {
    const fixture = await mount({});
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Histórico de versões');
    expect(text).toContain('Série 1');
    expect(text).toContain('T1');
    expect(text).toContain('I');
    expect(text).toContain('4FZ');
    expect(text).toContain('01/06/2026');
    expect(text).toContain('2 de 34 informadas');
    expect(text).toContain('usr2');
  });

  it('exibe erro caso a leitura do histórico falhe', async () => {
    const fixture = await mount({
      apiMock: { history: () => throwError(() => new Error('falha')) },
    });
    const text = fixture.nativeElement.textContent;

    expect(text).toContain(
      'Não foi possível carregar o histórico; tente novamente',
    );
  });

  it('informa id inválido caso o parâmetro seja malformado', async () => {
    const fixture = await mount({ idParam: 'invalido' });
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Identificador inválido');
  });
});
