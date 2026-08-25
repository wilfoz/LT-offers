import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { map } from 'rxjs';

// Casca da aplicação (spec interface/casca-navegacao, design D2): toolbar
// fina + navegação lateral fixa em telas largas e sobreposta nas estreitas.
@Component({
  imports: [
    RouterModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
  ],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'Orçamentação de Linhas de Transmissão';

  private readonly breakpoints = inject(BreakpointObserver);

  // Sidenav fixa (side) a partir de 1024px; sobreposta (over) abaixo
  protected readonly wide = toSignal(
    this.breakpoints
      .observe('(min-width: 1024px)')
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );

  // Estado do menu no modo sobreposto (telas estreitas)
  protected readonly menuOpen = signal(false);

  protected readonly links = [
    { path: '/catalogs/conductor-cables', label: 'Cabos condutores' },
    { path: '/catalogs/ground-wires', label: 'Cabos de guarda' },
    { path: '/catalogs/guy-wires', label: 'Cabos de tirante' },
    { path: '/catalogs/insulators', label: 'Isoladores' },
    { path: '/catalogs/structure-series', label: 'Séries de estruturas' },
  ];

  protected toggleMenu(): void {
    this.menuOpen.set(!this.menuOpen());
  }

  // No modo sobreposto o menu fecha após navegar; no fixo permanece aberto
  protected closeAfterNavigate(): void {
    if (!this.wide()) {
      this.menuOpen.set(false);
    }
  }
}
