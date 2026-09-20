import {
  StructureSeriesEntity,
  StructureSeriesVersionEntity,
} from '../entities';

export const STRUCTURE_SERIES_REPOSITORY = Symbol(
  'STRUCTURE_SERIES_REPOSITORY',
);

export interface StructureSeriesFilter {
  search?: string;
}

export interface StructureSeriesRepository {
  findById(id: number): Promise<StructureSeriesEntity | null>;
  findByName(name: string): Promise<StructureSeriesEntity | null>;
  list(filter?: StructureSeriesFilter): Promise<StructureSeriesEntity[]>;
  save(entity: StructureSeriesEntity): Promise<StructureSeriesEntity>;
  createVersion(
    structureSeriesId: number,
    version: StructureSeriesVersionEntity,
  ): Promise<StructureSeriesVersionEntity>;
}
