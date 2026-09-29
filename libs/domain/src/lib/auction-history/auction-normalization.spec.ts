import {
  auctionBenchmark,
  fractionToPercent,
  normalizeAuctionNumber,
  normalizeAuctionResult,
  parseAneelDecimal,
} from './auction-normalization';

describe('Normalização do histórico de leilões da ANEEL (RNF-08, RNF-09)', () => {
  describe('parseAneelDecimal — vírgula decimal publicada como texto', () => {
    it.each([
      ['2933612926,94', '2933612926.94'],
      ['2.933.612.926,94', '2933612926.94'],
      ['762630000', '762630000'],
      ['0,48', '0.48'],
      [1234.5, '1234.5'],
    ])('converte %s para %s', (input, expected) => {
      expect(parseAneelDecimal(input as string | number)).toBe(expected);
    });

    it.each([[''], ['-'], ['abc'], ['12,34,56'], [null], [undefined]])(
      'entrada ausente ou irreconhecível (%s) vira null, nunca zero',
      (input) => {
        expect(
          parseAneelDecimal(input as string | null | undefined),
        ).toBeNull();
      },
    );

    it('número em notação de expoente vira null (contrato exige string decimal)', () => {
      expect(parseAneelDecimal(1e21)).toBeNull();
      expect(parseAneelDecimal(Number.NaN)).toBeNull();
    });
  });

  describe('fractionToPercent — deságio publicado em fração', () => {
    it('converte "0,48" para "48.00"', () => {
      expect(fractionToPercent('0,48')).toBe('48.00');
    });

    it('converte "0,3789" para "37.89" e "0,562" para "56.20"', () => {
      expect(fractionToPercent('0,3789')).toBe('37.89');
      expect(fractionToPercent('0,562')).toBe('56.20');
    });

    it('arredonda half-up na segunda casa ("0,12345" → "12.35")', () => {
      expect(fractionToPercent('0,12345')).toBe('12.35');
    });

    it('entrada ausente ou inválida vira null', () => {
      expect(fractionToPercent(null)).toBeNull();
      expect(fractionToPercent('')).toBeNull();
    });
  });

  describe('normalizeAuctionNumber — formato NNN/AAAA', () => {
    it.each([
      ['002/2024', '002/2024'],
      ['2/2024', '002/2024'],
      ['04/2008', '004/2008'],
    ])('normaliza %s para %s', (input, expected) => {
      expect(normalizeAuctionNumber(input)).toBe(expected);
    });

    it.each([['2024-002'], ['leilão 2'], [''], [null]])(
      'formato irreconhecível (%s) vira null',
      (input) => {
        expect(normalizeAuctionNumber(input as string | null)).toBeNull();
      },
    );
  });

  describe('normalizeAuctionResult — registro cru do datastore', () => {
    const rawLot = {
      AnoLeilao: 2024,
      DatLeilao: '2024-09-27T00:00:00',
      NumLeilao: '2/2024',
      NumLoteLeilao: '7',
      NomEmpreendimento: 'LT 500 kV Exemplo - Trecho Norte',
      SigUFPrincipal: 'CE/PI',
      QtdPrazoConstrucaoMeses: '60',
      MdaExtensaoLinhaTransmissaoKm: '380,5',
      MdaSubEstacoesMVA: '1500',
      VlrInvestimentoPrevisto: '2.933.612.926,94',
      VlrRAPEditalLeilao: '762630000,00',
      NomVencedorLeilao: 'Transmissora Exemplo S.A.',
      VlrRAPVencedorLeilao: '381315000,00',
      PctDesagio: '0,48',
    };

    it('normaliza um lote com vencedor aplicando vírgula, fração e padding', () => {
      expect(normalizeAuctionResult(rawLot)).toEqual({
        auctionYear: 2024,
        auctionDate: '2024-09-27',
        auctionNumber: '002/2024',
        lotNumber: 7,
        projectName: 'LT 500 kV Exemplo - Trecho Norte',
        mainUf: 'CE/PI',
        constructionDeadlineMonths: 60,
        lineLengthKm: '380.5',
        substationMva: '1500',
        estimatedInvestment: '2933612926.94',
        maxRap: '762630000.00',
        winnerName: 'Transmissora Exemplo S.A.',
        winningRap: '381315000.00',
        discountPercent: '48.00',
      });
    });

    it('lote deserto grava vencedor, RAP vencedora e deságio como não informados', () => {
      const deserted = normalizeAuctionResult({
        ...rawLot,
        NomVencedorLeilao: '',
        VlrRAPVencedorLeilao: '0',
        PctDesagio: '0',
      });
      expect(deserted?.winnerName).toBeNull();
      expect(deserted?.winningRap).toBeNull();
      expect(deserted?.discountPercent).toBeNull();
    });

    it('aceita data publicada como dd/mm/aaaa e rejeita data inexistente', () => {
      expect(
        normalizeAuctionResult({ ...rawLot, DatLeilao: '27/09/2024' })
          ?.auctionDate,
      ).toBe('2024-09-27');
      expect(
        normalizeAuctionResult({ ...rawLot, DatLeilao: '30/02/2024' })
          ?.auctionDate,
      ).toBeNull();
    });

    it('registro sem identidade mínima vira null (sincronização aborta, não descarta em silêncio)', () => {
      expect(normalizeAuctionResult({ ...rawLot, NumLeilao: null })).toBeNull();
      expect(
        normalizeAuctionResult({ ...rawLot, NumLoteLeilao: 'sete' }),
      ).toBeNull();
      expect(normalizeAuctionResult({ ...rawLot, AnoLeilao: null })).toBeNull();
      expect(
        normalizeAuctionResult({ ...rawLot, NomEmpreendimento: '  ' }),
      ).toBeNull();
    });

    it('campos não essenciais ausentes viram null sem derrubar o registro', () => {
      const sparse = normalizeAuctionResult({
        AnoLeilao: '1999',
        NumLeilao: '001/1999',
        NumLoteLeilao: 1,
        NomEmpreendimento: 'LT Pioneira',
      });
      expect(sparse).toMatchObject({
        auctionYear: 1999,
        auctionNumber: '001/1999',
        lotNumber: 1,
        auctionDate: null,
        mainUf: null,
        maxRap: null,
        winnerName: null,
        discountPercent: null,
      });
    });
  });

  describe('auctionBenchmark — estatísticas de deságio', () => {
    it('calcula mínimo, médio e máximo com duas casas half-up e conta desertos', () => {
      expect(
        auctionBenchmark([
          { discountPercent: '37.89', winnerName: 'A' },
          { discountPercent: '56.20', winnerName: 'B' },
          { discountPercent: '48.00', winnerName: 'C' },
          { discountPercent: null, winnerName: null },
        ]),
      ).toEqual({
        lotCount: 4,
        desertedLotCount: 1,
        minDiscountPercent: '37.89',
        avgDiscountPercent: '47.36', // (37.89 + 56.20 + 48.00) / 3 = 47.363...
        maxDiscountPercent: '56.20',
      });
    });

    it('lista vazia devolve contagens zero e estatísticas não informadas', () => {
      expect(auctionBenchmark([])).toEqual({
        lotCount: 0,
        desertedLotCount: 0,
        minDiscountPercent: null,
        avgDiscountPercent: null,
        maxDiscountPercent: null,
      });
    });

    it('somente lotes desertos: contagem sem estatísticas, nunca zero', () => {
      expect(
        auctionBenchmark([{ discountPercent: null, winnerName: null }]),
      ).toEqual({
        lotCount: 1,
        desertedLotCount: 1,
        minDiscountPercent: null,
        avgDiscountPercent: null,
        maxDiscountPercent: null,
      });
    });
  });
});
