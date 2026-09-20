import { BadRequestException, MethodNotAllowedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  ConductorCablesController,
  GroundWiresController,
  GuyWiresController,
  InsulatorsController,
  StructureSeriesController,
  TowerTypesController,
  SoilTypesController,
  FoundationTypesController,
  FoundationVolumesController,
  FixedCostsController,
  EquipmentController,
  LaborRolesController,
  WorkCrewsController,
} from './';
import {
  ConductorCablesUseCases,
  GroundWiresUseCases,
  GuyWiresUseCases,
  InsulatorsUseCases,
  StructureSeriesUseCases,
  TowerTypesUseCases,
  SoilTypesUseCases,
  FoundationTypesUseCases,
  FoundationVolumesUseCases,
  FixedCostsUseCases,
  EquipmentUseCases,
  LaborRolesUseCases,
  WorkCrewsUseCases,
} from '../../../application';
import {
  ConductorCableEntity,
  ConductorCableVersionEntity,
  EffectivePeriod,
  CivilDate,
} from '../../../domain';

describe('Catalogs Controllers (Hexagonal Infrastructure)', () => {
  let conductorController: ConductorCablesController;
  let useCasesMock: jest.Mocked<ConductorCablesUseCases>;

  beforeEach(async () => {
    useCasesMock = {
      create: jest.fn(),
      createVersion: jest.fn(),
      list: jest.fn().mockResolvedValue([]),
      get: jest.fn(),
      listHistory: jest.fn(),
    } as any;

    const moduleRef = await Test.createTestingModule({
      controllers: [ConductorCablesController],
      providers: [
        {
          provide: ConductorCablesUseCases,
          useValue: useCasesMock,
        },
      ],
    }).compile();

    conductorController = moduleRef.get(ConductorCablesController);
  });

  it('usa "sistema" como autor padrão no cabeçalho X-User ausente', async () => {
    const dummy = new ConductorCableEntity({
      id: 1,
      code: 'CAA-636',
      versions: [
        new ConductorCableVersionEntity({
          description: 'Cabo',
          effectivePeriod: new EffectivePeriod(
            CivilDate.fromString('2026-01-01'),
          ),
          createdBy: 'sistema',
        }),
      ],
    });
    useCasesMock.create.mockResolvedValue(dummy);

    const result = await conductorController.create({ code: 'CAA-636' } as any);
    expect(useCasesMock.create).toHaveBeenCalledWith(
      expect.anything(),
      'sistema',
      expect.anything(),
    );
    expect(result.code).toBe('CAA-636');
  });

  it('repassa autor do cabeçalho X-User quando presente', async () => {
    const dummy = new ConductorCableEntity({
      id: 1,
      code: 'CAA-636',
      versions: [
        new ConductorCableVersionEntity({
          description: 'Cabo',
          effectivePeriod: new EffectivePeriod(
            CivilDate.fromString('2026-01-01'),
          ),
          createdBy: 'carla',
        }),
      ],
    });
    useCasesMock.create.mockResolvedValue(dummy);

    await conductorController.create({ code: 'CAA-636' } as any, 'carla');
    expect(useCasesMock.create).toHaveBeenCalledWith(
      expect.anything(),
      'carla',
      expect.anything(),
    );
  });

  it('rejeita data de referência fora do formato AAAA-MM-DD com 400', async () => {
    await expect(
      conductorController.list(undefined, '23/08/2026'),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejeita data de referência inválida no calendário (ex: 2026-02-30) com 400', async () => {
    await expect(
      conductorController.list(undefined, '2026-02-30'),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejeita PUT e PATCH em versões de catálogo com 405 MethodNotAllowed (RNF-05)', () => {
    expect(() => conductorController.replaceVersion()).toThrow(
      MethodNotAllowedException,
    );
    expect(() => conductorController.patchVersion()).toThrow(
      MethodNotAllowedException,
    );
  });
});
