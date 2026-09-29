import { Test } from '@nestjs/testing';
import {
  ConflictException,
  MethodNotAllowedException,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CreateViabilityParametersVersionUseCase,
  GetEffectiveViabilityParametersUseCase,
  GetViabilityAssessmentUseCase,
} from '../../application/usecases';
import {
  DuplicateViabilityParametersDateException,
  NoEffectiveViabilityParametersException,
} from '../../domain/exceptions/viability.exceptions';
import {
  CreateViabilityParametersVersionDto,
  ViabilityAssessmentQueryDto,
} from '../dto/viability-parameters.dto';
import { ViabilityController } from './viability.controller';

describe('ViabilityController', () => {
  const getEffectiveMock = { execute: jest.fn() };
  const createVersionMock = { execute: jest.fn() };
  const assessmentMock = { execute: jest.fn() };

  let controller: ViabilityController;

  const validVersion = {
    effectiveFrom: '2027-03-01',
    waccRealAfterTaxPercent: '7.50',
    concessionYears: 30,
    pisCofinsPercent: '9.25',
    operationMaintenancePercent: '10.00',
    incomeTaxPercent: '10.00',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [ViabilityController],
      providers: [
        {
          provide: GetEffectiveViabilityParametersUseCase,
          useValue: getEffectiveMock,
        },
        {
          provide: CreateViabilityParametersVersionUseCase,
          useValue: createVersionMock,
        },
        { provide: GetViabilityAssessmentUseCase, useValue: assessmentMock },
      ],
    }).compile();
    controller = moduleRef.get(ViabilityController);
  });

  it('GET parameters resolve a data de referência na borda (effectiveOn)', async () => {
    getEffectiveMock.execute.mockResolvedValue({ id: 1 });
    await controller.getParameters('2026-09-15');
    expect(getEffectiveMock.execute).toHaveBeenCalledWith('2026-09-15');
  });

  it('POST parameters valida data civil por round-trip (2027-02-30 → 400)', async () => {
    await expect(
      controller.createParameters(
        plainToInstance(CreateViabilityParametersVersionDto, {
          ...validVersion,
          effectiveFrom: '2027-02-30',
        }),
        'qa@epc.com',
      ),
    ).rejects.toThrow(
      'Data inválida: "2027-02-30"; informe uma data real no formato AAAA-MM-DD',
    );
    expect(createVersionMock.execute).not.toHaveBeenCalled();
  });

  it('POST parameters delega com autor do X-User e fallback sistema', async () => {
    createVersionMock.execute.mockResolvedValue({ id: 2 });
    await controller.createParameters(
      plainToInstance(CreateViabilityParametersVersionDto, validVersion),
      undefined,
    );
    expect(createVersionMock.execute).toHaveBeenCalledWith(
      validVersion,
      'sistema',
    );
  });

  it('vigência duplicada vira 409 e vigência ausente vira 404 com mensagens preservadas', async () => {
    createVersionMock.execute.mockRejectedValue(
      new DuplicateViabilityParametersDateException('2027-03-01'),
    );
    await expect(
      controller.createParameters(
        plainToInstance(CreateViabilityParametersVersionDto, validVersion),
        'qa',
      ),
    ).rejects.toThrow(ConflictException);

    getEffectiveMock.execute.mockRejectedValue(
      new NoEffectiveViabilityParametersException('2020-01-01'),
    );
    await expect(controller.getParameters('2020-01-01')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('PUT e PATCH de parâmetros respondem 405 imutável', () => {
    expect(() => controller.updateParameters()).toThrow(
      MethodNotAllowedException,
    );
    expect(() => controller.patchParameters()).toThrow(
      MethodNotAllowedException,
    );
  });

  it('GET assessment converte os ids e delega', async () => {
    assessmentMock.execute.mockResolvedValue({});
    await controller.assessment(
      plainToInstance(ViabilityAssessmentQueryDto, {
        offerId: '1',
        revisionId: '10',
      }),
    );
    expect(assessmentMock.execute).toHaveBeenCalledWith(1, 10);
  });

  describe('Validação dos DTOs (mensagens em português)', () => {
    it('paridade DTO × contrato: todas as chaves inválidas geram 1 erro por campo', async () => {
      const dto = plainToInstance(CreateViabilityParametersVersionDto, {
        effectiveFrom: '01/03/2027',
        waccRealAfterTaxPercent: '0',
        concessionYears: 0,
        pisCofinsPercent: '101.00',
        operationMaintenancePercent: '-1',
        incomeTaxPercent: '10.005',
      });
      const errors = await validate(dto);
      expect(errors.map((error) => error.property).sort()).toEqual([
        'concessionYears',
        'effectiveFrom',
        'incomeTaxPercent',
        'operationMaintenancePercent',
        'pisCofinsPercent',
        'waccRealAfterTaxPercent',
      ]);
    });

    it('mensagens exatas dos campos principais', async () => {
      const dto = plainToInstance(CreateViabilityParametersVersionDto, {
        ...validVersion,
        waccRealAfterTaxPercent: '0',
        pisCofinsPercent: '101.00',
        concessionYears: 61,
      });
      const errors = await validate(dto);
      const byField = Object.fromEntries(
        errors.map((error) => [error.property, error.constraints]),
      );
      expect(
        byField['waccRealAfterTaxPercent']?.['positiveNonZeroDecimal'],
      ).toBe(
        'O WACC real após impostos deve ser um decimal maior que zero com até 2 casas',
      );
      expect(byField['pisCofinsPercent']?.['decimalUpTo100']).toBe(
        'O PIS/COFINS deve ser de no máximo 100%',
      );
      expect(byField['concessionYears']?.['max']).toBe(
        'O prazo de recebimento da RAP deve ser de no máximo 60 anos',
      );
    });

    it('assessment: ids não inteiros são rejeitados', async () => {
      const errors = await validate(
        plainToInstance(ViabilityAssessmentQueryDto, {
          offerId: '0',
          revisionId: 'x',
        }),
      );
      expect(errors.map((error) => error.property).sort()).toEqual([
        'offerId',
        'revisionId',
      ]);
    });
  });
});
