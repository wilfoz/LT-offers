import {
  OfferRevisionStatus,
  UpdateOfferRevisionPayload,
  UserRole,
} from '@lt-offers/domain';
import { Offer } from '../../domain/entities/offer.entity';
import { OfferRevision } from '../../domain/entities/offer-revision.entity';
import { TransmissionLine } from '../../domain/entities/transmission-line.entity';
import { ScopeMatrixItem } from '../../domain/entities/scope-matrix-item.entity';
import {
  InvalidStatusTransitionException,
  OfferNotFoundException,
  RevisionNotFoundException,
  RevisionFrozenException,
} from '../../domain/exceptions/offer-domain.exceptions';
import { OffersAuditTrailPort } from '../../domain/ports/audit-trail.port';
import { OffersUnitOfWork } from '../../domain/ports/offers-unit-of-work';

export class UpdateRevisionUseCase {
  constructor(
    private readonly uow: OffersUnitOfWork,
    private readonly auditTrail?: OffersAuditTrailPort,
  ) {}

  async execute(
    offerId: number,
    revisionId: number,
    payload: UpdateOfferRevisionPayload,
    user?: { id: string; name: string; role: UserRole },
  ): Promise<Offer> {
    return this.uow.runInTransaction(async ({ offers, revisions }) => {
      const offer = await offers.findById(offerId);
      if (!offer) {
        throw new OfferNotFoundException(offerId);
      }

      const revision = offer.getRevisionById(revisionId);
      if (!revision) {
        throw new RevisionNotFoundException(revisionId);
      }

      const isClosed = revision.isClosed();
      const hasOnlyStatus =
        payload.status !== undefined &&
        Object.keys(payload).filter((k) => (payload as any)[k] !== undefined)
          .length === 1;

      if (isClosed && !hasOnlyStatus) {
        throw new RevisionFrozenException(
          revision.revisionNumber,
          'modificar revisões fechadas ou entregues. Crie uma nova revisão para realizar alterações',
        );
      }

      // Se for transição para FROZEN ou DELIVERED, verifica se há linhas (RF-63)
      if (payload.status === 'FROZEN' || payload.status === 'DELIVERED') {
        const effectiveLines = payload.transmissionLines
          ? payload.transmissionLines
          : revision.transmissionLines;
        if (!effectiveLines || effectiveLines.length === 0) {
          throw new Error(
            'Não é possível fechar ou congelar uma revisão sem linhas de transmissão cadastradas (RF-63).',
          );
        }
      }

      // Atualiza parâmetros da revisão (somente rascunho chega até aqui com
      // outros campos; transição pura de status não altera parâmetros).
      if (!isClosed) {
        // Campos novos: undefined ignora, null limpa e texto vazio vira null
        // (RNF-09 — nunca persistir string vazia como "informado").
        revision.updateParameters({
          auctionName: payload.auctionName?.trim(),
          lotName: payload.lotName?.trim(),
          auctionNumber:
            payload.auctionNumber === undefined
              ? undefined
              : payload.auctionNumber?.trim() || null,
          lotNumber: payload.lotNumber,
          subLotCode:
            payload.subLotCode === undefined
              ? undefined
              : payload.subLotCode?.trim().toUpperCase() || null,
          contractSigningDate: payload.contractSigningDate,
          constructionDeadlineMonths: payload.constructionDeadlineMonths,
          offerDate: payload.offerDate,
          auctionDate: payload.auctionDate ?? undefined,
          scheduleStartDate: payload.scheduleStartDate ?? undefined,
          commercialOperationDate: payload.commercialOperationDate ?? undefined,
          estimatedCapex: payload.estimatedCapex ?? undefined,
          maxRap: payload.maxRap ?? undefined,
          winningRap: payload.winningRap ?? undefined,
          notes: payload.notes?.trim() || undefined,
        });
      }

      const previousStatus = revision.status;
      this.applyStatusTransition(revision, payload.status);

      // Salva revisão atualizada
      await revisions.save(revision);

      // Auditoria das transições novas com status anterior e novo (RF-65).
      if (
        previousStatus !== revision.status &&
        (revision.status === 'WON' || revision.status === 'IN_EXECUTION')
      ) {
        this.auditTrail?.logEvent({
          userId: user?.id ?? 'sistema',
          userName: user?.name ?? 'sistema',
          userRole: user?.role ?? 'ADMIN',
          resource: 'REVISION',
          resourceId: String(revisionId),
          offerId: String(offerId),
          action: 'UPDATE',
          description: `Transição de status da revisão R${revision.revisionNumber}: ${previousStatus} → ${revision.status}`,
          diffs: [
            {
              field: 'status',
              previousValue: previousStatus,
              newValue: revision.status,
            },
          ],
        });
      }

      // Atualiza linhas se informadas
      if (payload.transmissionLines !== undefined) {
        const lineCodes = new Set<string>();
        const lines = payload.transmissionLines.map((l) => {
          const code = l.code.trim();
          if (lineCodes.has(code)) {
            throw new Error(`Código de linha duplicado na oferta: "${code}"`);
          }
          lineCodes.add(code);

          return TransmissionLine.create({
            code,
            name: l.name.trim(),
            nominalVoltageKv: l.nominalVoltageKv,
            refinedLengthKm: l.refinedLengthKm,
            reportLengthKm: l.reportLengthKm,
            circuitCount: l.circuitCount,
            bundleConductorCount: l.bundleConductorCount,
            destinationStatePrimary: l.destinationStatePrimary
              .trim()
              .toUpperCase(),
            destinationPercentagePrimary: l.destinationPercentagePrimary,
            destinationStateSecondary:
              l.destinationStateSecondary?.trim().toUpperCase() || null,
            destinationPercentageSecondary:
              l.destinationPercentageSecondary ?? '0',
          });
        });

        await revisions.saveTransmissionLines(revisionId, lines);
      }

      // Atualiza matriz de escopo se informada
      if (payload.scopeMatrixItems !== undefined) {
        const scopeItems = payload.scopeMatrixItems.map((s) =>
          ScopeMatrixItem.create({
            itemCode: s.itemCode.trim(),
            itemName: s.itemName.trim(),
            category: s.category.trim(),
            responsibleParty: s.responsibleParty,
            acceptsDirectBilling: s.acceptsDirectBilling,
            currencyRiskParty: s.currencyRiskParty,
            commodityRiskParty: s.commodityRiskParty,
            notes: s.notes?.trim() || null,
          }),
        );

        await revisions.saveScopeMatrix(revisionId, scopeItems);
      }

      const updatedOffer = await offers.findById(offerId);
      if (!updatedOffer) {
        throw new OfferNotFoundException(offerId);
      }
      return updatedOffer;
    });
  }

