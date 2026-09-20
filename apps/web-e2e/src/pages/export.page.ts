import { Locator, expect, Download } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Page Object para a Central de Exportações Contratuais (`OfferExportComponent`).
 */
export class ExportPage extends BasePage {
  /**
   * Dispara o download da Planilha de Preços do Edital (.xlsx) e intercepta o evento de download.
   */
  async triggerTenderSheetDownload(): Promise<Download> {
    const downloadPromise = this.page.waitForEvent('download');
    await this.page
      .getByRole('button', { name: /baixar planilha do edital/i })
      .click();
    return downloadPromise;
  }

  /**
   * Dispara o download da Folha de Medição Contratual e PUs (.xlsx).
   */
  async triggerMeasurementSheetDownload(): Promise<Download> {
    const downloadPromise = this.page.waitForEvent('download');
    await this.page
      .getByRole('button', { name: /baixar folha de medição/i })
      .click();
    return downloadPromise;
  }

  /**
   * Dispara o download do Fluxo de Caixa e Curva S (.xlsx).
   */
  async triggerCashflowDownload(): Promise<Download> {
    const downloadPromise = this.page.waitForEvent('download');
    await this.page
      .getByRole('button', { name: /baixar fluxo de caixa/i })
      .click();
    return downloadPromise;
  }

  /**
   * Dispara o download do Pacote Aberto JSON.
   */
  async triggerOpenPackageDownload(): Promise<Download> {
    const downloadPromise = this.page.waitForEvent('download');
    await this.page
      .getByRole('button', { name: /baixar pacote aberto json/i })
      .click();
    return downloadPromise;
  }

  /**
   * Altera o layout de edital selecionado (ex.: Padrão ANEEL, Celeo, Genérico).
   */
  async selectLayout(layoutName: string): Promise<void> {
    await this.page.locator('mat-select').first().click();
    await this.page
      .getByRole('option', { name: new RegExp(layoutName, 'i') })
      .click();
  }

  /**
   * Retorna os cards de indicadores sintéticos de benchmarking (RF-49).
   */
  getBenchmarkingKpiCards(): Locator {
    return this.page.locator('.benchmarking-card .kpi-card');
  }
}
