import { CommonModule } from '@angular/common';
import {
  Component,
  AfterViewInit,
  ChangeDetectorRef,
  ElementRef,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// API Response types matching backend
interface TableInfo {
  name: string;
  rowCount: number;
  columns: string[];
}

interface ConvertSuccessData {
  fileName: string;
  fileSize: number;
  tableCount: number;
  totalRows: number;
  tables: TableInfo[];
  content: Record<string, unknown[]>;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: string;
  } | null;
  meta: {
    timestamp: string;
    processingTimeMs: number;
  };
}

interface ResultStats {
  fileName: string;
  fileSize: number;
  tableCount: number;
  totalRows: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements AfterViewInit {
  @ViewChildren('parallaxLayer') private parallaxLayers!: QueryList<
    ElementRef<HTMLElement>
  >;
  @ViewChildren('reveal') private revealBlocks!: QueryList<
    ElementRef<HTMLElement>
  >;
  @ViewChild('heroTitle') private heroTitle?: ElementRef<HTMLElement>;

  // API Configuration - Update this to your backend URL
  private readonly API_BASE_URL =
    'https://sqliteconverter-990390454828.europe-west1.run.app';

  // private readonly API_BASE_URL = 'http://localhost:3456' for testing purposes
  // UI State
  protected isBusy = false;
  protected isDragging = false;
  protected status: 'idle' | 'success' | 'error' = 'idle';
  protected durationMs = 0;
  protected prettyPrint = true;
  protected copied = false;

  // File State
  protected selectedFile: File | null = null;
  protected selectedFileName = '';

  // Result State
  protected conversionResult: ConvertSuccessData | null = null;
  protected resultStats: ResultStats | null = null;
  protected previewOutput = '';
  protected errorMessage = '';

  constructor(private cdr: ChangeDetectorRef) {}

  // File Handling
  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.setFile(input.files[0]);
    }
  }

  protected handleDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  protected handleDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  protected handleDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const droppedFile = event.dataTransfer?.files?.item(0);
    if (droppedFile) {
      this.setFile(droppedFile);
    }
  }

  private setFile(file: File): void {
    this.selectedFile = file;
    this.selectedFileName = file.name;
    // Reset previous results when new file is selected
    this.conversionResult = null;
    this.resultStats = null;
    this.previewOutput = '';
    this.status = 'idle';
    this.cdr.markForCheck();
  }

  // Navigation
  protected scrollToWorkspace(): void {
    const target = document.getElementById('workspace');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Conversion
  protected async runConversion(event: Event): Promise<void> {
    event.preventDefault();

    if (this.isBusy || !this.selectedFile) {
      return;
    }

    this.isBusy = true;
    this.status = 'idle';
    this.errorMessage = '';
    this.cdr.markForCheck();

    const startedAt = performance.now();

    try {
      const result = await this.executeConversion();
      this.durationMs = Math.round(performance.now() - startedAt);

      if (result.success && result.data) {
        this.conversionResult = result.data;
        this.resultStats = {
          fileName: result.data.fileName,
          fileSize: result.data.fileSize,
          tableCount: result.data.tableCount,
          totalRows: result.data.totalRows,
        };
        this.previewOutput = this.formatOutput(result.data);
        this.status = 'success';
      } else {
        this.status = 'error';
        this.errorMessage =
          result.error?.message || 'Conversion failed. Please try again.';
        this.conversionResult = {} as ConvertSuccessData; // Set to show error UI
      }
    } catch (error) {
      this.durationMs = Math.round(performance.now() - startedAt);
      this.status = 'error';
      this.errorMessage =
        (error as Error).message || 'Failed to connect to the server.';
      this.conversionResult = {} as ConvertSuccessData; // Set to show error UI
    } finally {
      this.isBusy = false;
      this.cdr.markForCheck();
    }
  }

  private async executeConversion(): Promise<ApiResponse<ConvertSuccessData>> {
    const formData = new FormData();
    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    }

    const response = await fetch(`${this.API_BASE_URL}/convert`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    return data as ApiResponse<ConvertSuccessData>;
  }

  private formatOutput(data: ConvertSuccessData): string {
    const output = {
      fileName: data.fileName,
      fileSize: data.fileSize,
      tableCount: data.tableCount,
      totalRows: data.totalRows,
      tables: data.tables,
      content: data.content,
    };

    return JSON.stringify(output, null, this.prettyPrint ? 2 : 0);
  }

  // Output Actions
  protected togglePrettyPrint(): void {
    this.prettyPrint = !this.prettyPrint;
    if (this.conversionResult && this.status === 'success') {
      this.previewOutput = this.formatOutput(this.conversionResult);
    }
    this.cdr.markForCheck();
  }

  protected async copyToClipboard(): Promise<void> {
    if (!this.previewOutput) return;

    try {
      await navigator.clipboard.writeText(this.previewOutput);
      this.copied = true;
      this.cdr.markForCheck();

      setTimeout(() => {
        this.copied = false;
        this.cdr.markForCheck();
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  protected downloadJson(): void {
    if (!this.previewOutput) return;

    const blob = new Blob([this.previewOutput], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download =
      this.selectedFileName?.replace(/\.(sqlite|db)$/i, '') + '.json' ||
      'converted.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Utility
  protected formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // GSAP Animations
  ngAfterViewInit(): void {
    gsap.registerPlugin(ScrollTrigger);

    if (this.heroTitle?.nativeElement) {
      gsap.from(this.heroTitle.nativeElement, {
        opacity: 0,
        y: 30,
        duration: 0.9,
        ease: 'power2.out',
      });
    }

    if (this.revealBlocks) {
      this.revealBlocks.forEach((block, index) => {
        gsap.from(block.nativeElement, {
          opacity: 0,
          y: 36,
          duration: 0.9,
          delay: index * 0.05,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: block.nativeElement,
            start: 'top 85%',
          },
        });
      });
    }

    if (this.parallaxLayers) {
      this.parallaxLayers.forEach((layer) => {
        const depth = Number(layer.nativeElement.dataset['depth'] ?? 12);
        gsap.to(layer.nativeElement, {
          yPercent: -depth,
          ease: 'none',
          scrollTrigger: {
            trigger: '#page',
            start: 'top top',
            scrub: true,
          },
        });
      });
    }
  }
}
