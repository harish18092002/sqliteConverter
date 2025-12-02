import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, ChangeDetectionStrategy, ElementRef, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

type ConversionFormat = 'json' | 'csv' | 'sql' | 'ndjson';

interface FormatOption {
  value: ConversionFormat;
  label: string;
  description: string;
  accent: string;
}

interface HighlightCard {
  title: string;
  detail: string;
  badge: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App implements AfterViewInit {
  @ViewChildren('parallaxLayer') private parallaxLayers!: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('reveal') private revealBlocks!: QueryList<ElementRef<HTMLElement>>;
  @ViewChild('heroTitle') private heroTitle?: ElementRef<HTMLElement>;

  protected baseUrl = 'https://api.yourdomain.com';
  protected convertRoute = '/convert';
  protected healthRoute = '/health';
  protected selectedTable = 'main';
  protected selectedFormat: ConversionFormat = 'json';
  protected includeSchema = true;
  protected wrapInTransaction = true;
  protected prettyPrint = true;
  protected batchSize = 500;
  protected liveMode = false;
  protected isBusy = false;
  protected status: 'idle' | 'success' | 'error' | 'live' = 'idle';
  protected statusMessage = 'Ready to preview without hitting your API.';
  protected durationMs = 0;
  protected selectedFileName = 'Drop a .sqlite file or pick one below';
  protected previewOutput = this.buildPreview(this.selectedFormat);
  protected lastUpdated: string | null = null;

  protected readonly formatOptions: FormatOption[] = [
    { value: 'json', label: 'JSON', description: 'Structured JSON payload', accent: 'from-emerald-400 to-teal-500' },
    { value: 'csv', label: 'CSV', description: 'Spreadsheet friendly', accent: 'from-sky-400 to-cyan-400' },
    { value: 'sql', label: 'SQL', description: 'Schema + insert script', accent: 'from-indigo-400 to-blue-500' },
    { value: 'ndjson', label: 'NDJSON', description: 'Streaming friendly lines', accent: 'from-amber-400 to-orange-500' }
  ];

  protected readonly highlightCards: HighlightCard[] = [
    { title: 'Route-first UI', detail: 'Bring your own REST routes; buttons map to your existing endpoints.', badge: 'Backend ready' },
    { title: 'GSAP motion', detail: 'Modern parallax hero, scroll reveals, and floating badges to keep the page lively.', badge: 'Motion tuned' },
    { title: 'Dark clarity', detail: 'Tailwind-styled glass panels tuned for focus in low-light dashboards.', badge: 'Dark mode' }
  ];

  protected readonly workflowSteps = [
    'Drop a SQLite file or point to an S3 URL your backend knows how to fetch.',
    'Pick an output shape: JSON for APIs, CSV for spreadsheets, SQL for migrations, NDJSON for streams.',
    'Tune schema export, batching, and transaction wrapping to match your route expectations.',
    'Send a live request to your backend when you are ready—or stay in preview mode for UI-only testing.'
  ];

  private selectedFile?: File;

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      this.selectedFileName = this.selectedFile.name;
    }
  }

  protected handleDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  protected handleDrop(event: DragEvent): void {
    event.preventDefault();
    const droppedFile = event.dataTransfer?.files?.item(0);
    if (droppedFile) {
      this.selectedFile = droppedFile;
      this.selectedFileName = droppedFile.name;
    }
  }

  protected setFormat(format: ConversionFormat): void {
    this.selectedFormat = format;
    if (!this.liveMode) {
      this.previewOutput = this.buildPreview(format);
    }
  }

  protected toggleLiveMode(): void {
    this.liveMode = !this.liveMode;
    this.statusMessage = this.liveMode
      ? 'Live mode on: requests will hit your backend routes.'
      : 'Preview mode: no network calls until you toggle Live.';
  }

  protected scrollToWorkspace(): void {
    const target = document.getElementById('workspace');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  protected async runConversion(event: Event): Promise<void> {
    event.preventDefault();
    if (this.isBusy) {
      return;
    }

    this.isBusy = true;
    this.status = this.liveMode ? 'live' : 'success';
    const startedAt = performance.now();

    try {
      const result = this.liveMode ? await this.executeLiveRequest() : this.buildPreview(this.selectedFormat);
      this.previewOutput = result || this.buildPreview(this.selectedFormat);
      this.status = 'success';
      this.statusMessage = this.liveMode ? 'Response returned from your backend.' : 'Preview generated locally.';
    } catch (error) {
      this.status = 'error';
      this.statusMessage = (error as Error).message || 'Conversion failed. Check your route and try again.';
    } finally {
      this.durationMs = Math.round(performance.now() - startedAt);
      this.lastUpdated = new Date().toLocaleTimeString();
      this.isBusy = false;
    }
  }

  protected get generatedCurl(): string {
    const url = this.composeUrl(this.convertRoute);
    const fileName = this.selectedFileName || 'database.sqlite';
    return [
      `curl -X POST "${url}" \\`,
      `  -F "file=@${fileName}" \\`,
      `  -F "format=${this.selectedFormat}" \\`,
      `  -F "table=${this.selectedTable}" \\`,
      `  -F "includeSchema=${this.includeSchema}" \\`,
      `  -F "wrapInTransaction=${this.wrapInTransaction}" \\`,
      `  -F "batchSize=${this.batchSize}"`
    ].join('\n');
  }

  ngAfterViewInit(): void {
    gsap.registerPlugin(ScrollTrigger);

    if (this.heroTitle?.nativeElement) {
      gsap.from(this.heroTitle.nativeElement, {
        opacity: 0,
        y: 30,
        duration: 0.9,
        ease: 'power2.out'
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
            start: 'top 85%'
          }
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
            scrub: true
          }
        });
      });
    }

    gsap.utils.toArray<HTMLElement>('.floating-chip').forEach((chip, i) => {
      gsap.fromTo(
        chip,
        { y: 0 },
        { y: i % 2 === 0 ? 8 : -8, repeat: -1, yoyo: true, ease: 'sine.inOut', duration: 3 + i * 0.2 }
      );
    });
  }

  private composeUrl(route: string): string {
    try {
      return new URL(route, this.baseUrl).toString();
    } catch {
      return `${this.baseUrl}${route}`;
    }
  }

  private async executeLiveRequest(): Promise<string> {
    const url = this.composeUrl(this.convertRoute);
    const formData = new FormData();
    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    }
    formData.append('format', this.selectedFormat);
    formData.append('table', this.selectedTable);
    formData.append('includeSchema', String(this.includeSchema));
    formData.append('wrapInTransaction', String(this.wrapInTransaction));
    formData.append('pretty', String(this.prettyPrint));
    formData.append('batchSize', String(this.batchSize));

    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(text || 'Backend responded with an error.');
    }

    return text;
  }

  private buildPreview(format: ConversionFormat): string {
    const rows = [
      { id: 1024, customer: 'Cedar Labs', total: 12890.2, updated_at: '2024-07-01T12:42:10Z' },
      { id: 1025, customer: 'Northwind Studio', total: 8490.75, updated_at: '2024-07-01T12:55:42Z' },
      { id: 1026, customer: 'Helix Analytics', total: 16450.0, updated_at: '2024-07-02T08:03:17Z' }
    ];

    if (format === 'json') {
      const payload = {
        table: this.selectedTable,
        rows,
        schema: this.includeSchema
          ? {
              id: 'integer PRIMARY KEY',
              customer: 'text',
              total: 'real',
              updated_at: 'text'
            }
          : undefined,
        options: {
          batchSize: this.batchSize,
          wrapInTransaction: this.wrapInTransaction,
          pretty: this.prettyPrint
        }
      };
      return JSON.stringify(payload, null, this.prettyPrint ? 2 : 0);
    }

    if (format === 'csv') {
      const header = 'id,customer,total,updated_at';
      const lines = rows.map((row) => `${row.id},${row.customer},${row.total.toFixed(2)},${row.updated_at}`);
      return [header, ...lines].join('\n');
    }

    if (format === 'sql') {
      const sqlLines = [`-- export for table: ${this.selectedTable}`, 'BEGIN TRANSACTION;'];

      if (this.includeSchema) {
        sqlLines.push(
          `CREATE TABLE IF NOT EXISTS ${this.selectedTable} (`,
          '  id INTEGER PRIMARY KEY,',
          '  customer TEXT,',
          '  total REAL,',
          '  updated_at TEXT',
          ');'
        );
      }

      rows.forEach((row) =>
        sqlLines.push(
          `INSERT INTO ${this.selectedTable} (id, customer, total, updated_at) VALUES (${row.id}, '${row.customer}', ${row.total}, '${row.updated_at}');`
        )
      );

      sqlLines.push('COMMIT;');
      return sqlLines.join('\n');
    }

    return rows.map((row) => JSON.stringify(row)).join('\n');
  }
}
