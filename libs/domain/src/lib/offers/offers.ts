/**
 * Contratos de domínio para o Módulo M01: Gestão de Ofertas, Revisões,
 * Linhas de Transmissão e Matriz de Responsabilidade de Escopo.
 * (RF-01..RF-06, RN-01..RN-04, RNF-03, RNF-05, RNF-08, RNF-09).
 */

export const OFFER_REVISION_STATUSES = [
  'DRAFT',
  'FROZEN',
  'DELIVERED',
  'WON',
  'IN_EXECUTION',
] as const;
export type OfferRevisionStatus = (typeof OFFER_REVISION_STATUSES)[number];

export const OFFER_REVISION_STATUS_LABELS: Record<OfferRevisionStatus, string> =
  {
    DRAFT: 'Em edição',
    FROZEN: 'Fechada',
    DELIVERED: 'Entregue',
    WON: 'Vencedora (Ganha)',
    IN_EXECUTION: 'Em Execução',
  };

export const SCOPE_RESPONSIBLE_PARTIES = ['CONTRACTOR', 'CLIENT'] as const;
export type ScopeResponsibleParty = (typeof SCOPE_RESPONSIBLE_PARTIES)[number];

export const SCOPE_RESPONSIBLE_PARTY_LABELS: Record<
  ScopeResponsibleParty,
  string
> = {
  CONTRACTOR: 'Contratada (EPCista)',
  CLIENT: 'Cliente (Concessionária)',
};

export interface TransmissionLineItem {
  id?: number;
  code: string;
  name: string;
  nominalVoltageKv: string;
  refinedLengthKm: string;
  reportLengthKm: string;
  circuitCount: number;
  bundleConductorCount: number;
  destinationStatePrimary: string;
  destinationPercentagePrimary: string;
  destinationStateSecondary?: string | null;
  destinationPercentageSecondary?: string | null;
}

export interface ScopeMatrixItemPayload {
  id?: number;
  itemCode: string;
  itemName: string;
  category: string;
  responsibleParty: ScopeResponsibleParty;
  acceptsDirectBilling: boolean;
  currencyRiskParty: ScopeResponsibleParty;
  commodityRiskParty: ScopeResponsibleParty;
  notes?: string | null;
}

export interface OfferRevisionItem {
  id: number;
  offerId: number;
  revisionNumber: number;
  status: OfferRevisionStatus;
  auctionName: string;
  lotName: string;
  offerDate: string; // ISO Date YYYY-MM-DD
  auctionDate?: string | null;
  scheduleStartDate?: string | null;
  commercialOperationDate?: string | null;
  estimatedCapex?: string | null;
  maxRap?: string | null;
  winningRap?: string | null;
  notes?: string | null;
  closedAt?: string | null;
  deliveredAt?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  transmissionLines: TransmissionLineItem[];
  scopeMatrixItems: ScopeMatrixItemPayload[];
}

