import {
  contractualDeadlineDate,
  discountPercent,
  scheduleWarnings,
} from './offer-derivations';

describe('Derivações da revisão de oferta (RN-02, RNF-08, RNF-09)', () => {
  describe('discountPercent — deságio da RAP', () => {
    it('deve calcular 50.00 quando a RAP vencedora é metade da máxima', () => {
      expect(discountPercent('762630000.00', '381315000.00')).toBe('50.00');
    });

    it('deve arredondar half-up na segunda casa decimal', () => {
      // 1 − 2/3 = 0,33333... → 33,33; 1 − 1/3 = 0,66666... → 66,67.
      expect(discountPercent('3.00', '2.00')).toBe('33.33');
      expect(discountPercent('3.00', '1.00')).toBe('66.67');
    });

    it('deve devolver negativo quando a RAP estimada supera a máxima', () => {
      expect(discountPercent('100.00', '105.00')).toBe('-5.00');
    });

    it('deve calcular 100.00 quando a RAP vencedora informada é zero (zero ≠ ausente, RNF-09)', () => {
      expect(discountPercent('762630000.00', '0.00')).toBe('100.00');
    });

    it('deve devolver null quando a RAP máxima é zero, nunca zero silencioso', () => {
      expect(discountPercent('0.00', '100.00')).toBeNull();
      expect(discountPercent('0', '100.00')).toBeNull();
    });

    it.each([
      [null, '100.00'],
      ['100.00', null],
      [undefined, undefined],
      ['abc', '100.00'],
      ['100.00', '-5.00'],
    ])(
      'deve devolver null para entradas ausentes ou inválidas (%s, %s)',
      (maxRap, winningRap) => {
        expect(
          discountPercent(
            maxRap as string | null | undefined,
            winningRap as string | null | undefined,
          ),
        ).toBeNull();
      },
    );
  });

  describe('contractualDeadlineDate — data-limite contratual do edital', () => {
    it('deve somar 60 meses à assinatura 2027-02-26 resultando em 2032-02-26', () => {
      expect(contractualDeadlineDate('2027-02-26', 60)).toBe('2032-02-26');
    });

    it('deve limitar o dia ao último dia do mês de destino (2027-01-31 + 1 = 2027-02-28)', () => {
      expect(contractualDeadlineDate('2027-01-31', 1)).toBe('2027-02-28');
    });

    it('deve respeitar ano bissexto no clamp de fevereiro (2028-01-31 + 1 = 2028-02-29)', () => {
      expect(contractualDeadlineDate('2028-01-31', 1)).toBe('2028-02-29');
    });

    it('deve atravessar a virada de ano (2026-11-15 + 3 = 2027-02-15)', () => {
      expect(contractualDeadlineDate('2026-11-15', 3)).toBe('2027-02-15');
    });

    it.each([
      [null, 60],
      ['2027-02-26', null],
      ['2027-02-30', 60],
      ['2027-02-26', 0],
      ['2027-02-26', -1],
      ['2027-02-26', 1.5],
    ])(
      'deve devolver null para entrada ausente ou inválida (%s, %s)',
      (signingDate, months) => {
        expect(
          contractualDeadlineDate(
            signingDate as string | null | undefined,
            months as number | null | undefined,
          ),
        ).toBeNull();
      },
    );
  });

  describe('scheduleWarnings — alertas de prazo do RN-02', () => {
    it('deve emitir START_AFTER_COD quando o cronograma inicia após a entrada em operação', () => {
      expect(
        scheduleWarnings({
          scheduleStartDate: '2031-07-01',
          commercialOperationDate: '2031-06-30',
        }),
      ).toEqual([{ code: 'START_AFTER_COD' }]);
    });

    it('deve emitir DEADLINE_AFTER_COD com a data-limite derivada', () => {
      expect(
        scheduleWarnings({
          contractSigningDate: '2027-02-26',
          constructionDeadlineMonths: 60,
          commercialOperationDate: '2031-06-30',
        }),
      ).toEqual([
        { code: 'DEADLINE_AFTER_COD', contractualDeadlineDate: '2032-02-26' },
      ]);
    });

    it('deve emitir START_BEFORE_SIGNING quando o cronograma inicia antes da assinatura', () => {
      expect(
        scheduleWarnings({
          scheduleStartDate: '2027-01-01',
          contractSigningDate: '2027-02-26',
        }),
      ).toEqual([{ code: 'START_BEFORE_SIGNING' }]);
    });

    it('deve combinar os três alertas quando todas as condições ocorrem', () => {
      expect(
        scheduleWarnings({
          scheduleStartDate: '2032-03-01',
          commercialOperationDate: '2029-06-30',
          contractSigningDate: '2032-04-01',
          constructionDeadlineMonths: 60,
        }),
      ).toEqual([
        { code: 'START_AFTER_COD' },
        { code: 'DEADLINE_AFTER_COD', contractualDeadlineDate: '2037-04-01' },
        { code: 'START_BEFORE_SIGNING' },
      ]);
    });

    it('não deve emitir alerta quando os prazos estão em ordem', () => {
      expect(
        scheduleWarnings({
          scheduleStartDate: '2027-03-01',
          commercialOperationDate: '2032-06-30',
          contractSigningDate: '2027-02-26',
          constructionDeadlineMonths: 60,
        }),
      ).toEqual([]);
    });

    it('não deve emitir alerta com entradas ausentes (pendência não vira alerta)', () => {
      expect(scheduleWarnings({})).toEqual([]);
      expect(
        scheduleWarnings({ commercialOperationDate: '2031-06-30' }),
      ).toEqual([]);
    });

    it('deve ignorar data inválida (2027-02-30) sem emitir alerta', () => {
      expect(
        scheduleWarnings({
          scheduleStartDate: '2027-02-30',
          commercialOperationDate: '2026-01-01',
          contractSigningDate: '2027-02-30',
          constructionDeadlineMonths: 60,
        }),
      ).toEqual([]);
    });
  });
});
