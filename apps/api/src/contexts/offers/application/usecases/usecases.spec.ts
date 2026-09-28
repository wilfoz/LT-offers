import {
  OffersRepository,
  OffersFilter,
} from '../../domain/ports/offers.repository';
import { OfferRevisionsRepository } from '../../domain/ports/offer-revisions.repository';
import {
  OffersUnitOfWork,
  OffersTransactionalContext,
} from '../../domain/ports/offers-unit-of-work';
import { Offer } from '../../domain/entities/offer.entity';
import { OfferRevision } from '../../domain/entities/offer-revision.entity';
import { TransmissionLine } from '../../domain/entities/transmission-line.entity';
import { ScopeMatrixItem } from '../../domain/entities/scope-matrix-item.entity';
import {
  DuplicateOfferCodeException,
  InvalidDestinationSharesException,
  InvalidStatusTransitionException,
  OfferNotFoundException,
  RevisionFrozenException,
  RevisionNotFoundException,
} from '../../domain/exceptions/offer-domain.exceptions';
import {
  CreateOfferUseCase,
  GetOfferDetailsUseCase,
  ListOffersUseCase,
  UpdateOfferGeneralUseCase,
  CloneOfferUseCase,
  DeleteOfferUseCase,
  CreateRevisionUseCase,
  FreezeRevisionUseCase,
  MarkRevisionDeliveredUseCase,
  SaveScopeMatrixUseCase,
  SaveRevisionParametersUseCase,
  UpdateRevisionUseCase,
  AddTransmissionLineUseCase,
  UpdateTransmissionLineUseCase,
  DeleteTransmissionLineUseCase,
} from './index';

class InMemoryOffersRepository implements OffersRepository {
  public offers: Map<number, Offer> = new Map();
  private nextId = 1;

  async findById(id: number): Promise<Offer | null> {
    const offer = this.offers.get(id);
    return offer ? Offer.reconstitute(offer.toRawProps()) : null;
  }

  async findByCode(code: string): Promise<Offer | null> {
    for (const offer of this.offers.values()) {
      if (offer.code.toUpperCase() === code.toUpperCase()) {
        return Offer.reconstitute(offer.toRawProps());
      }
    }
    return null;
  }

  async list(filter?: OffersFilter): Promise<Offer[]> {
    const list = Array.from(this.offers.values()).map((o) =>
      Offer.reconstitute(o.toRawProps()),
    );
    if (!filter?.search) return list;

    const term = filter.search.toLowerCase();
    return list.filter(
      (o) =>
        o.code.toLowerCase().includes(term) ||
        o.name.toLowerCase().includes(term) ||
        o.clientName.toLowerCase().includes(term) ||
        o.revisions.some(
          (r) =>
            r.auctionName.toLowerCase().includes(term) ||
            r.lotName.toLowerCase().includes(term),
        ),
    );
  }

  async save(offer: Offer): Promise<Offer> {
    const raw = offer.toRawProps();
    if (!raw.id) {
      raw.id = this.nextId++;
      raw.revisions = raw.revisions.map((r, rIdx) => ({
        ...r,
        id: r.id ?? rIdx + 1,
        offerId: raw.id,
        transmissionLines: r.transmissionLines.map((l, lIdx) => ({
          ...l,
          id: l.id ?? lIdx + 1,
          revisionId: r.id ?? rIdx + 1,
        })),
        scopeMatrixItems: r.scopeMatrixItems.map((s, sIdx) => ({
          ...s,
          id: s.id ?? sIdx + 1,
          revisionId: r.id ?? rIdx + 1,
        })),
      }));
    }
    const saved = Offer.reconstitute(raw);
    this.offers.set(raw.id, saved);
    return Offer.reconstitute(saved.toRawProps());
  }

  async delete(id: number): Promise<void> {
    this.offers.delete(id);
  }
}

class InMemoryOfferRevisionsRepository implements OfferRevisionsRepository {
  constructor(private readonly offersRepo: InMemoryOffersRepository) {}

  async findById(id: number): Promise<OfferRevision | null> {
    for (const offer of this.offersRepo.offers.values()) {
      const rev = offer.getRevisionById(id);
      if (rev) return OfferRevision.reconstitute(rev.toRawProps());
    }
    return null;
  }

