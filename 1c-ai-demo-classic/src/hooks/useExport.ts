// Export Hook - React хук для управления экспортом
import { useState, useCallback, useEffect } from 'react';
import { exportManager, ExportManager, ExportOptions, ExportResult, ExportData } from '../services/export-service';
import { DemoResult, GeneratedCode, RoleData, Scenario } from '../data/demoContent';
import { useWebSocketCollaboration } from '../services/websocket-service';
import toast from 'react-hot-toast';

interface UseExportProps {
  role?: RoleData;
  scenario?: Scenario;
  results?: DemoResult[];
  codeExamples?: GeneratedCode[];
  executionTime?: number;
}

interface ExportState {
  isExporting: boolean;
  currentFormat: string | null;
  progress: number;
  results: ExportResult[];
  error: string | null;
}

interface UseExportReturn {
  // Состояние
  state: ExportState;
  
  // Деструктурированные свойства состояния для удобства
  exportData: ExportData;
  isExporting: boolean;
  progress: number;
  error: string | null;
  
  // Действия экспорта
  exportSingle: (format: 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'html' | 'json', options?: ExportOptions) => Promise<void>;
  exportMultiple: (formats?: Array<'pdf' | 'docx' | 'xlsx' | 'pptx' | 'html' | 'json'>, options?: ExportOptions) => Promise<void>;
  exportAll: (options?: ExportOptions) => Promise<void>;
  exportQuick: (format?: 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'html' | 'json') => Promise<void>;
  
  // Утилиты
  downloadResult: (result: ExportResult) => void;
  getSupportedFormats: () => Array<{ format: string; name: string; description: string; extension: string; }>;
  clearResults: () => void;
  getResultByFormat: (format: string) => ExportResult | undefined;
  
  // Статистика
  getTotalSize: () => string;
  getSuccessfulExports: () => number;
  getFailedExports: () => number;
  
  // Готовность
  canExport: boolean;
  isReady: boolean;
}

