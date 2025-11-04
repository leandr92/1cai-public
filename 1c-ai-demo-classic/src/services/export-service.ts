export type ExportFormat = 'pdf' | 'docx' | 'xlsx' | 'csv' | 'json' | 'xml' | 'html' | 'pptx' | 'mermaid' | 'bpmn';

export interface ExportOptions {
  format: ExportFormat;
  includeCharts?: boolean;
  includeImages?: boolean;
  includeMetadata?: boolean;
  customStyles?: Record<string, any>;
}

export interface ExportTask {
  id: string;
  type: string;
  data: any;
  options: ExportOptions;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  format: ExportOptions['format'];
  defaultOptions: ExportOptions;
  applicableTo: string[];
}

export interface ExportFormatInfo {
  id: string;
  name: string;
  extension: string;
  mimeType: string;
  description: string;
}

export interface ExportResult {
  success: boolean;
  fileName: string;
  filePath: string;
  size: number;
  format: string;
  createdAt: Date;
  downloadUrl?: string;
}

export interface ExportData {
  type: string;
  content: any;
  metadata?: Record<string, any>;
}

export interface ExportManager {
  export(data: ExportData, options: ExportOptions): Promise<ExportResult>;
  exportMultiple(dataItems: ExportData[], options: ExportOptions): Promise<ExportResult[]>;
  getAvailableFormats(): ExportFormat[];
  validateOptions(options: ExportOptions): boolean;
}

export interface UseExportReturn {
  exportData: (data: any, options: ExportOptions) => Promise<ExportResult>;
  isExporting: boolean;
  progress: number;
  error: string | null;
  exportMultiple: (dataItems: any[], options: ExportOptions) => Promise<ExportResult[]>;
  exportAll: (data: any, options: ExportOptions) => Promise<ExportResult[]>;
}

export class ExportService {
  private tasks: Map<string, ExportTask> = new Map();
  private templates: ExportTemplate[] = [];
  private processingQueue: string[] = [];

