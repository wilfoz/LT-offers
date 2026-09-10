import {
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
import { CreateLaborRoleDto } from './dto/create-labor-role.dto';
import { CreateLaborRoleVersionDto } from './dto/create-labor-role-version.dto';
import { LaborRolesService } from './labor-roles.service';

const IdPipe = createIdPipe();

@Controller('catalogs/labor-roles')
export class LaborRolesController {
  constructor(private readonly service: LaborRolesService) {}

  @Post()
  create(@Body() dto: CreateLaborRoleDto, @Headers('x-user') user?: string) {
    return this.service.create(dto, resolveAuthor(user), todayCivilDate());
  }

  @Get()
  list(
    @Query('search') search?: string,
    @Query('effectiveOn') effectiveOn?: string,
  ) {
    return this.service.list(search, resolveReferenceDate(effectiveOn));
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
    @Body() dto: CreateLaborRoleVersionDto,
    @Headers('x-user') user?: string,
  ) {
    return this.service.createVersion(id, dto, resolveAuthor(user));
  }

  @Put(':id/versions/:versionId')
  replaceVersion(): never {
    throw versionImmutableException();
  }

  @Patch(':id/versions/:versionId')
  patchVersion(): never {
    throw versionImmutableException();
  }
}
