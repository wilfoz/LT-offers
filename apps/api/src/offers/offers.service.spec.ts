import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../app/prisma.service';
import { OffersService } from './offers.service';

const Decimal = Prisma.Decimal;


const uniqueViolation = () =>
  Object.assign(new Error('unique'), { code: 'P2002' });

describe('OffersService', () => {
  const prismaMock = {
    offer: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    offerRevision: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    transmissionLine: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    scopeMatrixItem: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let service: OffersService;

  beforeEach(async () => {
    jest.resetAllMocks();
    prismaMock.$transaction.mockImplementation(
      (cb: (tx: typeof prismaMock) => Promise<unknown>) => cb(prismaMock),
    );

    const moduleRef = await Test.createTestingModule({
      providers: [
        OffersService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = moduleRef.get(OffersService);
  });

  describe('list', () => {
    it('lista ofertas e calcula total de linhas, km e pendências corretamente', async () => {
      prismaMock.offer.findMany.mockResolvedValue([
        {
          id: 1,
          code: 'OF-2026-01',
          name: 'Lote 1 Sul',
          clientName: 'Axia Energia',
          baseCurrency: 'BRL',
          clonedFromOfferId: null,
          createdBy: 'admin',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          revisions: [
            {
              id: 10,
              revisionNumber: 0,
              status: 'DRAFT',
              auctionName: 'Leilão 01/2026',
              lotName: 'Lote 1',
              transmissionLines: [
                {
                  id: 101,
                  code: 'LT-01',
                  reportLengthKm: new Decimal('120.500'),
                  destinationPercentagePrimary: new Decimal('60.00'),
                  destinationPercentageSecondary: new Decimal('40.00'),
                },
                {
                  id: 102,
                  code: 'LT-02',
                  reportLengthKm: new Decimal('80.250'),
                  destinationPercentagePrimary: new Decimal('100.00'),
                  destinationPercentageSecondary: null,
                },
              ],
              scopeMatrixItems: [{ id: 201, itemCode: 'MAT-CAB' }],
            },
          ],
        },
        {
          id: 2,
          code: 'OF-2026-02',
          name: 'Lote 2 Vazio',
          clientName: 'Neoenergia',
          baseCurrency: 'BRL',
          clonedFromOfferId: null,
          createdBy: 'admin',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          revisions: [
            {
              id: 20,
              revisionNumber: 0,
              status: 'DRAFT',
              auctionName: 'Leilão 01/2026',
              lotName: 'Lote 2',
              transmissionLines: [],
              scopeMatrixItems: [],
            },
          ],
        },
      ]);

      const result = await service.list();

      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('OF-2026-01');
      expect(result[0].lineCount).toBe(2);
      expect(result[0].totalLengthKm).toBe('200.750');
      expect(result[0].hasPendingIssues).toBe(false);

      expect(result[1].code).toBe('OF-2026-02');
      expect(result[1].lineCount).toBe(0);
      expect(result[1].totalLengthKm).toBe('0.000');
      expect(result[1].hasPendingIssues).toBe(true);
    });

    it('sinaliza pendência se houver rateio de UFs inválido na linha', async () => {
      prismaMock.offer.findMany.mockResolvedValue([
        {
          id: 1,
          code: 'OF-INV',
          name: 'Oferta Invalida',
          clientName: 'Cliente',
          baseCurrency: 'BRL',
          clonedFromOfferId: null,
          createdBy: 'admin',
          createdAt: new Date(),
          updatedAt: new Date(),
          revisions: [
            {
              id: 10,
              revisionNumber: 0,
              status: 'DRAFT',
              auctionName: 'Leilão',
              lotName: 'Lote',
              transmissionLines: [
                {
                  id: 101,
                  code: 'LT-01',
                  reportLengthKm: new Decimal('100.000'),
                  destinationPercentagePrimary: new Decimal('50.00'),
                  destinationPercentageSecondary: new Decimal('30.00'), // Soma 80% != 100%
                },
              ],
              scopeMatrixItems: [{ id: 1 }],
            },
          ],
        },
      ]);

      const result = await service.list();
      expect(result[0].hasPendingIssues).toBe(true);
    });
  });

  describe('getById e getByCode', () => {
    const rawOffer = {
      id: 1,
      code: 'OF-01',
      name: 'Oferta 01',
      clientName: 'Cliente A',
      baseCurrency: 'BRL',
      clonedFromOfferId: null,
      createdBy: 'admin',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      revisions: [
        {
          id: 10,
          offerId: 1,
          revisionNumber: 0,
          status: 'DRAFT',
          auctionName: 'Leilão 01',
          lotName: 'Lote 1',
          offerDate: new Date('2026-06-01T00:00:00.000Z'),
          auctionDate: new Date('2026-06-15T00:00:00.000Z'),
          scheduleStartDate: null,
          commercialOperationDate: null,
          estimatedCapex: new Decimal('500000000.00'),
          maxRap: new Decimal('65000000.00'),
          winningRap: null,
          notes: 'Nota inicial',
          closedAt: null,
          deliveredAt: null,
          createdBy: 'admin',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          transmissionLines: [
            {
              id: 100,
              code: 'LT-500-01',
              name: 'LT 500kV',
              nominalVoltageKv: new Decimal('500.00'),
              refinedLengthKm: new Decimal('123.456'),
              reportLengthKm: new Decimal('123.500'),
              circuitCount: 1,
              bundleConductorCount: 4,
              destinationStatePrimary: 'PR',
              destinationPercentagePrimary: new Decimal('100.00'),
              destinationStateSecondary: null,
              destinationPercentageSecondary: null,
            },
          ],
          scopeMatrixItems: [
            {
              id: 200,
              itemCode: 'MAT-CAB',
              itemName: 'Cabos',
              category: 'Materiais',
              responsibleParty: 'CONTRACTOR',
              acceptsDirectBilling: true,
              currencyRiskParty: 'CONTRACTOR',
              commodityRiskParty: 'CONTRACTOR',
              notes: null,
            },
          ],
        },
      ],
    };

    it('retorna os detalhes da oferta com tipos mapeados', async () => {
      prismaMock.offer.findUnique.mockResolvedValue(rawOffer);

      const result = await service.getById(1);

      expect(result.id).toBe(1);
      expect(result.code).toBe('OF-01');
      expect(result.revisions).toHaveLength(1);
      expect(result.revisions[0].estimatedCapex).toBe('500000000.00');
      expect(result.revisions[0].transmissionLines[0].refinedLengthKm).toBe('123.456');
      expect(result.revisions[0].scopeMatrixItems[0].itemCode).toBe('MAT-CAB');
    });

    it('lança NotFoundException quando a oferta não existe', async () => {
      prismaMock.offer.findUnique.mockResolvedValue(null);

      await expect(service.getById(999)).rejects.toThrow(NotFoundException);
      await expect(service.getByCode('INEXISTENTE')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('cria uma oferta com revisão R0 e itens padrão de escopo', async () => {
      const createdOffer = {
        id: 1,
        code: 'OF-NOVA',
        name: 'Nova Proposta',
        clientName: 'Cliente X',
        baseCurrency: 'BRL',
        clonedFromOfferId: null,
        createdBy: 'ana',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        revisions: [
          {
            id: 10,
            offerId: 1,
            revisionNumber: 0,
            status: 'DRAFT',
            auctionName: 'Leilão 01/2026',
            lotName: 'Lote 1',
            offerDate: new Date('2026-05-01T00:00:00.000Z'),
            auctionDate: null,
            scheduleStartDate: null,
            commercialOperationDate: null,
            estimatedCapex: null,
            maxRap: null,
            winningRap: null,
            notes: null,
            closedAt: null,
            deliveredAt: null,
            createdBy: 'ana',
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            updatedAt: new Date('2026-01-01T00:00:00.000Z'),
            transmissionLines: [],
            scopeMatrixItems: [],
          },
        ],
      };

      prismaMock.offer.create.mockResolvedValue({ id: 1 });
      prismaMock.offerRevision.create.mockResolvedValue({ id: 10 });
      prismaMock.offer.findUniqueOrThrow.mockResolvedValue(createdOffer);

      const result = await service.create({
        code: 'OF-NOVA',
        name: 'Nova Proposta',
        clientName: 'Cliente X',
        auctionName: 'Leilão 01/2026',
        lotName: 'Lote 1',
        offerDate: '2026-05-01',
        createdBy: 'ana',
      });

      expect(prismaMock.offer.create).toHaveBeenCalled();
      expect(prismaMock.offerRevision.create).toHaveBeenCalled();
      expect(prismaMock.scopeMatrixItem.createMany).toHaveBeenCalled();
      expect(result.code).toBe('OF-NOVA');
    });

    it('rejeita criação com código duplicado', async () => {
      prismaMock.offer.create.mockRejectedValue(uniqueViolation());

      await expect(
        service.create({
          code: 'OF-DUP',
          name: 'Duplicada',
          clientName: 'Cliente',
          auctionName: 'Leilão',
          lotName: 'Lote',
          offerDate: '2026-05-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejeita linha com rateio de UFs diferente de 100%', async () => {
      await expect(
        service.create({
          code: 'OF-ERR',
          name: 'Com Erro de UF',
          clientName: 'Cliente',
          auctionName: 'Leilão',
          lotName: 'Lote',
          offerDate: '2026-05-01',
          transmissionLines: [
            {
              code: 'LT-01',
              name: 'LT Teste',
              nominalVoltageKv: '230.00',
              refinedLengthKm: '50.000',
              reportLengthKm: '50.000',
              circuitCount: 1,
              bundleConductorCount: 1,
              destinationStatePrimary: 'MG',
              destinationPercentagePrimary: '60.00',
              destinationStateSecondary: 'SP',
              destinationPercentageSecondary: '30.00', // 90% != 100%
            },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejeita linhas com códigos duplicados dentro da mesma oferta', async () => {
      await expect(
        service.create({
          code: 'OF-ERR',
          name: 'Com Linhas Duplicadas',
          clientName: 'Cliente',
          auctionName: 'Leilão',
          lotName: 'Lote',
          offerDate: '2026-05-01',
          transmissionLines: [
            {
              code: 'LT-01',
              name: 'Linha 1',
              nominalVoltageKv: '230.00',
              refinedLengthKm: '50.000',
              reportLengthKm: '50.000',
              circuitCount: 1,
              bundleConductorCount: 1,
              destinationStatePrimary: 'MG',
              destinationPercentagePrimary: '100.00',
            },
            {
              code: 'LT-01',
              name: 'Linha 2 com mesmo código',
              nominalVoltageKv: '230.00',
              refinedLengthKm: '60.000',
              reportLengthKm: '60.000',
              circuitCount: 1,
              bundleConductorCount: 1,
              destinationStatePrimary: 'SP',
              destinationPercentagePrimary: '100.00',
            },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateRevision', () => {
    it('bloqueia alterações em revisão fechada a menos que seja mudança de status', async () => {
      prismaMock.offerRevision.findFirst.mockResolvedValue({
        id: 10,
        offerId: 1,
        status: 'FROZEN',
        transmissionLines: [],
        scopeMatrixItems: [],
      });

      await expect(
        service.updateRevision(1, 10, {
          auctionName: 'Novo Nome do Leilão',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('permite atualizar revisão em rascunho com linhas e matriz de escopo', async () => {
      prismaMock.offerRevision.findFirst.mockResolvedValue({
        id: 10,
        offerId: 1,
        status: 'DRAFT',
        transmissionLines: [],
        scopeMatrixItems: [],
      });
      prismaMock.offer.findUnique.mockResolvedValue({
        id: 1,
        code: 'OF-01',
        name: 'Oferta',
        clientName: 'Cliente',
        baseCurrency: 'BRL',
        revisions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.updateRevision(1, 10, {
        auctionName: 'Leilão Atualizado',
        transmissionLines: [
          {
            code: 'LT-01',
            name: 'Linha Atualizada',
            nominalVoltageKv: '500.00',
            refinedLengthKm: '100.000',
            reportLengthKm: '100.000',
            circuitCount: 2,
            bundleConductorCount: 4,
            destinationStatePrimary: 'BA',
            destinationPercentagePrimary: '100.00',
          },
        ],
      });

      expect(prismaMock.offerRevision.update).toHaveBeenCalled();
      expect(prismaMock.transmissionLine.deleteMany).toHaveBeenCalled();
      expect(prismaMock.transmissionLine.createMany).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('createNewRevision', () => {
    it('cria nova revisão R(n+1) clonando linhas e escopo da revisão anterior', async () => {
      prismaMock.offer.findUnique.mockResolvedValue({
        id: 1,
        code: 'OF-01',
        name: 'Oferta',
        clientName: 'Cliente',
        baseCurrency: 'BRL',
        createdAt: new Date(),
        updatedAt: new Date(),
        revisions: [
          {
            id: 10,
            revisionNumber: 0,
            status: 'FROZEN',
            auctionName: 'Leilão 01',
            lotName: 'Lote 1',
            offerDate: new Date('2026-05-01'),
            transmissionLines: [
              {
                id: 101,
                code: 'LT-01',
                name: 'Linha 1',
                nominalVoltageKv: new Decimal('500.00'),
                refinedLengthKm: new Decimal('100.000'),
                reportLengthKm: new Decimal('100.000'),
                circuitCount: 1,
                bundleConductorCount: 4,
                destinationStatePrimary: 'MG',
                destinationPercentagePrimary: new Decimal('100.00'),
                destinationStateSecondary: null,
                destinationPercentageSecondary: null,
              },
            ],
            scopeMatrixItems: [
              {
                id: 201,
                itemCode: 'MAT-CAB',
                itemName: 'Cabos',
                category: 'Materiais',
                responsibleParty: 'CONTRACTOR',
                acceptsDirectBilling: true,
                currencyRiskParty: 'CONTRACTOR',
                commodityRiskParty: 'CONTRACTOR',
                notes: null,
              },
            ],
          },
        ],
      });

      prismaMock.offerRevision.create.mockResolvedValue({ id: 11 });

      await service.createNewRevision(1, { notes: 'Ajuste de escopo' });

      expect(prismaMock.offerRevision.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          offerId: 1,
          revisionNumber: 1,
          status: 'DRAFT',
        }),
      });
      expect(prismaMock.transmissionLine.createMany).toHaveBeenCalled();
      expect(prismaMock.scopeMatrixItem.createMany).toHaveBeenCalled();
    });
  });

  describe('cloneOffer', () => {
    it('clona uma oferta inteira gerando nova oferta e R0 com vínculo de origem', async () => {
      prismaMock.offer.findUnique.mockResolvedValueOnce({
        id: 1,
        code: 'OF-ORIGEM',
        name: 'Oferta Base',
        clientName: 'Cliente Origem',
        baseCurrency: 'BRL',
        revisions: [
          {
            id: 10,
            revisionNumber: 1,
            auctionName: 'Leilão 2025',
            lotName: 'Lote 1',
            offerDate: new Date('2025-05-01'),
            transmissionLines: [],
            scopeMatrixItems: [],
          },
        ],
      });

      prismaMock.offer.create.mockResolvedValue({ id: 2 });
      prismaMock.offerRevision.create.mockResolvedValue({ id: 20 });
      prismaMock.offer.findUniqueOrThrow.mockResolvedValue({
        id: 2,
        code: 'OF-CLONADA',
        name: 'Oferta Nova',
        clientName: 'Cliente Origem',
        baseCurrency: 'BRL',
        clonedFromOfferId: 1,
        createdBy: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
        revisions: [],
      });

      const result = await service.cloneOffer(1, {
        targetCode: 'OF-CLONADA',
        targetName: 'Oferta Nova',
      });

      expect(prismaMock.offer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          code: 'OF-CLONADA',
          clonedFromOfferId: 1,
        }),
      });
      expect(result.code).toBe('OF-CLONADA');
    });
  });

  describe('delete', () => {
    it('deleta oferta existente', async () => {
      prismaMock.offer.findUnique.mockResolvedValue({ id: 1 });
      await service.delete(1);
      expect(prismaMock.offer.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('lança NotFoundException se a oferta a ser deletada não existir', async () => {
      prismaMock.offer.findUnique.mockResolvedValue(null);
      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
    });
  });
});
