import { OfferDetail, OfferSummary } from '@lt-offers/domain';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CloneOfferDto,
  CreateNewRevisionDto,
  CreateOfferDto,
  UpdateOfferGeneralDto,
  UpdateOfferRevisionDto,
} from './dto';
import {
  CreateOfferUseCase,
  GetOfferDetailsUseCase,
  ListOffersUseCase,
  UpdateOfferGeneralUseCase,
  CloneOfferUseCase,
  DeleteOfferUseCase,
  CreateRevisionUseCase,
  UpdateRevisionUseCase,
} from '../../application/usecases';
import {
  OfferNotFoundException,
  RevisionNotFoundException,
  LineNotFoundException,
  DuplicateOfferCodeException,
  RevisionFrozenException,
  InvalidScopeMatrixException,
  InvalidDestinationSharesException,
} from '../../domain/exceptions/offer-domain.exceptions';
import { OfferPresenter } from './presenters/offer.presenter';
import { RolesGuard } from '../../../../auth/roles.guard';
import { RequireScopes, Audited } from '../../../../auth/auth.decorators';

@Controller('offers')
@UseGuards(RolesGuard)
export class OffersController {
  constructor(
    private readonly listOffersUseCase: ListOffersUseCase,
    private readonly getOfferDetailsUseCase: GetOfferDetailsUseCase,
    private readonly createOfferUseCase: CreateOfferUseCase,
    private readonly updateOfferGeneralUseCase: UpdateOfferGeneralUseCase,
    private readonly updateRevisionUseCase: UpdateRevisionUseCase,
    private readonly createRevisionUseCase: CreateRevisionUseCase,
    private readonly cloneOfferUseCase: CloneOfferUseCase,
    private readonly deleteOfferUseCase: DeleteOfferUseCase,
  ) {}

  @Get()
  @RequireScopes('OFFER_READ')
  async list(@Query('search') search?: string): Promise<OfferSummary[]> {
    try {
      const offers = await this.listOffersUseCase.execute(search);
      return offers.map((o) => OfferPresenter.toSummary(o));
    } catch (error) {
      this.handleDomainError(error);
    }
  }

  @Get('by-code/:code')
  @RequireScopes('OFFER_READ')
  async getByCode(@Param('code') code: string): Promise<OfferDetail> {
    try {
      const offer = await this.getOfferDetailsUseCase.executeByCode(code);
      return OfferPresenter.toDetail(offer);
    } catch (error) {
      this.handleDomainError(error);
    }
  }

  @Get(':id')
  @RequireScopes('OFFER_READ')
  async getById(@Param('id', ParseIntPipe) id: number): Promise<OfferDetail> {
    try {
      const offer = await this.getOfferDetailsUseCase.execute(id);
      return OfferPresenter.toDetail(offer);
    } catch (error) {
      this.handleDomainError(error);
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequireScopes('OFFER_WRITE')
  @Audited({
    resource: 'OFFER',
    action: 'CREATE',
    description: 'Criação de nova oferta',
  })
  async create(@Body() dto: CreateOfferDto): Promise<OfferDetail> {
    try {
      const offer = await this.createOfferUseCase.execute(dto as any);
      return OfferPresenter.toDetail(offer);
    } catch (error) {
      this.handleDomainError(error);
    }
  }

  @Patch(':id')
  @RequireScopes('OFFER_WRITE')
  @Audited({
    resource: 'OFFER',
    action: 'UPDATE',
    description: 'Atualização de parâmetros gerais da oferta',
  })
  async updateGeneral(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOfferGeneralDto,
  ): Promise<OfferDetail> {
    try {
      const offer = await this.updateOfferGeneralUseCase.execute(
        id,
        dto as any,
      );
      return OfferPresenter.toDetail(offer);
    } catch (error) {
      this.handleDomainError(error);
    }
  }

  @Put(':offerId/revisions/:revisionId')
  @RequireScopes('OFFER_WRITE')
  @Audited({
    resource: 'REVISION',
    action: 'UPDATE',
    description: 'Edição de revisão de oferta',
  })
  async updateRevision(
    @Param('offerId', ParseIntPipe) offerId: number,
    @Param('revisionId', ParseIntPipe) revisionId: number,
    @Body() dto: UpdateOfferRevisionDto,
  ): Promise<OfferDetail> {
    try {
      const offer = await this.updateRevisionUseCase.execute(
        offerId,
        revisionId,
        dto as any,
      );
      return OfferPresenter.toDetail(offer);
    } catch (error) {
      this.handleDomainError(error);
    }
  }

  @Post(':id/revisions')
  @HttpCode(HttpStatus.CREATED)
  @RequireScopes('OFFER_WRITE')
  @Audited({
    resource: 'REVISION',
    action: 'CREATE',
    description: 'Criação de nova revisão a partir da anterior',
  })
  async createNewRevision(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateNewRevisionDto,
  ): Promise<OfferDetail> {
    try {
      const offer = await this.createRevisionUseCase.execute(id, dto as any);
      return OfferPresenter.toDetail(offer);
    } catch (error) {
      this.handleDomainError(error);
    }
  }

  @Post(':id/clone')
  @HttpCode(HttpStatus.CREATED)
  @RequireScopes('OFFER_WRITE')
  @Audited({
    resource: 'OFFER',
    action: 'CLONE',
    description: 'Clonagem integral de proposta',
  })
  async cloneOffer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CloneOfferDto,
  ): Promise<OfferDetail> {
    try {
      const offer = await this.cloneOfferUseCase.execute(id, dto as any);
      return OfferPresenter.toDetail(offer);
    } catch (error) {
      this.handleDomainError(error);
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireScopes('ADMIN')
  @Audited({
    resource: 'OFFER',
    action: 'DELETE',
    description: 'Exclusão definitiva de oferta',
  })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    try {
      await this.deleteOfferUseCase.execute(id);
    } catch (error) {
      this.handleDomainError(error);
    }
  }

  private handleDomainError(error: any): never {
    if (error instanceof HttpException) {
      throw error;
    }

    if (
      error instanceof OfferNotFoundException ||
      error instanceof RevisionNotFoundException ||
      error instanceof LineNotFoundException
    ) {
      throw new NotFoundException(error.message);
    }

    if (
      error instanceof DuplicateOfferCodeException ||
      error instanceof RevisionFrozenException ||
      error instanceof InvalidScopeMatrixException ||
      error instanceof InvalidDestinationSharesException
    ) {
      throw new BadRequestException(error.message);
    }

    throw new BadRequestException(
      error?.message || 'Erro ao processar requisição',
    );
  }
}
