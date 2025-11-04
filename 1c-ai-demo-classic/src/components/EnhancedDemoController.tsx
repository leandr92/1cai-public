// Упрощенная версия для диагностики проблемы с setState
// Основные изменения:
// 1. Убрали промежуточные setState в пошаговом процессе
// 2. Упростили зависимости useCallback
// 3. Добавили минимальную диагностику

import React, { useState, useCallback, useEffect } from 'react';
import EnhancedConsole from './EnhancedConsole';
import EnhancedResultsDisplay from './EnhancedResultsDisplay';
import { allRolesData, GeneratedCode, DemoResult } from '../data/demoContent';

interface CodeExample {
  title: string;
  content: string;
  language: string;
  filename: string;
}

interface Result {
  id: string;
  type: 'document' | 'diagram' | 'data' | 'code';
  title: string;
  description: string;
  filename: string;
  content: string;
  size?: string;
  timestamp?: string;
}

interface DemoLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

interface DemoControllerProps {
  roleId?: string;
  scenarioId?: string;
}

interface Role {
  id: string;
  name: string;
  icon: string;
  description: string;
  scenarios: Scenario[];
}

interface Scenario {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  difficulty: string;
  results: DemoResult[];
  codeExamples: GeneratedCode[];
}

const EnhancedDemoController: React.FC<DemoControllerProps> = ({ roleId, scenarioId }) => {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [results, setResults] = useState<DemoResult[]>([]);
  const [codeExamples, setCodeExamples] = useState<GeneratedCode[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [executionTime, setExecutionTime] = useState(0);
  const [consoleVisible, setConsoleVisible] = useState(true);
  const [logs, setLogs] = useState<DemoLog[]>([]);

  // Получаем роль по пропсам или по умолчанию "Архитектор"
  useEffect(() => {
    let targetRoleId = roleId || 'architect';
    const targetRole = allRolesData.find(role => role.id === targetRoleId);
    
    if (targetRole) {
      setSelectedRole(targetRole);
      
      // Находим сценарий по scenarioId или берем первый
      const targetScenario = scenarioId 
        ? targetRole.scenarios.find(s => s.id === scenarioId)
        : targetRole.scenarios[0];
      
      if (targetScenario) {
        setSelectedScenario(targetScenario);
      }
    }
  }, [roleId, scenarioId]);

  const addLog = useCallback((level: 'info' | 'success' | 'error' | 'warning', message: string, details?: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const id = Date.now().toString();
    setLogs(prev => [...prev, { id, timestamp, type: level, message, details }]);
  }, []);

  const runDemo = useCallback(async () => {
    if (!selectedRole || !selectedScenario) {
      addLog('error', '❌ Не выбрана роль или сценарий');
      return;
    }

    setIsRunning(true);
    setCurrentStep(0);
    setResults([]);
    setCodeExamples([]);
    setLogs([]);
    addLog('info', '🚀 Запуск демонстрации', `${selectedRole.name} → ${selectedScenario.title}`);
    
    const now = Date.now();
    const currentScenario = selectedScenario;

    try {
      console.log('🔍 НАЧАЛО ДЕМО - сценарий:', currentScenario.id);
      console.log('🔍 СОДЕРЖИМОЕ СЦЕНАРИЯ:', {
        resultsCount: currentScenario.results.length,
        codeExamplesCount: currentScenario.codeExamples.length,
        results: currentScenario.results.map((r: DemoResult) => ({ type: r.type, title: r.title })),
        codeExamples: currentScenario.codeExamples.map((c: GeneratedCode) => ({ title: c.title, language: c.language }))
      });

      // ПРОСТАЯ ЛОГИКА - просто устанавливаем финальные результаты
      console.log('🔍 УСТАНАВЛИВАЕМ ФИНАЛЬНЫЕ РЕЗУЛЬТАТЫ:', {
        scenarioId: currentScenario.id,
        resultsCount: currentScenario.results.length,
        codeExamplesCount: currentScenario.codeExamples.length
      });

      // КРИТИЧЕСКИ ВАЖНО: копируем массивы для избежания проблем с ссылками
      const finalResults = [...currentScenario.results];
      const finalCodeExamples = [...currentScenario.codeExamples];

      console.log('🔍 ПОСЛЕ КОПИРОВАНИЯ:', {
        finalResultsLength: finalResults.length,
        finalCodeExamplesLength: finalCodeExamples.length
      });

      // Устанавливаем оба состояния одновременно
      setResults(finalResults);
      setCodeExamples(finalCodeExamples);

      console.log('🔍 SETSTATE ВЫЗВАН - проверяем консоль через секунду...');

      const finalExecutionTime = Math.round((Date.now() - now) / 1000);
      setExecutionTime(finalExecutionTime);

      // Финальные логи
      addLog('success', '🎉 Демонстрация завершена успешно!');
      addLog('info', `📊 Статистика:`, `${finalResults.length} файлов, ${finalCodeExamples.reduce((sum, code) => sum + (code.content || '').split('\n').length, 0)} строк кода`);
      addLog('success', '💾 Результаты готовы к экспорту', 'Нажмите кнопки в консоли для скачивания');

      console.log('✅ Демонстрация завершена для:', currentScenario.id);

    } catch (error) {
      console.error('Ошибка демонстрации:', error);
      addLog('error', '❌ Произошла ошибка', String(error));
      setIsRunning(false);
      return;
    }

    setIsRunning(false);
  }, [selectedRole, selectedScenario]);

  const pauseDemo = useCallback(() => {
    setIsRunning(false);
    addLog('warning', '⏸️ Демонстрация приостановлена');
  }, [addLog]);

  const resetDemo = useCallback(() => {
    setIsRunning(false);
    setResults([]);
    setCodeExamples([]);
    setCurrentStep(0);
    setExecutionTime(0);
    setLogs([]);
    addLog('info', '🔄 Демонстрация сброшена');
  }, [addLog]);

  const handleDownloadJSON = useCallback(() => {
    const data = { results, codeExamples, role: selectedRole?.name, scenario: selectedScenario?.title };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `1c-ai-demo-${selectedScenario?.id || 'results'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [results, codeExamples, selectedRole, selectedScenario]);

  const handleDownloadTXT = useCallback(() => {
    let content = `1С AI Демонстрация\nРоль: ${selectedRole?.name}\nСценарий: ${selectedScenario?.title}\nВремя: ${executionTime}с\n\n`;
    
    if (results.length > 0) {
      content += `=== ДОКУМЕНТЫ (${results.length}) ===\n`;
      results.forEach(result => {
        content += `\n--- ${result.title} ---\n${result.content}\n`;
      });
    }

    if (codeExamples.length > 0) {
      content += `\n=== КОД ПРИМЕРЫ (${codeExamples.length}) ===\n`;
      codeExamples.forEach(example => {
        content += `\n--- ${example.title} (${example.language}) ---\n${example.content}\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `1c-ai-demo-${selectedScenario?.id || 'results'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [results, codeExamples, selectedRole, selectedScenario, executionTime]);

  const handleDownloadPDF = useCallback(() => {
    const data = { results, codeExamples, role: selectedRole?.name, scenario: selectedScenario?.title };
    const jsonString = JSON.stringify(data);
    
    // Создаем простую HTML страницу для печати
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>1С AI Демонстрация</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 20px; }
          .code { background: #f5f5f5; padding: 10px; border-left: 3px solid #007cba; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>1С AI Демонстрация</h1>
          <p><strong>Роль:</strong> ${selectedRole?.name || 'Не выбрана'}</p>
          <p><strong>Сценарий:</strong> ${selectedScenario?.title || 'Не выбран'}</p>
          <p><strong>Время выполнения:</strong> ${executionTime} секунд</p>
        </div>
        
        ${results.map(result => `
          <div class="section">
            <h2>${result.title}</h2>
            <pre>${result.content}</pre>
          </div>
        `).join('')}
        
        ${codeExamples.map(example => `
          <div class="section">
            <h2>${example.title} (${example.language})</h2>
            <div class="code"><pre>${example.content}</pre></div>
          </div>
        `).join('')}
      </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `1c-ai-demo-${selectedScenario?.id || 'results'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [results, codeExamples, selectedRole, selectedScenario, executionTime]);

  if (!selectedRole) {
    return <div>Загрузка...</div>;
  }

  const roleData = selectedRole;
  const currentScenario = selectedScenario;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-gray-900 text-white p-6 rounded-lg mb-6">
        <h1 className="text-2xl font-bold mb-4">1С AI Демонстрация</h1>
        
        {/* Роли */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Выберите роль:</h2>
          <div className="flex gap-3">
            {allRolesData.map(role => (
              <button
                key={role.id}
                onClick={() => {
                  setSelectedRole(role);
                  setSelectedScenario(role.scenarios[0] || null);
                }}
                className={`px-4 py-2 rounded ${
                  selectedRole?.id === role.id 
                    ? 'bg-blue-600' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {role.icon} {role.name}
              </button>
            ))}
          </div>
        </div>

        {/* Сценарии */}
        {selectedRole && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Выберите задачу:</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedRole.scenarios.map(scenario => (
                <label key={scenario.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="scenario"
                    value={scenario.id}
                    checked={selectedScenario?.id === scenario.id}
                    onChange={() => setSelectedScenario(scenario)}
                    className="text-blue-600"
                  />
                  <span>{scenario.title}</span>
                  <span className="text-sm text-gray-400">({scenario.estimatedTime})</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Кнопки управления */}
        <div className="flex gap-3">
          <button
            onClick={runDemo}
            disabled={isRunning}
            className={`px-6 py-2 rounded font-semibold ${
              isRunning 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isRunning ? '⏳ Выполняется...' : '▶️ Запустить демонстрацию'}
          </button>
          
          <button
            onClick={pauseDemo}
            disabled={!isRunning}
            className={`px-6 py-2 rounded font-semibold ${
              !isRunning 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-yellow-600 hover:bg-yellow-700'
            }`}
          >
            ⏸️ Пауза
          </button>
          
          <button
            onClick={resetDemo}
            className="px-6 py-2 rounded font-semibold bg-red-600 hover:bg-red-700"
          >
            🔄 Сброс
          </button>
        </div>

        {/* Информация о демонстрации */}
        {selectedScenario && (
          <div className="mt-4 p-3 bg-gray-800 rounded">
            <h3 className="font-semibold mb-2">{selectedScenario.title}</h3>
            <p className="text-sm text-gray-300 mb-2">{selectedScenario.description}</p>
            <div className="flex gap-4 text-sm text-gray-400">
              <span>⏱️ {selectedScenario.estimatedTime}</span>
              <span>📊 {selectedScenario.difficulty}</span>
            </div>
          </div>
        )}
      </div>

      {/* Результаты */}
      <EnhancedResultsDisplay
        results={results}
        codeExamples={codeExamples}
        isVisible={true}  // ВСЕГДА показывать для диагностики
        scenarioTitle={currentScenario?.title || ''}
        roleName={roleData.name}
        executionTime={executionTime}
      />

      {/* Консоль */}
      <EnhancedConsole
        logs={logs}
        isVisible={consoleVisible}
        onToggle={() => setConsoleVisible(!consoleVisible)}
        roleName={roleData.name}
        hasResults={results.length > 0 || codeExamples.length > 0}
        onDownloadJSON={handleDownloadJSON}
        onDownloadTXT={handleDownloadTXT}
        onDownloadPDF={handleDownloadPDF}
      />
    </div>
  );
};

export default EnhancedDemoController;