  constructor() {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates(): void {
    this.templates = [
      {
        id: 'report-pdf',
        name: 'PDF отчет',
        description: 'Стандартный PDF отчет с графиками',
        format: 'pdf',
        defaultOptions: {
          format: 'pdf',
          includeCharts: true,
          includeImages: true,
          includeMetadata: true
        },
        applicableTo: ['report', 'analysis']
      },
      {
        id: 'data-csv',
        name: 'CSV данные',
        description: 'Экспорт данных в формате CSV',
        format: 'csv',
        defaultOptions: {
          format: 'csv',
          includeCharts: false,
          includeImages: false,
          includeMetadata: false
        },
        applicableTo: ['data', 'table']
      },
      {
        id: 'analysis-json',
        name: 'JSON анализ',
        description: 'Структурированные данные в JSON',
        format: 'json',
        defaultOptions: {
          format: 'json',
          includeCharts: false,
          includeImages: false,
          includeMetadata: true
        },
        applicableTo: ['analysis', 'result']
      }
    ];
  }

  async exportData(data: any, options: ExportOptions): Promise<string> {
    const task: ExportTask = {
      id: this.generateTaskId(),
      type: typeof data,
      data,
      options,
      status: 'pending',
      progress: 0,
      createdAt: new Date()
    };

    this.tasks.set(task.id, task);
    this.processingQueue.push(task.id);

    // Start processing
    this.processTask(task);

    return task.id;
  }

  private async processTask(task: ExportTask): Promise<void> {
    task.status = 'processing';
    task.progress = 10;

    try {
      const result = await this.performExport(task);
      
      task.status = 'completed';
      task.progress = 100;
      task.result = result;
      task.completedAt = new Date();
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.completedAt = new Date();
    }
  }

  private async performExport(task: ExportTask): Promise<string> {
    const { data, options } = task;

    switch (options.format) {
      case 'json':
        return this.exportToJSON(data, options);
      case 'csv':
        return this.exportToCSV(data, options);
      case 'xml':
        return this.exportToXML(data, options);
      case 'pdf':
        return this.exportToPDF(data, options);
      case 'docx':
        return this.exportToDOCX(data, options);
      case 'xlsx':
        return this.exportToXLSX(data, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  private exportToJSON(data: any, options: ExportOptions): string {
    const exportData = {
      data,
      metadata: options.includeMetadata ? {
        exportedAt: new Date().toISOString(),
        format: 'json',
        version: '1.0'
      } : null
    };

    return JSON.stringify(exportData, null, 2);
  }

  private exportToCSV(data: any, options: ExportOptions): string {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Data must be a non-empty array for CSV export');
    }

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    data.forEach((row) => {
      const values = headers.map((header) => {
        const value = row[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      });
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  }

  private exportToXML(data: any, options: ExportOptions): string {
    const xmlData = options.includeMetadata ? {
      export: {
        '@timestamp': new Date().toISOString(),
        '@format': 'xml',
        '@version': '1.0',
        data
      }
    } : data;

    return this.objectToXML(xmlData);
  }

  private async exportToPDF(data: any, options: ExportOptions): Promise<string> {
    // Mock implementation - in real implementation would use jsPDF or similar
    return 'PDF_EXPORT_CONTENT';
  }

  private async exportToDOCX(data: any, options: ExportOptions): Promise<string> {
    // Mock implementation - in real implementation would use docx library
    return 'DOCX_EXPORT_CONTENT';
  }

  private async exportToXLSX(data: any, options: ExportOptions): Promise<string> {
    // Mock implementation - in real implementation would use xlsx library
    return 'XLSX_EXPORT_CONTENT';
  }

  private objectToXML(obj: any): string {
    if (obj === null || obj === undefined) return '';
    
    if (typeof obj !== 'object') {
      return String(obj);
    }

    let xml = '';
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (key.startsWith('@')) {
          // Handle attributes
          xml += ` ${key.substring(1)}="${value}"`;
        } else if (Array.isArray(value)) {
          value.forEach((item) => {
            xml += `<${key}>${this.objectToXML(item)}</${key}>`;
          });
        } else if (typeof value === 'object') {
          xml += `<${key}>${this.objectToXML(value)}</${key}>`;
        } else {
          xml += `<${key}>${value}</${key}>`;
        }
      }
    }
    return xml;
  }

  private generateTaskId(): string {
    return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getTask(taskId: string): ExportTask | null {
    return this.tasks.get(taskId) || null;
  }

  getAllTasks(): ExportTask[] {
    return Array.from(this.tasks.values());
  }

  getTasksByStatus(status: ExportTask['status']): ExportTask[] {
    return Array.from(this.tasks.values()).filter(task => task.status === status);
  }

  getTemplates(): ExportTemplate[] {
    return [...this.templates];
  }

  getTemplatesByType(type: string): ExportTemplate[] {
    return this.templates.filter(template => 
      template.applicableTo.includes(type)
    );
  }

  async createCustomTemplate(
    name: string,
    description: string,
    format: ExportOptions['format'],
    options: ExportOptions,
    applicableTo: string[]
  ): Promise<string> {
    const template: ExportTemplate = {
      id: this.generateTemplateId(),
      name,
      description,
      format,
      defaultOptions: options,
      applicableTo
    };

    this.templates.push(template);
    return template.id;
  }

  private generateTemplateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  removeTask(taskId: string): boolean {
    return this.tasks.delete(taskId);
  }

  clearCompletedTasks(): number {
    let removed = 0;
    for (const [id, task] of this.tasks.entries()) {
      if (task.status === 'completed') {
        this.tasks.delete(id);
        removed++;
      }
    }
    return removed;
  }
}

// Export singleton instance
export const exportService = new ExportService();

// Export manager class
export class ExportManagerClass implements ExportManager {
  async export(data: ExportData, options: ExportOptions): Promise<ExportResult> {
    const result = await exportService.exportData(data.content, options);
    return {
      success: true,
      fileName: `export_${Date.now()}`,
      filePath: result,
      size: 0,
      format: options.format,
      createdAt: new Date()
    };
  }

  async exportMultiple(dataItems: ExportData[], options: ExportOptions): Promise<ExportResult[]> {
    const results: ExportResult[] = [];
    for (const data of dataItems) {
      try {
        const result = await this.export(data, options);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          fileName: `failed_${Date.now()}`,
          filePath: '',
          size: 0,
          format: options.format,
          createdAt: new Date()
        });
      }
    }
    return results;
  }

  getAvailableFormats(): ExportFormat[] {
    return [
      { id: 'pdf', name: 'PDF', extension: 'pdf', mimeType: 'application/pdf', description: 'Portable Document Format' },
      { id: 'docx', name: 'Word', extension: 'docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', description: 'Microsoft Word Document' },
      { id: 'xlsx', name: 'Excel', extension: 'xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', description: 'Microsoft Excel Spreadsheet' },
      { id: 'csv', name: 'CSV', extension: 'csv', mimeType: 'text/csv', description: 'Comma Separated Values' },
      { id: 'json', name: 'JSON', extension: 'json', mimeType: 'application/json', description: 'JavaScript Object Notation' },
      { id: 'xml', name: 'XML', extension: 'xml', mimeType: 'application/xml', description: 'Extensible Markup Language' }
    ];
  }

  validateOptions(options: ExportOptions): boolean {
    const requiredFormats = ['pdf', 'docx', 'xlsx', 'csv', 'json', 'xml'];
    return requiredFormats.includes(options.format);
  }
}

// Export manager singleton
export const exportManager = new ExportManagerClass();