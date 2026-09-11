import {
  CloneOfferPayload,
  CreateNewRevisionPayload,
  CreateOfferPayload,
  OfferDetail,
  OfferSummary,
  UpdateOfferGeneralPayload,
  UpdateOfferRevisionPayload,
} from '@lt-offers/domain';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CloneOfferDto } from './dto/clone-offer.dto';
import { CreateNewRevisionDto } from './dto/create-new-revision.dto';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferGeneralDto } from './dto/update-offer-general.dto';
import { UpdateOfferRevisionDto } from './dto/update-offer-revision.dto';
import { OffersService } from './offers.service';
import { RolesGuard } from '../auth/roles.guard';
import { RequireScopes, Audited } from '../auth/auth.decorators';

@Controller('offers')
@UseGuards(RolesGuard)
export class OffersController {
  constructor(private readonly service: OffersService) {}

  @Get()
  @RequireScopes('OFFER_READ')
  async list(@Query('search') search?: string): Promise<OfferSummary[]> {
    return this.service.list(search);
  }

  @Get('by-code/:code')
  @RequireScopes('OFFER_READ')
  async getByCode(@Param('code') code: string): Promise<OfferDetail> {
    return this.service.getByCode(code);
  }

  @Get(':id')
  @RequireScopes('OFFER_READ')
  async getById(@Param('id', ParseIntPipe) id: number): Promise<OfferDetail> {
    return this.service.getById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequireScopes('OFFER_WRITE')
  @Audited({ resource: 'OFFER', action: 'CREATE', description: 'Criação de nova oferta' })
  async create(@Body() dto: CreateOfferDto): Promise<OfferDetail> {
    return this.service.create(dto as CreateOfferPayload);
  }

  @Patch(':id')
  @RequireScopes('OFFER_WRITE')
  @Audited({ resource: 'OFFER', action: 'UPDATE', description: 'Atualização de parâmetros gerais da oferta' })
  async updateGeneral(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOfferGeneralDto,
  ): Promise<OfferDetail> {
    return this.service.updateGeneral(id, dto as UpdateOfferGeneralPayload);
  }

  @Put(':offerId/revisions/:revisionId')
  @RequireScopes('OFFER_WRITE')
  @Audited({ resource: 'REVISION', action: 'UPDATE', description: 'Edição de revisão de oferta' })
  async updateRevision(
    @Param('offerId', ParseIntPipe) offerId: number,
    @Param('revisionId', ParseIntPipe) revisionId: number,
    @Body() dto: UpdateOfferRevisionDto,
  ): Promise<OfferDetail> {
    return this.service.updateRevision(
      offerId,
      revisionId,
      dto as UpdateOfferRevisionPayload,
    );
  }

  @Post(':id/revisions')
  @HttpCode(HttpStatus.CREATED)
  @RequireScopes('OFFER_WRITE')
  @Audited({ resource: 'REVISION', action: 'CREATE', description: 'Criação de nova revisão a partir da anterior' })
  async createNewRevision(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateNewRevisionDto,
  ): Promise<OfferDetail> {
    return this.service.createNewRevision(id, dto as CreateNewRevisionPayload);
  }

  @Post(':id/clone')
  @HttpCode(HttpStatus.CREATED)
  @RequireScopes('OFFER_WRITE')
  @Audited({ resource: 'OFFER', action: 'CLONE', description: 'Clonagem integral de proposta' })
  async cloneOffer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CloneOfferDto,
  ): Promise<OfferDetail> {
    return this.service.cloneOffer(id, dto as CloneOfferPayload);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireScopes('ADMIN')
  @Audited({ resource: 'OFFER', action: 'DELETE', description: 'Exclusão definitiva de oferta' })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.service.delete(id);
  }
}
