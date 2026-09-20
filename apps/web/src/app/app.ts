import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth/auth.service';
import { UserProfile, UserRole } from '@lt-offers/domain';

// Casca da aplicação OFERTA Engineering System (Alexandria Design System)
// Barra superior com seletor de projeto e busca + Sidebar técnica com logo OFERTA
@Component({
  imports: [
    RouterModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'Orçamentação de Linhas de Transmissão';
  protected brandName = 'OFERTA';
  protected brandSubtitle = 'Linha de transmissão';
  protected technicalMode = signal(false);

  private readonly breakpoints = inject(BreakpointObserver);
  readonly authService = inject(AuthService);

  // Sidenav fixa (side) a partir de 1024px; sobreposta (over) abaixo
  protected readonly wide = toSignal(
    this.breakpoints
      .observe('(min-width: 1024px)')
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );

  // Estado do menu no modo sobreposto (telas estreitas)
  protected readonly menuOpen = signal(false);

  protected readonly systemLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/upload', label: 'Upload & OCR', icon: 'cloud_upload' },
  ];

  protected readonly links = [
    { path: '/offers', label: 'Ofertas', icon: 'topic' },
    {
      path: '/catalogs/conductor-cables',
      label: 'Cabos condutores',
      icon: 'cable',
    },
    {
      path: '/catalogs/ground-wires',
      label: 'Cabos de guarda',
      icon: 'shield',
    },
    {
      path: '/catalogs/guy-wires',
      label: 'Cabos de tirante',
      icon: 'line_weight',
    },
    { path: '/catalogs/insulators', label: 'Isoladores', icon: 'bolt' },
    {
      path: '/catalogs/structure-series',
      label: 'Séries de estruturas',
      icon: 'cell_tower',
    },
    { path: '/catalogs/soil-types', label: 'Tipos de solo', icon: 'terrain' },
    {
      path: '/catalogs/foundation-types',
      label: 'Tipos de fundação',
      icon: 'foundation',
    },
    {
      path: '/catalogs/foundation-volumes',
      label: 'Matriz de volumes',
      icon: 'view_in_ar',
    },
    {
      path: '/catalogs/labor-roles',
      label: 'Mão de obra',
      icon: 'engineering',
    },
    {
      path: '/catalogs/equipment',
      label: 'Equipamentos',
      icon: 'precision_manufacturing',
    },
    {
      path: '/catalogs/fixed-costs',
      label: 'Custos fixos',
      icon: 'receipt_long',
    },
    {
      path: '/catalogs/work-crews',
      label: 'Equipes de trabalho',
      icon: 'groups',
    },
  ];

  protected toggleMenu(): void {
    this.menuOpen.set(!this.menuOpen());
  }

  protected toggleTechnicalMode(): void {
    this.technicalMode.set(!this.technicalMode());
  }

  // No modo sobreposto o menu fecha após navegar; no fixo permanece aberto
  protected closeAfterNavigate(): void {
    if (!this.wide()) {
      this.menuOpen.set(false);
    }
  }

  protected selectUser(user: UserProfile): void {
    this.authService.switchUser(user);
  }
}
