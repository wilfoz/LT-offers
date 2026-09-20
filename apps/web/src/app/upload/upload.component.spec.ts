import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { UploadComponent } from './upload.component';

describe('UploadComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renderiza o cabeçalho de Gestão de Documentos e a dropzone', () => {
    const fixture = TestBed.createComponent(UploadComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.page-title')?.textContent).toContain(
      'Gestão de Documentos',
    );
    expect(el.textContent).toContain('Arraste arquivos aqui');
    expect(el.textContent).toContain('Fila de Processamento Analítico');
  });

  it('permite remover um arquivo da lista de anexados', () => {
    const fixture = TestBed.createComponent(UploadComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.attachedFiles().length).toBe(4);
    component.removeFile('1');
    fixture.detectChanges();
    expect(component.attachedFiles().length).toBe(3);
  });
});