export interface OfferSummary {
  id: number;
  code: string;
  name: string;
  clientName: string;
  baseCurrency: string;
  clonedFromOfferId?: number | null;
  currentRevisionNumber: number;
  currentRevisionStatus: OfferRevisionStatus;
  auctionName: string;
  lotName: string;
  lineCount: number;
  totalLengthKm: string;
  hasPendingIssues: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface OfferDetail {
  id: number;
  code: string;
  name: string;
  clientName: string;
  baseCurrency: string;
  clonedFromOfferId?: number | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  revisions: OfferRevisionItem[];
}

export interface CreateOfferPayload {
  code: string;
  name: string;
  clientName: string;
  baseCurrency?: string;
  auctionName: string;
  lotName: string;
  offerDate: string; // YYYY-MM-DD
  auctionDate?: string | null;
  scheduleStartDate?: string | null;
  commercialOperationDate?: string | null;
  estimatedCapex?: string | null;
  maxRap?: string | null;
  winningRap?: string | null;
  notes?: string | null;
  transmissionLines?: TransmissionLineItem[];
  scopeMatrixItems?: ScopeMatrixItemPayload[];
  createdBy?: string;
}

export interface UpdateOfferGeneralPayload {
  name?: string;
  clientName?: string;
  baseCurrency?: string;
}

export interface UpdateOfferRevisionPayload {
  auctionName?: string;
  lotName?: string;
  offerDate?: string;
  auctionDate?: string | null;
  scheduleStartDate?: string | null;
  commercialOperationDate?: string | null;
  estimatedCapex?: string | null;
  maxRap?: string | null;
  winningRap?: string | null;
  notes?: string | null;
  status?: OfferRevisionStatus;
  transmissionLines?: TransmissionLineItem[];
  scopeMatrixItems?: ScopeMatrixItemPayload[];
}

export interface CreateNewRevisionPayload {
  notes?: string | null;
  createdBy?: string;
}

export interface CloneOfferPayload {
  targetCode: string;
  targetName: string;
  targetAuctionName?: string;
  targetLotName?: string;
  createdBy?: string;
}

export const CANONICAL_SCOPE_ITEMS: Array<{
  itemCode: string;
  itemName: string;
  category: string;
  responsibleParty: ScopeResponsibleParty;
  acceptsDirectBilling: boolean;
  currencyRiskParty: ScopeResponsibleParty;
  commodityRiskParty: ScopeResponsibleParty;
}> = [
  {
    itemCode: 'MAT-CAB-COND',
    itemName: 'Fornecimento de Cabos Condutores',
    category: 'Materiais',
    responsibleParty: 'CONTRACTOR',
    acceptsDirectBilling: true,
    currencyRiskParty: 'CONTRACTOR',
    commodityRiskParty: 'CONTRACTOR',
  },
  {
    itemCode: 'MAT-CAB-GRD',
    itemName: 'Fornecimento de Cabos Para-raios / OPGW',
    category: 'Materiais',
    responsibleParty: 'CONTRACTOR',
    acceptsDirectBilling: true,
    currencyRiskParty: 'CONTRACTOR',
    commodityRiskParty: 'CONTRACTOR',
  },
  {
    itemCode: 'MAT-TOR-ESTR',
    itemName: 'Fornecimento de Estruturas Metálicas e Acessórios',
    category: 'Materiais',
    responsibleParty: 'CONTRACTOR',
    acceptsDirectBilling: true,
    currencyRiskParty: 'CONTRACTOR',
    commodityRiskParty: 'CONTRACTOR',
  },
  {
    itemCode: 'MAT-ISOLAD',
    itemName: 'Fornecimento de Isoladores e Cadeias',
    category: 'Materiais',
    responsibleParty: 'CONTRACTOR',
    acceptsDirectBilling: true,
    currencyRiskParty: 'CONTRACTOR',
    commodityRiskParty: 'CONTRACTOR',
  },
  {
    itemCode: 'MAT-FERRAG',
    itemName: 'Fornecimento de Ferragens e Acessórios de Linha',
    category: 'Materiais',
    responsibleParty: 'CONTRACTOR',
    acceptsDirectBilling: true,
    currencyRiskParty: 'CONTRACTOR',
    commodityRiskParty: 'CONTRACTOR',
  },
  {
    itemCode: 'SRV-CIV-ACESS',
    itemName: 'Abertura de Faixa de Servidão e Acessos',
    category: 'Serviços Civis',
    responsibleParty: 'CONTRACTOR',
    acceptsDirectBilling: false,
    currencyRiskParty: 'CONTRACTOR',
    commodityRiskParty: 'CONTRACTOR',
  },
  {
    itemCode: 'SRV-CIV-FUND',
    itemName: 'Execução de Fundações e Obras Civis',
    category: 'Serviços Civis',
    responsibleParty: 'CONTRACTOR',
    acceptsDirectBilling: false,
    currencyRiskParty: 'CONTRACTOR',
    commodityRiskParty: 'CONTRACTOR',
  },
  {
    itemCode: 'SRV-ELM-MONT',
    itemName: 'Montagem de Torres e Estruturas Metálicas',
    category: 'Serviços Eletromecânicos',
    responsibleParty: 'CONTRACTOR',
    acceptsDirectBilling: false,
    currencyRiskParty: 'CONTRACTOR',
    commodityRiskParty: 'CONTRACTOR',
  },
  {
    itemCode: 'SRV-ELM-LANC',
    itemName: 'Lançamento e Tensionamento de Cabos',
    category: 'Serviços Eletromecânicos',
    responsibleParty: 'CONTRACTOR',
    acceptsDirectBilling: false,
    currencyRiskParty: 'CONTRACTOR',
    commodityRiskParty: 'CONTRACTOR',
  },
  {
    itemCode: 'SRV-ELM-COMIS',
    itemName: 'Comissionamento, Ensaios e Energização',
    category: 'Serviços Eletromecânicos',
    responsibleParty: 'CONTRACTOR',
    acceptsDirectBilling: false,
    currencyRiskParty: 'CONTRACTOR',
    commodityRiskParty: 'CONTRACTOR',
  },
  {
    itemCode: 'IND-AMB-LIC',
    itemName: 'Licenciamento Ambiental e Gestão de Fauna/Flora',
    category: 'Indiretos e Gestão',
    responsibleParty: 'CONTRACTOR',
    acceptsDirectBilling: false,
    currencyRiskParty: 'CONTRACTOR',
    commodityRiskParty: 'CONTRACTOR',
  },
  {
    itemCode: 'IND-FND-SERV',
    itemName: 'Liberação Fundiária e Indenização de Servidão',
    category: 'Indiretos e Gestão',
    responsibleParty: 'CONTRACTOR',
    acceptsDirectBilling: false,
    currencyRiskParty: 'CONTRACTOR',
    commodityRiskParty: 'CONTRACTOR',
  },
  {
    itemCode: 'IND-ENG-PROJ',
    itemName: 'Engenharia do Proprietário e Projeto Executivo',
    category: 'Indiretos e Gestão',
    responsibleParty: 'CONTRACTOR',
    acceptsDirectBilling: false,
    currencyRiskParty: 'CONTRACTOR',
    commodityRiskParty: 'CONTRACTOR',
  },
];
