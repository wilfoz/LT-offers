import { GROUND_WIRE_TYPES, GroundWireType } from '@lt-offers/domain';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  MethodNotAllowedException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { todayCivilDate, toCivilDate } from './civil-date';
import { CreateGroundWireDto } from './dto/create-ground-wire.dto';
import { CreateGroundWireVersionDto } from './dto/create-ground-wire-version.dto';
import { GroundWiresService } from './ground-wires.service';

const DEFAULT_USER = 'sistema';

const IdPipe = new ParseIntPipe({
  exceptionFactory: () =>
    new BadRequestException('O identificador deve ser um número inteiro'),
});

@Controller('catalogs/ground-wires')
export class GroundWiresController {
  constructor(private readonly service: GroundWiresService) {}

  @Post()
  create(@Body() dto: CreateGroundWireDto, @Headers('x-user') user?: string) {
    return this.service.create(dto, this.author(user), todayCivilDate());
  }

  @Get()
  list(
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('effectiveOn') effectiveOn?: string,
  ) {
    return this.service.list(
      search,
      this.wireType(type),
      this.referenceDate(effectiveOn),
    );
  }

  @Get(':id')
  get(
    @Param('id', IdPipe) id: number,
    @Query('effectiveOn') effectiveOn?: string,
  ) {
    return this.service.get(id, this.referenceDate(effectiveOn));
  }

  @Get(':id/history')
  listHistory(@Param('id', IdPipe) id: number) {
    return this.service.listHistory(id);
  }

  @Post(':id/versions')
  createVersion(
    @Param('id', IdPipe) id: number,
    @Body() dto: CreateGroundWireVersionDto,
    @Headers('x-user') user?: string,
  ) {
    return this.service.createVersion(id, dto, this.author(user));
  }

  // Decoradores @Put/@Patch empilhados no mesmo método NÃO registram duas
  // rotas (o mais externo sobrescreve o metadata) — por isso dois métodos.
  @Put(':id/versions/:versionId')
  replaceVersion(): never {
    return this.rejectVersionChange();
  }

  @Patch(':id/versions/:versionId')
  patchVersion(): never {
    return this.rejectVersionChange();
  }

  private rejectVersionChange(): never {
    throw new MethodNotAllowedException(
      'Versões são imutáveis; para alterar valores, crie uma nova versão com data de vigência',
    );
  }

  private author(user?: string): string {
    return user?.trim() || DEFAULT_USER;
  }

  /** Filtro de tipo validado na borda; ausência = todos os tipos. */
  private wireType(type?: string): GroundWireType | undefined {
    if (type === undefined || type === '') {
      return undefined;
    }
    if (!(GROUND_WIRE_TYPES as readonly string[]).includes(type)) {
      throw new BadRequestException(
        'O tipo deve ser STEEL (aço) ou OPGW quando informado',
      );
    }
    return type as GroundWireType;
  }

  /** Data de referência resolvida na borda: default = hoje civil. */
  private referenceDate(effectiveOn?: string): Date {
    return effectiveOn ? toCivilDate(effectiveOn) : todayCivilDate();
  }
}
