import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../app/prisma.service';
import {
  CatalogsTransactionalContext,
  CatalogsUnitOfWork,
} from '../../../domain';
import {
  PrismaConductorCablesRepository,
  PrismaGroundWiresRepository,
  PrismaGuyWiresRepository,
  PrismaInsulatorsRepository,
  PrismaStructureSeriesRepository,
  PrismaTowerTypesRepository,
  PrismaSoilTypesRepository,
  PrismaFoundationTypesRepository,
  PrismaFoundationVolumesRepository,
  PrismaFixedCostsRepository,
  PrismaEquipmentRepository,
  PrismaLaborRolesRepository,
  PrismaWorkCrewsRepository,
} from './repositories';

@Injectable()
export class PrismaCatalogsUnitOfWork implements CatalogsUnitOfWork {
  constructor(private readonly prisma: PrismaService) {}

  async runInTransaction<T>(
    work: (context: CatalogsTransactionalContext) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      const context: CatalogsTransactionalContext = {
        conductorCables: new PrismaConductorCablesRepository(tx),
        groundWires: new PrismaGroundWiresRepository(tx),
        guyWires: new PrismaGuyWiresRepository(tx),
        insulators: new PrismaInsulatorsRepository(tx),
        structureSeries: new PrismaStructureSeriesRepository(tx),
        towerTypes: new PrismaTowerTypesRepository(tx),
        soilTypes: new PrismaSoilTypesRepository(tx),
        foundationTypes: new PrismaFoundationTypesRepository(tx),
        foundationVolumes: new PrismaFoundationVolumesRepository(tx),
        fixedCosts: new PrismaFixedCostsRepository(tx),
        equipment: new PrismaEquipmentRepository(tx),
        laborRoles: new PrismaLaborRolesRepository(tx),
        workCrews: new PrismaWorkCrewsRepository(tx),
      };

      return work(context);
    });
  }
}
