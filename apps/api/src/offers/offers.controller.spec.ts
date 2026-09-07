import { Test } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CloneOfferDto } from './dto/clone-offer.dto';
import { CreateNewRevisionDto } from './dto/create-new-revision.dto';
import { CreateOfferDto } from './dto/create-offer.dto';
import { TransmissionLineItemDto } from './dto/transmission-line-item.dto';
import { UpdateOfferGeneralDto } from './dto/update-offer-general.dto';
import { UpdateOfferRevisionDto } from './dto/update-offer-revision.dto';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';

describe('OffersController', () => {
  const serviceMock = {
    list: jest.fn(),
    getById: jest.fn(),
    getByCode: jest.fn(),
    create: jest.fn(),
    updateGeneral: jest.fn(),
    updateRevision: jest.fn(),
    createNewRevision: jest.fn(),
    cloneOffer: jest.fn(),
    delete: jest.fn(),
  };

  let controller: OffersController;

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [OffersController],
      providers: [{ provide: OffersService, useValue: serviceMock }],
    }).compile();

    controller = moduleRef.get(OffersController);
  });

  it('delega listagem ao serviço passando parâmetro de busca', async () => {
    serviceMock.list.mockResolvedValue([]);
    await controller.list('Lote 1');
    expect(serviceMock.list).toHaveBeenCalledWith('Lote 1');
  });

  it('delega getById e getByCode ao serviço', async () => {
    serviceMock.getById.mockResolvedValue({ id: 1 });
    serviceMock.getByCode.mockResolvedValue({ code: 'OF-01' });

    expect(await controller.getById(1)).toEqual({ id: 1 });
    expect(await controller.getByCode('OF-01')).toEqual({ code: 'OF-01' });
  });

  it('delega create ao serviço', async () => {
    const dto: CreateOfferDto = {
      code: 'OF-01',
      name: 'Oferta 1',
      clientName: 'Cliente A',
      auctionName: 'Leilão 01',
      lotName: 'Lote 1',
      offerDate: '2026-05-01',
    };
    serviceMock.create.mockResolvedValue({ id: 1, ...dto });

    const result = await controller.create(dto);
    expect(serviceMock.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 1, ...dto });
  });

  it('delega updateGeneral e updateRevision ao serviço', async () => {
    const generalDto: UpdateOfferGeneralDto = { name: 'Novo Nome' };
    const revisionDto: UpdateOfferRevisionDto = { auctionName: 'Novo Leilão' };

    serviceMock.updateGeneral.mockResolvedValue({ id: 1 });
    serviceMock.updateRevision.mockResolvedValue({ id: 1 });

    await controller.updateGeneral(1, generalDto);
    expect(serviceMock.updateGeneral).toHaveBeenCalledWith(1, generalDto);

    await controller.updateRevision(1, 10, revisionDto);
    expect(serviceMock.updateRevision).toHaveBeenCalledWith(1, 10, revisionDto);
  });

  it('delega createNewRevision, cloneOffer e delete ao serviço', async () => {
    const revDto: CreateNewRevisionDto = { notes: 'Ajuste' };
    const cloneDto: CloneOfferDto = {
      targetCode: 'OF-CLONE',
      targetName: 'Oferta Clonada',
    };

    serviceMock.createNewRevision.mockResolvedValue({ id: 1 });
    serviceMock.cloneOffer.mockResolvedValue({ id: 2 });
    serviceMock.delete.mockResolvedValue(undefined);

    await controller.createNewRevision(1, revDto);
    expect(serviceMock.createNewRevision).toHaveBeenCalledWith(1, revDto);

    await controller.cloneOffer(1, cloneDto);
    expect(serviceMock.cloneOffer).toHaveBeenCalledWith(1, cloneDto);

    await controller.delete(1);
    expect(serviceMock.delete).toHaveBeenCalledWith(1);
  });

  describe('Validação de DTOs', () => {
    it('rejeita CreateOfferDto sem campos obrigatórios', async () => {
      const dto = plainToInstance(CreateOfferDto, {});
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
        destinationStatePrimary: 'SAOPAULO', // > 2 chars
        destinationPercentagePrimary: '100',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('aceita CreateOfferDto válido com linhas aninhadas', async () => {
      const dto = plainToInstance(CreateOfferDto, {
        code: 'OF-VAL',
        name: 'Oferta Valida',
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
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
