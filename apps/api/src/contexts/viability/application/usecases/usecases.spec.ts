import { ViabilityParametersVersionItem } from '@lt-offers/domain';
import {
  DuplicateViabilityParametersDateException,
  NoEffectiveViabilityParametersException,
  ViabilityRevisionNotFoundException,
} from '../../domain/exceptions/viability.exceptions';
import { ViabilityAuctionStatsPort } from '../../domain/ports/viability-auction-stats.port';
import {
  ViabilityOfferQueryPort,
  ViabilityRevisionFinancials,
} from '../../domain/ports/viability-offer-query.port';
import { ViabilityParametersRepository } from '../../domain/ports/viability-parameters.repository';
import { CreateViabilityParametersVersionUseCase } from './create-viability-parameters-version.usecase';
import { GetEffectiveViabilityParametersUseCase } from './get-effective-viability-parameters.usecase';
import { GetViabilityAssessmentUseCase } from './get-viability-assessment.usecase';

const seedVersion: ViabilityParametersVersionItem = {
  id: 1,
  effectiveFrom: '2026-03-01',
  waccRealAfterTaxPercent: '8.00',
  concessionYears: 30,
  pisCofinsPercent: '9.25',
  operationMaintenancePercent: '10.00',
  incomeTaxPercent: '10.00',
  createdBy: 'seed',
  createdAt: '2026-03-01T00:00:00.000Z',
};

class InMemoryParametersRepository implements ViabilityParametersRepository {
  versions: ViabilityParametersVersionItem[] = [];

  async findEffective(referenceDate: string) {
    return (
      this.versions
        .filter((version) => version.effectiveFrom <= referenceDate)
        .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0] ??
      null
    );
  }

  async create(
    version: Parameters<ViabilityParametersRepository['create']>[0],
  ) {
    if (this.versions.some((v) => v.effectiveFrom === version.effectiveFrom)) {
      throw new DuplicateViabilityParametersDateException(
        version.effectiveFrom,
      );
    }
    const created: ViabilityParametersVersionItem = {
      ...version,
      id: this.versions.length + 1,
      createdAt: '2026-09-29T00:00:00.000Z',
    };
    this.versions.push(created);
    return created;
  }
}

const revisionFinancials: ViabilityRevisionFinancials = {
  offerDate: '2026-09-01',
  bidderCapex: null,
  estimatedCapex: '4110000000.00',
  maxRap: '762630000.00',
  winningRap: null,
  auctionNumber: '004/2026',
};

