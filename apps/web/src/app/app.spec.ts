import { BreakpointObserver } from '@angular/cdk/layout';
import { TestBed } from '@angular/core/testing';
import { MatSidenav } from '@angular/material/sidenav';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { App } from './app';

// Observer mockado: matches = tela larga (>= 1024px)
const observerMock = (matches: boolean) => ({
  observe: () => of({ matches, breakpoints: {} }),
});

async function mount(wide: boolean) {
  await TestBed.configureTestingModule({
    imports: [App],
    providers: [
      provideRouter([
        { path: 'catalogs/guy-wires', children: [] },
        { path: '**', children: [] },
      ]),
      { provide: BreakpointObserver, useValue: observerMock(wide) },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(App);
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

describe('App (casca de navegação)', () => {
  it('exibe o título e um item de navegação por catálogo', async () => {
    const fixture = await mount(true);
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('h1')?.textContent).toContain(
      'Orçamentação de Linhas de Transmissão',
    );
    const items = Array.from(
      el.querySelectorAll('mat-nav-list a [matListItemTitle]'),
    ).map((a) => a.textContent?.trim());
    expect(items).toEqual([
      'Ofertas',
      'Cabos condutores',
      'Cabos de guarda',
      'Cabos de tirante',
      'Isoladores',
      'Séries de estruturas',
      'Tipos de solo',
      'Tipos de fundação',
      'Matriz de volumes',
      'Mão de obra',
      'Equipamentos',
      'Custos fixos',
      'Equipes de trabalho',
    ]);
  });

  it('destaca o item da rota ativa mantendo os demais acessíveis', async () => {
    const fixture = await mount(true);
    await TestBed.inject(Router).navigateByUrl('/catalogs/guy-wires');
    fixture.detectChanges();

    const active = (fixture.nativeElement as HTMLElement).querySelectorAll(
      'a.active-link',
    );
    expect(active).toHaveLength(1);
    expect(active[0].textContent).toContain('Cabos de tirante');
    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll('mat-nav-list a'),
    ).toHaveLength(13);
  });

  it('em tela larga a navegação fica fixa, sem botão de menu', async () => {
    const fixture = await mount(true);
    const sidenav = fixture.debugElement.query(By.directive(MatSidenav))
      .componentInstance as MatSidenav;

    expect(sidenav.mode).toBe('side');
    expect(sidenav.opened).toBe(true);
    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        'button[aria-label="Abrir menu de navegação"]',
      ),
    ).toBeNull();
  });

  it('em tela estreita a navegação inicia oculta e o botão de menu a abre sobreposta', async () => {
    const fixture = await mount(false);
    const sidenav = fixture.debugElement.query(By.directive(MatSidenav))
      .componentInstance as MatSidenav;

    expect(sidenav.mode).toBe('over');
    expect(sidenav.opened).toBe(false);

    const button = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Abrir menu de navegação"]',
    ) as HTMLButtonElement;
    expect(button).not.toBeNull();
    button.click();
    fixture.detectChanges();

    expect(sidenav.opened).toBe(true);
  });

  it('em tela estreita o menu fecha após navegar por um item', async () => {
    const fixture = await mount(false);
    const el = fixture.nativeElement as HTMLElement;
    (
      el.querySelector(
        'button[aria-label="Abrir menu de navegação"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    const link = el.querySelector('mat-nav-list a') as HTMLAnchorElement;
    link.click();
    fixture.detectChanges();

    const sidenav = fixture.debugElement.query(By.directive(MatSidenav))
      .componentInstance as MatSidenav;
    expect(sidenav.opened).toBe(false);
  });
});
