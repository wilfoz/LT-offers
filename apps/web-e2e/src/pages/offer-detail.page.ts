import { Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Page Object para a página de detalhes da proposta técnica (`OfferDetailComponent`).
 * Encapsula o seletor de revisões, as 17 abas de engenharia/orçamentação,
 * a matriz de escopo e os comandos de congelamento/governança.
 */
export class OfferDetailPage extends BasePage {
  /**
   * Navega diretamente para a página de detalhes de uma proposta técnica.
   */
  async gotoOffer(offerId: number | string): Promise<void> {
    await this.goto(`/offers/${offerId}`);
  }

  /**
   * Clica em uma das abas do projeto pelo nome/texto.
   */
  async selectTab(tabLabel: string | RegExp): Promise<void> {
    await this.page.getByRole('tab', { name: tabLabel }).click();
    await this.waitForLoading();
  }

  /**
   * Seleciona uma revisão específica clicando na pílula correspondente (R0, R1, etc.).
   */
  async selectRevisionPill(revisionNumber: number): Promise<void> {
    await this.page
      .locator('.rev-pill')
      .filter({ hasText: `R${revisionNumber}` })
      .click();
    await this.waitForLoading();
  }

  /**
   * Aciona o botão de congelar/fechar revisão.
   */
  async freezeRevision(): Promise<void> {
    await this.page.getByRole('button', { name: /fechar revisão/i }).click();
    await this.waitForLoading();
  }

  /**
   * Aciona o botão de criar nova revisão.
   */
  async createNewRevision(): Promise<void> {
    await this.page.getByRole('button', { name: /nova revisão/i }).click();
    await this.waitForLoading();
  }

  /**
   * Aciona o botão de marcar como entregue.
   */
  async markDelivered(): Promise<void> {
    await this.page
      .getByRole('button', { name: /marcar como entregue/i })
      .click();
    await this.waitForLoading();
  }

  /**
   * Carrega os itens canônicos de escopo na aba Matriz de Escopo.
   */
  async loadBenchmarkScope(): Promise<void> {
    await this.selectTab(/matriz de escopo/i);
    const loadBtn = this.page.getByRole('button', {
      name: /carregar itens canônicos/i,
    });
    if (await loadBtn.isVisible()) {
      await loadBtn.click();
      await this.waitForLoading();
    }
  }

  /**
   * Salva alterações de parâmetros ou escopo da revisão.
   */
  async saveScopeOrParameters(): Promise<void> {
    const saveBtn = this.page.getByRole('button', { name: /salvar/i }).first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await this.waitForLoading();
    }
  }

  /**
   * Retorna o badge de integridade e saúde da oferta.
   */
  getHealthBadge(): Locator {
    return this.page.locator('.health-badge-btn');
  }

  /**
   * Retorna o banner visual de revisão imutável/congelada.
   */
  getImmutableBanner(): Locator {
    return this.page.locator('.immutable-banner');
  }

  /**
   * Retorna o chip de status da revisão atual.
   */
  getStatusChip(): Locator {
    return this.page.locator('.status-chip');
  }
}
