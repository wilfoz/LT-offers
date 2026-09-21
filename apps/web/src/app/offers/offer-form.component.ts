import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  CreateOfferPayload,
  DATE_PATTERN,
  POSITIVE_DECIMAL_PATTERN,
  UpdateOfferGeneralPayload,
} from '@lt-offers/domain';
import { decimalScaleValidator, orNull } from '../catalogs/form-utils';
import { OffersApi } from './offers-api.service';

@Component({
  selector: 'app-offer-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  template: `
    <section class="offer-form-page">
      <!-- Subheader -->
      <div class="page-sub-header">
        <div class="header-left">
          <nav class="breadcrumb-nav">
            <a routerLink="/offers" class="breadcrumb-link">Ofertas</a>
            <mat-icon class="breadcrumb-sep">chevron_right</mat-icon>
            <span class="breadcrumb-current">{{
              editId() ? 'Editar Dados da Obra' : 'Nova Obra / Projeto'
            }}</span>
          </nav>
          <h2 class="font-display-lg page-title">
            {{
              editId()
                ? 'Editar Dados Gerais da Proposta'
                : 'Criar Novo Projeto / Obra'
            }}
          </h2>
          <p class="page-subtitle">
            {{
              editId()
                ? 'Alteração dos metadados globais da proposta (código, nome, cliente e moeda).'
                : 'Insira os parâmetros técnicos e premissas para iniciar o dimensionamento estrutural.'
            }}
          </p>
        </div>

        <div class="header-actions">
          <a
            matButton="outlined"
            [routerLink]="cancelLink()"
            class="btn-secondary-outline"
          >
            Cancelar
          </a>
          <button
            type="button"
            class="btn-primary-gradient"
            (click)="save()"
            [disabled]="saving() || form.invalid"
          >
            <mat-icon>{{
              saving() ? 'sync' : editId() ? 'save' : 'add_task'
            }}</mat-icon>
            <span>{{
              saving()
                ? 'Processando...'
                : editId()
                  ? 'Salvar Alterações'
                  : 'Criar Projeto'
            }}</span>
          </button>
        </div>
      </div>

      @if (loading()) {
        <mat-progress-bar
          mode="indeterminate"
          aria-label="Carregando"
          class="my-4"
        />
        <p class="loading-text">Carregando dados…</p>
      } @else {
        <form [formGroup]="form" (ngSubmit)="save()" class="offer-form-layout">
          <!-- Left Column: General Info & Location -->
          <div class="form-col-left">
            <!-- Section 1: Informações Gerais -->
            <fieldset class="panel-card technical-border fieldset-card">
              <div class="panel-header">
                <mat-icon class="panel-icon">info</mat-icon>
                <legend class="panel-title font-label-caps">
                  Informações Gerais da Obra
                </legend>
              </div>

              <div class="fieldset-content form-grid">
                <div class="col-12">
                  <label class="form-label font-label-caps" for="name"
                    >NOME DA OBRA / PROJETO *</label
                  >
                  <mat-form-field
                    appearance="outline"
                    floatLabel="always"
                    subscriptSizing="dynamic"
                    class="w-full"
                  >
                    <input
                      matInput
                      id="name"
                      formControlName="name"
                      placeholder="Ex: Linha de Transmissão 500kV - Setor Norte"
                      maxlength="200"
                    />
                    @if (errorFor('name')) {
                      <mat-error>{{ errorFor('name') }}</mat-error>
                    }
                  </mat-form-field>
                </div>

                <div class="col-6">
                  <label class="form-label font-label-caps" for="code"
                    >CÓDIGO INTERNO *</label
                  >
                  <mat-form-field
                    appearance="outline"
                    floatLabel="always"
                    subscriptSizing="dynamic"
                    class="w-full"
                  >
                    <input
                      matInput
                      id="code"
                      formControlName="code"
                      placeholder="Ex: OBR-2026-001"
                      maxlength="50"
                      class="font-numeric-tabular"
                    />
                    @if (errorFor('code')) {
                      <mat-error>{{ errorFor('code') }}</mat-error>
                    }
                  </mat-form-field>
                </div>

                <div class="col-6">
                  <label class="form-label font-label-caps" for="clientName"
                    >CLIENTE / CONCESSIONÁRIA *</label
                  >
                  <mat-form-field
                    appearance="outline"
                    floatLabel="always"
                    subscriptSizing="dynamic"
                    class="w-full"
                  >
                    <input
                      matInput
                      id="clientName"
                      formControlName="clientName"
                      placeholder="Ex: Axia Energia Transmissão S.A."
                      maxlength="200"
                    />
                    @if (errorFor('clientName')) {
                      <mat-error>{{ errorFor('clientName') }}</mat-error>
                    }
                  </mat-form-field>
                </div>

                <div class="col-12">
                  <label class="form-label font-label-caps" for="baseCurrency"
                    >MOEDA BASE *</label
                  >
                  <mat-form-field
                    appearance="outline"
                    floatLabel="always"
                    subscriptSizing="dynamic"
                    class="w-full"
                  >
                    <mat-select
                      id="baseCurrency"
                      formControlName="baseCurrency"
                    >
                      <mat-option value="BRL">BRL (Real Brasileiro)</mat-option>
                      <mat-option value="USD">USD (Dólar Americano)</mat-option>
                      <mat-option value="EUR">EUR (Euro)</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>
              </div>
            </fieldset>

            @if (!editId()) {
              <!-- Section 2: Premissas do Leilão / Lote -->
              <fieldset class="panel-card technical-border fieldset-card">
                <div class="panel-header">
                  <mat-icon class="panel-icon">gavel</mat-icon>
                  <legend class="panel-title font-label-caps">
                    Premissas do Leilão &amp; Lote (R0)
                  </legend>
                </div>

                <div class="fieldset-content form-grid">
                  <div class="col-6">
                    <label class="form-label font-label-caps" for="auctionName"
                      >EDITAL / LEILÃO *</label
                    >
                    <mat-form-field
                      appearance="outline"
                      floatLabel="always"
                      subscriptSizing="dynamic"
                      class="w-full"
                    >
                      <input
                        matInput
                        id="auctionName"
                        formControlName="auctionName"
                        placeholder="Ex: Leilão 01/2026 - ANEEL"
                        maxlength="100"
                      />
                      @if (errorFor('auctionName')) {
                        <mat-error>{{ errorFor('auctionName') }}</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  <div class="col-6">
                    <label class="form-label font-label-caps" for="lotName"
                      >LOTE / CIRCUITO *</label
                    >
                    <mat-form-field
                      appearance="outline"
                      floatLabel="always"
                      subscriptSizing="dynamic"
                      class="w-full"
                    >
                      <input
                        matInput
                        id="lotName"
                        formControlName="lotName"
                        placeholder="Ex: Lote 1"
                        maxlength="100"
                      />
                      @if (errorFor('lotName')) {
                        <mat-error>{{ errorFor('lotName') }}</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  <div class="col-6">
                    <label class="form-label font-label-caps" for="offerDate"
                      >DATA DA OFERTA *</label
                    >
                    <mat-form-field
                      appearance="outline"
                      floatLabel="always"
                      subscriptSizing="dynamic"
                      class="w-full"
                    >
                      <input
                        matInput
                        id="offerDate"
                        formControlName="offerDate"
                        placeholder="AAAA-MM-DD"
                        class="font-numeric-tabular"
                      />
                      @if (errorFor('offerDate')) {
                        <mat-error>{{ errorFor('offerDate') }}</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  <div class="col-6">
                    <label class="form-label font-label-caps" for="auctionDate"
                      >DATA DO LEILÃO</label
                    >
                    <mat-form-field
                      appearance="outline"
                      floatLabel="always"
                      subscriptSizing="dynamic"
                      class="w-full"
                    >
                      <input
                        matInput
                        id="auctionDate"
                        formControlName="auctionDate"
                        placeholder="AAAA-MM-DD"
                        class="font-numeric-tabular"
                      />
                      @if (errorFor('auctionDate')) {
                        <mat-error>{{ errorFor('auctionDate') }}</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  <div class="col-6">
                    <label
                      class="form-label font-label-caps"
                      for="scheduleStartDate"
                      >INÍCIO DO CRONOGRAMA</label
                    >
                    <mat-form-field
                      appearance="outline"
                      floatLabel="always"
                      subscriptSizing="dynamic"
                      class="w-full"
                    >
                      <input
                        matInput
                        id="scheduleStartDate"
                        formControlName="scheduleStartDate"
                        placeholder="AAAA-MM-DD"
                        class="font-numeric-tabular"
                      />
                      @if (errorFor('scheduleStartDate')) {
                        <mat-error>{{
                          errorFor('scheduleStartDate')
                        }}</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  <div class="col-6">
                    <label
                      class="form-label font-label-caps"
                      for="commercialOperationDate"
                      >ENTRADA EM OPERAÇÃO</label
                    >
                    <mat-form-field
                      appearance="outline"
                      floatLabel="always"
                      subscriptSizing="dynamic"
                      class="w-full"
                    >
                      <input
                        matInput
                        id="commercialOperationDate"
                        formControlName="commercialOperationDate"
                        placeholder="AAAA-MM-DD"
                        class="font-numeric-tabular"
                      />
                      @if (errorFor('commercialOperationDate')) {
                        <mat-error>{{
                          errorFor('commercialOperationDate')
                        }}</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  @if (hasScheduleInconsistency()) {
                    <div
                      class="col-12 alert-schedule technical-border"
                      role="alert"
                    >
                      <mat-icon>warning</mat-icon>
                      <span>
                        <strong>Alerta de Cronograma (RN-02):</strong> A data de
                        início do cronograma é posterior à data prevista de
                        entrada em operação do edital.
                      </span>
                    </div>
                  }
                </div>
              </fieldset>

              <!-- Section 3: Premissas Financeiras -->
              <fieldset class="panel-card technical-border fieldset-card">
                <div class="panel-header">
                  <mat-icon class="panel-icon">payments</mat-icon>
                  <legend class="panel-title font-label-caps">
                    Valores Estimados (CAPEX &amp; RAP)
                  </legend>
                </div>

                <div class="fieldset-content form-grid">
                  <div class="col-4">
                    <label
                      class="form-label font-label-caps"
                      for="estimatedCapex"
                      >CAPEX ANEEL</label
                    >
                    <mat-form-field
                      appearance="outline"
                      floatLabel="always"
                      subscriptSizing="dynamic"
                      class="w-full"
                    >
                      <input
                        matInput
                        id="estimatedCapex"
                        formControlName="estimatedCapex"
                        inputmode="decimal"
                        placeholder="Ex: 150000000.00"
                        class="font-numeric-tabular"
                      />
                      @if (errorFor('estimatedCapex')) {
                        <mat-error>{{ errorFor('estimatedCapex') }}</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  <div class="col-4">
                    <label class="form-label font-label-caps" for="maxRap"
                      >RAP MÁXIMA</label
                    >
                    <mat-form-field
                      appearance="outline"
                      floatLabel="always"
                      subscriptSizing="dynamic"
                      class="w-full"
                    >
                      <input
                        matInput
                        id="maxRap"
                        formControlName="maxRap"
                        inputmode="decimal"
                        placeholder="Ex: 25000000.00"
                        class="font-numeric-tabular"
                      />
                      @if (errorFor('maxRap')) {
                        <mat-error>{{ errorFor('maxRap') }}</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  <div class="col-4">
                    <label class="form-label font-label-caps" for="winningRap"
                      >RAP ESTIMADA</label
                    >
                    <mat-form-field
                      appearance="outline"
                      floatLabel="always"
                      subscriptSizing="dynamic"
                      class="w-full"
                    >
                      <input
                        matInput
                        id="winningRap"
                        formControlName="winningRap"
                        inputmode="decimal"
                        placeholder="Ex: 21000000.00"
                        class="font-numeric-tabular"
                      />
                      @if (errorFor('winningRap')) {
                        <mat-error>{{ errorFor('winningRap') }}</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  <div class="col-12">
                    <label class="form-label font-label-caps" for="notes"
                      >NOTAS E PREMISSAS CONTRATUAIS</label
                    >
                    <mat-form-field
                      appearance="outline"
                      floatLabel="always"
                      subscriptSizing="dynamic"
                      class="w-full"
                    >
                      <textarea
                        matInput
                        id="notes"
                        formControlName="notes"
                        rows="2"
                        placeholder="Observações, escopo inicial e premissas de projeto..."
                        maxlength="1000"
                      ></textarea>
                    </mat-form-field>
                  </div>
                </div>
              </fieldset>
            }
          </div>

          <!-- Right Column: Structure Type Cards & Audit Info -->
          <div class="form-col-right">
            <div class="panel-card technical-border fieldset-card">
              <div class="panel-header">
                <mat-icon class="panel-icon">settings_input_component</mat-icon>
                <span class="panel-title font-label-caps"
                  >Configuração da Estrutura</span
                >
              </div>

              <div class="fieldset-content space-y-4">
                <!-- Preset Pills -->
                <div class="preset-pills-bar">
                  <button
                    type="button"
                    class="preset-pill-btn"
                    [class.active]="includeSelfSupporting() && includeGuyed()"
                    (click)="setStructurePreset('BOTH')"
                  >
                    Ambas (Misto)
                  </button>
                  <button
                    type="button"
                    class="preset-pill-btn"
                    [class.active]="includeSelfSupporting() && !includeGuyed()"
                    (click)="setStructurePreset('SELF_SUPPORTING')"
                  >
                    Autoportante
                  </button>
                  <button
                    type="button"
                    class="preset-pill-btn"
                    [class.active]="!includeSelfSupporting() && includeGuyed()"
                    (click)="setStructurePreset('GUYED')"
                  >
                    Estaiada
                  </button>
                </div>

                <!-- Card 1: Torre Autoportante -->
                <div
                  class="structure-type-card"
                  [class.selected]="includeSelfSupporting()"
                  (click)="toggleSelfSupporting()"
                  role="checkbox"
                  [attr.aria-checked]="includeSelfSupporting()"
                  tabindex="0"
                  (keydown.enter)="toggleSelfSupporting()"
                  (keydown.space)="$event.preventDefault(); toggleSelfSupporting()"
                >
                  <div class="struct-radio-box">
                    <mat-icon class="struct-check" [class.checked]="includeSelfSupporting()">
                      {{ includeSelfSupporting() ? 'check_box' : 'check_box_outline_blank' }}
                    </mat-icon>
                  </div>
                  <div class="struct-info">
                    <div class="struct-header-line">
                      <span class="struct-title">Torre Autoportante</span>
                      @if (includeSelfSupporting()) {
                        <span class="struct-badge badge-blue">Habilitada</span>
                      }
                    </div>
                    <span class="struct-desc"
                      >Estrutura rígida treliçada com 4 pés. Alta estabilidade e
                      fixação por fundação profunda/direta. Empregada em ancoragens, vértices e trechos urbanos.</span
                    >
                  </div>
                </div>

                <!-- Card 2: Torre Estaiada -->
                <div
                  class="structure-type-card"
                  [class.selected]="includeGuyed()"
                  (click)="toggleGuyed()"
                  role="checkbox"
                  [attr.aria-checked]="includeGuyed()"
                  tabindex="0"
                  (keydown.enter)="toggleGuyed()"
                  (keydown.space)="$event.preventDefault(); toggleGuyed()"
                >
                  <div class="struct-radio-box">
                    <mat-icon class="struct-check" [class.checked]="includeGuyed()">
                      {{ includeGuyed() ? 'check_box' : 'check_box_outline_blank' }}
                    </mat-icon>
                  </div>
                  <div class="struct-info">
                    <div class="struct-header-line">
                      <span class="struct-title">Torre Estaiada</span>
                      @if (includeGuyed()) {
                        <span class="struct-badge badge-amber">Habilitada</span>
                      }
                    </div>
                    <span class="struct-desc"
                      >Mastro central suportado por cabos tensores (estais) externos.
                      Ideal para suspensões em tangentes e longos vãos com economia de aço.</span
                    >
                  </div>
                </div>

                <!-- Status Summary Box -->
                @if (includeSelfSupporting() && includeGuyed()) {
                  <div class="struct-status-box status-both">
                    <mat-icon class="status-icon">layers</mat-icon>
                    <div class="status-text-content">
                      <strong class="status-title">Configuração Híbrida: Ambas as Estruturas</strong>
                      <p class="status-desc">O projeto contemplará tanto torres autoportantes (ângulos/ancoragens) quanto torres estaiadas (suspensões).</p>
                    </div>
                  </div>
                } @else if (includeSelfSupporting()) {
                  <div class="struct-status-box status-self">
                    <mat-icon class="status-icon">filter_tilt_shift</mat-icon>
                    <div class="status-text-content">
                      <strong class="status-title">Configuração 100% Autoportante</strong>
                      <p class="status-desc">O projeto empregará exclusivamente estruturas rígidas autoportantes de 4 apoios.</p>
                    </div>
                  </div>
                } @else if (includeGuyed()) {
                  <div class="struct-status-box status-guyed">
                    <mat-icon class="status-icon">alt_route</mat-icon>
                    <div class="status-text-content">
                      <strong class="status-title">Configuração 100% Estaiada</strong>
                      <p class="status-desc">O projeto empregará predominantemente mastros estaiados com cabos tensores externos.</p>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Action Box -->
            <div class="action-card-box technical-border">
              <button
                type="submit"
                class="btn-primary-gradient w-full submit-large-btn"
                [disabled]="saving() || form.invalid"
              >
                <mat-icon>{{
                  saving() ? 'sync' : editId() ? 'save' : 'add_task'
                }}</mat-icon>
                <span>{{
                  saving()
                    ? 'Processando...'
                    : editId()
                      ? 'Salvar Alterações'
                      : 'Criar Projeto'
                }}</span>
              </button>

              <a
                matButton="outlined"
                [routerLink]="cancelLink()"
                class="btn-secondary-outline w-full cancel-btn"
              >
                Cancelar
              </a>

              <p class="audit-hint font-label-caps">
                Os dados serão auditados e registrados no histórico do sistema.
              </p>
            </div>
          </div>
        </form>
      }
    </section>
  `,
  styles: `
    .offer-form-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .page-sub-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--solaris-outline-variant);

      @media (max-width: 768px) {
        flex-direction: column;
        gap: 16px;
      }
    }

    .breadcrumb-nav {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: var(--solaris-on-surface-variant);
      margin-bottom: 4px;

      .breadcrumb-link {
        color: var(--solaris-on-surface-variant);
        text-decoration: none;

        &:hover {
          color: var(--solaris-primary);
        }
      }

      .breadcrumb-sep {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }

      .breadcrumb-current {
        font-weight: 700;
        color: var(--solaris-primary);
      }
    }

    .page-title {
      margin: 0;
    }

    .page-subtitle {
      font-size: 13px;
      color: var(--solaris-on-surface-variant);
      margin: 4px 0 0;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .offer-form-layout {
      display: flex;
      gap: 20px;
      align-items: flex-start;

      @media (max-width: 1024px) {
        flex-direction: column;
      }
    }

    .form-col-left {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 20px;
      min-width: 0;
    }

    .form-col-right {
      width: 360px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      flex-shrink: 0;

      @media (max-width: 1024px) {
        width: 100%;
      }
    }

    .panel-card {
      background: var(--solaris-surface-container-lowest);
      border-radius: 6px;
      overflow: hidden;
      box-shadow: var(--mat-sys-level1);
    }

    .panel-header {
      padding: 10px 16px;
      background: var(--solaris-surface-container-low);
      border-bottom: 1px solid var(--solaris-outline-variant);
      display: flex;
      align-items: center;
      gap: 8px;

      .panel-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--solaris-primary);
      }

      .panel-title {
        margin: 0;
        font-size: 11px;
        font-weight: 700;
        color: var(--solaris-on-surface);
      }
    }

    .fieldset-card {
      border: 1px solid var(--solaris-outline-variant);
      margin: 0;
      padding: 0;
    }

    .fieldset-content {
      padding: 16px;
    }

    .form-label {
      display: block;
      margin-bottom: 4px;
      font-size: 10px;
      color: var(--solaris-on-surface-variant);
    }

    .w-full {
      width: 100%;
    }

    .preset-pills-bar {
      display: flex;
      gap: 6px;
      margin-bottom: 4px;
    }

    .preset-pill-btn {
      flex: 1;
      padding: 6px 8px;
      font-size: 11px;
      font-weight: 600;
      border-radius: 4px;
      border: 1px solid var(--solaris-outline-variant);
      background: var(--solaris-surface-container-lowest);
      color: var(--solaris-on-surface-variant);
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: var(--solaris-surface-container-low);
      }

      &.active {
        background: var(--solaris-primary);
        color: #ffffff;
        border-color: var(--solaris-primary);
      }
    }

    .structure-type-card {
      display: flex;
      gap: 12px;
      padding: 12px;
      border: 1px solid var(--solaris-outline-variant);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
      background: var(--solaris-surface-container-lowest);

      &:hover {
        background: var(--solaris-surface-container-low);
      }

      &.selected {
        border-color: var(--solaris-primary);
        background: #f0f4ff;

        .struct-check {
          color: var(--solaris-primary);
        }
      }

      .struct-radio-box {
        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
          color: var(--solaris-outline);

          &.checked {
            color: var(--solaris-primary);
          }
        }
      }

      .struct-info {
        display: flex;
        flex-direction: column;
        flex: 1;

        .struct-header-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .struct-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .badge-blue {
          background: #e0f2fe;
          color: #0369a1;
        }

        .badge-amber {
          background: #fef3c7;
          color: #92400e;
        }

        .struct-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--solaris-on-surface);
        }

        .struct-desc {
          font-size: 11px;
          color: var(--solaris-on-surface-variant);
          margin-top: 2px;
          line-height: 1.4;
        }
      }
    }

    .struct-status-box {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      padding: 10px 12px;
      border-radius: 6px;
      font-size: 11px;
      margin-top: 8px;

      .status-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        flex-shrink: 0;
        margin-top: 1px;
      }

      .status-title {
        display: block;
        font-size: 11px;
        font-weight: 700;
        margin-bottom: 2px;
      }

      .status-desc {
        margin: 0;
        line-height: 1.35;
      }
    }

    .status-both {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      color: #0369a1;

      .status-icon {
        color: #0284c7;
      }
    }

    .status-self {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      color: #334155;

      .status-icon {
        color: #475569;
      }
    }

    .status-guyed {
      background: #fffbeb;
      border: 1px solid #fde68a;
      color: #92400e;

      .status-icon {
        color: #d97706;
      }
    }

    .action-card-box {
      background: var(--solaris-surface-container-lowest);
      border-radius: 6px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;

      .submit-large-btn {
        justify-content: center;
        padding: 10px;
      }

      .cancel-btn {
        justify-content: center;
        padding: 10px;
      }

      .audit-hint {
        font-size: 10px;
        text-align: center;
        color: var(--solaris-on-surface-variant);
        margin: 4px 0 0;
      }
    }

    .alert-schedule {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 12px;

      mat-icon {
        color: #b45309;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }
  `,
})
export class OfferFormComponent {
  private readonly api = inject(OffersApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  readonly editId = signal<number | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);

  readonly includeSelfSupporting = signal<boolean>(true);
  readonly includeGuyed = signal<boolean>(true);

  private readonly todayStr = new Date().toISOString().slice(0, 10);

  readonly form = new FormGroup({
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(50)],
    }),
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(200)],
    }),
    clientName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(200)],
    }),
    baseCurrency: new FormControl('BRL', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(10)],
    }),
    // Initial revision fields
    auctionName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(100)],
    }),
    lotName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(100)],
    }),
    offerDate: new FormControl(this.todayStr, {
      nonNullable: true,
      validators: [Validators.pattern(DATE_PATTERN)],
    }),
    auctionDate: new FormControl('', [Validators.pattern(DATE_PATTERN)]),
    scheduleStartDate: new FormControl('', [Validators.pattern(DATE_PATTERN)]),
    commercialOperationDate: new FormControl('', [
      Validators.pattern(DATE_PATTERN),
    ]),
    estimatedCapex: new FormControl('', [
      Validators.pattern(POSITIVE_DECIMAL_PATTERN),
      decimalScaleValidator(2),
    ]),
    maxRap: new FormControl('', [
      Validators.pattern(POSITIVE_DECIMAL_PATTERN),
      decimalScaleValidator(2),
    ]),
    winningRap: new FormControl('', [
      Validators.pattern(POSITIVE_DECIMAL_PATTERN),
      decimalScaleValidator(2),
    ]),
    notes: new FormControl('', [Validators.maxLength(1000)]),
  });

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const parsedId = Number(idParam);
      this.editId.set(parsedId);
      this.loadOffer(parsedId);
    } else {
      // In create mode, auctionName, lotName and offerDate are required
      this.form.controls.auctionName.addValidators(Validators.required);
      this.form.controls.lotName.addValidators(Validators.required);
      this.form.controls.offerDate.addValidators(Validators.required);
      this.form.updateValueAndValidity();
    }
  }

  cancelLink(): string[] {
    const id = this.editId();
    return id ? ['/offers', String(id)] : ['/offers'];
  }

  toggleSelfSupporting(): void {
    if (this.includeSelfSupporting() && !this.includeGuyed()) {
      this.snackBar.open(
        'Selecione pelo menos um tipo de estrutura (Autoportante ou Estaiada).',
        'OK',
        { duration: 3000 },
      );
      return;
    }
    this.includeSelfSupporting.update((v) => !v);
  }

  toggleGuyed(): void {
    if (this.includeGuyed() && !this.includeSelfSupporting()) {
      this.snackBar.open(
        'Selecione pelo menos um tipo de estrutura (Autoportante ou Estaiada).',
        'OK',
        { duration: 3000 },
      );
      return;
    }
    this.includeGuyed.update((v) => !v);
  }

  setStructurePreset(preset: 'BOTH' | 'SELF_SUPPORTING' | 'GUYED'): void {
    if (preset === 'BOTH') {
      this.includeSelfSupporting.set(true);
      this.includeGuyed.set(true);
    } else if (preset === 'SELF_SUPPORTING') {
      this.includeSelfSupporting.set(true);
      this.includeGuyed.set(false);
    } else if (preset === 'GUYED') {
      this.includeSelfSupporting.set(false);
      this.includeGuyed.set(true);
    }
  }

  hasScheduleInconsistency(): boolean {
    const start = this.form.controls.scheduleStartDate.value;
    const end = this.form.controls.commercialOperationDate.value;
    return !!(start && end && start > end);
  }

  errorFor(controlName: string): string | null {
    const c = this.form.get(controlName);
    if (!c || !c.touched || !c.errors) return null;
    if (c.errors['required']) return 'Campo obrigatório';
    if (c.errors['maxlength']) return 'Texto muito longo';
    if (c.errors['pattern']) {
      if (controlName.includes('Date'))
        return 'Data inválida (formato AAAA-MM-DD)';
      return 'Valor decimal inválido (ex.: 1500.00)';
    }
    if (c.errors['decimalScale']) return 'Máximo de 2 casas decimais';
    return 'Valor inválido';
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const raw = this.form.getRawValue();
    const id = this.editId();

    if (id) {
      const payload: UpdateOfferGeneralPayload = {
        name: raw.name.trim(),
        clientName: raw.clientName.trim(),
        baseCurrency: raw.baseCurrency.trim(),
      };
      this.api.updateGeneral(id, payload).subscribe({
        next: (updated) => {
          this.snackBar.open('Dados gerais atualizados com sucesso!', 'OK', {
            duration: 3000,
          });
          this.router.navigate(['/offers', updated.id]);
        },
        error: (err) => {
          this.saving.set(false);
          const msg =
            err.error?.message ||
            'Não foi possível atualizar a proposta. Verifique os campos.';
          this.snackBar.open(msg, 'Fechar', { duration: 5000 });
        },
      });
    } else {
      const payload: CreateOfferPayload = {
        code: raw.code.trim(),
        name: raw.name.trim(),
        clientName: raw.clientName.trim(),
        baseCurrency: raw.baseCurrency.trim(),
        auctionName: raw.auctionName.trim(),
        lotName: raw.lotName.trim(),
        offerDate: raw.offerDate.trim(),
        auctionDate: orNull(raw.auctionDate),
        scheduleStartDate: orNull(raw.scheduleStartDate),
        commercialOperationDate: orNull(raw.commercialOperationDate),
        estimatedCapex: orNull(raw.estimatedCapex),
        maxRap: orNull(raw.maxRap),
        winningRap: orNull(raw.winningRap),
        notes: orNull(raw.notes),
      };

      this.api.create(payload).subscribe({
        next: (created) => {
          this.snackBar.open('Proposta criada com sucesso!', 'OK', {
            duration: 4000,
          });
          this.router.navigate(['/offers', created.id]);
        },
        error: (err) => {
          this.saving.set(false);
          const msg =
            err.error?.message ||
            'Não foi possível criar a proposta. Verifique se o código já existe.';
          this.snackBar.open(msg, 'Fechar', { duration: 5000 });
        },
      });
    }
  }

  private loadOffer(id: number): void {
    this.loading.set(true);
    this.api.getById(id).subscribe({
      next: (detail) => {
        this.form.patchValue({
          code: detail.code,
          name: detail.name,
          clientName: detail.clientName,
          baseCurrency: detail.baseCurrency,
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open(
          'Não foi possível carregar a proposta para edição.',
          'Fechar',
          { duration: 5000 },
        );
        this.router.navigate(['/offers']);
      },
    });
  }
}
