import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-tower-foundation-schematic',
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
  template: `
    <div class="schematics-grid">
      <!-- 1. Planta de Locação Centro das Cavas -->
      <div class="schematic-card technical-border">
        <div class="schematic-header">
          <span class="font-label-caps">Planta de Locação Centro das Cavas</span>
          <span class="badge badge-analysis">Marco Central: 0.00</span>
        </div>
        <div class="svg-canvas-wrapper technical-grid">
          <svg class="schematic-svg" viewBox="0 0 400 400" aria-label="Planta de locação das pernas da torre">
            <!-- Grid crosshairs -->
            <line x1="200" y1="20" x2="200" y2="380" stroke="#737784" stroke-dasharray="4" stroke-width="1"></line>
            <line x1="20" y1="200" x2="380" y2="200" stroke="#737784" stroke-dasharray="4" stroke-width="1"></line>
            
            <!-- Diagonal structural lines -->
            <line x1="80" y1="80" x2="320" y2="320" stroke="#c3c6d5" stroke-dasharray="2" stroke-width="1.5"></line>
            <line x1="320" y1="80" x2="80" y2="320" stroke="#c3c6d5" stroke-dasharray="2" stroke-width="1.5"></line>
            
            <!-- Perimeter Box -->
            <rect x="80" y="80" width="240" height="240" fill="none" stroke="#094cb2" stroke-width="2"></rect>
            
            <!-- Center MC Marker -->
            <circle cx="200" cy="200" r="14" fill="#ffffff" stroke="#094cb2" stroke-width="2"></circle>
            <text x="200" y="204" font-family="Inter" font-size="9" font-weight="bold" fill="#094cb2" text-anchor="middle">MC</text>
            
            <!-- Foot A (Top Left) -->
            <rect x="65" y="65" width="30" height="30" fill="#ffffff" stroke="#1b1c1d" stroke-width="2" transform="rotate(45 80 80)"></rect>
            <circle cx="80" cy="80" r="3" fill="#ba1a1a"></circle>
            <text x="50" y="55" font-family="Public Sans" font-size="12" font-weight="bold" fill="#094cb2">PÉ A</text>
            
            <!-- Foot B (Top Right) -->
            <rect x="305" y="65" width="30" height="30" fill="#ffffff" stroke="#1b1c1d" stroke-width="2" transform="rotate(45 320 80)"></rect>
            <circle cx="320" cy="80" r="3" fill="#ba1a1a"></circle>
            <text x="330" y="55" font-family="Public Sans" font-size="12" font-weight="bold" fill="#094cb2">PÉ B</text>
            
            <!-- Foot C (Bottom Right) -->
            <rect x="305" y="305" width="30" height="30" fill="#ffffff" stroke="#1b1c1d" stroke-width="2" transform="rotate(45 320 320)"></rect>
            <circle cx="320" cy="320" r="3" fill="#ba1a1a"></circle>
            <text x="330" y="355" font-family="Public Sans" font-size="12" font-weight="bold" fill="#094cb2">PÉ C</text>
            
            <!-- Foot D (Bottom Left) -->
            <rect x="65" y="305" width="30" height="30" fill="#ffffff" stroke="#1b1c1d" stroke-width="2" transform="rotate(45 80 320)"></rect>
            <circle cx="80" cy="320" r="3" fill="#ba1a1a"></circle>
            <text x="50" y="355" font-family="Public Sans" font-size="12" font-weight="bold" fill="#094cb2">PÉ D</text>
            
            <!-- Dimension callouts -->
            <rect x="110" y="130" width="50" height="18" fill="#ffffff" stroke="#c3c6d5" rx="3"></rect>
            <text x="135" y="143" font-family="Inter" font-size="10" font-weight="bold" fill="#434653" text-anchor="middle">6.691m</text>
            
            <rect x="240" y="130" width="50" height="18" fill="#ffffff" stroke="#c3c6d5" rx="3"></rect>
            <text x="265" y="143" font-family="Inter" font-size="10" font-weight="bold" fill="#434653" text-anchor="middle">6.683m</text>
            
            <text x="200" y="70" font-family="Inter" font-size="10" font-weight="bold" fill="#094cb2" text-anchor="middle">Lado AB = 9.457m</text>
            <text x="200" y="335" font-family="Inter" font-size="10" font-weight="bold" fill="#094cb2" text-anchor="middle">Lado CD = 9.455m</text>
          </svg>
        </div>
      </div>

      <!-- 2. Vista Lateral Técnica (Fundação) -->
      <div class="schematic-card technical-border">
        <div class="schematic-header">
          <span class="font-label-caps">Vista Lateral Técnica (Fundação)</span>
          <span class="badge badge-valid">Detalhe HC / L</span>
        </div>
        <div class="svg-canvas-wrapper technical-grid">
          <svg class="schematic-svg" viewBox="0 0 400 320" aria-label="Corte transversal de fundação">
            <!-- Ground Line -->
            <line x1="30" y1="80" x2="370" y2="80" stroke="#1b1c1d" stroke-width="2"></line>
            <!-- Ground hatching -->
            <line x1="40" y1="80" x2="30" y2="95" stroke="#737784" stroke-width="1"></line>
            <line x1="70" y1="80" x2="60" y2="95" stroke="#737784" stroke-width="1"></line>
            <line x1="100" y1="80" x2="90" y2="95" stroke="#737784" stroke-width="1"></line>
            <line x1="300" y1="80" x2="290" y2="95" stroke="#737784" stroke-width="1"></line>
            <line x1="330" y1="80" x2="320" y2="95" stroke="#737784" stroke-width="1"></line>
            <line x1="360" y1="80" x2="350" y2="95" stroke="#737784" stroke-width="1"></line>

            <!-- Foundation Pillar Body -->
            <rect x="170" y="60" width="60" height="150" fill="#e3e2e3" stroke="#434653" stroke-width="1.5"></rect>
            
            <!-- Concrete Footing Base -->
            <polygon points="140,210 260,210 280,260 120,260" fill="#cbd5e1" stroke="#434653" stroke-width="1.5"></polygon>
            <rect x="120" y="260" width="160" height="30" fill="#b1c5ff" stroke="#094cb2" stroke-width="1.5"></rect>

            <!-- Stub Inset -->
            <line x1="200" y1="40" x2="200" y2="180" stroke="#ba1a1a" stroke-width="3"></line>
            <circle cx="200" cy="40" r="5" fill="#ffffff" stroke="#ba1a1a" stroke-width="2"></circle>

            <!-- Technical Dimension Lines -->
            <g stroke="#ba1a1a" stroke-width="1">
              <!-- HC -->
              <line x1="90" y1="80" x2="90" y2="290"></line>
              <line x1="85" y1="80" x2="95" y2="80"></line>
              <line x1="85" y1="290" x2="95" y2="290"></line>

              <!-- Base L -->
              <line x1="120" y1="305" x2="280" y2="305"></line>
              <line x1="120" y1="300" x2="120" y2="310"></line>
              <line x1="280" y1="300" x2="280" y2="310"></line>
            </g>

            <!-- Text Labels -->
            <text x="75" y="185" font-family="Inter" font-size="11" font-weight="bold" fill="#ba1a1a">HC</text>
            <text x="200" y="318" font-family="Inter" font-size="10" font-weight="bold" fill="#ba1a1a" text-anchor="middle">Base L x B</text>
            <text x="240" y="140" font-family="Inter" font-size="10" font-weight="bold" fill="#094cb2">Fuste (Dc/Ds)</text>
            <text x="200" y="30" font-family="Public Sans" font-size="10" font-weight="bold" fill="#ba1a1a" text-anchor="middle">Topo do Stub</text>
          </svg>
        </div>
      </div>

      <!-- 3. Detalhe Gabarito Inclinado -->
      <div class="schematic-card technical-border">
        <div class="schematic-header">
          <span class="font-label-caps">Detalhe Gabarito Inclinado</span>
          <span class="badge badge-pending">Tg. Diag: 0,19988</span>
        </div>
        <div class="svg-canvas-wrapper technical-grid">
          <svg class="schematic-svg" viewBox="0 0 400 240" aria-label="Diagrama do gabarito inclinado">
            <!-- Triangle -->
            <path d="M 80 190 L 320 190 L 320 40 Z" fill="#edf0ff" stroke="#094cb2" stroke-width="2"></path>
            <!-- Right angle marker -->
            <rect x="300" y="170" width="20" height="20" fill="none" stroke="#094cb2" stroke-width="1"></rect>

            <!-- Dimension callouts -->
            <text x="200" y="210" font-family="Inter" font-size="12" font-weight="bold" fill="#094cb2" text-anchor="middle">50.000</text>
            <text x="335" y="120" font-family="Inter" font-size="12" font-weight="bold" fill="#094cb2">9,994</text>
            <text x="180" y="110" font-family="Inter" font-size="11" font-style="italic" fill="#6d5e00">Ângulo Inclinado (11.3°)</text>
          </svg>
        </div>
      </div>
    </div>
  `,
  styles: `
    .schematics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }

    .schematic-card {
      background: var(--solaris-surface-container-lowest);
      border-radius: 6px;
      overflow: hidden;
      box-shadow: var(--mat-sys-level1);
      display: flex;
      flex-direction: column;
    }

    .schematic-header {
      padding: 8px 14px;
      background: var(--solaris-surface-container-low);
      border-bottom: 1px solid var(--solaris-outline-variant);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .svg-canvas-wrapper {
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 240px;
    }

    .schematic-svg {
      width: 100%;
      max-height: 280px;
    }
  `,
})
export class TowerFoundationSchematicComponent {
  readonly towerType = input<string>('JJAT-T-10');
}
