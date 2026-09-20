import { Injectable } from '@nestjs/common';
import { MaterialQuote } from '@lt-offers/domain';
import { QuotesQueryPort } from '../../domain';

/**
 * Adaptador das cotações de materiais. A fonte hoje é estática em código
 * (cotações padrão de engenharia); quando as cotações migrarem para o
 * banco, apenas este adaptador muda — a porta e o domínio permanecem.
 */
@Injectable()
export class StaticQuotesAdapter implements QuotesQueryPort {
  /**
   * Cotações mockadas/armazenadas por padrão para materiais de engenharia.
   */
  private readonly defaultQuotes: Record<string, MaterialQuote> = {
    // 1. Torres
    'MAT-TOR-EST': {
      id: 'q-tor-1',
      materialCode: 'MAT-TOR-EST',
      materialName: 'Aço Estrutural para Torres Treliçadas Galvanizadas',
      supplierName: 'Indústria Metalúrgica Nacional S/A',
      supplierState: 'SP',
      unit: 't',
      unitPrice: 14500,
      currency: 'BRL',
      exchangeRateToBrl: 1.0,
      isWinner: true,
    },
    // 2. Cabos Condutores (Alumínio)
    'MAT-CAB-COND': {
      id: 'q-cab-1',
      materialCode: 'MAT-CAB-COND',
      materialName: 'Cabo Condutor de Alumínio CAA Drake 795 kcmil',
      supplierName: 'Fios e Cabos Brasil Ltda',
      supplierState: 'SP',
      unit: 't',
      unitPrice: 18875,
      currency: 'BRL',
      exchangeRateToBrl: 1.0,
      isWinner: true,
    },
    // 3. Cabo Para-Raios / OPGW
    'MAT-CAB-OPGW': {
      id: 'q-opgw-1',
      materialCode: 'MAT-CAB-OPGW',
      materialName: 'Cabo de Guarda Óptico OPGW 48 Fibras',
      supplierName: 'Cabos Especiais & Óptica S/A',
      supplierState: 'SP',
      unit: 'km',
      unitPrice: 28000,
      currency: 'BRL',
      exchangeRateToBrl: 1.0,
      isWinner: true,
    },
    // 4. Isoladores
    'MAT-ISOL-VIDRO': {
      id: 'q-isol-1',
      materialCode: 'MAT-ISOL-VIDRO',
      materialName: 'Isolador de Vidro Temperado 120 kN',
      supplierName: 'Global Glass Insulators Ltd',
      supplierState: 'SP',
      unit: 'un',
      unitPrice: 22,
      currency: 'USD',
      exchangeRateToBrl: 5.5,
      isWinner: true,
    },
    // 5. Ferragens e Acessórios
    'MAT-FERR-GRAMPO': {
      id: 'q-ferr-1',
      materialCode: 'MAT-FERR-GRAMPO',
      materialName: 'Grampos e Ferragens de Suspensão/Ancoragem',
      supplierName: 'Ferragens Pesadas do Brasil',
      supplierState: 'MG',
      unit: 'cj',
      unitPrice: 450,
      currency: 'BRL',
      exchangeRateToBrl: 1.0,
      isWinner: true,
    },
    // 6. Concreto de Fundação
    'CONC-SAPATA': {
      id: 'q-conc-1',
      materialCode: 'CONC-SAPATA',
      materialName: 'Concreto Usinado FCK 25 MPa (Fundações)',
      supplierName: 'Concreteira Regional',
      supplierState: 'MG',
      unit: 'm³',
      unitPrice: 620,
      currency: 'BRL',
      exchangeRateToBrl: 1.0,
      isWinner: true,
    },
    // 7. Aço de Fundação
    'ACO-ARM-SAPATA': {
      id: 'q-aco-1',
      materialCode: 'ACO-ARM-SAPATA',
      materialName: 'Aço CA-50 Cortado e Dobrado para Armaduras de Fundação',
      supplierName: 'Siderúrgica Gerdau',
      supplierState: 'MG',
      unit: 'kg',
      unitPrice: 8.5,
      currency: 'BRL',
      exchangeRateToBrl: 1.0,
      isWinner: true,
    },
    // 8. Chumbadores
    'CHUMB-FUND': {
      id: 'q-chumb-1',
      materialCode: 'CHUMB-FUND',
      materialName: 'Chumbadores de Aço ASTM A36 / SAE 1045',
      supplierName: 'Fixadores Especiais',
      supplierState: 'SP',
      unit: 'kg',
      unitPrice: 18.0,
      currency: 'BRL',
      exchangeRateToBrl: 1.0,
      isWinner: true,
    },
  };

  findQuotesMap(): Record<string, MaterialQuote> {
    return { ...this.defaultQuotes };
  }
}