describe('Contexto viability — casos de uso (M13, RNF-05, RNF-09)', () => {
  let parameters: InMemoryParametersRepository;

  beforeEach(async () => {
    parameters = new InMemoryParametersRepository();
    await parameters.create({ ...seedVersion, createdBy: 'seed' });
  });

  describe('Parâmetros versionados por vigência', () => {
    it('edição cria nova versão preservando a anterior, resolvida por data', async () => {
      await new CreateViabilityParametersVersionUseCase(parameters).execute(
        {
          ...seedVersion,
          effectiveFrom: '2027-03-01',
          waccRealAfterTaxPercent: '7.50',
        },
        'qa@epc.com',
      );

      const getEffective = new GetEffectiveViabilityParametersUseCase(
        parameters,
      );
      expect(
        (await getEffective.execute('2026-09-01')).waccRealAfterTaxPercent,
      ).toBe('8.00');
      expect(
        (await getEffective.execute('2027-06-01')).waccRealAfterTaxPercent,
      ).toBe('7.50');
    });

    it('vigência duplicada é rejeitada com mensagem em português', async () => {
      await expect(
        new CreateViabilityParametersVersionUseCase(parameters).execute(
          seedVersion,
          'qa@epc.com',
        ),
      ).rejects.toThrow(
        'Já existe uma versão de parâmetros de viabilidade com vigência a partir de 2026-03-01.',
      );
    });

    it('sem versão vigente na data, 404 tipado com a data citada', async () => {
      await expect(
        new GetEffectiveViabilityParametersUseCase(parameters).execute(
          '2020-01-01',
        ),
      ).rejects.toThrow(
        'Nenhuma versão de parâmetros de viabilidade vigente em 2020-01-01.',
      );
    });
  });

  describe('GetViabilityAssessmentUseCase', () => {
    function makeUseCase(overrides?: {
      revision?: ViabilityRevisionFinancials | null;
      auctionRows?: {
        discountPercent: string | null;
        winnerName: string | null;
      }[];
    }) {
      const offerQuery: ViabilityOfferQueryPort = {
        findRevisionFinancials: jest
          .fn()
          .mockResolvedValue(
            overrides?.revision === undefined
              ? revisionFinancials
              : overrides.revision,
          ),
      };
      const auctionStats: ViabilityAuctionStatsPort = {
        findByAuction: jest
          .fn()
          .mockResolvedValue(overrides?.auctionRows ?? []),
        findDiscountRows: jest.fn().mockResolvedValue([
          { discountPercent: '43.00', winnerName: 'A' },
          { discountPercent: '27.00', winnerName: 'B' },
        ]),
      };
      return {
        useCase: new GetViabilityAssessmentUseCase(
          offerQuery,
          parameters,
          auctionStats,
        ),
        auctionStats,
      };
    }

    it('deriva o parecer canônico da oferta-mestre (origem estimativa ANEEL)', async () => {
      const { useCase } = makeUseCase();
      const response = await useCase.execute(1, 10);

      expect(response.assessment).toMatchObject({
        investmentBase: '4110000000.00',
        investmentSource: 'ANEEL_ESTIMATE',
        investmentAnnuity: '365080751.22',
        minimumGrossRap: '496657825.69',
        maxSupportableDiscountPercent: '34.88',
        viableAtMaxRap: true,
        missingInputs: ['ESTIMATED_WINNING_RAP'],
      });
      expect(response.parameters.effectiveFrom).toBe('2026-03-01');
      expect(response.auctionStats).toBeNull(); // leilão sem lotes no snapshot
      expect(response.overallStats).toEqual({
        lotCount: 2,
        desertedLotCount: 0,
        minDiscountPercent: '27.00',
        avgDiscountPercent: '35.00',
        maxDiscountPercent: '43.00',
      });
    });

    it('CAPEX próprio informado prevalece sobre a estimativa ANEEL (origem BIDDER)', async () => {
      const { useCase } = makeUseCase({
        revision: { ...revisionFinancials, bidderCapex: '3000000000.00' },
      });
      const response = await useCase.execute(1, 10);
      expect(response.assessment.investmentBase).toBe('3000000000.00');
      expect(response.assessment.investmentSource).toBe('BIDDER');
    });

    it('parâmetros resolvidos pela data da oferta, não pela data atual', async () => {
      await parameters.create({
        ...seedVersion,
        effectiveFrom: '2026-09-15',
        waccRealAfterTaxPercent: '7.50',
        createdBy: 'qa',
      });
      // Oferta datada de 2026-09-01: continua usando a versão de 8,00%.
      const { useCase } = makeUseCase();
      const response = await useCase.execute(1, 10);
      expect(response.parameters.waccRealAfterTaxPercent).toBe('8.00');
    });

    it('benchmark do leilão preenchido quando o snapshot tem lotes do certame', async () => {
      const { useCase } = makeUseCase({
        auctionRows: [
          { discountPercent: '37.89', winnerName: 'X' },
          { discountPercent: '56.20', winnerName: 'Y' },
        ],
      });
      const response = await useCase.execute(1, 10);
      expect(response.auctionStats).toEqual({
        lotCount: 2,
        desertedLotCount: 0,
        minDiscountPercent: '37.89',
        avgDiscountPercent: '47.05',
        maxDiscountPercent: '56.20',
      });
    });

    it('revisão sem identidade do leilão não consulta o snapshot por leilão', async () => {
      const { useCase, auctionStats } = makeUseCase({
        revision: { ...revisionFinancials, auctionNumber: null },
      });
      const response = await useCase.execute(1, 10);
      expect(auctionStats.findByAuction).not.toHaveBeenCalled();
      expect(response.auctionStats).toBeNull();
    });

    it('revisão inexistente vira 404 tipado citando proposta e revisão', async () => {
      const { useCase } = makeUseCase({ revision: null });
      await expect(useCase.execute(9, 99)).rejects.toThrow(
        ViabilityRevisionNotFoundException,
      );
      await expect(useCase.execute(9, 99)).rejects.toThrow(
        "Revisão com ID '99' não encontrada na proposta '9'.",
      );
    });

    it('sem parâmetros vigentes na data da oferta, aborta com 404 tipado', async () => {
      const { useCase } = makeUseCase({
        revision: { ...revisionFinancials, offerDate: '2020-01-01' },
      });
      await expect(useCase.execute(1, 10)).rejects.toThrow(
        NoEffectiveViabilityParametersException,
      );
    });
  });
});