  async findByOfferIdAndNumber(
    offerId: number,
    revisionNumber: number,
  ): Promise<OfferRevision | null> {
    const offer = this.offersRepo.offers.get(offerId);
    if (!offer) return null;
    const rev = offer.getRevisionByNumber(revisionNumber);
    return rev ? OfferRevision.reconstitute(rev.toRawProps()) : null;
  }

  async save(revision: OfferRevision): Promise<OfferRevision> {
    const rawRev = revision.toRawProps();
    if (!rawRev.offerId) {
      throw new Error('OfferRevision must have an offerId');
    }
    const offer = this.offersRepo.offers.get(rawRev.offerId);
    if (!offer) {
      throw new OfferNotFoundException(rawRev.offerId);
    }

    const offerRaw = offer.toRawProps();
    const existingRevIndex = offerRaw.revisions.findIndex(
      (r) =>
        (rawRev.id && r.id === rawRev.id) ||
        r.revisionNumber === rawRev.revisionNumber,
    );

    if (!rawRev.id) {
      rawRev.id = offerRaw.revisions.length + 1;
    }

    if (existingRevIndex >= 0) {
      offerRaw.revisions[existingRevIndex] = rawRev;
    } else {
      offerRaw.revisions.push(rawRev);
    }

    await this.offersRepo.save(Offer.reconstitute(offerRaw));
    return OfferRevision.reconstitute(rawRev);
  }

  async saveScopeMatrix(
    revisionId: number,
    items: ScopeMatrixItem[],
  ): Promise<ScopeMatrixItem[]> {
    for (const offer of this.offersRepo.offers.values()) {
      const rev = offer.getRevisionById(revisionId);
      if (rev) {
        rev.setScopeMatrixItems(items);
        await this.offersRepo.save(offer);
        return items;
      }
    }
    throw new RevisionNotFoundException(revisionId);
  }

  async saveTransmissionLines(
    revisionId: number,
    lines: TransmissionLine[],
  ): Promise<TransmissionLine[]> {
    for (const offer of this.offersRepo.offers.values()) {
      const rev = offer.getRevisionById(revisionId);
      if (rev) {
        rev.setTransmissionLines(lines);
        await this.offersRepo.save(offer);
        return lines;
      }
    }
    throw new RevisionNotFoundException(revisionId);
  }

  async addTransmissionLine(
    revisionId: number,
    line: TransmissionLine,
  ): Promise<TransmissionLine> {
    for (const offer of this.offersRepo.offers.values()) {
      const rev = offer.getRevisionById(revisionId);
      if (rev) {
        const rawLine = line.toRawProps();
        rawLine.id = rev.transmissionLines.length + 1;
        rawLine.revisionId = revisionId;
        const reconstitutedLine = TransmissionLine.reconstitute(rawLine);
        rev.setTransmissionLines([...rev.transmissionLines, reconstitutedLine]);
        await this.offersRepo.save(offer);
        return reconstitutedLine;
      }
    }
    throw new RevisionNotFoundException(revisionId);
  }

  async updateTransmissionLine(
    revisionId: number,
    lineId: number,
    line: TransmissionLine,
  ): Promise<TransmissionLine> {
    for (const offer of this.offersRepo.offers.values()) {
      const rev = offer.getRevisionById(revisionId);
      if (rev) {
        const rawLine = line.toRawProps();
        rawLine.id = lineId;
        rawLine.revisionId = revisionId;
        const reconstitutedLine = TransmissionLine.reconstitute(rawLine);
        const updatedLines = rev.transmissionLines.map((l) =>
          l.id === lineId ? reconstitutedLine : l,
        );
        rev.setTransmissionLines(updatedLines);
        await this.offersRepo.save(offer);
        return reconstitutedLine;
      }
    }
    throw new RevisionNotFoundException(revisionId);
  }

  async deleteTransmissionLine(
    revisionId: number,
    lineId: number,
  ): Promise<void> {
    for (const offer of this.offersRepo.offers.values()) {
      const rev = offer.getRevisionById(revisionId);
      if (rev) {
        rev.setTransmissionLines(
          rev.transmissionLines.filter((l) => l.id !== lineId),
        );
        await this.offersRepo.save(offer);
        return;
      }
    }
    throw new RevisionNotFoundException(revisionId);
  }
}

class InMemoryOffersUnitOfWork implements OffersUnitOfWork {
  public offersRepo: InMemoryOffersRepository;
  public revisionsRepo: InMemoryOfferRevisionsRepository;

