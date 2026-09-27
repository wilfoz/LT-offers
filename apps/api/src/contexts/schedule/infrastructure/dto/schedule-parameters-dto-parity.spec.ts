import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CreateRainfallParametersVersionDto,
  RainfallSeverityBandDto,
  RainfallUfSeriesDto,
} from './create-rainfall-parameters-version.dto';
import {
  CreateWorkCalendarVersionDto,
  HolidayDto,
} from './create-work-calendar-version.dto';

// Paridade DTO × contrato da domain: todo campo do contrato precisa de
// decorator no DTO — sem ele, o ValidationPipe (whitelist) descartaria a
// propriedade em silêncio e o valor persistiria nulo. Payload com todas as
// chaves inválidas deve produzir exatamente 1 erro por campo.
describe('Paridade DTO × contrato (parâmetros de chuva e calendário)', () => {
  async function expectOneErrorPerField(
    instance: object,
    expectedFields: string[],
  ) {
    const errors = await validate(instance);
    expect(errors.map((e) => e.property).sort()).toEqual(
      [...expectedFields].sort(),
    );
  }

  it('CreateRainfallParametersVersionDto: 1 erro por campo do contrato', async () => {
    const dto = plainToInstance(CreateRainfallParametersVersionDto, {
      effectiveFrom: '30/02/2027',
      bands: 'não-é-lista',
      ufSeries: 42,
    });
    await expectOneErrorPerField(dto, ['effectiveFrom', 'bands', 'ufSeries']);
  });

  it('RainfallSeverityBandDto: 1 erro por campo do contrato', async () => {
    const dto = plainToInstance(RainfallSeverityBandDto, {
      position: 'primeira',
      upperLimitMm: '49.95', // escala 1 excedida — protegeria a fronteira histórica
      productivityFactor: '0.85555', // escala 4 excedida
    });
    await expectOneErrorPerField(dto, [
      'position',
      'upperLimitMm',
      'productivityFactor',
    ]);
  });

  it('RainfallUfSeriesDto: 1 erro por campo do contrato', async () => {
    const dto = plainToInstance(RainfallUfSeriesDto, {
      uf: 42,
      monthlyMm: ['280', 'muita-chuva'],
    });
    await expectOneErrorPerField(dto, ['uf', 'monthlyMm']);
  });

  it('CreateWorkCalendarVersionDto: 1 erro por campo do contrato', async () => {
    const dto = plainToInstance(CreateWorkCalendarVersionDto, {
      effectiveFrom: 'amanhã',
      standardWorkingDaysPerMonth: '0',
      nonWorkingWeekdays: [9],
      holidays: 'não-é-lista',
    });
    await expectOneErrorPerField(dto, [
      'effectiveFrom',
      'standardWorkingDaysPerMonth',
      'nonWorkingWeekdays',
      'holidays',
    ]);
  });

  it('HolidayDto: 1 erro por campo do contrato', async () => {
    const dto = plainToInstance(HolidayDto, {
      date: '25/12/2026',
      name: '',
      recurring: 'sim',
      uf: 'ba',
    });
    await expectOneErrorPerField(dto, ['date', 'name', 'recurring', 'uf']);
  });
});
