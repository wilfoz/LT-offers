import { Page, Locator, expect } from '@playwright/test';

/**
 * Classe base do padrão Page Object Model (POM).
 * Fornece métodos utilitários compartilhados de navegação, tratamento de snackbar e espera de carregamento.
 */
export class BasePage {
  constructor(protected readonly page: Page) {}

  /**
   * Navega para uma rota relativa da aplicação.
   */
  async goto(path = ''): Promise<void> {
    await this.page.goto(path);
    await this.waitForLoading();
  }

  /**
   * Aguarda a finalização de animações e indicadores de progresso do Angular Material.
   */
  async waitForLoading(): Promise<void> {
    const progressBar = this.page.locator('mat-progress-bar, .loading-state');
    if (
      await progressBar
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await progressBar
        .first()
        .waitFor({ state: 'detached', timeout: 8000 })
        .catch(() => {
          // Tolerância caso o indicador tenha fechado rapidamente
        });
    }
  }

  /**
   * Obtém o texto exibido no snackbar de notificação do Angular Material.
   */
  async getSnackbarText(): Promise<string> {
    const snackbar = this.page.locator(
      '.mat-mdc-snack-bar-label, mat-snack-bar-container, .cdk-overlay-container',
    );
    await snackbar.first().waitFor({ state: 'visible', timeout: 5000 });
    return (await snackbar.first().textContent()) ?? '';
  }

  /**
   * Valida se uma notificação de sucesso ou erro é exibida com o texto esperado.
   */
  async expectSnackbar(expectedText: string): Promise<void> {
    const snackbar = this.page.locator(
      '.mat-mdc-snack-bar-label, mat-snack-bar-container, .cdk-overlay-container',
    );
    await expect(snackbar.first()).toContainText(expectedText, {
      timeout: 7000,
    });
  }

  /**
   * Helper para interceptação e mock de endpoints REST.
   */
  async mockJson(
    urlPattern: string | RegExp,
    data: unknown,
    status = 200,
  ): Promise<void> {
    await this.page.route(urlPattern, async (route) => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(data),
      });
    });
  }
}
