import { Test } from '@nestjs/testing';
import { AuthModule } from '../auth/auth.module';
import { CatalogsModule } from '../contexts/catalogs/infrastructure/catalogs.module';
import { FoundationsModule } from '../contexts/foundations/infrastructure/foundations.module';
import { OffersModule } from '../contexts/offers/infrastructure/offers.module';
import { StakingModule } from '../contexts/staking/infrastructure/staking.module';
import { TaxationModule } from '../contexts/taxation/infrastructure/taxation.module';
import { PricingModule } from '../contexts/pricing/infrastructure/pricing.module';
import { EconomicsModule } from '../contexts/economics/infrastructure/economics.module';
import { BaselineModule } from '../contexts/baseline/infrastructure/baseline.module';

import { ElectromechanicalModule } from '../contexts/electromechanical/infrastructure/electromechanical.module';
import { ScheduleModule } from '../contexts/schedule/infrastructure/schedule.module';
import { HistogramModule } from '../contexts/histogram/infrastructure/histogram.module';
import { RisksModule } from '../contexts/risks/infrastructure/risks.module';
import { ChecksModule } from '../contexts/checks/infrastructure/checks.module';
import { ExportModule } from '../contexts/export/infrastructure/export.module';

// Regressão de DI real: testes puros mockam as portas e o build só checa
// tipos, então um provider irresolvível (ex.: construtor com tipo de união,
// cujo paramtype vira Object) só explode no bootstrap. Compilar cada módulo
// de contexto aqui pega essa classe de falha sem precisar de banco — o
// PrismaService não conecta no construtor, apenas no onModuleInit.
describe('Módulos de contexto compilam com injeção de dependência real', () => {
  const cases: Array<[string, unknown]> = [
    ['CatalogsModule', CatalogsModule],
    ['OffersModule', OffersModule],
    ['StakingModule', StakingModule],
    ['FoundationsModule', FoundationsModule],
    ['TaxationModule', TaxationModule],
    ['PricingModule', PricingModule],
    ['ElectromechanicalModule', ElectromechanicalModule],
    ['ScheduleModule', ScheduleModule],
    ['HistogramModule', HistogramModule],
    ['EconomicsModule', EconomicsModule],
    ['BaselineModule', BaselineModule],
    ['RisksModule', RisksModule],
    ['ChecksModule', ChecksModule],
    ['ExportModule', ExportModule],
  ];

  it.each(cases)('%s resolve todos os providers', async (_name, module) => {
    // AuthModule é @Global() no AppModule real; sem ele o RolesGuard dos
    // controllers não resolve o AuthService.
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule, module as never],
    }).compile();
    expect(moduleRef).toBeDefined();
    await moduleRef.close();
  });
});
