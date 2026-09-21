import {
  PrismaClient,
  GroundWireType,
  TowerFunction,
  FoundationApplication,
  OfferRevisionStatus,
  ScopeResponsibleParty,
  AccessDifficulty,
  FixedCostCategory,
  ProductionPeriod,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as path from 'path';
import * as fs from 'fs';
import * as xlsx from 'xlsx';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL ?? 'postgresql://lt_offers:lt_offers_dev@localhost:5432/lt_offers',
  }),
});

async function main() {
  console.log('🌱 =========================================================================');
  console.log('🌱 Iniciando Seed do Banco de Dados com Catálogos e Oferta Celeo Lote 04...');
  console.log('🌱 =========================================================================');

  const now = new Date('2026-03-25T00:00:00.000Z');
  const user = 'sistema@celeoredes.com.br';

  const templatePath = path.join(process.cwd(), 'template/Calculo LT-CELEO-LOTE-04-2026-XXX_R0_COM REIDI BR-v03.xlsm');
  let wb: xlsx.WorkBook | null = null;
  if (fs.existsSync(templatePath)) {
    console.log(`  📂 Planilha mestre carregada: ${path.basename(templatePath)}`);
    wb = xlsx.readFile(templatePath, { cellFormula: false, cellHTML: false });
  } else {
    console.log('  ⚠️ Planilha mestre não encontrada localmente. Utilizando catálogo base interno.');
  }

  // =========================================================================
  // 1. CATÁLOGOS BASE
  // =========================================================================

  // -------------------------------------------------------------------------
  // 1.1 Cabos Condutores (DB_CAL)
  // -------------------------------------------------------------------------
  console.log('\n[1/10] Processando Catálogo de Cabos Condutores (DB_CAL)...');
  const conductorSeedList = [
    {
      code: 'CAL-998.7',
      description: 'Cabo de Alumínio Liga CAL 998.7 MCM 1120',
      weightTonPerKm: 1.385,
      reelLengthM: 2500,
      diameterMm: 29.59,
      utsKn: 125.4,
    },
    {
      code: 'AAAC-1024-MCM',
      description: 'Cabo de Alumínio Liga AAAC 1024 MCM 1120',
      weightTonPerKm: 1.42,
      reelLengthM: 2500,
      diameterMm: 29.98,
      utsKn: 128.6,
    },
    {
      code: 'ACAR-1000-MCM',
      description: 'Cabo de Alumínio Alma de Liga ACAR 1000 MCM 30/7',
      weightTonPerKm: 1.395,
      reelLengthM: 2200,
      diameterMm: 29.7,
      utsKn: 122.0,
    },
  ];

  for (const c of conductorSeedList) {
    let item = await prisma.conductorCable.findUnique({ where: { code: c.code } });
    if (!item) {
      item = await prisma.conductorCable.create({
        data: {
          code: c.code,
          versions: {
            create: {
              description: c.description,
              weightTonPerKm: c.weightTonPerKm,
              reelLengthM: c.reelLengthM,
              diameterMm: c.diameterMm,
              utsKn: c.utsKn,
              effectiveFrom: now,
              createdBy: user,
            },
          },
        },
      });
    }
  }
  console.log(`  ✓ ${conductorSeedList.length} Cabos Condutores cadastrados.`);

  // -------------------------------------------------------------------------
  // 1.2 Cabos de Guarda e OPGW (DB_CGA, DB_OPGW)
  // -------------------------------------------------------------------------
  console.log('\n[2/10] Processando Catálogo de Cabos de Guarda e OPGW (DB_CGA / DB_OPGW)...');
  const groundWireSeedList = [
    {
      code: 'OPGW-24F-CELEO',
      type: GroundWireType.OPGW,
      description: 'Cabo OPGW 24 Fibras Ópticas Monomodo G.652D',
      weightTonPerKm: 0.52,
      reelLengthM: 4000,
      diameterMm: 12.5,
      utsKn: 78.5,
      manufacturer: 'Prysmian / Furukawa',
      fiberCount: 24,
      i2tKa2s: 65.5,
    },
    {
      code: 'CGA-EHS-3/8',
      type: GroundWireType.STEEL,
      description: 'Cabo de Aço Galvanizado Para-raios 3/8" EHS 7 Fios',
      weightTonPerKm: 0.407,
      reelLengthM: 2200,
      diameterMm: 9.52,
      utsKn: 68.5,
      galvanizationClass: 'Classe A',
      strengthGrade: 'EHS',
      wireCount: 7,
    },
  ];

  for (const gw of groundWireSeedList) {
    let item = await prisma.groundWire.findUnique({ where: { code: gw.code } });
    if (!item) {
      item = await prisma.groundWire.create({
        data: {
          code: gw.code,
          type: gw.type,
          versions: {
            create: {
              description: gw.description,
              weightTonPerKm: gw.weightTonPerKm,
              reelLengthM: gw.reelLengthM,
              diameterMm: gw.diameterMm,
              utsKn: gw.utsKn,
              manufacturer: gw.manufacturer,
              fiberCount: gw.fiberCount,
              i2tKa2s: gw.i2tKa2s,
              galvanizationClass: gw.galvanizationClass,
              strengthGrade: gw.strengthGrade,
              wireCount: gw.wireCount,
              effectiveFrom: now,
              createdBy: user,
            },
          },
        },
      });
    }
  }
  console.log(`  ✓ ${groundWireSeedList.length} Cabos de Guarda e OPGW cadastrados.`);

  // -------------------------------------------------------------------------
  // 1.3 Cabos de Aço para Tirantes (DB_CTI)
  // -------------------------------------------------------------------------
  console.log('\n[3/10] Processando Catálogo de Cabos de Tirante (DB_CTI)...');
  const guyWireSeedList = [
    {
      code: 'CABO-ACO-TIRANTE-5/8',
      description: 'Cabo de Aço Galvanizado EHS 5/8" para Tirantes de Torre Estaiada',
      weightTonPerKm: 0.89,
      reelLengthM: 1000,
      diameterMm: 15.87,
      utsKn: 180.0,
      galvanizationClass: 'Classe A',
      strengthGrade: 'EHS',
      wireCount: 19,
    },
    {
      code: 'CABO-ACO-TIRANTE-1/2',
      description: 'Cabo de Aço Galvanizado EHS 1/2" para Tirantes',
      weightTonPerKm: 0.768,
      reelLengthM: 1100,
      diameterMm: 11.11,
      utsKn: 120.0,
      galvanizationClass: 'Classe A',
      strengthGrade: 'EHS',
      wireCount: 7,
    },
  ];

  for (const guy of guyWireSeedList) {
    let item = await prisma.guyWire.findUnique({ where: { code: guy.code } });
    if (!item) {
      item = await prisma.guyWire.create({
        data: {
          code: guy.code,
          versions: {
            create: {
              description: guy.description,
              weightTonPerKm: guy.weightTonPerKm,
              reelLengthM: guy.reelLengthM,
              diameterMm: guy.diameterMm,
              utsKn: guy.utsKn,
              galvanizationClass: guy.galvanizationClass,
              strengthGrade: guy.strengthGrade,
              wireCount: guy.wireCount,
              effectiveFrom: now,
              createdBy: user,
            },
          },
        },
      });
    }
  }
  console.log(`  ✓ ${guyWireSeedList.length} Cabos de Tirante cadastrados.`);

  // -------------------------------------------------------------------------
  // 1.4 Séries de Torres e Tipos de Torre (DB_TOR)
  // -------------------------------------------------------------------------
  console.log('\n[4/10] Processando Séries e Tipos de Torres (DB_TOR)...');
  let serie = await prisma.structureSeries.findUnique({
    where: { name: 'SERIE-525-CELEO' },
  });
  if (!serie) {
    serie = await prisma.structureSeries.create({
      data: {
        name: 'SERIE-525-CELEO',
        versions: {
          create: {
            designer: 'Celeo Redes / Brametal',
            voltageKv: 525,
            circuitCount: 2,
            cablesPerPhase: 4,
            designWindSpeedMs: 45.0,
            insulatorType: 'Vidro Temperado',
            silMw: 1800,
            effectiveFrom: now,
            createdBy: user,
          },
        },
      },
    });
  }

  const towerTypeConfigs = [
    { code: 'RS4SL-AUTO', function: TowerFunction.SUSPENSION, guyCount: 0, weightKg: 14800 },
    { code: 'RS4SP-AUTO', function: TowerFunction.SUSPENSION, guyCount: 0, weightKg: 18600 },
    { code: 'RS4EL-ESTAI', function: TowerFunction.SUSPENSION, guyCount: 4, weightKg: 9500 },
    { code: 'RS4A1-ANCOR', function: TowerFunction.ANCHOR, guyCount: 0, weightKg: 26850 },
    { code: 'RS4AT-ANCOR', function: TowerFunction.ANCHOR, guyCount: 0, weightKg: 34200 },
  ];

  const towerTypeMap: Record<string, number> = {};
  for (const tc of towerTypeConfigs) {
    let tt = await prisma.towerType.findUnique({
      where: {
        structureSeriesId_code: {
          structureSeriesId: serie.id,
          code: tc.code,
        },
      },
    });
    if (!tt) {
      tt = await prisma.towerType.create({
        data: {
          structureSeriesId: serie.id,
          code: tc.code,
          function: tc.function,
          versions: {
            create: {
              guyCount: tc.guyCount,
              effectiveFrom: now,
              createdBy: user,
              weights: {
                create: [
                  { heightM: 35.0, weightKg: tc.weightKg * 0.9 },
                  { heightM: 40.0, weightKg: tc.weightKg },
                  { heightM: 45.0, weightKg: tc.weightKg * 1.15 },
                ],
              },
            },
          },
        },
      });
    }
    towerTypeMap[tc.code] = tt.id;
  }
  console.log(`  ✓ Série '${serie.name}' com ${Object.keys(towerTypeMap).length} tipos de torre cadastrados.`);

  // -------------------------------------------------------------------------
  // 1.5 Isoladores (DB_AIS)
  // -------------------------------------------------------------------------
  console.log('\n[5/10] Processando Catálogo de Isoladores (DB_AIS)...');
  let aisCount = 0;
  if (wb && wb.Sheets['DB_AIS']) {
    const dataAIS = xlsx.utils.sheet_to_json<any[]>(wb.Sheets['DB_AIS'], { header: 1, defval: '' });
    for (let i = 4; i < dataAIS.length; i++) {
      const row = dataAIS[i];
      if (row && typeof row[0] === 'number' && row[1]) {
        const sheetId = row[0];
        const type = String(row[1]).trim();
        const code = `AIS-${String(sheetId).padStart(2, '0')}`;
        const manufacturer = row[2] ? String(row[2]).trim() : null;
        const profile = row[3] ? String(row[3]).trim() : null;
        const rupture = typeof row[4] === 'number' ? row[4] : null;
        const diameter = typeof row[5] === 'number' ? row[5] : null;
        const spacing = typeof row[6] === 'number' ? row[6] : null;
        const creepage = typeof row[7] === 'number' ? row[7] : null;

        let ais = await prisma.insulator.findUnique({ where: { code } });
        if (!ais) {
          ais = await prisma.insulator.create({
            data: {
              code,
              versions: {
                create: {
                  description: `${type}${manufacturer ? ' - ' + manufacturer : ''}`,
                  type,
                  manufacturer,
                  profile,
                  ruptureStrengthKn: rupture,
                  diameterMm: diameter,
                  spacingMm: spacing,
                  creepageDistanceMm: creepage,
                  effectiveFrom: now,
                  createdBy: user,
                },
              },
            },
          });
        }
        aisCount++;
      }
    }
  } else {
    // Fallback básico
    const fallbackAis = [
      { code: 'AIS-01', desc: '100 kN F100/46 - SEDIVER', type: '100 kN F100/46', mfg: 'SEDIVER', prof: 'Normal', r: 100, d: 255, s: 146, c: 320 },
      { code: 'AIS-02', desc: '160 kN F160CG/170 - SEDIVER', type: '160 kN F160CG/170', mfg: 'SEDIVER', prof: 'Normal', r: 160, d: 280, s: 170, c: 380 },
      { code: 'AIS-03', desc: '210 kN F21/170 - SEDIVER', type: '210 kN F21/170', mfg: 'SEDIVER', prof: 'Normal', r: 210, d: 280, s: 170, c: 380 },
    ];
    for (const fa of fallbackAis) {
      let ais = await prisma.insulator.findUnique({ where: { code: fa.code } });
      if (!ais) {
        await prisma.insulator.create({
          data: {
            code: fa.code,
            versions: {
              create: {
                description: fa.desc,
                type: fa.type,
                manufacturer: fa.mfg,
                profile: fa.prof,
                ruptureStrengthKn: fa.r,
                diameterMm: fa.d,
                spacingMm: fa.s,
                creepageDistanceMm: fa.c,
                effectiveFrom: now,
                createdBy: user,
              },
            },
          },
        });
        aisCount++;
      }
    }
  }
  console.log(`  ✓ ${aisCount} Isoladores cadastrados (DB_AIS).`);

  // -------------------------------------------------------------------------
  // 1.6 Tipos de Solo (DB_FUN - Suelos)
  // -------------------------------------------------------------------------
  console.log('\n[6/10] Processando Catálogo de Solos (DB_FUN)...');
  const soilTypeMap: Record<string, number> = {};
  let soilCount = 0;

  if (wb && wb.Sheets['DB_FUN']) {
    const dataFUN = xlsx.utils.sheet_to_json<any[]>(wb.Sheets['DB_FUN'], { header: 1, defval: '' });
    for (let i = 6; i < 16; i++) {
      const row = dataFUN[i];
      if (row && row[1] && row[2]) {
        const tipo = String(row[2]).trim();
        const code = `SOLO-${tipo}`;
        const desc = String(row[3]).trim();
        const submergedStr = String(row[4] || '').trim().toLowerCase();
        const submerged = submergedStr.includes('si') || submergedStr.includes('sí') || submergedStr.includes('yes');
        const allowableStress = typeof row[5] === 'number' ? row[5] : null;
        const specificWeight = typeof row[6] === 'number' ? row[6] : null;
        const internalFriction = typeof row[7] === 'number' ? row[7] : null;
        const cohesion = typeof row[8] === 'number' ? row[8] : null;
        const nsptStr = String(row[9] || '').trim();

        let nsptMin: number | null = null;
        let nsptMax: number | null = null;
        const match = nsptStr.match(/(\d+)\s*≤\s*N\s*<\s*(\d+)/);
        if (match) {
          nsptMin = parseInt(match[1], 10);
          nsptMax = parseInt(match[2], 10);
        }

        let st = await prisma.soilType.findUnique({ where: { code } });
        if (!st) {
          st = await prisma.soilType.create({
            data: {
              code,
              versions: {
                create: {
                  description: `${desc} (${tipo}) - NSPT: ${nsptStr || 'N/A'}`,
                  submerged,
                  allowableCompressionStressKgfCm2: allowableStress,
                  specificWeightKgfM3: specificWeight,
                  internalFrictionAngleDeg: internalFriction,
                  cohesionKgCm2: cohesion,
                  nsptMin,
                  nsptMax,
                  effectiveFrom: now,
                  createdBy: user,
                },
              },
            },
          });
        }
        soilTypeMap[code] = st.id;
        soilCount++;
      }
    }
  }

  // Se algum solo base do modelo ainda não estiver mapeado:
  const baseSoils = [
    { code: 'SOLO-I', desc: 'Solo Arenoso / Pouco Coesivo (NSPT 2-6)', min: 2, max: 6 },
    { code: 'SOLO-II', desc: 'Solo Argiloso Médio (NSPT 6-15)', min: 6, max: 15 },
    { code: 'SOLO-III', desc: 'Solo Silte-Argiloso Compacto (NSPT 15-30)', min: 15, max: 30 },
    { code: 'SOLO-IV', desc: 'Rocha Sã / Alteração de Rocha (NSPT > 30)', min: 30, max: 60 },
  ];
  for (const bs of baseSoils) {
    if (!soilTypeMap[bs.code]) {
      let st = await prisma.soilType.findUnique({ where: { code: bs.code } });
      if (!st) {
        st = await prisma.soilType.create({
          data: {
            code: bs.code,
            versions: {
              create: {
                description: bs.desc,
                nsptMin: bs.min,
                nsptMax: bs.max,
                allowableCompressionStressKgfCm2: bs.min * 0.4,
                specificWeightKgfM3: 1800,
                effectiveFrom: now,
                createdBy: user,
              },
            },
          },
        });
      }
      soilTypeMap[bs.code] = st.id;
      soilCount++;
    }
  }
  console.log(`  ✓ ${soilCount} Tipos de Solo cadastrados (DB_FUN).`);

  // -------------------------------------------------------------------------
  // 1.7 Tipos de Fundação (DB_FUN - Tipos Fundaciones)
  // -------------------------------------------------------------------------
  console.log('\n[7/10] Processando Catálogo de Fundações (DB_FUN)...');
  const foundationTypeMap: Record<string, number> = {};
  let fndCount = 0;

  if (wb && wb.Sheets['DB_FUN']) {
    const dataFUN = xlsx.utils.sheet_to_json<any[]>(wb.Sheets['DB_FUN'], { header: 1, defval: '' });
    for (let i = 20; i < 55; i++) {
      const row = dataFUN[i];
      if (row && row[1] && row[2]) {
        const tipo = String(row[2]).trim();
        const code = `FND-${tipo.replace(/\s+/g, '-')}`;
        const desc = String(row[3]).trim();
        const appStr = String(row[4] || '').trim().toLowerCase();

        let application: FoundationApplication = FoundationApplication.SELF_SUPPORTING;
        if (appStr.includes('estaiada') || appStr.includes('guyed')) application = FoundationApplication.GUYED;
        else if (appStr.includes('crossrope') || appStr.includes('cross')) application = FoundationApplication.CROSS_ROPE;

        const spreadFooting = typeof row[5] === 'number' ? row[5] : null;
        const precastMast = typeof row[6] === 'number' ? row[6] : null;
        const precastGuy = typeof row[7] === 'number' ? row[7] : null;
        const straightPier = typeof row[8] === 'number' ? row[8] : null;
        const belledPier = typeof row[9] === 'number' ? row[9] : null;
        const slabPier = typeof row[10] === 'number' ? row[10] : null;
        const straightPierGuy = typeof row[11] === 'number' ? row[11] : null;
        const belledPierGuy = typeof row[12] === 'number' ? row[12] : null;
        const rockAnchor = typeof row[13] === 'number' ? row[13] : null;
        const concretePile = typeof row[14] === 'number' ? row[14] : null;

        let ft = await prisma.foundationType.findUnique({ where: { code } });
        if (!ft) {
          ft = await prisma.foundationType.create({
            data: {
              code,
              application,
              versions: {
                create: {
                  description: desc || tipo,
                  spreadFootingCount: spreadFooting,
                  precastMastCount: precastMast,
                  precastGuyCount: precastGuy,
                  straightPierCount: straightPier,
                  belledPierCount: belledPier,
                  slabPierCount: slabPier,
                  straightPierGuyCount: straightPierGuy,
                  belledPierGuyCount: belledPierGuy,
                  rockAnchorCount: rockAnchor,
                  concretePileCount: concretePile,
                  effectiveFrom: now,
                  createdBy: user,
                },
              },
            },
          });
        }
        foundationTypeMap[code] = ft.id;
        fndCount++;
      }
    }
  }

  // Fundações base representativas para o estaqueamento
  const baseFoundations = [
    { code: 'FND-4PILAS-CAMPANA', app: FoundationApplication.SELF_SUPPORTING, desc: '4 Pilões com Sino / Tubulão a Céu Aberto' },
    { code: 'FND-MASTRO-PILA-4TIR', app: FoundationApplication.GUYED, desc: 'Mastro Central + 4 Tirantes de Estai' },
    { code: 'FND-GRELHA-METALICA', app: FoundationApplication.SELF_SUPPORTING, desc: 'Grelha Metálica Embutida' },
    { code: 'FND-SAPATA-ROCHA', app: FoundationApplication.SELF_SUPPORTING, desc: 'Sapata com Tirantes Chumbados em Rocha' },
  ];
  for (const bf of baseFoundations) {
    if (!foundationTypeMap[bf.code]) {
      let ft = await prisma.foundationType.findUnique({ where: { code: bf.code } });
      if (!ft) {
        ft = await prisma.foundationType.create({
          data: {
            code: bf.code,
            application: bf.app,
            versions: {
              create: {
                description: bf.desc,
                effectiveFrom: now,
                createdBy: user,
              },
            },
          },
        });
      }
      foundationTypeMap[bf.code] = ft.id;
      fndCount++;
    }
  }
  console.log(`  ✓ ${fndCount} Tipos de Fundação cadastrados (DB_FUN).`);

  // -------------------------------------------------------------------------
  // 1.8 Mão de Obra e Funções (DB_MO)
  // -------------------------------------------------------------------------
  console.log('\n[8/10] Processando Catálogo de Mão de Obra e Funções (DB_MO)...');
  let laborCount = 0;
  const laborRoleMap: Record<number, number> = {}; // sheetId -> dbId

  if (wb && wb.Sheets['DB_MO']) {
    const dataMO = xlsx.utils.sheet_to_json<any[]>(wb.Sheets['DB_MO'], { header: 1, defval: '' });
    for (let i = 7; i < dataMO.length; i++) {
      const row = dataMO[i];
      if (row && typeof row[0] === 'number' && row[1]) {
        const sheetId = row[0];
        const name = String(row[1]).trim();
        const code = `MO-${String(sheetId).padStart(3, '0')}`;
        const baseSalary = typeof row[2] === 'number' ? row[2] : null;
        
        // Percentuais (ratios 0..1 para caber em Decimal(6,4))
        const hazardVal = typeof row[3] === 'number' ? row[3] : 0;
        const overtimeVal = typeof row[4] === 'number' ? row[4] : 0;
        const dsrVal = typeof row[5] === 'number' ? row[5] : 0;
        const encargosVal = typeof row[6] === 'number' ? row[6] : 0;

        const hazardPayPercent = baseSalary && baseSalary > 0 && hazardVal > 0 ? Number((hazardVal / baseSalary).toFixed(4)) : 0;
        const overtimePercent = baseSalary && baseSalary > 0 && overtimeVal > 0 ? Number((overtimeVal / baseSalary).toFixed(4)) : 0;
        const dsrOvertimePercent = baseSalary && baseSalary > 0 && dsrVal > 0 ? Number((dsrVal / baseSalary).toFixed(4)) : 0;
        const baseAndExtras = (baseSalary || 0) + hazardVal + overtimeVal + dsrVal;
        const socialChargesPercent = baseAndExtras > 0 && encargosVal > 0 ? Number((encargosVal / baseAndExtras).toFixed(4)) : 0.7596;

        const food = typeof row[8] === 'number' ? row[8] : null;
        const housing = typeof row[10] === 'number' ? row[10] : null;
        const travel = typeof row[13] === 'number' ? row[13] : null;
        const health = typeof row[14] === 'number' ? row[14] : null;
        const life = typeof row[15] === 'number' ? row[15] : null;

        let lr = await prisma.laborRole.findUnique({ where: { code } });
        if (!lr) {
          lr = await prisma.laborRole.create({
            data: {
              code,
              name,
              versions: {
                create: {
                  baseSalary,
                  hazardPayPercent,
                  overtimePercent,
                  dsrOvertimePercent,
                  socialChargesPercent,
                  foodAllowanceMonthly: food,
                  housingMonthly: housing,
                  homeLeaveTravelMonthly: travel,
                  healthInsuranceMonthly: health,
                  lifeInsuranceMonthly: life,
                  effectiveFrom: now,
                  createdBy: user,
                },
              },
            },
          });
        }
        laborRoleMap[sheetId] = lr.id;
        laborCount++;
      }
    }
  }
  console.log(`  ✓ ${laborCount} Funções de Mão de Obra cadastradas (DB_MO).`);

  // -------------------------------------------------------------------------
  // 1.9 Equipamentos (DB_EQ)
  // -------------------------------------------------------------------------
  console.log('\n[9/10] Processando Catálogo de Equipamentos (DB_EQ)...');
  let eqCount = 0;
  const eqMap: Record<number, number> = {}; // sheetId -> dbId

  if (wb && wb.Sheets['DB_EQ']) {
    const dataEQ = xlsx.utils.sheet_to_json<any[]>(wb.Sheets['DB_EQ'], { header: 1, defval: '' });
    for (let i = 7; i < dataEQ.length; i++) {
      const row = dataEQ[i];
      if (row && typeof row[1] === 'number' && row[2]) {
        const sheetId = row[1];
        const description = String(row[2]).trim();
        const code = `EQ-${String(sheetId).padStart(3, '0')}`;
        const externalRental = typeof row[3] === 'number' ? row[3] : null;
        const internalRental = typeof row[5] === 'number' ? row[5] : null;
        const purchasePrice = typeof row[6] === 'number' ? row[6] : null;
        const depreciation = typeof row[8] === 'number' ? row[8] : null;
        const ownedAvail = typeof row[10] === 'number' ? row[10] : null;
        const category = row[21] ? String(row[21]).trim() : null;
        const fuel = typeof row[28] === 'number' ? row[28] : null;
        const maintenance = typeof row[29] === 'number' ? row[29] : null;
        const fuelMaintenance = (fuel !== null || maintenance !== null) ? ((fuel || 0) + (maintenance || 0)) : null;

        let eq = await prisma.equipment.findUnique({ where: { code } });
        if (!eq) {
          eq = await prisma.equipment.create({
            data: {
              code,
              description,
              category,
              versions: {
                create: {
                  externalRentalMonthly: externalRental,
                  internalRentalMonthly: internalRental,
                  purchasePrice,
                  depreciationYears: depreciation ? Math.round(depreciation) : null,
                  ownedAvailabilityCount: ownedAvail ? Math.round(ownedAvail) : null,
                  fuelMaintenanceMonthly: fuelMaintenance,
                  effectiveFrom: now,
                  createdBy: user,
                },
              },
            },
          });
        }
        eqMap[sheetId] = eq.id;
        eqCount++;
      }
    }
  }
  console.log(`  ✓ ${eqCount} Equipamentos cadastrados (DB_EQ).`);

  // -------------------------------------------------------------------------
  // 1.10 Custos Fixos e Indiretos (DB_FI)
  // -------------------------------------------------------------------------
  console.log('\n[10/10] Processando Catálogo de Custos Fixos (DB_FI)...');
  let fiCount = 0;

  if (wb && wb.Sheets['DB_FI']) {
    const dataFI = xlsx.utils.sheet_to_json<any[]>(wb.Sheets['DB_FI'], { header: 1, defval: '' });
    for (let i = 5; i < dataFI.length; i++) {
      const row = dataFI[i];
      if (row && typeof row[0] === 'number' && row[1]) {
        const sheetId = row[0];
        const item = String(row[1]).trim();
        const tipo = String(row[2] || '').trim().toUpperCase();
        const coste = typeof row[3] === 'number' ? row[3] : null;
        const desc = String(row[4] || '').trim();
        const code = `FI-${String(sheetId).padStart(3, '0')}`;

        let category: FixedCostCategory = FixedCostCategory.OTHER;
        if (tipo.includes('EPI')) category = FixedCostCategory.EPI;
        else if (tipo.includes('EXAM')) category = FixedCostCategory.MEDICAL_EXAM;
        else if (tipo.includes('ROUPA') || tipo.includes('UNIFORM')) category = FixedCostCategory.UNIFORM;
        else if (tipo.includes('MOB') || tipo.includes('DEMOB')) category = FixedCostCategory.MOB_DEMOB;
        else if (tipo.includes('VIAGEN') || tipo.includes('TRAVEL')) category = FixedCostCategory.TRAVEL_HOUSING;
        else if (tipo.includes('INFORMAT')) category = FixedCostCategory.OTHER;

        let fc = await prisma.fixedCost.findUnique({ where: { code } });
        if (!fc) {
          fc = await prisma.fixedCost.create({
            data: {
              code,
              description: item + (desc ? ` (${desc})` : ''),
              category,
              versions: {
                create: {
                  unitCost: coste,
                  unit: 'UN',
                  effectiveFrom: now,
                  createdBy: user,
                },
              },
            },
          });
        }
        fiCount++;
      }
    }
  }
  console.log(`  ✓ ${fiCount} Custos Fixos e Indiretos cadastrados (DB_FI).`);

  // -------------------------------------------------------------------------
  // 1.11 Equipes de Trabalho e Composições (Equipos & DesEquipos)
  // -------------------------------------------------------------------------
  console.log('\n[+] Processando Equipes de Trabalho e Composições (Equipos & DesEquipos)...');
  let crewCount = 0;
  let crewLaborCount = 0;
  let crewEqCount = 0;

  if (wb && wb.Sheets['Equipos'] && wb.Sheets['DesEquipos']) {
    const dataEqMeta = xlsx.utils.sheet_to_json<any[]>(wb.Sheets['Equipos'], { header: 1, defval: '' });
    const equiposMetaMap: Record<number, { name: string; prodRate: number | null; unit: string | null; period: ProductionPeriod | null }> = {};

    for (let i = 4; i < dataEqMeta.length; i++) {
      const row = dataEqMeta[i];
      if (row && typeof row[1] === 'number' && row[2]) {
        const id = row[1];
        const name = String(row[2]).trim();
        const val = typeof row[3] === 'number' ? row[3] : null;
        const unit = row[4] ? String(row[4]).trim() : null;
        const periodStr = row[5] ? String(row[5]).trim().toLowerCase() : '';
        let period: ProductionPeriod | null = null;
        if (periodStr.includes('hora') || periodStr.includes('h')) period = ProductionPeriod.HOUR;
        else if (periodStr.includes('dia') || periodStr.includes('d')) period = ProductionPeriod.DAY;
        else if (periodStr.includes('sem') || periodStr.includes('w')) period = ProductionPeriod.WEEK;
        else if (periodStr.includes('mes') || periodStr.includes('m')) period = ProductionPeriod.MONTH;

        equiposMetaMap[id] = { name, prodRate: val, unit, period };
      }
    }

    const dataDes = xlsx.utils.sheet_to_json<any[]>(wb.Sheets['DesEquipos'], { header: 1, defval: '' });

    interface ParsedCrew {
      sheetId: number;
      code: string;
      name: string;
      standardProductionRate: number | null;
      productionUnit: string | null;
      productionPeriod: ProductionPeriod | null;
      laborRoles: Array<{ laborRoleId: number; quantity: number }>;
      equipments: Array<{ equipmentId: number; quantity: number }>;
    }

    const crews: ParsedCrew[] = [];
    let currentCrew: ParsedCrew | null = null;
    let section: 'labor' | 'equipment' | 'fixed' | null = null;

    for (let i = 0; i < dataDes.length; i++) {
      const row = dataDes[i];
      if (!row) continue;

      if (row[1] === 'id' && typeof row[2] === 'number') {
        if (currentCrew) crews.push(currentCrew);
        const sId = row[2];
        const meta = equiposMetaMap[sId] || { name: '', prodRate: null, unit: null, period: null };
        currentCrew = {
          sheetId: sId,
          code: `CREW-${String(sId).padStart(3, '0')}`,
          name: meta.name || '',
          standardProductionRate: meta.prodRate,
          productionUnit: meta.unit,
          productionPeriod: meta.period,
          laborRoles: [],
          equipments: [],
        };
        section = null;
        continue;
      }

      if (currentCrew) {
        if (row[1] === 'Descripción' && row[3] && !currentCrew.name) {
          currentCrew.name = String(row[3]).trim();
        }
        if (String(row[1]).includes('Mano de obra')) {
          section = 'labor';
          continue;
        }
        if (String(row[1]).includes('Equipo y herramienta')) {
          section = 'equipment';
          continue;
        }
        if (String(row[1]).includes('Costes fijos')) {
          section = 'fixed';
          continue;
        }

        if (section === 'labor') {
          const roleSheetId = row[2];
          const qtd = row[11];
          if (typeof roleSheetId === 'number' && typeof qtd === 'number' && qtd > 0) {
            const dbLaborId = laborRoleMap[roleSheetId];
            if (dbLaborId) {
              currentCrew.laborRoles.push({ laborRoleId: dbLaborId, quantity: qtd });
            }
          }
        }

        if (section === 'equipment') {
          const eqSheetId = row[2];
          const qtd = row[11];
          if (typeof eqSheetId === 'number' && typeof qtd === 'number' && qtd > 0) {
            const dbEqId = eqMap[eqSheetId];
            if (dbEqId) {
              currentCrew.equipments.push({ equipmentId: dbEqId, quantity: qtd });
            }
          }
        }
      }
    }
    if (currentCrew) crews.push(currentCrew);

    for (const c of crews) {
      let crew = await prisma.workCrew.findUnique({
        where: { code: c.code },
        include: { versions: { include: { laborRoles: true, equipments: true } } },
      });

      if (!crew) {
        crew = await prisma.workCrew.create({
          data: {
            code: c.code,
            name: c.name || `Equipe ${c.code}`,
            versions: {
              create: {
                standardProductionRate: c.standardProductionRate,
                productionUnit: c.productionUnit,
                productionPeriod: c.productionPeriod,
                effectiveFrom: now,
                createdBy: user,
                laborRoles: {
                  create: c.laborRoles.map((lr) => ({
                    laborRoleId: lr.laborRoleId,
                    quantity: lr.quantity,
                  })),
                },
                equipments: {
                  create: c.equipments.map((eq) => ({
                    equipmentId: eq.equipmentId,
                    quantity: eq.quantity,
                  })),
                },
              },
            },
          },
          include: { versions: { include: { laborRoles: true, equipments: true } } },
        });
      }
      crewCount++;
      crewLaborCount += c.laborRoles.length;
      crewEqCount += c.equipments.length;
    }
  }
  console.log(`  ✓ ${crewCount} Equipes de Trabalho cadastradas com ${crewLaborCount} funções e ${crewEqCount} equipamentos vinculados.`);

  // =========================================================================
  // 2. OFERTA PRINCIPAL (CELEO LOTE 04 - 2026)
  // =========================================================================
  console.log('\n[+] Processando Oferta Principal Celeo Lote 04 (Leilão 004/2026)...');
  const offerCode = 'OF-2026-CELEO-LOTE-04';

  let offer = await prisma.offer.findUnique({
    where: { code: offerCode },
    include: { revisions: { include: { transmissionLines: true, scopeMatrixItems: true } } },
  });

  if (offer) {
    console.log(`  ℹ️ Oferta '${offerCode}' já cadastrada. Atualizando para sincronia total...`);
    await prisma.offer.delete({ where: { code: offerCode } });
  }

  offer = await prisma.offer.create({
    data: {
      code: offerCode,
      name: 'Lote 04 - Celeo Redes (Leilão 004/2026) 525 kV',
      clientName: 'Celeo Redes Brasil',
      baseCurrency: 'BRL',
      createdBy: user,
      revisions: {
        create: {
          revisionNumber: 0,
          status: OfferRevisionStatus.DRAFT,
          auctionName: 'Leilão Aneel 004/2026',
          lotName: 'Lote 04',
          offerDate: now,
          auctionDate: new Date('2026-03-27T00:00:00.000Z'),
          scheduleStartDate: new Date('2026-07-01T00:00:00.000Z'),
          commercialOperationDate: new Date('2029-06-30T00:00:00.000Z'),
          estimatedCapex: 2382080065.89, // Total Custo EPC (R$ 2.382 bilhões)
          maxRap: 535000000.00,
          winningRap: 480000000.00,
          notes: 'Proposta mestre extraída de Calculo LT-CELEO-LOTE-04-2026-XXX_R0_COM REIDI BR-v03. Contém 3 linhas 525 kV (856 km), regime REIDI, faturamento direto e estruturas autoportantes e estaiadas.',
          createdBy: user,
          // 2.1 Linhas de Transmissão (3 trechos)
          transmissionLines: {
            create: [
              {
                code: 'LT-525-RB-SAR',
                name: 'L.T. 525 kV Rio Brilhante - Sarandi C1-C2-CD',
                nominalVoltageKv: 525.0,
                refinedLengthKm: 307.0,
                reportLengthKm: 307.0,
                circuitCount: 2,
                bundleConductorCount: 4,
                destinationStatePrimary: 'MS',
                destinationPercentagePrimary: 60.0,
                destinationStateSecondary: 'PR',
                destinationPercentageSecondary: 40.0,
              },
              {
                code: 'LT-525-CHP-RB',
                name: 'L.T. 525 kV Chapadão - Rio Brilhante C1',
                nominalVoltageKv: 525.0,
                refinedLengthKm: 330.0,
                reportLengthKm: 330.0,
                circuitCount: 1,
                bundleConductorCount: 4,
                destinationStatePrimary: 'MS',
                destinationPercentagePrimary: 100.0,
              },
              {
                code: 'LT-525-RVN-CHP',
                name: 'L.T. 525 kV Rio Verde Norte - Chapadão C1',
                nominalVoltageKv: 525.0,
                refinedLengthKm: 219.0,
                reportLengthKm: 219.0,
                circuitCount: 1,
                bundleConductorCount: 4,
                destinationStatePrimary: 'GO',
                destinationPercentagePrimary: 50.0,
                destinationStateSecondary: 'MS',
                destinationPercentageSecondary: 50.0,
              },
            ],
          },
          // 2.2 Matriz de Escopo REIDI & Faturamento Direto
          scopeMatrixItems: {
            create: [
              {
                itemCode: 'MAT-TORRES-525KV',
                itemName: 'Estruturas Metálicas de Torres 525 kV (Aço Galvanizado)',
                category: 'TOWER',
                responsibleParty: ScopeResponsibleParty.CONTRACTOR,
                acceptsDirectBilling: true,
                currencyRiskParty: ScopeResponsibleParty.CONTRACTOR,
                commodityRiskParty: ScopeResponsibleParty.CONTRACTOR,
                notes: 'Faturamento direto pelo cliente com suspensão PIS/COFINS (REIDI). Custo Líquido R$ 412,47M',
              },
              {
                itemCode: 'MAT-CONDUTOR-CAL-998',
                itemName: 'Cabo Condutor CAL 998.7 MCM 1120',
                category: 'CONDUCTOR',
                responsibleParty: ScopeResponsibleParty.CONTRACTOR,
                acceptsDirectBilling: true,
                currencyRiskParty: ScopeResponsibleParty.CONTRACTOR,
                commodityRiskParty: ScopeResponsibleParty.CONTRACTOR,
                notes: 'Faturamento direto com hedge de alumínio LME. Custo Líquido R$ 384,12M',
              },
              {
                itemCode: 'MAT-OPGW-24F',
                itemName: 'Cabo Para-raios com Fibras Ópticas OPGW 24F',
                category: 'OPGW',
                responsibleParty: ScopeResponsibleParty.CONTRACTOR,
                acceptsDirectBilling: true,
                currencyRiskParty: ScopeResponsibleParty.CONTRACTOR,
                commodityRiskParty: ScopeResponsibleParty.CONTRACTOR,
                notes: 'Faturamento direto com suspensão REIDI. Custo Líquido R$ 42,35M',
              },
              {
                itemCode: 'MAT-ISOLADORES-525KV',
                itemName: 'Cadeias de Isoladores de Vidro/Porcelana 525 kV',
                category: 'INSULATOR',
                responsibleParty: ScopeResponsibleParty.CONTRACTOR,
                acceptsDirectBilling: true,
                currencyRiskParty: ScopeResponsibleParty.CONTRACTOR,
                commodityRiskParty: ScopeResponsibleParty.CONTRACTOR,
                notes: 'Custo Líquido R$ 86,22M',
              },
              {
                itemCode: 'MAT-FERRAGENS-AMORTECEDORES',
                itemName: 'Ferragens, Grampos e Amortecedores de Vibração',
                category: 'HARDWARE',
                responsibleParty: ScopeResponsibleParty.CONTRACTOR,
                acceptsDirectBilling: true,
                currencyRiskParty: ScopeResponsibleParty.CONTRACTOR,
                commodityRiskParty: ScopeResponsibleParty.CONTRACTOR,
                notes: 'Custo Líquido R$ 122,92M',
              },
              {
                itemCode: 'SRV-OBRAS-CIVIS-FUNDACOES',
                itemName: 'Obras Civis, Acessos e Fundações Especiais',
                category: 'CIVIL',
                responsibleParty: ScopeResponsibleParty.CONTRACTOR,
                acceptsDirectBilling: false,
                currencyRiskParty: ScopeResponsibleParty.CONTRACTOR,
                commodityRiskParty: ScopeResponsibleParty.CONTRACTOR,
                notes: 'Serviços diretos: R$ 326,22M',
              },
              {
                itemCode: 'SRV-MONTAGEM-ELETROMECANICA',
                itemName: 'Montagem de Torres Autoportantes e Estaiadas',
                category: 'ERECTION',
                responsibleParty: ScopeResponsibleParty.CONTRACTOR,
                acceptsDirectBilling: false,
                currencyRiskParty: ScopeResponsibleParty.CONTRACTOR,
                commodityRiskParty: ScopeResponsibleParty.CONTRACTOR,
                notes: 'Serviços diretos: R$ 157,79M',
              },
              {
                itemCode: 'SRV-TENDIDO-CABOS',
                itemName: 'Lançamento e Tensionamento de Cabos Condutores e OPGW',
                category: 'STRINGING',
                responsibleParty: ScopeResponsibleParty.CONTRACTOR,
                acceptsDirectBilling: false,
                currencyRiskParty: ScopeResponsibleParty.CONTRACTOR,
                commodityRiskParty: ScopeResponsibleParty.CONTRACTOR,
                notes: 'Serviços diretos: R$ 234,50M',
              },
              {
                itemCode: 'SRV-CANTEIROS-ADMINISTRACAO',
                itemName: 'Canteiros Principais, Avançados, Pátios e Direção de Obra',
                category: 'INDIRECTS',
                responsibleParty: ScopeResponsibleParty.CONTRACTOR,
                acceptsDirectBilling: false,
                currencyRiskParty: ScopeResponsibleParty.CONTRACTOR,
                commodityRiskParty: ScopeResponsibleParty.CONTRACTOR,
                notes: 'Canteiros R$ 203,00M + Pátios R$ 61,58M + Preliminares R$ 23,38M + Engenharia R$ 20,37M',
              },
            ],
          },
        },
      },
    },
    include: {
      revisions: {
        include: {
          transmissionLines: true,
          scopeMatrixItems: true,
        },
      },
    },
  });

  console.log(`  ✓ Oferta '${offer.code}' (${offer.name}) inserida com sucesso!`);
  console.log(`    - ID da Oferta: ${offer.id}`);
  console.log(`    - Revisão 0 ID: ${offer.revisions[0].id}`);
  console.log(`    - ${offer.revisions[0].transmissionLines.length} Linhas de Transmissão cadastradas:`);
  for (const tl of offer.revisions[0].transmissionLines) {
    console.log(`      * [${tl.code}] ${tl.name} (${tl.refinedLengthKm} km, ${tl.nominalVoltageKv} kV)`);
  }
  console.log(`    - ${offer.revisions[0].scopeMatrixItems.length} Itens de Matriz de Escopo cadastrados.`);

  // -------------------------------------------------------------------------
  // 2.3 Inserção de Torres de Estaqueamento Representativas
  // -------------------------------------------------------------------------
  const line1 = offer.revisions[0].transmissionLines.find((l) => l.code === 'LT-525-RB-SAR')!;
  const line2 = offer.revisions[0].transmissionLines.find((l) => l.code === 'LT-525-CHP-RB')!;
  const line3 = offer.revisions[0].transmissionLines.find((l) => l.code === 'LT-525-RVN-CHP')!;

  const sampleStaking = [
    // Trecho 1: Rio Brilhante - Sarandi
    { lineId: line1.id, num: 'E1-T001', station: 0.0, towerType: 'RS4EL-ESTAI', soil: 'SOLO-IV', fnd: 'FND-MASTRO-PILA-4TIR', diff: AccessDifficulty.NORMAL },
    { lineId: line1.id, num: 'E1-T002', station: 450.0, towerType: 'RS4SL-AUTO', soil: 'SOLO-II', fnd: 'FND-4PILAS-CAMPANA', diff: AccessDifficulty.NORMAL },
    { lineId: line1.id, num: 'E1-T003', station: 890.0, towerType: 'RS4A1-ANCOR', soil: 'SOLO-I', fnd: 'FND-4PILAS-CAMPANA', diff: AccessDifficulty.DIFFICULT },
    { lineId: line1.id, num: 'E1-T004', station: 1340.0, towerType: 'RS4EL-ESTAI', soil: 'SOLO-III', fnd: 'FND-MASTRO-PILA-4TIR', diff: AccessDifficulty.NORMAL },
    { lineId: line1.id, num: 'E1-T005', station: 1800.0, towerType: 'RS4SP-AUTO', soil: 'SOLO-II', fnd: 'FND-4PILAS-CAMPANA', diff: AccessDifficulty.NORMAL },
    // Trecho 2: Chapadão - Rio Brilhante
    { lineId: line2.id, num: 'E2-T001', station: 0.0, towerType: 'RS4A1-ANCOR', soil: 'SOLO-I', fnd: 'FND-4PILAS-CAMPANA', diff: AccessDifficulty.NORMAL },
    { lineId: line2.id, num: 'E2-T002', station: 480.0, towerType: 'RS4EL-ESTAI', soil: 'SOLO-IV', fnd: 'FND-MASTRO-PILA-4TIR', diff: AccessDifficulty.NORMAL },
    { lineId: line2.id, num: 'E2-T003', station: 950.0, towerType: 'RS4SL-AUTO', soil: 'SOLO-II', fnd: 'FND-4PILAS-CAMPANA', diff: AccessDifficulty.NORMAL },
    // Trecho 3: Rio Verde Norte - Chapadão
    { lineId: line3.id, num: 'E3-T001', station: 0.0, towerType: 'RS4AT-ANCOR', soil: 'SOLO-I', fnd: 'FND-SAPATA-ROCHA', diff: AccessDifficulty.DIFFICULT },
    { lineId: line3.id, num: 'E3-T002', station: 460.0, towerType: 'RS4EL-ESTAI', soil: 'SOLO-III', fnd: 'FND-MASTRO-PILA-4TIR', diff: AccessDifficulty.NORMAL },
    { lineId: line3.id, num: 'E3-T003', station: 920.0, towerType: 'RS4SL-AUTO', soil: 'SOLO-II', fnd: 'FND-4PILAS-CAMPANA', diff: AccessDifficulty.NORMAL },
  ];

  for (const st of sampleStaking) {
    await prisma.stakingTower.create({
      data: {
        transmissionLineId: st.lineId,
        towerNumber: st.num,
        stationMeters: st.station,
        towerTypeId: towerTypeMap[st.towerType],
        soilTypeId: soilTypeMap[st.soil],
        foundationTypeId: foundationTypeMap[st.fnd],
        accessDifficulty: st.diff,
      },
    });
  }
  console.log(`  ✓ ${sampleStaking.length} Torres de estaqueamento representativas cadastradas.`);

  // -------------------------------------------------------------------------
  // 2.4 Distribuição Preliminar Paramétrica
  // -------------------------------------------------------------------------
  for (const line of [line1, line2, line3]) {
    await prisma.preliminaryStakingDistribution.create({
      data: {
        transmissionLineId: line.id,
        soilPercentages: [
          { soilCode: 'SOLO-I', percentage: 25.0 },
          { soilCode: 'SOLO-II', percentage: 40.0 },
          { soilCode: 'SOLO-III', percentage: 20.0 },
          { soilCode: 'SOLO-IV', percentage: 15.0 },
        ],
        foundationPercentages: [
          { foundationCode: 'FND-4PILAS-CAMPANA', percentage: 55.0 },
          { foundationCode: 'FND-MASTRO-PILA-4TIR', percentage: 30.0 },
          { foundationCode: 'FND-GRELHA-METALICA', percentage: 10.0 },
          { foundationCode: 'FND-SAPATA-ROCHA', percentage: 5.0 },
        ],
      },
    });
  }
  console.log('  ✓ Distribuições preliminares de solo e fundação associadas.');

  console.log('\n✨ =========================================================================');
  console.log('✨ Seed concluído com 100% de sucesso em todos os catálogos!');
  console.log('✨ =========================================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante a execução do seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
