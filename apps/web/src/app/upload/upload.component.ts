import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface UploadedFileItem {
  id: string;
  name: string;
  type: string;
  size: string;
  icon: string;
}

export interface ProcessingQueueItem {
  id: string;
  filename: string;
  tag: string;
  tower: string;
  progress: number;
  statusText: string;
  statusType: 'success' | 'warning' | 'info' | 'pending';
  lastUpdate: string;
}

@Component({
  selector: 'app-upload',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.scss',
})
export class UploadComponent {
  private readonly snackBar = inject(MatSnackBar);

  readonly isDragging = signal(false);
  readonly isProcessing = signal(false);

  readonly attachedFiles = signal<UploadedFileItem[]>([
    {
      id: '1',
      name: 'Projeto_Fundacao_12A.pdf',
      type: 'Stub',
      size: '2.4 MB',
      icon: 'description',
    },
    {
      id: '2',
      name: 'Cargas_Torre_Estaiada.xlsx',
      type: 'Planilha',
      size: '850 KB',
      icon: 'grid_on',
    },
    {
      id: '3',
      name: 'Locacao_Base_12A.pdf',
      type: 'Locação',
      size: '1.1 MB',
      icon: 'description',
    },
    {
      id: '4',
      name: 'Detalhamento_Armadura_05.pdf',
      type: 'Fundação',
      size: '4.2 MB',
      icon: 'description',
    },
  ]);

  readonly processingQueue = signal<ProcessingQueueItem[]>([
    {
      id: '1',
      filename: 'Projeto_Fundacao_12A.pdf',
      tag: 'Stub',
      tower: '12/A',
      progress: 100,
      statusText: 'Persistido no Banco',
      statusType: 'success',
      lastUpdate: 'Hoje, 10:42',
    },
    {
      id: '2',
      filename: 'Cargas_Torre_Estaiada.xlsx',
      tag: 'Planilha',
      tower: 'EST-01',
      progress: 65,
      statusText: 'Em Validação de Regras',
      statusType: 'warning',
      lastUpdate: 'Hoje, 10:45',
    },
    {
      id: '3',
      filename: 'Locacao_Base_12A.pdf',
      tag: 'Locação',
      tower: '12/A',
      progress: 30,
      statusText: 'Extraindo OCR',
      statusType: 'info',
      lastUpdate: 'Hoje, 10:47',
    },
    {
      id: '4',
      filename: 'Detalhamento_Armadura_05.pdf',
      tag: 'Fundação',
      tower: '-',
      progress: 0,
      statusText: 'Aguardando na Fila',
      statusType: 'pending',
      lastUpdate: 'Hoje, 10:47',
    },
  ]);

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(): void {
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const files = Array.from(event.dataTransfer.files);
      const newItems: UploadedFileItem[] = files.map((f, i) => ({
        id: `drop-${Date.now()}-${i}`,
        name: f.name,
        type: f.name.endsWith('.xlsx') ? 'Planilha' : 'Documento',
        size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
        icon: f.name.endsWith('.xlsx') ? 'grid_on' : 'description',
      }));
      this.attachedFiles.update((curr) => [...curr, ...newItems]);
      this.snackBar.open(
        `${files.length} arquivo(s) adicionado(s) à fila.`,
        'OK',
        {
          duration: 3000,
        },
      );
    }
  }

  removeFile(id: string): void {
    this.attachedFiles.update((files) => files.filter((f) => f.id !== id));
    this.snackBar.open('Arquivo removido da lista.', 'OK', { duration: 2000 });
  }

  startProcessing(): void {
    this.isProcessing.set(true);
    this.snackBar.open('Iniciando processamento analítico do lote...', '', {
      duration: 2500,
    });
    setTimeout(() => {
      this.processingQueue.update((items) =>
        items.map((it) => ({
          ...it,
          progress: 100,
          statusText: 'Persistido no Banco',
          statusType: 'success',
        })),
      );
      this.isProcessing.set(false);
      this.snackBar.open('Processamento concluído com sucesso!', 'OK', {
        duration: 4000,
      });
    }, 2000);
  }

  clearQueue(): void {
    this.attachedFiles.set([]);
    this.snackBar.open('Fila limpa.', 'OK', { duration: 2000 });
  }
}
