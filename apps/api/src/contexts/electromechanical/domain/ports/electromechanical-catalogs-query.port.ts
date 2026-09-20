/**
 * Porta de consulta de catálogos eletromecânicos vigentes (cabos, isoladores, séries de torres).
 */
export interface ElectromechanicalCatalogsQueryPort {
  loadEffectiveCatalogs(referenceDate?: string): Promise<{
    referenceDate?: string;
  }>;
}
