import { Test, TestingModule } from '@nestjs/testing';
import { ParityController } from './parity.controller';
import { ParityService } from './parity.service';
import { RolesGuard } from '../auth/roles.guard';

describe('ParityController', () => {
  let controller: ParityController;
  let service: ParityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParityController],
      providers: [ParityService],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ParityController>(ParityController);
    service = module.get<ParityService>(ParityService);
  });

  it('deve ser instanciado com sucesso', () => {
    expect(controller).toBeDefined();
  });

  it('deve listar perfis através do controller', () => {
    const profiles = controller.getProfiles();
    expect(profiles.length).toBeGreaterThanOrEqual(4);
  });

  it('deve retornar todos os relatórios', () => {
    const reports = controller.getAllReports();
    expect(reports.length).toBe(4);
    expect(reports.every((r) => r.isApproved)).toBe(true);
  });

  it('deve retornar relatório de um perfil específico', () => {
    const report = controller.getReportByProfile('celeo');
    expect(report.offerCode).toBe('OF-2026-CELEO-LOTE-04');
    expect(report.isApproved).toBe(true);
  });

  it('deve enviar markdown do relatório com header correto', () => {
    const resMock = {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as any;

    controller.getMarkdownReport('solaris', resMock);
    expect(resMock.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'text/markdown; charset=utf-8',
    );
    expect(resMock.send).toHaveBeenCalled();
  });
});
