import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CloneOfferDto } from './clone-offer.dto';
import { CreateOfferDto } from './create-offer.dto';
import { UpdateOfferRevisionDto } from './update-offer-revision.dto';

// Paridade DTO × contrato da domain: todo campo novo do contrato precisa de
// decorator no DTO — sem ele, o ValidationPipe (whitelist) descartaria a
// propriedade em silêncio e o valor persistiria nulo. Payload com todas as
// chaves novas inválidas deve produzir exatamente 1 erro por campo.
describe('Paridade DTO × contrato (identidade do leilão e prazos do edital)', () => {
  const invalidNewFields = {
    auctionNumber: '4/2026',
    lotNumber: 0,
    subLotCode: '4ABC',
    contractSigningDate: '2027-02-30',
    constructionDeadlineMonths: 241,
  };

  async function expectOneErrorPerField(
    instance: object,
    expectedFields: string[],
  ) {
    const errors = await validate(instance);
    expect(errors.map((e) => e.property).sort()).toEqual(
      [...expectedFields].sort(),
    );
  }

  it('CreateOfferDto: 1 erro por campo novo inválido', async () => {
    const dto = plainToInstance(CreateOfferDto, {
      code: 'PROP-01',
      name: 'Proposta',
      clientName: 'Cliente',
      auctionName: 'Leilão',
      lotName: 'Lote',
      offerDate: '2026-09-01',
      ...invalidNewFields,
    });
    await expectOneErrorPerField(dto, Object.keys(invalidNewFields));
  });

  it('UpdateOfferRevisionDto: 1 erro por campo novo inválido', async () => {
    const dto = plainToInstance(UpdateOfferRevisionDto, invalidNewFields);
    await expectOneErrorPerField(dto, Object.keys(invalidNewFields));
  });

  it('CloneOfferDto: 1 erro por campo target* novo inválido', async () => {
    const dto = plainToInstance(CloneOfferDto, {
      targetCode: 'PROP-CLONE',
      targetName: 'Clonada',
      targetAuctionNumber: '2026-004',
      targetLotNumber: 1.5,
      targetSubLotCode: 'ABCD',
    });
    await expectOneErrorPerField(dto, [
      'targetAuctionNumber',
      'targetLotNumber',
      'targetSubLotCode',
    ]);
  });

  it('discountPercent enviado no payload é descartado pela whitelist (derivado, nunca entrada)', async () => {
    const dto = plainToInstance(UpdateOfferRevisionDto, {
      winningRap: '381315000.00',
      discountPercent: '99.99',
      contractualDeadlineDate: '2030-01-01',
      scheduleWarnings: ['START_AFTER_COD'],
    });
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: false,
    });
    expect(errors).toHaveLength(0);
    expect(
      (dto as unknown as Record<string, unknown>)['discountPercent'],
    ).toBeUndefined();
    expect(
      (dto as unknown as Record<string, unknown>)['contractualDeadlineDate'],
    ).toBeUndefined();
    expect(
      (dto as unknown as Record<string, unknown>)['scheduleWarnings'],
    ).toBeUndefined();
    expect(dto.winningRap).toBe('381315000.00');
  });
});