  /**
   * Transições válidas (spec ofertas/cadastro-revisoes-linhas): DRAFT →
   * FROZEN → DELIVERED → WON → IN_EXECUTION. Status igual ao atual é no-op;
   * DRAFT como alvo e transições fora de ordem são rejeitados — a API nunca
   * aceita e ignora um status em silêncio.
   */
  private applyStatusTransition(
    revision: OfferRevision,
    target: OfferRevisionStatus | undefined,
  ): void {
    if (target === undefined || target === revision.status) {
      return;
    }
    switch (target) {
      case 'DRAFT':
        // Não existe reabertura de revisão: criar uma nova revisão (RNF-05).
        throw new InvalidStatusTransitionException(revision.status, 'DRAFT');
      case 'FROZEN':
        if (!revision.isDraft()) {
          throw new InvalidStatusTransitionException(revision.status, 'FROZEN');
        }
        revision.freeze();
        break;
      case 'DELIVERED':
        // Atalho preservado: rascunho entregue congela e entrega no mesmo ato.
        if (!revision.isDraft() && !revision.isFrozen()) {
          throw new InvalidStatusTransitionException(
            revision.status,
            'DELIVERED',
          );
        }
        if (!revision.isFrozen()) {
          revision.freeze();
        }
        revision.markDelivered();
        break;
      case 'WON':
        revision.markWon();
        break;
      case 'IN_EXECUTION':
        revision.markInExecution();
        break;
      default: {
        // Exaustividade garantida em compilação: novo status exige tratamento.
        const exhaustive: never = target;
        throw new InvalidStatusTransitionException(revision.status, exhaustive);
      }
    }
  }
}
