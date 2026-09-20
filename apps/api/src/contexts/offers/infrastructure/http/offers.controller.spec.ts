import { Test } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { OffersController } from './offers.controller';
import {
  CreateOfferUseCase,
  GetOfferDetailsUseCase,
  ListOffersUseCase,
  UpdateOfferGeneralUseCase,
  CloneOfferUseCase,
  DeleteOfferUseCase,
  CreateRevisionUseCase,
  UpdateRevisionUseCase,
} from '../../application/usecases';
import {
  CreateOfferDto,
  TransmissionLineItemDto,
  UpdateOfferGeneralDto,
  UpdateOfferRevisionDto,
  CreateNewRevisionDto,
  CloneOfferDto,
} from './dto';
import { AuthService } from '../../../../auth/auth.service';
import { Offer } from '../../domain/entities/offer.entity';
import { OfferRevision } from '../../domain/entities/offer-revision.entity';
import { TransmissionLine } from '../../domain/entities/transmission-line.entity';
import { ScopeMatrixItem } from '../../domain/entities/scope-matrix-item.entity';

describe('Hexagonal OffersController', () => {
  let controller: OffersController;

  const mockOffer = Offer.create({
    code: 'PROP-01',
    name: 'Proposta 1',
    clientName: 'Cliente A',
    baseCurrency: 'BRL',
    revisions: [
      OfferRevision.create({
        revisionNumber: 0,
        status: 'DRAFT',
        auctionName: 'Leilão 01',
        lotName: 'Lote 1',
        offerDate: '2026-05-01',
        createdBy: 'test@epc.com',
        transmissionLines: [
          TransmissionLine.create({
            code: 'LT-01',
            name: 'Linha 1',
            nominalVoltageKv: '500.00',
            refinedLengthKm: '100.000',
            reportLengthKm: '100.000',
            circuitCount: 1,
            bundleConductorCount: 4,
            destinationStatePrimary: 'PR',
            destinationPercentagePrimary: '100.00',
          }),
        ],
        scopeMatrixItems: [
          ScopeMatrixItem.create({
            itemCode: 'MAT-CAB',
            itemName: 'Cabos',
            category: 'Materiais',
            responsibleParty: 'CONTRACTOR',
            acceptsDirectBilling: true,
            currencyRiskParty: 'CONTRACTOR',
            commodityRiskParty: 'CONTRACTOR',
          }),
        ],
      }),
    ],
  });

  const listUseCaseMock = { execute: jest.fn().mockResolvedValue([mockOffer]) };
  const getDetailsUseCaseMock = {
    execute: jest.fn().mockResolvedValue(mockOffer),
    executeByCode: jest.fn().mockResolvedValue(mockOffer),
  };
  const createUseCaseMock = {
    execute: jest.fn().mockResolvedValue(mockOffer),
  };
  const updateGeneralUseCaseMock = {
    execute: jest.fn().mockResolvedValue(mockOffer),
  };
  const updateRevisionUseCaseMock = {
    execute: jest.fn().mockResolvedValue(mockOffer),
  };
  const createRevisionUseCaseMock = {
    execute: jest.fn().mockResolvedValue(mockOffer),
  };
  const cloneUseCaseMock = { execute: jest.fn().mockResolvedValue(mockOffer) };
  const deleteUseCaseMock = { execute: jest.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [OffersController],
      providers: [
        { provide: ListOffersUseCase, useValue: listUseCaseMock },
        { provide: GetOfferDetailsUseCase, useValue: getDetailsUseCaseMock },
        { provide: CreateOfferUseCase, useValue: createUseCaseMock },
        {
          provide: UpdateOfferGeneralUseCase,
          useValue: updateGeneralUseCaseMock,
        },
        { provide: UpdateRevisionUseCase, useValue: updateRevisionUseCaseMock },
        { provide: CreateRevisionUseCase, useValue: createRevisionUseCaseMock },
        { provide: CloneOfferUseCase, useValue: cloneUseCaseMock },
        { provide: DeleteOfferUseCase, useValue: deleteUseCaseMock },
        AuthService,
      ],
    }).compile();

    controller = moduleRef.get(OffersController);
  });

  it('delega listagem ao usecase passando parâmetro de busca', async () => {
    const result = await controller.list('Lote 1');
    expect(listUseCaseMock.execute).toHaveBeenCalledWith('Lote 1');
    expect(result.length).toBe(1);
    expect(result[0].code).toBe('PROP-01');
  });

  it('delega getById e getByCode ao usecase', async () => {
    const byId = await controller.getById(1);
    expect(getDetailsUseCaseMock.execute).toHaveBeenCalledWith(1);
    expect(byId.code).toBe('PROP-01');

    const byCode = await controller.getByCode('PROP-01');
    expect(getDetailsUseCaseMock.executeByCode).toHaveBeenCalledWith('PROP-01');
    expect(byCode.code).toBe('PROP-01');
  });

  it('delega create ao usecase', async () => {
    const dto: CreateOfferDto = {
      code: 'PROP-01',
      name: 'Proposta 1',
      clientName: 'Cliente A',
      auctionName: 'Leilão 01',
      lotName: 'Lote 1',
      offerDate: '2026-05-01',
    };
    const result = await controller.create(dto);
    expect(createUseCaseMock.execute).toHaveBeenCalledWith(dto);
    expect(result.code).toBe('PROP-01');
  });

  it('delega updateGeneral e updateRevision ao usecase', async () => {
    const generalDto: UpdateOfferGeneralDto = { name: 'Novo Nome' };
    const revisionDto: UpdateOfferRevisionDto = { auctionName: 'Novo Leilão' };

    await controller.updateGeneral(1, generalDto);
    expect(updateGeneralUseCaseMock.execute).toHaveBeenCalledWith(
      1,
      generalDto,
    );

    await controller.updateRevision(1, 10, revisionDto);
    expect(updateRevisionUseCaseMock.execute).toHaveBeenCalledWith(
      1,
      10,
      revisionDto,
    );
  });

  it('delega createNewRevision, cloneOffer e delete aos usecases', async () => {
    const revDto: CreateNewRevisionDto = { notes: 'Ajuste' };
    const cloneDto: CloneOfferDto = {
      targetCode: 'PROP-CLONE',
      targetName: 'Proposta Clonada',
    };

    await controller.createNewRevision(1, revDto);
    expect(createRevisionUseCaseMock.execute).toHaveBeenCalledWith(1, revDto);

    await controller.cloneOffer(1, cloneDto);
    expect(cloneUseCaseMock.execute).toHaveBeenCalledWith(1, cloneDto);

    await controller.delete(1);
    expect(deleteUseCaseMock.execute).toHaveBeenCalledWith(1);
  });

  describe('Validação de DTOs HTTP', () => {
    it('rejeita CreateOfferDto sem campos obrigatórios', async () => {
      const dto = plainToInstance(CreateOfferDto, {} as any);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejeita TransmissionLineItemDto com valores inválidos', async () => {
      const dto = plainToInstance(TransmissionLineItemDto, {
        code: '',
        name: '',
        nominalVoltageKv: 'invalido',
        refinedLengthKm: '-10',
        reportLengthKm: '0',
        circuitCount: 0,
        bundleConductorCount: 0,
        destinationStatePrimary: 'SAOPAULO',
        destinationPercentagePrimary: '100',
      } as any);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('aceita CreateOfferDto válido com linhas aninhadas', async () => {
      const dto = plainToInstance(CreateOfferDto, {
        code: 'PROP-VAL',
        name: 'Proposta Valida',
        clientName: 'Cliente',
        auctionName: 'Leilão',
        lotName: 'Lote',
        offerDate: '2026-05-01',
        transmissionLines: [
          {
            code: 'LT-01',
            name: 'Linha 1',
            nominalVoltageKv: '500.00',
            refinedLengthKm: '100.000',
            reportLengthKm: '100.000',
            circuitCount: 1,
            bundleConductorCount: 4,
            destinationStatePrimary: 'PR',
            destinationPercentagePrimary: '100.00',
          },
        ],
      } as any);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
