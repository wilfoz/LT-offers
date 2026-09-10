import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ElectromechanicalQuantitiesComponent } from './electromechanical-quantities.component';
import { ElectromechanicalApiService } from './electromechanical-api.service';
import {
  ElectromechanicalSummary,
  TowerTraceabilityDetail,
} from '@lt-offers/domain';

describe('ElectromechanicalQuantitiesComponent', () => {
  let component: ElectromechanicalQuantitiesComponent;
  let fixture: ComponentFixture<ElectromechanicalQuantitiesComponent>;
  let apiSpy: {
    getLineElectromechanicalSummary: ReturnType<typeof vi.fn>;
    getLineElectromechanicalTraceability: ReturnType<typeof vi.fn>;
  };

  const mockSummary: ElectromechanicalSummary = {
    lineId: '10',
    lineName: 'LT 500 kV Cascavel - Foz',
    lineLengthKm: 50.0,
    totalTowers: 5,
    towers: [
      {
        towerTypeCode: 'SL-500',
        towerTypeName: 'Suspensão Leve 500kV',
        structuralFamily: 'SELF_SUPPORTING_SUSPENSION',
        bodyType: 'LATTICE',
        count: 5,
        baseWeightKg: 8500,
        averageHeightM: 35.0,
        legExtensionsWeightKg: 1200,
        theoreticalWeightKg: 43700,
        extraMarginPercent: 0.5,
        extraWeightKg: 218.5,
        totalWeightKg: 43918.5,
        totalWeightTons: 43.92,
      },
    ],
    conductors: [
      {
        cableCode: 'CAB-RAIL',
        cableName: 'ACSR Rail 954 kcmil',
        circuitCount: 1,
        subconductorsPerPhase: 4,
        totalPhases: 3,
        routeLengthKm: 50.0,
        sagFactorPercent: 2.5,
        theoreticalLengthKm: 615.0,
        wasteFactorPercent: 3.0,
        wasteLengthKm: 18.45,
        totalLengthKm: 633.45,
        weightKgPerKm: 1600.0,
        totalWeightKg: 1013520.0,
        totalWeightTons: 1013.52,
      },
    ],
    groundWires: [
      {
        cableCode: 'OPGW-24',
        cableName: 'OPGW 24 FO 70mm²',
        type: 'OPGW',
        positionCount: 1,
        routeLengthKm: 50.0,
        sagFactorPercent: 1.5,
        spliceBoxesCount: 10,
        dropLengthPerBoxKm: 0.04,
        totalDropsKm: 0.4,
        theoreticalLengthKm: 51.15,
        wasteFactorPercent: 3.0,
        wasteLengthKm: 1.5345,
        totalLengthKm: 52.6845,
        weightKgPerKm: 450.0,
        totalWeightKg: 23708.03,
        totalWeightTons: 23.71,
      },
    ],
    insulators: [
      {
        typeCode: 'ISO-VIDRO-160KN',
        typeName: 'Cadeia de Isoladores de Vidro 160kN',
        category: 'SUSPENSION',
        stringsCount: 30,
        unitsPerString: 24,
        theoreticalUnits: 720,
        extraPercent: 2.0,
        extraUnits: 15,
        totalUnits: 735,
        unit: 'peças',
      },
    ],
    guyWires: [],
    dampers: [
      {
        cableCode: 'CAB-RAIL',
        cableName: 'ACSR Rail 954 kcmil',
        damperModel: 'Stockbridge 4-Resonance',
        totalSpans: 120,
        dampersPerSpan: 4,
        theoreticalUnits: 480,
        extraPercent: 2.0,
        extraUnits: 10,
        totalUnits: 490,
      },
    ],
    grounding: [
      {
        towerCount: 25,
        groundingType: 'COUNTERPOISE_4_LEGS',
        wireCode: 'CAB-ACO-50',
        wireLengthPerTowerM: 200,
        theoreticalLengthM: 5000,
        wastePercent: 5.0,
        totalLengthM: 5250,
        rodsCount: 100,
      },
    ],
    warningMarkers: [
      {
        markerType: 'SPHERICAL_ORANGE',
        totalUnits: 12,
        extraUnits: 1,
        totalWithExtras: 13,
      },
    ],
    accesses: [
      {
        accessType: 'RECOVERY_EXISTING',
        lengthKm: 15.0,
        description: 'Adequação de acessos existentes em terra',
        unit: 'km',
      },
    ],
    vegetationClearing: [
      {
        density: 'MEDIUM',
        lengthKm: 45.0,
        rightOfWayWidthM: 50.0,
        areaHectares: 225.0,
        description: 'Supressão vegetal média em faixa de servidão',
      },
    ],
    crossings: [
      {
        type: 'HIGHWAY',
        count: 4,
        description: 'Travessia de rodovia federal pavimentada',
      },
    ],
    consolidatedMaterials: [
      {
        itemCode: 'MAT-TOR-SL-500',
        itemName: 'Estrutura metálica treliçada SL-500',
        family: 'TOWERS',
        unit: 'kg',
        theoreticalQuantity: 43700,
        extraQuantity: 218.5,
        spareQuantity: 0,
        totalQuantity: 43918.5,
      },
    ],
    kpis: {
      totalTowerSteelTons: 43.92,
      totalConductorKm: 633.45,
      totalConductorTons: 1013.52,
      totalGroundWireKm: 52.68,
      totalGroundWireTons: 23.71,
      totalInsulatorUnits: 735,
      totalAccessKm: 15.0,
      totalClearingHectares: 225.0,
    },
  };

  const mockTraceability: TowerTraceabilityDetail[] = [
    {
      towerNumber: 'T001',
      towerTypeCode: 'SL-500',
      function: 'SUSPENSION',
      bodyType: 'LATTICE',
      heightM: 35.0,
      legExtensionsSumM: 4.0,
      baseWeightKg: 8500,
      extensionsWeightKg: 600,
      totalWeightKg: 9100,
      extraMarginPercent: 0.5,
      totalWeightWithExtraKg: 9145.5,
    },
    {
      towerNumber: 'T002',
      towerTypeCode: 'AL-500',
      function: 'ANCHOR',
      bodyType: 'LATTICE',
      heightM: 30.0,
      legExtensionsSumM: 0.0,
      baseWeightKg: 14000,
      extensionsWeightKg: 0,
      totalWeightKg: 14000,
      extraMarginPercent: 0.5,
      totalWeightWithExtraKg: 14070.0,
    },
  ];

  beforeEach(async () => {
    apiSpy = {
      getLineElectromechanicalSummary: vi.fn().mockReturnValue(of(mockSummary)),
      getLineElectromechanicalTraceability: vi.fn().mockReturnValue(of(mockTraceability)),
    };

    await TestBed.configureTestingModule({
      imports: [ElectromechanicalQuantitiesComponent],
      providers: [
        { provide: ElectromechanicalApiService, useValue: apiSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ElectromechanicalQuantitiesComponent);
    component = fixture.componentInstance;
    component.lineId = 10;
    fixture.detectChanges();
  });

  it('deve instanciar o componente e carregar os quantitativos automaticamente', () => {
    expect(component).toBeTruthy();
    expect(apiSpy.getLineElectromechanicalSummary).toHaveBeenCalledWith(10);
    expect(component.summary()).toEqual(mockSummary);
    expect(component.loading()).toBe(false);
  });

  it('deve renderizar os KPIs eletromecânicos no template', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('43.92');
    expect(el.textContent).toContain('1,013.52');
    expect(el.textContent).toContain('52.68');
    expect(el.textContent).toContain('225.0');
  });

  it('deve alternar os filtros de visualização por família', () => {
    expect(component.selectedFilter()).toBe('ALL');

    component.setFilter('TOWERS');
    expect(component.selectedFilter()).toBe('TOWERS');

    component.setFilter('CONDUCTORS');
    expect(component.selectedFilter()).toBe('CONDUCTORS');

    component.setFilter('HARDWARE');
    expect(component.selectedFilter()).toBe('HARDWARE');

    component.setFilter('ACCESSES');
    expect(component.selectedFilter()).toBe('ACCESSES');
  });

  it('deve abrir o modal de rastreabilidade e carregar dados torre a torre', () => {
    expect(component.showTraceabilityModal()).toBe(false);

    component.openTraceabilityModal();
    expect(component.showTraceabilityModal()).toBe(true);
    expect(apiSpy.getLineElectromechanicalTraceability).toHaveBeenCalledWith(10);
    expect(component.traceabilityData()).toEqual(mockTraceability);

    // Filtrar por texto
    component.traceSearchQuery = 'T001';
    const filtered = component.filteredTraceability();
    expect(filtered.length).toBe(1);
    expect(filtered[0].towerNumber).toBe('T001');

    // Fechar modal
    component.closeTraceabilityModal();
    expect(component.showTraceabilityModal()).toBe(false);
  });

  it('deve retornar o label correto para as famílias de suprimentos', () => {
    expect(component.getFamilyLabel('TOWERS')).toBe('Torres e Estruturas Metálicas');
    expect(component.getFamilyLabel('CONDUCTORS')).toBe('Cabos Condutores de Alumínio');
    expect(component.getFamilyLabel('INSULATORS')).toBe('Cadeias de Isoladores');
  });
});
