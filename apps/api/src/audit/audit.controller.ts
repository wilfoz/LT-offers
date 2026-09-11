import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { AuditEvent, AuditFilter } from '@lt-offers/domain';
import { AuditService } from './audit.service';
import { RolesGuard } from '../auth/roles.guard';
import { RequireScopes } from '../auth/auth.decorators';

@Controller('audit')
@UseGuards(RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequireScopes('AUDIT_READ')
  getEvents(
    @Query('offerId') offerId?: string,
    @Query('resource') resource?: any,
    @Query('userId') userId?: string,
    @Query('action') action?: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): AuditEvent[] {
    const filter: AuditFilter = {
      offerId,
      resource,
      userId,
      action,
      startDate,
      endDate,
    };
    return this.auditService.getEvents(filter);
  }

  @Post('log')
  @RequireScopes('OFFER_WRITE')
  logManualEvent(
    @Body() eventInput: Omit<AuditEvent, 'id' | 'timestamp'>
  ): AuditEvent {
    return this.auditService.logEvent(eventInput);
  }
}
