import {
  WorkCrewComposition,
  OwnEquipmentAvailability,
} from '@lt-offers/calc-engine';

export function getDefaultHistogramCrews(): WorkCrewComposition[] {
  return [
    {
      id: 1,
      code: 'EQ-PRELIM',
      name: 'Equipe de Terraplenagem e Desmatamento',
      laborRoles: [
        {
          laborRoleId: 10,
          laborRoleCode: 'ENC-TERR',
          laborRoleName: 'Encarregado de Terraplenagem',
          quantity: 1,
        },
        {
          laborRoleId: 11,
          laborRoleCode: 'OP-TRAT',
          laborRoleName: 'Operador de Trator / Motosserra',
          quantity: 3,
        },
        {
          laborRoleId: 12,
          laborRoleCode: 'SERV-CAMPO',
          laborRoleName: 'Servente de Campo',
          quantity: 6,
        },
      ],
      equipments: [
        {
          equipmentId: 101,
          equipmentCode: 'TRAT-ESTEIRA',
          equipmentDescription: 'Trator de Esteira D6',
          quantity: 2,
          monthlyRentalRate: '28000.00',
        },
        {
          equipmentId: 102,
          equipmentCode: 'CAM-BASC',
          equipmentDescription: 'Caminhão Basculante 6x4',
          quantity: 2,
          monthlyRentalRate: '15000.00',
        },
      ],
    },
    {
      id: 2,
      code: 'EQ-CIVIL',
      name: 'Equipe de Obras Civis e Fundações',
      laborRoles: [
        {
          laborRoleId: 20,
          laborRoleCode: 'ENC-CIVIL',
          laborRoleName: 'Encarregado de Obras Civis',
          quantity: 1,
        },
        {
          laborRoleId: 21,
          laborRoleCode: 'PEDR',
          laborRoleName: 'Pedreiro / Armador',
          quantity: 4,
        },
        {
          laborRoleId: 22,
          laborRoleCode: 'SERV-CIVIL',
          laborRoleName: 'Servente de Obras Civis',
          quantity: 8,
        },
      ],
      equipments: [
        {
          equipmentId: 103,
          equipmentCode: 'RETROESC',
          equipmentDescription: 'Retroescavadeira 4x4',
          quantity: 1,
          monthlyRentalRate: '18000.00',
        },
        {
          equipmentId: 104,
          equipmentCode: 'CAM-BET',
          equipmentDescription: 'Caminhão Betoneira 8m³',
          quantity: 2,
          monthlyRentalRate: '22000.00',
        },
        {
          equipmentId: 105,
          equipmentCode: 'GERADOR-50',
          equipmentDescription: 'Grupo Gerador 50 kVA',
          quantity: 1,
          monthlyRentalRate: '6500.00',
        },
      ],
    },
    {
      id: 3,
      code: 'EQ-ERECT',
      name: 'Equipe de Montagem Pesada',
      laborRoles: [
        {
          laborRoleId: 30,
          laborRoleCode: 'ENC-MONT',
          laborRoleName: 'Encarregado Geral de Montagem',
          quantity: 1,
        },
        {
          laborRoleId: 31,
          laborRoleCode: 'MONT-ESP',
          laborRoleName: 'Montador Especialista de Torres',
          quantity: 6,
        },
        {
          laborRoleId: 32,
          laborRoleCode: 'GUINCH',
          laborRoleName: 'Operador de Guincho / Munck',
          quantity: 2,
        },
        {
          laborRoleId: 33,
          laborRoleCode: 'AJUD-MONT',
          laborRoleName: 'Ajudante de Montagem',
          quantity: 6,
        },
      ],
      equipments: [
        {
          equipmentId: 106,
          equipmentCode: 'GUINDASTE-70',
          equipmentDescription: 'Guindaste Rodoviário 70 t',
          quantity: 1,
          monthlyRentalRate: '45000.00',
        },
        {
          equipmentId: 107,
          equipmentCode: 'CAM-MUNCK',
          equipmentDescription: 'Caminhão com Guindauto Munck 20 t',
          quantity: 2,
          monthlyRentalRate: '19000.00',
        },
      ],
    },
    {
      id: 4,
      code: 'EQ-STRING',
      name: 'Equipe de Lançamento e Tensionamento',
      laborRoles: [
        {
          laborRoleId: 40,
          laborRoleCode: 'ENC-LANC',
          laborRoleName: 'Encarregado de Lançamento de Cabos',
          quantity: 1,
        },
        {
          laborRoleId: 41,
          laborRoleCode: 'LINH',
          laborRoleName: 'Eletricista Linheiro de Alta Tensão',
          quantity: 8,
        },
        {
          laborRoleId: 42,
          laborRoleCode: 'OP-FREIO',
          laborRoleName: 'Operador de Guincho Frenador (Tensioner/Puller)',
          quantity: 2,
        },
        {
          laborRoleId: 43,
          laborRoleCode: 'AJUD-LANC',
          laborRoleName: 'Ajudante de Lançamento',
          quantity: 8,
        },
      ],
      equipments: [
        {
          equipmentId: 108,
          equipmentCode: 'PULLER-TENSIONER',
          equipmentDescription:
            'Conjunto Tensionador e Guincho Frenador 4 Cabos',
          quantity: 1,
          monthlyRentalRate: '60000.00',
        },
        {
          equipmentId: 107,
          equipmentCode: 'CAM-MUNCK',
          equipmentDescription: 'Caminhão com Guindauto Munck 20 t',
          quantity: 2,
          monthlyRentalRate: '19000.00',
        },
        {
          equipmentId: 109,
          equipmentCode: 'CAM-TRACAO',
          equipmentDescription: 'Caminhão de Apoio e Tração 4x4',
          quantity: 2,
          monthlyRentalRate: '16000.00',
        },
      ],
    },
    {
      id: 5,
      code: 'EQ-COMM',
      name: 'Equipe Especializada de Ensaios e Comissionamento',
      laborRoles: [
        {
          laborRoleId: 50,
          laborRoleCode: 'ENG-ELET',
          laborRoleName: 'Engenheiro Eletricista de Comissionamento',
          quantity: 1,
        },
        {
          laborRoleId: 51,
          laborRoleCode: 'TEC-ELET',
          laborRoleName: 'Técnico em Eletrotécnica',
          quantity: 2,
        },
      ],
      equipments: [
        {
          equipmentId: 110,
          equipmentCode: 'VAN-ENSAIOS',
          equipmentDescription: 'Veículo Laboratório de Ensaios Elétricos',
          quantity: 1,
          monthlyRentalRate: '25000.00',
        },
      ],
    },
  ];
}

export function getDefaultHistogramOwnFleet(): OwnEquipmentAvailability[] {
  return [
    { equipmentId: 102, ownUnits: 2 }, // 2 Caminhões Basculantes próprios
    { equipmentId: 103, ownUnits: 1 }, // 1 Retroescavadeira própria
    { equipmentId: 104, ownUnits: 2 }, // 2 Betoneiras próprias
    { equipmentId: 107, ownUnits: 2 }, // 2 Caminhões Munck próprios
  ];
}
