import { Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export interface ConductorCableFormData {
  code?: string;
  description?: string;
  weightTonPerKm?: string | number;
  reelLengthM?: string | number;
  diameterMm?: string | number;
  utsKn?: string | number;
  effectiveFrom?: string;
}

/**
 * Page Object para gestão de catálogos e vigências temporais.
 */
export class CatalogPage extends BasePage {
  /**
   * Navega para a listagem de cabos condutores.
   */
  async gotoConductorCables(): Promise<void> {
    await this.goto('/catalogs/conductor-cables');
  }

  /**
   * Clica no botão de novo cadastro.
   */
  async clickNewConductorCable(): Promise<void> {
    await this.page
      .getByRole('link', { name: /novo cabo condutor/i })
      .first()
      .click();
    await this.waitForLoading();
  }

  /**
   * Preenche os campos do formulário de cabo condutor.
   */
  async fillConductorCableForm(data: ConductorCableFormData): Promise<void> {
    if (data.code !== undefined) {
      await this.page.locator('input#code').fill(data.code);
    }
    if (data.description !== undefined) {
      await this.page.locator('input#description').fill(data.description);
    }
    if (data.weightTonPerKm !== undefined) {
      await this.page
        .locator('input#weightTonPerKm')
        .fill(String(data.weightTonPerKm));
    }
    if (data.reelLengthM !== undefined) {
      await this.page
        .locator('input#reelLengthM')
        .fill(String(data.reelLengthM));
    }
    if (data.diameterMm !== undefined) {
      await this.page.locator('input#diameterMm').fill(String(data.diameterMm));
    }
    if (data.utsKn !== undefined) {
      await this.page.locator('input#utsKn').fill(String(data.utsKn));
    }
    if (data.effectiveFrom !== undefined) {
      await this.page.locator('input#effectiveFrom').fill(data.effectiveFrom);
    }
  }

  /**
   * Submete o formulário clicando em Salvar.
   */
  async submitForm(): Promise<void> {
    await this.page.getByRole('button', { name: /salvar/i }).click();
    await this.waitForLoading();
  }

  /**
   * Localiza a linha da tabela correspondente a um código de item.
   */
  getTableRowByCode(code: string): Locator {
    return this.page.locator('tr').filter({ hasText: code });
  }

  /**
   * Clica no botão Histórico de uma linha.
   */
  async clickHistoryFor(code: string): Promise<void> {
    const row = this.getTableRowByCode(code);
    await row.getByRole('link', { name: /histórico/i }).click();
    await this.waitForLoading();
  }

  /**
   * Clica no botão Editar (para criar nova versão vigente) de uma linha.
   */
  async clickEditFor(code: string): Promise<void> {
    const row = this.getTableRowByCode(code);
    await row.getByRole('link', { name: /editar/i }).click();
    await this.waitForLoading();
  }

  /**
   * Retorna os locators das linhas do histórico.
   */
  getHistoryRows(): Locator {
    return this.page.locator('table mat-row, table tr:has(td)');
  }
}
