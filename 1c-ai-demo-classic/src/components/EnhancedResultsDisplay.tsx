import React, { useState } from 'react';
import { CheckCircle, Clock, TrendingUp, FileText, Download, Eye, Code, Database, X, Settings } from 'lucide-react';
import { DemoResult, GeneratedCode } from '../data/demoContent';
import ExportButton from './export/ExportButton';
import ExportModal from './export/ExportModal';
import ExportProgress from './export/ExportProgress';

interface ModalContent {
  title: string;
  content: string;
  type: string;
}

interface EnhancedResultsProps {
  results: DemoResult[];
  codeExamples: GeneratedCode[];
  isVisible: boolean;
  scenarioTitle: string;
  roleName: string;
  executionTime: number;
  onClose?: () => void;
  // Legacy export functions (deprecated, replaced by new export system)
  onDownloadJSON?: () => void;
  onDownloadTXT?: () => void;
  onDownloadPDF?: () => void;
}

const EnhancedResultsDisplay: React.FC<EnhancedResultsProps> = ({ 
  results, 
  codeExamples,
  isVisible, 
  scenarioTitle,
  roleName,
  executionTime,
  onClose,
  onDownloadJSON,
  onDownloadTXT,
  onDownloadPDF
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<ModalContent | null>(null);
  
  // Export state
  const [showExportModal, setShowExportModal] = useState(false);
  const [showExportProgress, setShowExportProgress] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'completed' | 'error'>('idle');
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportFilename, setExportFilename] = useState('export');
  const [exportError, setExportError] = useState<string | undefined>(undefined);

  // Add default onClose function
  const handleClose = onClose || (() => {});

  console.log('🔍 ENHANCED RESULTS DISPLAY PROPS:', {
    resultsLength: results.length,
    codeExamplesLength: codeExamples.length,
    isVisible,
    scenarioTitle,
    roleName
  });

  // ДИАГНОСТИЧЕСКИЙ БЛОК В УГЛУ
  if (!isVisible || (results.length === 0 && codeExamples.length === 0)) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-900/80 border border-red-500 p-4 rounded text-white text-sm">
        <p className="font-bold text-yellow-300">🔍 ДИАГНОСТИКА РЕЗУЛЬТАТОВ</p>
        <p>Результатов: {results.length}</p>
        <p>Код-примеров: {codeExamples.length}</p>
        <p>Видимый: {isVisible ? 'ДА' : 'НЕТ'}</p>
        <p>Сценарий: {scenarioTitle}</p>
        <p>Роль: {roleName}</p>
      </div>
    );
  }

  const openModal = (title: string, content: string, type: string) => {
    setModalContent({ title, content, type });
    setIsModalOpen(true);
  };

  // Prepare export data
  const prepareExportData = () => {
    const calculateTotalSize = results.reduce((sum, result) => {
      const sizeValue = result.size ? parseFloat(result.size.toString().replace(/[^\d.]/g, '')) : 0;
      return sum + (isNaN(sizeValue) ? 0 : sizeValue);
    }, 0);

    return {
      scenario: {
        title: scenarioTitle,
        role: roleName,
        executionTime,
        timestamp: new Date().toISOString()
      },
      results: results.map(result => ({
        id: result.id,
        title: result.title,
        type: result.type,
        description: result.description,
        filename: result.filename,
        size: result.size,
        timestamp: result.timestamp,
        content: result.content
      })),
      codeExamples: codeExamples.map(code => ({
        title: code.title,
        language: code.language,
        filename: code.filename,
        lines: code.content.split('\n').length,
        content: code.content
      })),
      statistics: {
        totalFiles: results.length,
        totalCodeLines: codeExamples.reduce((sum, code) => sum + code.content.split('\n').length, 0),
        totalSize: calculateTotalSize,
        executionTime
      }
    };
  };

  // Export handlers
  const handleExportComplete = (filename: string) => {
    console.log('Export completed:', filename);
    setShowExportProgress(false);
    setExportStatus('idle');
    setExportProgress(0);
  };

  const handleExportError = (error: string) => {
    console.error('Export failed:', error);
    setExportError(error);
    setExportStatus('error');
    setShowExportProgress(true);
  };

  const handleExportRetry = () => {
    setShowExportProgress(false);
    setExportStatus('idle');
    setExportError(undefined);
    setExportProgress(0);
    // Reopen export modal
    setTimeout(() => setShowExportModal(true), 100);
  };

  const handleExportCancel = () => {
    setShowExportProgress(false);
    setExportStatus('idle');
    setExportProgress(0);
    setExportError(undefined);
  };

  const handleViewResult = (result: DemoResult) => {
    openModal(result.title, result.content, result.type);
  };

  const handleViewCode = (code: GeneratedCode) => {
    openModal(code.title, code.content, 'code');
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'code': return <Code className="w-5 h-5 text-blue-400" />;
      case 'document': return <FileText className="w-5 h-5 text-green-400" />;
      case 'diagram': return <TrendingUp className="w-5 h-5 text-purple-400" />;
      case 'data': return <Database className="w-5 h-5 text-orange-400" />;
      case 'report': return <FileText className="w-5 h-5 text-cyan-400" />;
      default: return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'code': return 'bg-blue-900/30 border-blue-500/30 text-blue-300';
      case 'document': return 'bg-green-900/30 border-green-500/30 text-green-300';
      case 'diagram': return 'bg-purple-900/30 border-purple-500/30 text-purple-300';
      case 'data': return 'bg-orange-900/30 border-orange-500/30 text-orange-300';
      case 'report': return 'bg-cyan-900/30 border-cyan-500/30 text-cyan-300';
      default: return 'bg-slate-900/30 border-slate-500/30 text-slate-300';
    }
  };

  const totalSize = results.reduce((sum, result) => {
    const sizeValue = result.size ? parseFloat(result.size.toString().replace(/[^\d.]/g, '')) : 0;
    return sum + (isNaN(sizeValue) ? 0 : sizeValue);
  }, 0);

  const totalCodeLines = codeExamples.reduce((sum, code) => {
    const content = code.content || '';
    return sum + content.split('\n').length;
  }, 0);

  return (
    <div className={`results-section animate-fade-in mt-8 p-6 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    }`}>
      
      {/* Заголовок результатов */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Результаты демонстрации</h2>
            <p className="text-slate-300">
              {roleName} • {scenarioTitle}
            </p>
          </div>
        </div>
        
        {/* Новые возможности экспорта */}
        <div className="flex items-center space-x-3">
          <ExportButton
            data={prepareExportData()}
            title={`Демонстрация: ${scenarioTitle} (${roleName})`}
            filename={`demo-${roleName.toLowerCase()}-${scenarioTitle.toLowerCase().replace(/\s+/g, '-')}`}
            variant="compact"
            className="shadow-lg"
          />
          
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <Settings className="w-4 h-4" />
            <span>Настройки экспорта</span>
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Файлов создано</p>
              <p className="text-2xl font-bold text-white">{results.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Строк кода</p>
              <p className="text-2xl font-bold text-white">{totalCodeLines.toLocaleString()}</p>
            </div>
            <Code className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Время выполнения</p>
              <p className="text-2xl font-bold text-white">{executionTime}s</p>
            </div>
            <Clock className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Общий размер</p>
              <p className="text-2xl font-bold text-white">{totalSize.toFixed(1)} KB</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Сгенерированные файлы */}
      {results.length > 0 && (
        <div className="mb-8">
          <h3 className="section-title text-xl mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Сгенерированные файлы
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {results.map((result, index) => (
              <div key={result.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:bg-slate-800/70 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getResultIcon(result.type)}
                    <div>
                      <h4 className="font-semibold text-white">{result.title}</h4>
                      <span className={`inline-block px-2 py-1 text-xs rounded border ${getTypeColor(result.type)}`}>
                        {result.type}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-sm text-slate-400">
                    <div>{result.size}</div>
                    <div>{result.timestamp ? result.timestamp.split(' ')[1] : '--:--'}</div>
                  </div>
                </div>
                
                <p className="text-slate-300 text-sm mb-3">{result.description}</p>
                
                <div className="flex items-center justify-between">
                  <code className="text-xs text-slate-400 bg-slate-900/50 px-2 py-1 rounded">
                    {result.filename}
                  </code>
                  <button 
                    onClick={() => handleViewResult(result)}
                    className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Просмотр</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Примеры кода */}
      {codeExamples.length > 0 && (
        <div>
          <h3 className="section-title text-xl mb-4 flex items-center">
            <Code className="w-5 h-5 mr-2" />
            Примеры сгенерированного кода
          </h3>
          <div className="space-y-4">
            {codeExamples.map((code, index) => (
              <div key={index} className="code-block p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-white">{code.title}</h4>
                    <div className="flex items-center space-x-3 text-sm text-slate-400 mt-1">
                      <span>Язык: {code.language}</span>
                      <span>Файл: {code.filename}</span>
                      <span>Строк: {(code.content || '').split('\n').length}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleViewCode(code)}
                      className="flex items-center space-x-1 px-3 py-1 bg-green-600/80 hover:bg-green-600 text-white text-xs rounded transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Просмотр</span>
                    </button>
                    <button className="flex items-center space-x-1 px-3 py-1 bg-blue-600/80 hover:bg-blue-600 text-white text-xs rounded transition-colors">
                      <Download className="w-3 h-3" />
                      <span>Скачать</span>
                    </button>
                  </div>
                </div>
                
                <div className="bg-slate-900/80 rounded border border-slate-600 p-3 overflow-x-auto">
                  <pre className="text-sm text-slate-200 whitespace-pre-wrap">
                    <code>{code.content.substring(0, 800)}{code.content.length > 800 ? '\n\n... (код обрезан для отображения)' : ''}</code>
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Если нет результатов */}
      {results.length === 0 && codeExamples.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Результаты появятся после завершения демонстрации</h3>
          <p className="text-slate-400">Запустите сценарий для генерации файлов и кода</p>
        </div>
      )}

      {/* Информация о времени выполнения */}
      <div className="mt-8 pt-6 border-t border-slate-700">
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>Демонстрация завершена: {new Date().toLocaleString('ru-RU')}</span>
          <span>Общее время: {executionTime} секунд</span>
          <span>Статус: <span className="text-green-400 font-semibold">Успешно</span></span>
        </div>
      </div>

      {/* Модальное окно просмотра */}
      {isModalOpen && modalContent && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-600 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Заголовок модального окна */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{modalContent.title}</h3>
                  <span className={`inline-block px-2 py-1 text-xs rounded border ${
                    modalContent.type === 'code' ? 'bg-blue-900/30 border-blue-500/30 text-blue-300' :
                    modalContent.type === 'diagram' ? 'bg-purple-900/30 border-purple-500/30 text-purple-300' :
                    'bg-green-900/30 border-green-500/30 text-green-300'
                  }`}>
                    {modalContent.type}
                  </span>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Содержимое */}
            <div className="flex-1 overflow-auto p-6">
              {modalContent.type === 'code' || modalContent.content.includes('@startuml') ? (
                <div className="bg-slate-900/80 rounded border border-slate-600 p-4 overflow-auto">
                  <pre className="text-sm text-slate-200 whitespace-pre-wrap">
                    <code>{modalContent.content}</code>
                  </pre>
                </div>
              ) : (
                <div className="prose prose-slate prose-invert max-w-none">
                  <div 
                    className="text-slate-200"
                    dangerouslySetInnerHTML={{ 
                      __html: (modalContent.content || '').replace(/\n/g, '<br />').replace(/`([^`]+)`/g, '<code class="bg-slate-700 px-1 rounded">$1</code>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/`(.*?)`/g, '<code class="bg-slate-700 px-1 rounded text-yellow-300">$1</code>')
                    }}
                  />
                </div>
              )}
            </div>

            {/* Кнопки действий */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-slate-700">
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                Закрыть
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([modalContent.content], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${(modalContent.title || 'document').replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}.${modalContent.type === 'code' ? 'bsl' : 'txt'}`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Скачать</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        data={prepareExportData()}
        initialTitle={`Демонстрация: ${scenarioTitle} (${roleName})`}
        initialFilename={`demo-${roleName.toLowerCase()}-${scenarioTitle.toLowerCase().replace(/\s+/g, '-')}`}
        onExportComplete={(filename) => {
          console.log('Export completed:', filename);
          setShowExportModal(false);
        }}
      />

      {/* Export Progress */}
      <ExportProgress
        isVisible={showExportProgress}
        format={exportFormat}
        filename={exportFilename}
        progress={exportProgress}
        status={exportStatus}
        error={exportError}
        onCancel={handleExportCancel}
        onRetry={handleExportRetry}
        onComplete={() => handleExportComplete(exportFilename)}
        currentStep={
          exportStatus === 'exporting' 
            ? `Экспорт в формат ${exportFormat.toUpperCase()}...`
            : undefined
        }
      />
    </div>
  );
};

export default EnhancedResultsDisplay;