  constructor() {
    this.offersRepo = new InMemoryOffersRepository();
    this.revisionsRepo = new InMemoryOfferRevisionsRepository(this.offersRepo);
  }

  async runInTransaction<T>(
    work: (context: OffersTransactionalContext) => Promise<T>,
  ): Promise<T> {
    return work({
      offers: this.offersRepo,
      revisions: this.revisionsRepo,
    });
  }
}

describe('Offers Context - Hexagonal Application Use Cases (Pure Unit Tests)', () => {
  let uow: InMemoryOffersUnitOfWork;

  beforeEach(() => {
    uow = new InMemoryOffersUnitOfWork();
  });

  describe('1. CreateOfferUseCase', () => {
    it('deve criar uma proposta com revisão R0, linhas de transmissão e matriz canônica padrão', async () => {
      const useCase = new CreateOfferUseCase(uow);
      const offer = await useCase.execute({
        code: 'PROP-2026-001',
        name: 'LT 500kV Marimbondo - Ribeirão Preto',
        clientName: 'Furnas Centrais Elétricas',
        baseCurrency: 'BRL',
        auctionName: 'Leilão Aneel 01/2026',
        lotName: 'Lote 1',
        offerDate: '2026-03-15',
        transmissionLines: [
          {
            code: 'LT-500-01',
            name: 'LT 500kV Trecho 1',
            nominalVoltageKv: '500',
            refinedLengthKm: '120.5',
            reportLengthKm: '120.0',
            circuitCount: 1,
            bundleConductorCount: 4,
            destinationStatePrimary: 'SP',
            destinationPercentagePrimary: '60.00',
            destinationStateSecondary: 'MG',
            destinationPercentageSecondary: '40.00',
          },
        ],
      });

      expect(offer.id).toBeDefined();
      expect(offer.code).toBe('PROP-2026-001');
      expect(offer.revisions.length).toBe(1);

      const r0 = offer.getCurrentRevision();
      expect(r0).toBeDefined();
      expect(r0?.revisionNumber).toBe(0);
      expect(r0?.status).toBe('DRAFT');
      expect(r0?.transmissionLines.length).toBe(1);
      expect(r0?.transmissionLines[0].code).toBe('LT-500-01');
      expect(r0?.scopeMatrixItems.length).toBeGreaterThan(0);
    });

    it('deve rejeitar proposta com código duplicado', async () => {
      const useCase = new CreateOfferUseCase(uow);
      await useCase.execute({
        code: 'PROP-DUP',
        name: 'Oferta 1',
        clientName: 'Cliente A',
        auctionName: 'Leilão',
        lotName: 'Lote',
        offerDate: '2026-01-01',
      });

      await expect(
        useCase.execute({
          code: 'PROP-DUP',
          name: 'Oferta 2',
          clientName: 'Cliente B',
          auctionName: 'Leilão',
          lotName: 'Lote',
          offerDate: '2026-01-01',
        }),
      ).rejects.toThrow(DuplicateOfferCodeException);
    });

    it('deve rejeitar criação de linha com soma de percentuais de rateio diferente de 100%', async () => {
      const useCase = new CreateOfferUseCase(uow);
      await expect(
        useCase.execute({
          code: 'PROP-INVALID-SHARES',
          name: 'Oferta Rateio Inválido',
          clientName: 'Cliente',
          auctionName: 'Leilão',
          lotName: 'Lote',
          offerDate: '2026-01-01',
          transmissionLines: [
            {
              code: 'LT-INV',
              name: 'Linha Inválida',
              nominalVoltageKv: '230',
              refinedLengthKm: '50',
              reportLengthKm: '50',
              circuitCount: 1,
              bundleConductorCount: 2,
              destinationStatePrimary: 'BA',
              destinationPercentagePrimary: '60.00',
              destinationStateSecondary: 'PE',
              destinationPercentageSecondary: '30.00', // Soma = 90%
            },
          ],
        }),
      ).rejects.toThrow(InvalidDestinationSharesException);
    });
  });

  describe('2. GetOfferDetailsUseCase & ListOffersUseCase', () => {
    it('deve consultar detalhes por ID e por Código', async () => {
      const createUseCase = new CreateOfferUseCase(uow);
      const created = await createUseCase.execute({
        code: 'PROP-GET',
        name: 'Oferta Get',
        clientName: 'Cliente Get',
        auctionName: 'Leilão Get',
        lotName: 'Lote Get',
        offerDate: '2026-01-01',
      });

      const getUseCase = new GetOfferDetailsUseCase(uow.offersRepo);
      const byId = await getUseCase.execute(created.id!);
      expect(byId.code).toBe('PROP-GET');

      const byCode = await getUseCase.executeByCode('PROP-GET');
      expect(byCode.id).toBe(created.id);
    });

    it('deve lançar OfferNotFoundException para IDs ou códigos inexistentes', async () => {
      const getUseCase = new GetOfferDetailsUseCase(uow.offersRepo);
      await expect(getUseCase.execute(9999)).rejects.toThrow(
        OfferNotFoundException,
      );
      await expect(getUseCase.executeByCode('INEXISTENTE')).rejects.toThrow(
        OfferNotFoundException,
      );
    });

    it('deve listar e filtrar propostas por termo de busca', async () => {
      const createUseCase = new CreateOfferUseCase(uow);
      await createUseCase.execute({
        code: 'PROP-ALPHA',
        name: 'Subestação Alpha',
        clientName: 'Empresa A',
        auctionName: 'Leilão 2026',
        lotName: 'Lote 1',
        offerDate: '2026-01-01',
      });
      await createUseCase.execute({
        code: 'PROP-BETA',
        name: 'LT Beta 500kV',
        clientName: 'Empresa B',
        auctionName: 'Leilão Especial',
        lotName: 'Lote 2',
        offerDate: '2026-01-01',
      });

      const listUseCase = new ListOffersUseCase(uow.offersRepo);
      const all = await listUseCase.execute();
      expect(all.length).toBe(2);

      const filtered = await listUseCase.execute('Alpha');
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('PROP-ALPHA');
    });
  });

  describe('3. UpdateOfferGeneralUseCase & DeleteOfferUseCase', () => {
    it('deve atualizar dados cadastrais da proposta', async () => {
      const createUseCase = new CreateOfferUseCase(uow);
      const created = await createUseCase.execute({
        code: 'PROP-UPD',
        name: 'Nome Antigo',
        clientName: 'Cliente Antigo',
        auctionName: 'Leilão',
        lotName: 'Lote',
        offerDate: '2026-01-01',
      });

      const updateUseCase = new UpdateOfferGeneralUseCase(uow.offersRepo);
      const updated = await updateUseCase.execute(created.id!, {
        name: 'Nome Novo',
        clientName: 'Cliente Novo',
      });

      expect(updated.name).toBe('Nome Novo');
      expect(updated.clientName).toBe('Cliente Novo');
    });

    it('deve excluir proposta existente', async () => {
      const createUseCase = new CreateOfferUseCase(uow);
      const created = await createUseCase.execute({
        code: 'PROP-DEL',
        name: 'Para Deletar',
        clientName: 'Cliente',
        auctionName: 'Leilão',
        lotName: 'Lote',
        offerDate: '2026-01-01',
      });

      const deleteUseCase = new DeleteOfferUseCase(uow.offersRepo);
      await deleteUseCase.execute(created.id!);

      const getUseCase = new GetOfferDetailsUseCase(uow.offersRepo);
      await expect(getUseCase.execute(created.id!)).rejects.toThrow(
        OfferNotFoundException,
      );
    });
  });

  describe('4. CloneOfferUseCase', () => {
    it('deve clonar integralmente proposta com linhas e matriz de escopo', async () => {
      const createUseCase = new CreateOfferUseCase(uow);
      const source = await createUseCase.execute({
        code: 'PROP-ORIGEM',
        name: 'Proposta Original',
        clientName: 'Cliente A',
        auctionName: 'Leilão 01',
        lotName: 'Lote A',
        offerDate: '2026-01-01',
        transmissionLines: [
          {
            code: 'LT-01',
            name: 'Linha 1',
            nominalVoltageKv: '230',
            refinedLengthKm: '100',
            reportLengthKm: '100',
            circuitCount: 1,
            bundleConductorCount: 2,
            destinationStatePrimary: 'MG',
            destinationPercentagePrimary: '100',
          },
        ],
      });

      const cloneUseCase = new CloneOfferUseCase(uow);
      const cloned = await cloneUseCase.execute(source.id!, {
        targetCode: 'PROP-CLONADA',
        targetName: 'Proposta Clonada',
        targetAuctionName: 'Leilão 02',
        targetLotName: 'Lote B',
      });

      expect(cloned.code).toBe('PROP-CLONADA');
      expect(cloned.clonedFromOfferId).toBe(source.id);
      expect(cloned.revisions.length).toBe(1);

      const rev = cloned.getCurrentRevision()!;
      expect(rev.revisionNumber).toBe(0);
      expect(rev.transmissionLines.length).toBe(1);
      expect(rev.transmissionLines[0].code).toBe('LT-01');
      expect(rev.scopeMatrixItems.length).toBeGreaterThan(0);
    });
  });

  describe('5. Lifecycle: CreateRevision, Freeze, Deliver, and Immutability', () => {
    it('deve criar nova revisão R1 a partir de R0 clonando itens e linhas', async () => {
      const createOffer = new CreateOfferUseCase(uow);
      const offer = await createOffer.execute({
        code: 'PROP-REV',
        name: 'Proposta com Revisões',
        clientName: 'Cliente',
        auctionName: 'Leilão',
        lotName: 'Lote',
        offerDate: '2026-01-01',
        transmissionLines: [
          {
            code: 'LT-R0',
            name: 'Linha R0',
            nominalVoltageKv: '500',
            refinedLengthKm: '80',
            reportLengthKm: '80',
            circuitCount: 1,
            bundleConductorCount: 4,
            destinationStatePrimary: 'GO',
            destinationPercentagePrimary: '100',
          },
        ],
      });

      const createRev = new CreateRevisionUseCase(uow);
      const updated = await createRev.execute(offer.id!, {
        notes: 'Iniciando R1 após revisão de diretriz',
      });

      expect(updated.revisions.length).toBe(2);
      const r1 = updated.getRevisionByNumber(1);
      expect(r1).toBeDefined();
      expect(r1?.status).toBe('DRAFT');
      expect(r1?.transmissionLines.length).toBe(1);
      expect(r1?.transmissionLines[0].code).toBe('LT-R0');
    });

    it('deve congelar revisão R0 e transicionar para DELIVERED', async () => {
      const createOffer = new CreateOfferUseCase(uow);
      const offer = await createOffer.execute({
        code: 'PROP-FREEZE',
        name: 'Proposta Freeze',
        clientName: 'Cliente',
        auctionName: 'Leilão',
        lotName: 'Lote',
        offerDate: '2026-01-01',
        transmissionLines: [
          {
            code: 'LT-01',
            name: 'Linha 1',
            nominalVoltageKv: '230',
            refinedLengthKm: '40',
            reportLengthKm: '40',
            circuitCount: 1,
            bundleConductorCount: 2,
            destinationStatePrimary: 'PR',
            destinationPercentagePrimary: '100',
          },
        ],
      });

      const r0Id = offer.getCurrentRevision()!.id!;
      const freezeUseCase = new FreezeRevisionUseCase(uow);
      const frozenOffer = await freezeUseCase.execute(offer.id!, r0Id);

      const frozenRev = frozenOffer.getRevisionById(r0Id)!;
      expect(frozenRev.isFrozen()).toBe(true);
      expect(frozenRev.closedAt).toBeDefined();

      const deliverUseCase = new MarkRevisionDeliveredUseCase(uow);
      const deliveredOffer = await deliverUseCase.execute(offer.id!, r0Id);

      const deliveredRev = deliveredOffer.getRevisionById(r0Id)!;
      expect(deliveredRev.isDelivered()).toBe(true);
      expect(deliveredRev.deliveredAt).toBeDefined();
    });

    it('deve bloquear congelamento se a revisão não tiver linhas de transmissão (RF-63)', async () => {
      const createOffer = new CreateOfferUseCase(uow);
      const offer = await createOffer.execute({
        code: 'PROP-NO-LINES',
        name: 'Sem Linhas',
        clientName: 'Cliente',
        auctionName: 'Leilão',
        lotName: 'Lote',
        offerDate: '2026-01-01',
        transmissionLines: [],
      });

      const r0Id = offer.getCurrentRevision()!.id!;
      const freezeUseCase = new FreezeRevisionUseCase(uow);
      await expect(freezeUseCase.execute(offer.id!, r0Id)).rejects.toThrow(
        /Não é possível fechar ou congelar/,
      );
    });

    it('deve bloquear modificações diretas em revisão congelada (RNF-05)', async () => {
      const createOffer = new CreateOfferUseCase(uow);
      const offer = await createOffer.execute({
        code: 'PROP-IMMUTABLE',
        name: 'Proposta Imutável',
        clientName: 'Cliente',
        auctionName: 'Leilão',
        lotName: 'Lote',
        offerDate: '2026-01-01',
        transmissionLines: [
          {
            code: 'LT-01',
            name: 'Linha 1',
            nominalVoltageKv: '230',
            refinedLengthKm: '40',
            reportLengthKm: '40',
            circuitCount: 1,
            bundleConductorCount: 2,
            destinationStatePrimary: 'PR',
            destinationPercentagePrimary: '100',
          },
        ],
      });

      const r0Id = offer.getCurrentRevision()!.id!;
      const freezeUseCase = new FreezeRevisionUseCase(uow);
      await freezeUseCase.execute(offer.id!, r0Id);

      const saveParams = new SaveRevisionParametersUseCase(uow);
      await expect(
        saveParams.execute(offer.id!, r0Id, { auctionName: 'Novo Leilão' }),
      ).rejects.toThrow(RevisionFrozenException);

      const addLine = new AddTransmissionLineUseCase(uow);
      await expect(
        addLine.execute(offer.id!, r0Id, {
          code: 'LT-02',
          name: 'Linha 2',
          nominalVoltageKv: '230',
          refinedLengthKm: '20',
          reportLengthKm: '20',
          circuitCount: 1,
          bundleConductorCount: 2,
          destinationStatePrimary: 'PR',
          destinationPercentagePrimary: '100',
        }),
      ).rejects.toThrow(RevisionFrozenException);
    });
  });

  describe('6. Transmission Lines Management Use Cases', () => {
    it('deve adicionar, atualizar e excluir linha de transmissão em revisão DRAFT', async () => {
      const createOffer = new CreateOfferUseCase(uow);
      const offer = await createOffer.execute({
        code: 'PROP-LINES',
        name: 'Proposta Gestão Linhas',
        clientName: 'Cliente',
        auctionName: 'Leilão',
        lotName: 'Lote',
        offerDate: '2026-01-01',
        transmissionLines: [],
      });

      const r0Id = offer.getCurrentRevision()!.id!;
      const addLineUseCase = new AddTransmissionLineUseCase(uow);
      const withLine = await addLineUseCase.execute(offer.id!, r0Id, {
        code: 'LT-138-01',
        name: 'Linha 138kV',
        nominalVoltageKv: '138',
        refinedLengthKm: '45.0',
        reportLengthKm: '45.0',
        circuitCount: 1,
        bundleConductorCount: 1,
        destinationStatePrimary: 'MG',
        destinationPercentagePrimary: '100',
      });

      const addedLine = withLine.getCurrentRevision()!.transmissionLines[0];
      expect(addedLine.code).toBe('LT-138-01');

      const updateLineUseCase = new UpdateTransmissionLineUseCase(uow);
      const updatedOffer = await updateLineUseCase.execute(
        offer.id!,
        r0Id,
        addedLine.id!,
        {
          code: 'LT-138-01-REV',
          name: 'Linha 138kV Atualizada',
          nominalVoltageKv: '138',
          refinedLengthKm: '48.0',
          reportLengthKm: '48.0',
          circuitCount: 1,
          bundleConductorCount: 1,
          destinationStatePrimary: 'MG',
          destinationPercentagePrimary: '70',
          destinationStateSecondary: 'RJ',
          destinationPercentageSecondary: '30',
        },
      );

      const modifiedLine =
        updatedOffer.getCurrentRevision()!.transmissionLines[0];
      expect(modifiedLine.code).toBe('LT-138-01-REV');
      expect(modifiedLine.destinationPercentagePrimary).toBe('70');
      expect(modifiedLine.destinationPercentageSecondary).toBe('30');

      const deleteLineUseCase = new DeleteTransmissionLineUseCase(uow);
      const withoutLine = await deleteLineUseCase.execute(
        offer.id!,
        r0Id,
        addedLine.id!,
      );
      expect(withoutLine.getCurrentRevision()!.transmissionLines.length).toBe(
        0,
      );
    });
  });

  describe('7. Identidade do leilão, prazos do edital e transições WON/IN_EXECUTION (RF-01, RF-02, RN-02)', () => {
    const auctionIdentity = {
      auctionNumber: '004/2026',
      lotNumber: 4,
      subLotCode: '4A',
      contractSigningDate: '2027-02-26',
      constructionDeadlineMonths: 60,
    };

    const singleLine = [
      {
        code: 'LT-01',
        name: 'Linha 1',
        nominalVoltageKv: '525',
        refinedLengthKm: '100',
        reportLengthKm: '100',
        circuitCount: 1,
        bundleConductorCount: 4,
        destinationStatePrimary: 'MG',
        destinationPercentagePrimary: '100',
      },
    ];

    async function createOfferWithIdentity(code: string) {
      const createOffer = new CreateOfferUseCase(uow);
      return createOffer.execute({
        code,
        name: 'Proposta Leilão 4/2026',
        clientName: 'Cliente',
        auctionName: 'Leilão Aneel 004/2026',
        lotName: 'Lote 04',
        ...auctionIdentity,
        offerDate: '2026-09-01',
        transmissionLines: singleLine,
      });
    }

    it('deve persistir identidade normalizada e prazos do edital na criação da oferta', async () => {
      const offer = await createOfferWithIdentity('PROP-ID-01');
      const r0 = offer.getCurrentRevision()!;
      expect(r0.auctionNumber).toBe('004/2026');
      expect(r0.lotNumber).toBe(4);
      expect(r0.subLotCode).toBe('4A');
      expect(r0.contractSigningDate).toBe('2027-02-26');
      expect(r0.constructionDeadlineMonths).toBe(60);
    });

    it('nova revisão copia identidade e prazos da revisão anterior', async () => {
      const offer = await createOfferWithIdentity('PROP-ID-02');
      const createRev = new CreateRevisionUseCase(uow);
      const updated = await createRev.execute(offer.id!, {});
      const r1 = updated.getRevisionByNumber(1)!;
      expect(r1.auctionNumber).toBe('004/2026');
      expect(r1.lotNumber).toBe(4);
      expect(r1.subLotCode).toBe('4A');
      expect(r1.contractSigningDate).toBe('2027-02-26');
      expect(r1.constructionDeadlineMonths).toBe(60);
    });

    it('clonagem copia identidade e prazos da origem quando o destino não informa', async () => {
      const source = await createOfferWithIdentity('PROP-ID-03');
      const clone = new CloneOfferUseCase(uow);
      const cloned = await clone.execute(source.id!, {
        targetCode: 'PROP-ID-03-CLONE',
        targetName: 'Clonada sem destino',
      });
      const rev = cloned.getCurrentRevision()!;
      expect(rev.auctionNumber).toBe('004/2026');
      expect(rev.lotNumber).toBe(4);
      expect(rev.subLotCode).toBe('4A');
      expect(rev.contractSigningDate).toBe('2027-02-26');
      expect(rev.constructionDeadlineMonths).toBe(60);
    });

    it('clonagem sobrescreve a identidade quando o destino informa os campos target*', async () => {
      const source = await createOfferWithIdentity('PROP-ID-04');
      const clone = new CloneOfferUseCase(uow);
      const cloned = await clone.execute(source.id!, {
        targetCode: 'PROP-ID-04-CLONE',
        targetName: 'Clonada para outro lote',
        targetAuctionNumber: '002/2027',
        targetLotNumber: 3,
        targetSubLotCode: '3b',
      });
      const rev = cloned.getCurrentRevision()!;
      expect(rev.auctionNumber).toBe('002/2027');
      expect(rev.lotNumber).toBe(3);
      expect(rev.subLotCode).toBe('3B');
      // Prazos do edital seguem a origem: não há target* para eles.
      expect(rev.contractSigningDate).toBe('2027-02-26');
      expect(rev.constructionDeadlineMonths).toBe(60);
    });

    it('sublote com texto vazio persiste null e null explícito limpa o campo (RNF-09)', async () => {
      const offer = await createOfferWithIdentity('PROP-ID-EMPTY');
      const revisionId = offer.getCurrentRevision()!.id!;
      const update = new UpdateRevisionUseCase(uow);

      const afterEmpty = await update.execute(offer.id!, revisionId, {
        subLotCode: '  ',
        auctionNumber: '',
      });
      const revEmpty = afterEmpty.getRevisionById(revisionId)!;
      expect(revEmpty.subLotCode).toBeNull();
      expect(revEmpty.auctionNumber).toBeNull();

      const afterNull = await update.execute(offer.id!, revisionId, {
        lotNumber: null,
        contractSigningDate: null,
        constructionDeadlineMonths: null,
      });
      const revNull = afterNull.getRevisionById(revisionId)!;
      expect(revNull.lotNumber).toBeNull();
      expect(revNull.contractSigningDate).toBeNull();
      expect(revNull.constructionDeadlineMonths).toBeNull();
    });

    it('transições válidas DELIVERED → WON → IN_EXECUTION persistem e emitem auditoria com status anterior e novo', async () => {
      const auditTrail = { logEvent: jest.fn() };
      const offer = await createOfferWithIdentity('PROP-ST-01');
      const revisionId = offer.getCurrentRevision()!.id!;
      const update = new UpdateRevisionUseCase(uow, auditTrail);

      await update.execute(offer.id!, revisionId, { status: 'DELIVERED' });
      const won = await update.execute(offer.id!, revisionId, {
        status: 'WON',
      });
      expect(won.getRevisionById(revisionId)!.status).toBe('WON');

      const inExecution = await update.execute(offer.id!, revisionId, {
        status: 'IN_EXECUTION',
      });
      expect(inExecution.getRevisionById(revisionId)!.status).toBe(
        'IN_EXECUTION',
      );

      expect(auditTrail.logEvent).toHaveBeenCalledTimes(2);
      expect(auditTrail.logEvent).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          resource: 'REVISION',
          action: 'UPDATE',
          diffs: [
            { field: 'status', previousValue: 'DELIVERED', newValue: 'WON' },
          ],
        }),
      );
      expect(auditTrail.logEvent).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          diffs: [
            {
              field: 'status',
              previousValue: 'WON',
              newValue: 'IN_EXECUTION',
            },
          ],
        }),
      );
    });

    it.each([
      ['DRAFT', 'WON'],
      ['FROZEN', 'WON'],
      ['DELIVERED', 'IN_EXECUTION'],
    ] as const)(
      'transição fora de ordem %s → %s é rejeitada com mensagem em português sem alterar a revisão',
      async (initialStatus, targetStatus) => {
        const offer = await createOfferWithIdentity(
          `PROP-ST-${initialStatus}-${targetStatus}`,
        );
        const revisionId = offer.getCurrentRevision()!.id!;
        const update = new UpdateRevisionUseCase(uow);

        if (initialStatus === 'FROZEN') {
          await update.execute(offer.id!, revisionId, { status: 'FROZEN' });
        } else if (initialStatus === 'DELIVERED') {
          await update.execute(offer.id!, revisionId, { status: 'DELIVERED' });
        }

        await expect(
          update.execute(offer.id!, revisionId, { status: targetStatus }),
        ).rejects.toThrow(
          `Transição de status não permitida: a revisão está em ${initialStatus} e não pode ir para ${targetStatus}.`,
        );

        const untouched = await new GetOfferDetailsUseCase(
          uow.offersRepo,
        ).execute(offer.id!);
        expect(untouched.getRevisionById(revisionId)!.status).toBe(
          initialStatus,
        );
      },
    );

    it('DRAFT como alvo é rejeitado: não existe reabertura de revisão fechada', async () => {
      const offer = await createOfferWithIdentity('PROP-ST-REOPEN');
      const revisionId = offer.getCurrentRevision()!.id!;
      const update = new UpdateRevisionUseCase(uow);
      await update.execute(offer.id!, revisionId, { status: 'FROZEN' });

      await expect(
        update.execute(offer.id!, revisionId, { status: 'DRAFT' }),
      ).rejects.toThrow(InvalidStatusTransitionException);
    });

    it('status igual ao atual é no-op explícito, sem exceção e sem auditoria', async () => {
      const auditTrail = { logEvent: jest.fn() };
      const offer = await createOfferWithIdentity('PROP-ST-NOOP');
      const revisionId = offer.getCurrentRevision()!.id!;
      const update = new UpdateRevisionUseCase(uow, auditTrail);
      await update.execute(offer.id!, revisionId, { status: 'DELIVERED' });

      const unchanged = await update.execute(offer.id!, revisionId, {
        status: 'DELIVERED',
      });
      expect(unchanged.getRevisionById(revisionId)!.status).toBe('DELIVERED');
      expect(auditTrail.logEvent).not.toHaveBeenCalled();
    });
  });
});
