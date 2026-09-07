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
import { CreateWorkCrewVersionDto } from './dto/create-work-crew-version.dto';
import { CreateWorkCrewDto } from './dto/create-work-crew.dto';
import { WorkCrewsService } from './work-crews.service';

const IdPipe = createIdPipe();

@Controller('catalogs/work-crews')
export class WorkCrewsController {
  constructor(private readonly service: WorkCrewsService) {}

  @Post()
  create(@Body() dto: CreateWorkCrewDto, @Headers('x-user') user?: string) {
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
    @Body() dto: CreateWorkCrewVersionDto,
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
