import {
  BadRequestException,
  MethodNotAllowedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { validate } from 'class-validator';
import { CabosCondutoresController } from './cabos-condutores.controller';
import { CabosCondutoresService } from './cabos-condutores.service';
import { CriarCaboCondutorDto } from './dto/criar-cabo-condutor.dto';

describe('CabosCondutoresController', () => {
  const serviceMock = {
    criar: jest.fn(),
    criarVersao: jest.fn(),
    listar: jest.fn().mockResolvedValue([]),
    obter: jest.fn(),
    listarHistorico: jest.fn(),
  };

  let controller: CabosCondutoresController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [CabosCondutoresController],
      providers: [
        { provide: CabosCondutoresService, useValue: serviceMock },
      ],
    }).compile();
    controller = moduleRef.get(CabosCondutoresController);
  });

  it('usa "sistema" como autor quando o cabeçalho X-Usuario está ausente', async () => {
    await controller.criar({ codigo: 'CAA-636' } as CriarCaboCondutorDto);
    expect(serviceMock.criar.mock.calls[0][1]).toBe('sistema');
  });

  it('repassa o autor do cabeçalho X-Usuario', async () => {
    await controller.criar(
      { codigo: 'CAA-636' } as CriarCaboCondutorDto,
      'carla',
    );
    expect(serviceMock.criar.mock.calls[0][1]).toBe('carla');
  });

  it('rejeita data de referência fora do formato AAAA-MM-DD', () => {
    expect(() => controller.listar(undefined, '23/08/2026')).toThrow(
      BadRequestException,
    );
  });

  it('rejeita data de referência de calendário inexistente', () => {
    expect(() => controller.listar(undefined, '2026-02-30')).toThrow(
      BadRequestException,
    );
  });

  it('repassa a data de referência válida para o serviço', () => {
    controller.listar('CAA', '2026-03-15');
    expect(serviceMock.listar.mock.calls[0][1]).toEqual(
      new Date('2026-03-15T00:00:00.000Z'),
    );
  });

  it('usa a data civil de hoje como referência quando vigenteEm está ausente', () => {
    controller.listar(undefined, undefined);
    const dataUsada = serviceMock.listar.mock.calls[0][1] as Date;
    expect(dataUsada.toISOString()).toMatch(/T00:00:00\.000Z$/);
  });

  it('rejeita alteração direta de versão por PUT e por PATCH', () => {
    expect(() => controller.substituirVersao()).toThrow(
      MethodNotAllowedException,
    );
    expect(() => controller.corrigirVersao()).toThrow(
      MethodNotAllowedException,
    );
  });
});

describe('CriarCaboCondutorDto (validação)', () => {
  const dto = (dados: Partial<CriarCaboCondutorDto>) =>
    Object.assign(new CriarCaboCondutorDto(), dados);

  it('aceita numéricos como string decimal positiva e null como não informado', async () => {
    const erros = await validate(
      dto({ codigo: 'CAA-636', pesoTonKm: '1.25', utsKn: null }),
    );
    expect(erros).toHaveLength(0);
  });

  it('rejeita valor numérico negativo ou não numérico com mensagem em português', async () => {
    const erros = await validate(
      dto({ codigo: 'CAA-636', pesoTonKm: '-1', utsKn: 'abc' }),
    );
    const mensagens = erros.flatMap((e) =>
      Object.values(e.constraints ?? {}),
    );
    expect(mensagens.some((m) => m.includes('peso (ton/km)'))).toBe(true);
    expect(mensagens.some((m) => m.includes('UTS (kN)'))).toBe(true);
  });

  it('rejeita código ausente', async () => {
    const erros = await validate(dto({ pesoTonKm: '1.2' }));
    expect(
      erros.some((e) => e.property === 'codigo'),
    ).toBe(true);
  });
});
