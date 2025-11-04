import React from 'react';
import { ExportButton } from '../components/export/ExportButton';
import ExportModal from '../components/export/ExportModal';
import ExportProgress from '../components/export/ExportProgress';

// Test data for export functionality
const testExportData = {
  scenario: {
    title: 'Генерация архитектурного решения',
    role: 'Архитектор',
    executionTime: 15,
    timestamp: new Date().toISOString()
  },
  results: [
    {
      id: '1',
      title: 'Архитектурная диаграмма',
      type: 'diagram',
      description: 'Диаграмма компонентов системы',
      filename: 'architecture_diagram.png',
      size: '256 KB',
      timestamp: '2025-10-31 15:30:00',
      content: 'Mermaid diagram code...'
    },
    {
      id: '2', 
      title: 'Техническое задание',
      type: 'document',
      description: 'Полное техническое описание',
      filename: 'technical_spec.md',
      size: '1.2 MB',
      timestamp: '2025-10-31 15:25:00',
      content: '# Technical Specification...'
    }
  ],
  codeExamples: [
    {
      title: 'Модуль обработки данных',
      language: '1C',
      filename: 'DataProcessor.bsl',
      lines: 150,
      content: 'Процедура ОбработатьДанные()\n  // Логика обработки\nКонецПроцедуры'
    }
  ],
  statistics: {
    totalFiles: 2,
    totalCodeLines: 150,
    totalSize: 1.456,
    executionTime: 15
  }
};

export const ExportTestPage: React.FC = () => {
  const [showModal, setShowModal] = React.useState(false);
  const [showProgress, setShowProgress] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [status, setStatus] = React.useState<'idle' | 'exporting' | 'completed' | 'error'>('idle');

  const handleTestExport = async (format: string) => {
    setShowProgress(true);
    setStatus('exporting');
    setProgress(0);

    // Simulate export progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(i);
    }

    setStatus('completed');
    setTimeout(() => {
      setShowProgress(false);
      setStatus('idle');
      setProgress(0);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Тестирование системы экспорта</h1>
        
        {/* ExportButton Tests */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Тест ExportButton</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Компактная версия:</h3>
              <ExportButton
                data={testExportData}
                title="Тестовый экспорт"
                filename="test-export"
                variant="compact"
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Иконка:</h3>
              <ExportButton
                data={testExportData}
                title="Тестовый экспорт"
                filename="test-export"
                variant="icon"
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Полная версия:</h3>
              <ExportButton
                data={testExportData}
                title="Тестовый экспорт"
                filename="test-export"
                variant="default"
              />
            </div>
          </div>
        </div>

        {/* Manual Tests */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Ручное тестирование</h2>
          <div className="space-x-4">
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Открыть модальное окно
            </button>
            
            <button
              onClick={() => handleTestExport('pdf')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Тест прогресса PDF
            </button>
            
            <button
              onClick={() => handleTestExport('docx')}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Тест прогресса Word
            </button>
          </div>
        </div>

        {/* Data Preview */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Тестовые данные</h2>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
            {JSON.stringify(testExportData, null, 2)}
          </pre>
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        data={testExportData}
        initialTitle="Тестовый экспорт демонстрации"
        initialFilename="test-demo-export"
        onExportComplete={(filename) => {
          console.log('Export completed:', filename);
          setShowModal(false);
        }}
      />

      {/* Export Progress */}
      <ExportProgress
        isVisible={showProgress}
        format="pdf"
        filename="test-export.pdf"
        progress={progress}
        status={status}
        onCancel={() => {
          setShowProgress(false);
          setStatus('idle');
          setProgress(0);
        }}
        onRetry={() => {
          handleTestExport('pdf');
        }}
        onComplete={() => {
          setShowProgress(false);
          setStatus('idle');
          setProgress(0);
        }}
        currentStep={
          status === 'exporting' 
            ? 'Подготовка данных для экспорта...'
            : undefined
        }
      />
    </div>
  );
};

export default ExportTestPage;