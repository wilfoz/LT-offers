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
import { CreateFixedCostDto } from './dto/create-fixed-cost.dto';
import { CreateFixedCostVersionDto } from './dto/create-fixed-cost-version.dto';
import { FixedCostsService } from './fixed-costs.service';

const IdPipe = createIdPipe();

@Controller('catalogs/fixed-costs')
export class FixedCostsController {
  constructor(private readonly service: FixedCostsService) {}

  @Post()
  create(@Body() dto: CreateFixedCostDto, @Headers('x-user') user?: string) {
    return this.service.create(dto, resolveAuthor(user), todayCivilDate());
  }

  @Get()
  list(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('effectiveOn') effectiveOn?: string,
  ) {
    return this.service.list(
      search,
      category,
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
    @Body() dto: CreateFixedCostVersionDto,
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
