import { ErpIntegrationPackage } from '@lt-offers/domain';

/**
 * Porta de geração da planilha XLSX de carga ERP: recebe o pacote canônico
 * estruturado e devolve o binário — apresentação é infraestrutura.
 */
export interface ErpSpreadsheetPort {
  buildWorkbook(erpPackage: ErpIntegrationPackage): Promise<Buffer>;
}
