import {
  FOUNDATION_APPLICATIONS,
  FoundationApplication,
} from '@lt-offers/domain';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { todayCivilDate } from './civil-date';
import {
  createIdPipe,
  resolveAuthor,
  resolveReferenceDate,
  versionImmutableException,
} from './controller-shared';
import { CreateFoundationTypeDto } from './dto/create-foundation-type.dto';
import { CreateFoundationTypeVersionDto } from './dto/create-foundation-type-version.dto';
import { FoundationTypesService } from './foundation-types.service';

const IdPipe = createIdPipe();

@Controller('catalogs/foundation-types')
export class FoundationTypesController {
  constructor(private readonly service: FoundationTypesService) {}

  @Post()
  create(
    @Body() dto: CreateFoundationTypeDto,
    @Headers('x-user') user?: string,
  ) {
    return this.service.create(dto, resolveAuthor(user), todayCivilDate());
  }

  @Get()
  list(
    @Query('search') search?: string,
    @Query('application') application?: string,
    @Query('effectiveOn') effectiveOn?: string,
  ) {
    return this.service.list(
      search,
      this.foundationApplication(application),
      resolveReferenceDate(effectiveOn),
    );
  }

  @Get(':id')
  get(
    @Param('id', IdPipe) id: number,
    @Query('effectiveOn') effectiveOn?: string,
  ) {
    return this.service.get(id, resolveReferenceDate(effectiveOn));
  }

  @Get(':id/history')
  listHistory(@Param('id', IdPipe) id: number) {
    return this.service.listHistory(id);
  }

  @Post(':id/versions')
  createVersion(
    @Param('id', IdPipe) id: number,
    @Body() dto: CreateFoundationTypeVersionDto,
    @Headers('x-user') user?: string,
  ) {
    return this.service.createVersion(id, dto, resolveAuthor(user));
  }

  // Decoradores @Put/@Patch empilhados no mesmo método NÃO registram duas
  // rotas (o mais externo sobrescreve o metadata) — por isso dois métodos.
  @Put(':id/versions/:versionId')
  replaceVersion(): never {
    throw versionImmutableException();
  }

  @Patch(':id/versions/:versionId')
  patchVersion(): never {
    throw versionImmutableException();
  }

  /** Filtro de aplicação validado na borda; ausência = todas as aplicações. */
  private foundationApplication(
    application?: string,
  ): FoundationApplication | undefined {
    if (application === undefined || application === '') {
      return undefined;
    }
    if (!(FOUNDATION_APPLICATIONS as readonly string[]).includes(application)) {
      throw new BadRequestException(
        'A aplicação deve ser SELF_SUPPORTING (autoportante), GUYED (estaiada) ou CROSS_ROPE quando informada',
      );
    }
    return application as FoundationApplication;
  }
}
