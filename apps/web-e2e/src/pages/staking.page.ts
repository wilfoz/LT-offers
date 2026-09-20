import { Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Page Object para a aba de Estaqueamento & Torres (`StakingTableComponent`).
 */
export class StakingPage extends BasePage {
  /**
   * Clica no botão de Importar PLS-CADD.
   */
  async openPlsCaddImportDialog(): Promise<void> {
    await this.page.getByRole('button', { name: /importar pls-cadd/i }).click();
    await this.waitForLoading();
  }

  /**
   * Alterna a visualização da distribuição preliminar paramétrica.
   */
  async togglePreliminaryMode(): Promise<void> {
    await this.page
      .getByRole('button', {
        name: /distribuição paramétrica|ocultar distribuição/i,
      })
      .click();
    await this.waitForLoading();
  }

  /**
   * Filtra estruturas por termo de busca no input.
   */
  async searchTower(query: string): Promise<void> {
    const input = this.page.locator('.search-input input');
    await input.fill(query);
    await this.waitForLoading();
  }

  /**
   * Retorna os locators das linhas da tabela de estaqueamento.
   */
  getStakingRows(): Locator {
    return this.page.locator('.staking-table tbody tr, table mat-row');
  }

  /**
   * Retorna os cards de KPI de estaqueamento.
   */
  getKpiCards(): Locator {
    return this.page.locator('.metrics-grid .kpi-card');
  }

  /**
   * Retorna o banner de alertas de consistência e integridade (RN-13).
   */
  getIntegrityAlert(): Locator {
    return this.page.locator('.integrity-alert');
  }
}
