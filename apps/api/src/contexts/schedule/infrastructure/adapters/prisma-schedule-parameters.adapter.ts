import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../app/prisma.service';
import {
  CreateRainfallVersionInput,
  CreateWorkCalendarVersionInput,
  DuplicateScheduleParametersDateException,
  RainfallParametersVersionRecord,
  ScheduleParametersPort,
  WorkCalendarVersionRecord,
} from '../../domain';

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  );
}

/** Data civil AAAA-MM-DD como meia-noite UTC (convenção @db.Date do projeto). */
function toDbDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const MONTH_FIELDS = [
  'janMm',
  'febMm',
  'marMm',
  'aprMm',
  'mayMm',
  'junMm',
  'julMm',
  'augMm',
  'sepMm',
  'octMm',
  'novMm',
  'decMm',
] as const;

const RAINFALL_INCLUDE = {
  severityBands: { orderBy: { position: 'asc' as const } },
  ufRows: { orderBy: { uf: 'asc' as const } },
} satisfies Prisma.RainfallParameterVersionInclude;

type RainfallVersionRow = Prisma.RainfallParameterVersionGetPayload<{
  include: typeof RAINFALL_INCLUDE;
}>;

const CALENDAR_INCLUDE = {
  holidays: { orderBy: [{ date: 'asc' as const }, { id: 'asc' as const }] },
} satisfies Prisma.WorkCalendarVersionInclude;

type WorkCalendarVersionRow = Prisma.WorkCalendarVersionGetPayload<{
  include: typeof CALENDAR_INCLUDE;
}>;

function toRainfallRecord(
  row: RainfallVersionRow,
): RainfallParametersVersionRecord {
  return {
    id: row.id,
    effectiveFrom: toIsoDate(row.effectiveFrom),
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    parameters: {
      bands: row.severityBands.map((band) => ({
        position: band.position,
        upperLimitMm: band.upperLimitMm ? band.upperLimitMm.toString() : null,
        productivityFactor: band.productivityFactor.toString(),
      })),
      ufSeries: row.ufRows.map((ufRow) => ({
        uf: ufRow.uf,
        monthlyMm: MONTH_FIELDS.map((field) => ufRow[field].toString()),
      })),
    },
  };
}

function toWorkCalendarRecord(
  row: WorkCalendarVersionRow,
): WorkCalendarVersionRecord {
  return {
    id: row.id,
    effectiveFrom: toIsoDate(row.effectiveFrom),
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    calendar: {
      standardWorkingDaysPerMonth: row.standardWorkingDaysPerMonth.toString(),
      nonWorkingWeekdays: row.nonWorkingWeekdays,
      holidays: row.holidays.map((holiday) => ({
        date: toIsoDate(holiday.date),
        name: holiday.name,
        recurring: holiday.recurring,
        uf: holiday.uf,
      })),
    },
  };
}

@Injectable()
export class PrismaScheduleParametersAdapter implements ScheduleParametersPort {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) {}

  async findEffectiveRainfall(
    referenceDate: string,
  ): Promise<RainfallParametersVersionRecord | null> {
    const row = await this.prisma.rainfallParameterVersion.findFirst({
      where: { effectiveFrom: { lte: toDbDate(referenceDate) } },
      orderBy: { effectiveFrom: 'desc' },
      include: RAINFALL_INCLUDE,
    });
    return row ? toRainfallRecord(row) : null;
  }

  async createRainfallVersion(
    input: CreateRainfallVersionInput,
  ): Promise<RainfallParametersVersionRecord> {
    try {
      const row = await this.prisma.rainfallParameterVersion.create({
        data: {
          effectiveFrom: toDbDate(input.effectiveFrom),
          createdBy: input.createdBy,
          severityBands: {
            create: input.parameters.bands.map((band) => ({
              position: band.position,
              upperLimitMm: band.upperLimitMm,
              productivityFactor: band.productivityFactor,
            })),
          },
          ufRows: {
            create: input.parameters.ufSeries.map((series) => ({
              uf: series.uf,
              janMm: series.monthlyMm[0],
              febMm: series.monthlyMm[1],
              marMm: series.monthlyMm[2],
              aprMm: series.monthlyMm[3],
              mayMm: series.monthlyMm[4],
              junMm: series.monthlyMm[5],
              julMm: series.monthlyMm[6],
              augMm: series.monthlyMm[7],
              sepMm: series.monthlyMm[8],
              octMm: series.monthlyMm[9],
              novMm: series.monthlyMm[10],
              decMm: series.monthlyMm[11],
            })),
          },
        },
        include: RAINFALL_INCLUDE,
      });
      return toRainfallRecord(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateScheduleParametersDateException(
          'chuva',
          input.effectiveFrom,
        );
      }
      throw error;
    }
  }

  async findEffectiveWorkCalendar(
    referenceDate: string,
  ): Promise<WorkCalendarVersionRecord | null> {
    const row = await this.prisma.workCalendarVersion.findFirst({
      where: { effectiveFrom: { lte: toDbDate(referenceDate) } },
      orderBy: { effectiveFrom: 'desc' },
      include: CALENDAR_INCLUDE,
    });
    return row ? toWorkCalendarRecord(row) : null;
  }

  async createWorkCalendarVersion(
    input: CreateWorkCalendarVersionInput,
  ): Promise<WorkCalendarVersionRecord> {
    try {
      const row = await this.prisma.workCalendarVersion.create({
        data: {
          effectiveFrom: toDbDate(input.effectiveFrom),
          standardWorkingDaysPerMonth:
            input.calendar.standardWorkingDaysPerMonth,
          nonWorkingWeekdays: input.calendar.nonWorkingWeekdays,
          createdBy: input.createdBy,
          holidays: {
            create: input.calendar.holidays.map((holiday) => ({
              date: toDbDate(holiday.date),
              name: holiday.name,
              recurring: holiday.recurring,
              uf: holiday.uf,
            })),
          },
        },
        include: CALENDAR_INCLUDE,
      });
      return toWorkCalendarRecord(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateScheduleParametersDateException(
          'calendário',
          input.effectiveFrom,
        );
      }
      throw error;
    }
  }
}