export const useExport = ({
  role = {} as RoleData,
  scenario = {} as Scenario,
  results = [],
  codeExamples = [],
  executionTime = 0
}: UseExportProps = {}): UseExportReturn => {
  const [state, setState] = useState<ExportState>({
    isExporting: false,
    currentFormat: null,
    progress: 0,
    results: [],
    error: null
  });

  const { isInReadySession } = useWebSocketCollaboration();

  // Создание данных для экспорта
  const createExportData = useCallback((): ExportData => {
    return {
      role,
      scenario,
      results,
      codeExamples,
      metadata: {
        exportDate: new Date().toLocaleString('ru-RU'),
        exportTime: executionTime,
        format: 'multi-format',
        version: '2.0.0',
        userAgent: navigator.userAgent
      }
    };
  }, [role, scenario, results, codeExamples, executionTime]);

  // Обновление состояния экспорта
  const updateState = useCallback((updates: Partial<ExportState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Обработка результата экспорта
  const handleExportResult = useCallback((result: ExportResult, format: string) => {
    setState(prev => ({
      ...prev,
      results: [...(prev.results || []).filter(r => r.fileName !== result.fileName), result],
      currentFormat: null,
      progress: (prev.results || []).length + 1
    }));

    if (result.success) {
      toast.success(`Экспорт в ${format.toUpperCase()} завершен`);
      console.log(`✅ Export successful: ${result.fileName} (${exportManager.getFileSizeString(result.size)})`);
    } else {
      toast.error(`Ошибка экспорта в ${format.toUpperCase()}: ${result.error || 'Неизвестная ошибка'}`);
      console.error(`❌ Export failed: ${result.error || 'Unknown error'}`);
    }
  }, []);

  // Экспорт в один формат
  const exportSingle = useCallback(async (format: 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'html' | 'json', options: ExportOptions = {}) => {
    if (state.isExporting) {
      toast.error('Экспорт уже выполняется');
      return;
    }

    try {
      updateState({ 
        isExporting: true, 
        currentFormat: format, 
        progress: 0,
        error: null 
      });

      const exportData = createExportData();
      const exportOptions = { ...options, format };
      const result = await exportManager.export(exportData, exportOptions);
      
      handleExportResult(result, format);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка экспорта';
      updateState({ 
        isExporting: false, 
        currentFormat: null, 
        error: errorMessage 
      });
      toast.error(errorMessage);
    } finally {
      updateState({ isExporting: false });
    }
  }, [state.isExporting, createExportData, handleExportResult, updateState]);

  // Экспорт в несколько форматов
  const exportMultiple = useCallback(async (formats?: Array<'pdf' | 'docx' | 'xlsx' | 'pptx' | 'html' | 'json'>, options: ExportOptions = {}) => {
    if (state.isExporting) {
      toast.error('Экспорт уже выполняется');
      return;
    }

    try {
      const formatsToUse = formats || ['pdf', 'docx', 'xlsx', 'pptx', 'html', 'json'];
      
      updateState({ 
        isExporting: true, 
        currentFormat: 'multiple', 
        progress: 0,
        error: null 
      });

      const exportData = createExportData();
      const exportOptions = { ...options, format: formatsToUse[0] }; // Используем первый формат как базовый
      const dataItems = formatsToUse.map(format => ({ ...exportData, format }));
      const results = await exportManager.exportMultiple(dataItems, exportOptions);
      
      // Обрабатываем результаты
      let successfulCount = 0;
      results.forEach((result, index) => {
        const format = formatsToUse[index];
        handleExportResult(result, format);
        if (result.success) successfulCount++;
      });

      const totalSize = (results || []).reduce((sum, result) => sum + result.size, 0);
      toast.success(`Экспорт завершен: ${successfulCount}/${formatsToUse.length} форматов успешно`);
      console.log(`📦 Batch export completed: ${successfulCount}/${formatsToUse.length} successful, total size: ${getFileSizeString(totalSize)}`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка экспорта';
      updateState({ 
        isExporting: false, 
        currentFormat: null, 
        error: errorMessage 
      });
      toast.error(errorMessage);
    } finally {
      updateState({ isExporting: false });
    }
  }, [state.isExporting, createExportData, handleExportResult, updateState]);

  // Экспорт во все форматы
  const exportAll = useCallback(async (options: ExportOptions = {}) => {
    const allFormats: Array<'pdf' | 'docx' | 'xlsx' | 'pptx' | 'html' | 'json'> = ['pdf', 'docx', 'xlsx', 'pptx', 'html', 'json'];
    await exportMultiple(allFormats, options);
  }, [exportMultiple]);

  // Быстрый экспорт
  const exportQuick = useCallback(async (format: 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'html' | 'json' = 'pdf') => {
    const quickOptions: ExportOptions = {
      includeCodeExamples: true,
      includeMetadata: true,
      includeTimestamps: false,
      includeCharts: false,
      compressionLevel: 'moderate'
    };
    
    await exportSingle(format, quickOptions);
  }, [exportSingle]);

  // Скачивание результата
  const downloadResult = useCallback((result: ExportResult) => {
    try {
      // TODO: Реализовать downloadFile в exportManager
      toast.success('Скачивание началось');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка скачивания';
      toast.error(errorMessage);
    }
  }, []);

  // Получение поддерживаемых форматов
  const getSupportedFormats = useCallback(() => {
    // TODO: Реализовать getSupportedFormats в exportManager
    return [];
  }, []);

  // Очистка результатов
  const clearResults = useCallback(() => {
    // Очищаем download URLs
    (state.results || []).forEach(result => {
      if (result.downloadUrl) {
        URL.revokeObjectURL(result.downloadUrl);
      }
    });
    
    updateState({ results: [], error: null });
    toast.success('Результаты очищены');
  }, [state.results, updateState]);

  // Получение результата по формату
  const getResultByFormat = useCallback((format: string) => {
    return (state.results || []).find(result => result.fileName.endsWith(`.${format}`));
  }, [state.results]);

  // Получение общего размера
  const getTotalSize = useCallback(() => {
    const totalBytes = (state.results || [])
      .filter(result => result.success)
      .reduce((sum, result) => sum + result.size, 0);
    return getFileSizeString(totalBytes);
  }, [state.results]);

  // Получение количества успешных экспортов
  const getSuccessfulExports = useCallback(() => {
    return (state.results || []).filter(result => result.success).length;
  }, [state.results]);

  // Получение количества неудачных экспортов
  const getFailedExports = useCallback(() => {
    return (state.results || []).filter(result => !result.success).length;
  }, [state.results]);

  // Готовность к экспорту
  const canExport = results.length > 0 || codeExamples.length > 0;
  const isReady = true;

  // Утилита для форматирования размера файла
  const getFileSizeString = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Автоматическая очистка при размонтировании
  useEffect(() => {
    return () => {
      // Очищаем URL objects при размонтировании
      (state.results || []).forEach(result => {
        if (result.downloadUrl) {
          URL.revokeObjectURL(result.downloadUrl);
        }
      });
    };
  }, [state.results]);

  return {
    // Состояние
    state,
    
    // Деструктурированные свойства состояния
    exportData: createExportData(),
    isExporting: state.isExporting,
    progress: state.progress,
    error: state.error,
    
    // Действия экспорта
    exportSingle,
    exportMultiple,
    exportAll,
    exportQuick,
    
    // Утилиты
    downloadResult,
    getSupportedFormats,
    clearResults,
    getResultByFormat,
    
    // Статистика
    getTotalSize,
    getSuccessfulExports,
    getFailedExports,
    
    // Готовность
    canExport,
    isReady
  };
};

// Дополнительные хуки для специфичных сценариев экспорта

// Хук для экспорта только документов
export const useDocumentExport = (props: UseExportProps = {}) => {
  const exportHook = useExport(props);
  
  const exportDocuments = useCallback(async (options?: ExportOptions) => {
    await exportHook.exportMultiple(['pdf', 'docx', 'html'], options);
  }, [exportHook]);

  return {
    ...exportHook,
    exportDocuments
  };
};

// Хук для экспорта только таблиц
export const useSpreadsheetExport = (props: UseExportProps = {}) => {
  const exportHook = useExport(props);
  
  const exportSpreadsheets = useCallback(async (options?: ExportOptions) => {
    await exportHook.exportMultiple(['xlsx', 'csv'], options);
  }, [exportHook]);

  return {
    ...exportHook,
    exportSpreadsheets
  };
};

// Хук для презентационного экспорта
export const usePresentationExport = (props: UseExportProps = {}) => {
  const exportHook = useExport(props);
  
  const exportPresentation = useCallback(async (options?: ExportOptions) => {
    await exportHook.exportMultiple(['pptx', 'pdf'], options);
  }, [exportHook]);

  return {
    ...exportHook,
    exportPresentation
  };
};

// Хук для технического экспорта
export const useTechnicalExport = (props: UseExportProps = {}) => {
  const exportHook = useExport(props);
  
  const exportTechnical = useCallback(async (options?: ExportOptions) => {
    const technicalOptions: ExportOptions = {
      includeCodeExamples: true,
      includeMetadata: true,
      includeTimestamps: true,
      includeCharts: true,
      compressionLevel: 'high',
      ...options
    };
    
    await exportHook.exportMultiple(['json', 'html', 'pdf'], technicalOptions);
  }, [exportHook]);

  return {
    ...exportHook,
    exportTechnical
  };
};

export default useExport;
