import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Download, FileText, Code, FileDown } from 'lucide-react';
import { useEnhancedDemoExport } from '../hooks/useEnhancedDemoExport';

interface DemoLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

interface EnhancedConsoleProps {
  logs: DemoLog[];
  isVisible: boolean;
  onToggle: () => void;
  roleName: string;
  hasResults: boolean;
  onDownloadJSON?: () => void;
  onDownloadTXT?: () => void;
  onDownloadPDF?: () => void;
}

const EnhancedConsole: React.FC<EnhancedConsoleProps> = ({ 
  logs, 
  isVisible, 
  onToggle, 
  roleName,
  hasResults,
  onDownloadJSON,
  onDownloadTXT,
  onDownloadPDF
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { downloadJSON, downloadTXT, downloadPDF } = useEnhancedDemoExport();

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-400 bg-green-900/30 border-green-500/30';
      case 'error': return 'text-red-400 bg-red-900/30 border-red-500/30';
      case 'warning': return 'text-yellow-400 bg-yellow-900/30 border-yellow-500/30';
      default: return 'text-blue-400 bg-blue-900/30 border-blue-500/30';
    }
  };

interface BasicResult {
  scenarioTitle: string;
  roleName: string;
  results: any[];
  codeExamples: any[];
  executionTime: number;
  timestamp: string;
  summary: {
    totalFiles: number;
    totalSize: string;
    successRate: number;
  };
}

  const handleDownloadJSON = () => {
    if (onDownloadJSON) {
      onDownloadJSON();
    } else {
      // Создаем базовый JSON если нет обработчика
      const basicResult: BasicResult = {
        scenarioTitle: 'Демонстрация',
        roleName: roleName,
        results: [],
        codeExamples: [],
        executionTime: logs.length * 2,
        timestamp: new Date().toLocaleString('ru-RU'),
        summary: {
          totalFiles: 0,
          totalSize: '0 KB',
          successRate: 95
        }
      };
      downloadJSON(basicResult);
    }
  };

  const handleDownloadTXT = () => {
    if (onDownloadTXT) {
      onDownloadTXT();
    } else {
      const basicResult = {
        scenarioTitle: 'Демонстрация',
        roleName: roleName,
        results: [],
        codeExamples: [],
        executionTime: logs.length * 2,
        timestamp: new Date().toLocaleString('ru-RU'),
        summary: {
          totalFiles: 0,
          totalSize: '0 KB',
          successRate: 95
        }
      };
      downloadTXT(basicResult);
    }
  };

  const handleDownloadPDF = () => {
    if (onDownloadPDF) {
      onDownloadPDF();
    } else {
      const basicResult = {
        scenarioTitle: 'Демонстрация',
        roleName: roleName,
        results: [],
        codeExamples: [],
        executionTime: logs.length * 2,
        timestamp: new Date().toLocaleString('ru-RU'),
        summary: {
          totalFiles: 0,
          totalSize: '0 KB',
          successRate: 95
        }
      };
      downloadPDF(basicResult);
    }
  };

  return (
    <>
      {/* Кнопка управления консолью */}
      <button
        onClick={onToggle}
        className="fixed top-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-3 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
        title={isVisible ? 'Скрыть консоль' : 'Показать консоль'}
      >
        <Code className="w-6 h-6" />
      </button>

      {/* Консоль */}
      <div className={`demo-console fixed right-6 top-20 z-40 transition-all duration-500 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
      } ${isCollapsed ? 'h-16' : 'h-[500px]'} w-96 md:w-[480px]`}>
        
        {/* Заголовок консоли */}
        <div 
          className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-t-lg cursor-pointer border-b border-slate-600"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center space-x-3">
            <FileText className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold">Консоль демонстрации</h3>
            <span className="text-xs bg-blue-600 px-2 py-1 rounded-full">{roleName}</span>
          </div>
          {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>

        {!isCollapsed && (
          <>
            {/* Панель управления */}
            <div className="p-4 border-b border-slate-700 bg-slate-800/50">
              <div className="grid grid-cols-3 gap-2 mb-3">
                <button
                  onClick={handleDownloadJSON}
                  disabled={!hasResults}
                  className="flex items-center justify-center space-x-1 px-3 py-2 text-xs bg-blue-600/80 hover:bg-blue-600 disabled:bg-slate-600 disabled:text-slate-400 text-white rounded transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                >
                  <Download className="w-3 h-3" />
                  <span>JSON</span>
                </button>
                <button
                  onClick={handleDownloadTXT}
                  disabled={!hasResults}
                  className="flex items-center justify-center space-x-1 px-3 py-2 text-xs bg-green-600/80 hover:bg-green-600 disabled:bg-slate-600 disabled:text-slate-400 text-white rounded transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                >
                  <FileText className="w-3 h-3" />
                  <span>TXT</span>
                </button>
                <button
                  onClick={handleDownloadPDF}
                  disabled={!hasResults}
                  className="flex items-center justify-center space-x-1 px-3 py-2 text-xs bg-purple-600/80 hover:bg-purple-600 disabled:bg-slate-600 disabled:text-slate-400 text-white rounded transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                >
                  <FileDown className="w-3 h-3" />
                  <span>PDF</span>
                </button>
              </div>

              {/* Статус */}
              <div className="flex items-center justify-between text-xs">
                <span className={`px-3 py-1 rounded-full font-medium ${
                  hasResults ? 'bg-green-600/80 text-white' : 'bg-slate-600/80 text-slate-300'
                }`}>
                  {hasResults ? 'Готово к экспорту' : 'Демонстрация не завершена'}
                </span>
                <span className="text-slate-400">
                  {logs.length} записей
                </span>
              </div>
            </div>

            {/* Логи */}
            <div className="h-80 overflow-y-auto p-3 space-y-2 bg-slate-900/30">
              {logs.length === 0 ? (
                <div className="text-center text-slate-400 text-sm mt-12">
                  <div className="animate-pulse">
                    <div className="w-16 h-16 bg-slate-700 rounded-full mx-auto mb-4"></div>
                    <p>Готово к демонстрации</p>
                    <p className="text-xs mt-2">Запустите сценарий для просмотра логов</p>
                  </div>
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className={`log-entry ${log.type}`}
                  >
                    <div className="flex items-start space-x-2">
                      <div className="text-xs font-mono text-slate-400 mt-0.5">
                        {log.timestamp}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {log.message}
                        </div>
                        {log.details && (
                          <div className="mt-1 text-xs opacity-80 font-mono bg-slate-800/50 p-2 rounded border-l-2 border-blue-500">
                            {log.details}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default EnhancedConsole;
