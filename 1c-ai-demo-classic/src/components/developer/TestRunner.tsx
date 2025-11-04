/**
 * Компонент запуска и управления автоматическими тестами для 1С
 * Интерфейс для создания, выполнения и анализа результатов тестирования
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Play, 
  Square, 
  Pause, 
  RotateCcw, 
  Settings, 
  Download, 
  Upload, 
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  BarChart3,
  FileText,
  GitBranch,
  Zap,
  Target,
  TrendingUp,
  Users,
  Calendar,
  Timer,
  Activity,
  Layers,
  BookOpen,
  Brain,
  Award,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Trash2,
  Copy,
  Edit,
  Save
} from 'lucide-react';

import {
  automatedTestingService,
  TestSuite,
  TestCase,
  TestExecutionResult,
  TestReport,
  TestStatus,
  TestPriority,
  CoverageInfo,
  TestStatistics,
  TestIssue,
  TestRecommendation,
  TestGenerationOptions,
  TestConfiguration,
  AssertionResult
} from '../services/automated-testing-service';

interface TestRunnerProps {
  moduleCode?: string;
  targetModule?: string;
  onTestComplete?: (report: TestReport) => void;
  onTestProgress?: (progress: number, message: string) => void;
  readonly?: boolean;
  showCoverage?: boolean;
  showStatistics?: boolean;
  height?: string | number;
  width?: string | number;
  className?: string;
}

interface TestFilter {
  status?: TestStatus[];
  priority?: TestPriority[];
  tags?: string[];
  search?: string;
}

const TestRunner: React.FC<TestRunnerProps> = ({
  moduleCode = '',
  targetModule = '',
  onTestComplete,
  onTestProgress,
  readonly = false,
  showCoverage = true,
  showStatistics = true,
  height = '600px',
  width = '100%',
  className = ''
}) => {
  // Состояние основных данных
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [selectedSuite, setSelectedSuite] = useState<TestSuite | null>(null);
  const [selectedTest, setSelectedTest] = useState<TestCase | null>(null);
  const [executionResults, setExecutionResults] = useState<TestExecutionResult[]>([]);
  const [currentReport, setCurrentReport] = useState<TestReport | null>(null);

  // Состояние UI
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [executionMessage, setExecutionMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showNewTestModal, setShowNewTestModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showCoverageView, setShowCoverageView] = useState(false);
  const [activeTab, setActiveTab] = useState<'suites' | 'results' | 'coverage' | 'statistics'>('suites');

  // Состояние фильтрации и поиска
  const [filter, setFilter] = useState<TestFilter>({});
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'priority' | 'executionTime'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Состояние конфигурации
  const [testConfig, setTestConfig] = useState<TestConfiguration>({
    timeout: 30000,
    retryCount: 2,
    retryDelay: 1000,
    parallelExecution: true,
    maxParallelTests: 5,
    screenshotsOnFailure: true,
    screenshotsOnSuccess: false,
    logsEnabled: true,
    debugMode: false,
    environmentVariables: {},
    databaseConnection: {
      server: '',
      database: '',
      username: '',
      password: ''
    }
  });

  // Состояние создания новых тестов
  const [newTestOptions, setNewTestOptions] = useState<TestGenerationOptions>({
    targetModule: targetModule || 'Module',
    includeIntegrationTests: true,
    includeUnitTests: true,
    includeSmokeTests: true,
    includeRegressionTests: false,
    templateLanguage: 'RU',
    includeDocumentation: true,
    includeAssertions: true,
    mockExternalDependencies: true
  });

  // Загрузка данных при монтировании
  useEffect(() => {
    loadTestSuites();
  }, []);

  // Загрузка тестовых наборов
  const loadTestSuites = useCallback(() => {
    const suites = automatedTestingService.getAllTestSuites();
    setTestSuites(suites);
    
    if (suites.length > 0 && !selectedSuite) {
      setSelectedSuite(suites[0]);
    }
  }, [selectedSuite]);

  /**
   * Создание нового тестового набора
   */
  const handleCreateTestSuite = useCallback(async () => {
    try {
      setIsExecuting(true);
      setExecutionProgress(0);
      setExecutionMessage('Анализ модуля...');

      const suite = await automatedTestingService.createTestSuite(moduleCode, newTestOptions);
      
      setExecutionProgress(100);
      setExecutionMessage('Тестовый набор создан успешно');
      
      setTestSuites(prev => [...prev, suite]);
      setSelectedSuite(suite);
      setShowNewTestModal(false);
      
      onTestProgress?.(100, 'Тестовый набор создан успешно');
    } catch (error: any) {
      console.error('Ошибка создания тестового набора:', error);
      setExecutionMessage(`Ошибка: ${error.message}`);
    } finally {
      setIsExecuting(false);
    }
  }, [moduleCode, newTestOptions, onTestProgress]);

  /**
   * Выполнение тестового набора
   */
  const handleExecuteSuite = useCallback(async (suiteId: string) => {
    if (!suiteId) return;

    try {
      setIsExecuting(true);
      setExecutionProgress(0);
      setExecutionMessage('Начало выполнения тестов...');

      const report = await automatedTestingService.executeTestSuite(suiteId, testConfig);
      
      setExecutionProgress(100);
      setExecutionMessage('Выполнение тестов завершено');
      
      setCurrentReport(report);
      setExecutionResults(prev => [...prev, ...report.results]);
      setActiveTab('results');
      
      // Обновление статуса тестового набора
      setTestSuites(prev => prev.map(suite => 
        suite.id === suiteId 
          ? { ...suite, status: report.summary.failedTests > 0 ? 'failed' as any : 'passed' as any, lastRun: new Date(report.executionDate) }
          : suite
      ));

      onTestComplete?.(report);
      onTestProgress?.(100, `Тесты выполнены: ${report.summary.passedTests}/${report.summary.totalTests} прошли`);
    } catch (error: any) {
      console.error('Ошибка выполнения тестов:', error);
      setExecutionMessage(`Ошибка: ${error.message}`);
      onTestProgress?.(0, `Ошибка: ${error.message}`);
    } finally {
      setIsExecuting(false);
    }
  }, [testConfig, onTestComplete, onTestProgress]);

  /**
   * Выполнение всех тестовых наборов
   */
  const handleExecuteAllSuites = useCallback(async () => {
    for (const suite of testSuites) {
      await handleExecuteSuite(suite.id);
    }
  }, [testSuites, handleExecuteSuite]);

  /**
   * Отмена выполнения тестов
   */
  const handleCancelExecution = useCallback(() => {
    setIsExecuting(false);
    setExecutionProgress(0);
    setExecutionMessage('Выполнение отменено');
  }, []);

  /**
   * Фильтрация и сортировка тестов
   */
  const filteredAndSortedSuites = useMemo(() => {
    let filtered = [...testSuites];

    // Применение фильтров
    if (filter.status && filter.status.length > 0) {
      filtered = filtered.filter(suite => filter.status!.includes(suite.status));
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(suite => 
        suite.name.toLowerCase().includes(searchLower) ||
        (suite.description && suite.description.toLowerCase().includes(searchLower))
      );
    }

    // Сортировка
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'executionTime':
          aValue = a.executionTime || 0;
          bValue = b.executionTime || 0;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [testSuites, filter, sortBy, sortDirection]);

  /**
   * Получение цвета статуса
   */
  const getStatusColor = (status: TestStatus): string => {
    switch (status) {
      case TestStatus.PASSED:
        return 'text-green-600 bg-green-100';
      case TestStatus.FAILED:
        return 'text-red-600 bg-red-100';
      case TestStatus.SKIPPED:
        return 'text-yellow-600 bg-yellow-100';
      case TestStatus.RUNNING:
        return 'text-blue-600 bg-blue-100';
      case TestStatus.ERROR:
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  /**
   * Получение иконки статуса
   */
  const getStatusIcon = (status: TestStatus) => {
    switch (status) {
      case TestStatus.PASSED:
        return <CheckCircle className="w-4 h-4" />;
      case TestStatus.FAILED:
        return <XCircle className="w-4 h-4" />;
      case TestStatus.SKIPPED:
        return <Clock className="w-4 h-4" />;
      case TestStatus.RUNNING:
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case TestStatus.ERROR:
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  /**
   * Получение цвета приоритета
   */
  const getPriorityColor = (priority: TestPriority): string => {
    switch (priority) {
      case TestPriority.CRITICAL:
        return 'text-red-600 bg-red-100';
      case TestPriority.HIGH:
        return 'text-orange-600 bg-orange-100';
      case TestPriority.MEDIUM:
        return 'text-yellow-600 bg-yellow-100';
      case TestPriority.LOW:
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Статистика выполненных тестов
  const executionStats = useMemo(() => {
    const stats = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      running: 0,
      errors: 0
    };

    testSuites.forEach(suite => {
      stats.total += suite.tests.length;
      
      suite.tests.forEach(test => {
        switch (test.status) {
          case TestStatus.PASSED:
            stats.passed++;
            break;
          case TestStatus.FAILED:
            stats.failed++;
            break;
          case TestStatus.SKIPPED:
            stats.skipped++;
            break;
          case TestStatus.RUNNING:
            stats.running++;
            break;
          case TestStatus.ERROR:
            stats.errors++;
            break;
        }
      });
    });

    return stats;
  }, [testSuites]);

  return (
    <div className={`test-runner ${className}`} style={{ height, width }}>
      {/* Заголовок */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Автоматическое тестирование 1С</h2>
              <p className="text-sm text-gray-600">Управление тестами, выполнение и анализ результатов</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Статистика выполнения */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">{executionStats.passed}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-600">{executionStats.failed}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-600">{executionStats.skipped}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">{executionStats.total}</span>
              </div>
            </div>

            {/* Кнопки действий */}
            {!readonly && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowNewTestModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Новый тест
                </button>

                <button
                  onClick={loadTestSuites}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                  title="Обновить"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                  title="Настройки"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Прогресс выполнения */}
        {isExecuting && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Выполнение тестов</span>
              <span className="text-sm text-gray-500">{executionProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${executionProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">{executionMessage}</p>
          </div>
        )}
      </div>

      {/* Основное содержимое */}
      <div className="flex h-full">
        {/* Левая панель - Навигация */}
        <div className="w-64 bg-gray-50 border-r border-gray-200">
          <div className="p-4">
            {/* Поиск и фильтры */}
            <div className="space-y-3 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Поиск тестов..."
                  value={filter.search || ''}
                  onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded"
                >
                  <option value="name">По имени</option>
                  <option value="status">По статусу</option>
                  <option value="priority">По приоритету</option>
                  <option value="executionTime">По времени</option>
                </select>
                
                <button
                  onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="p-1 text-gray-600 hover:text-gray-900"
                >
                  {sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Вкладки */}
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab('suites')}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg text-sm ${
                  activeTab === 'suites' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Target className="w-4 h-4" />
                Тестовые наборы ({testSuites.length})
              </button>

              <button
                onClick={() => setActiveTab('results')}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg text-sm ${
                  activeTab === 'results' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Activity className="w-4 h-4" />
                Результаты ({executionResults.length})
              </button>

              {showCoverage && (
                <button
                  onClick={() => setActiveTab('coverage')}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg text-sm ${
                    activeTab === 'coverage' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Покрытие
                </button>
              )}

              {showStatistics && (
                <button
                  onClick={() => setActiveTab('statistics')}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg text-sm ${
                    activeTab === 'statistics' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  Статистика
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Правая панель - Основной контент */}
        <div className="flex-1 bg-white">
          {activeTab === 'suites' && (
            <div className="h-full flex flex-col">
              {/* Заголовок секции */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Тестовые наборы</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleExecuteAllSuites}
                      disabled={isExecuting || testSuites.length === 0}
                      className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <Play className="w-4 h-4" />
                      Выполнить все
                    </button>
                  </div>
                </div>
              </div>

              {/* Список тестовых наборов */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {filteredAndSortedSuites.map(suite => (
                    <div
                      key={suite.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedSuite?.id === suite.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedSuite(suite)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-gray-900">{suite.name}</h4>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${getStatusColor(suite.status)}`}>
                              {getStatusIcon(suite.status)}
                              {suite.status}
                            </div>
                          </div>
                          
                          {suite.description && (
                            <p className="text-sm text-gray-600 mb-3">{suite.description}</p>
                          )}

                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              {suite.tests.length} тестов
                            </span>
                            {suite.executionTime && (
                              <span className="flex items-center gap-1">
                                <Timer className="w-4 h-4" />
                                {(suite.executionTime / 1000).toFixed(1)}с
                              </span>
                            )}
                            {suite.lastRun && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {suite.lastRun.toLocaleDateString('ru-RU')}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {!readonly && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleExecuteSuite(suite.id);
                                }}
                                disabled={isExecuting}
                                className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                                title="Выполнить набор"
                              >
                                <Play className="w-3 h-3" />
                                Выполнить
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Действие удаления
                                }}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                                title="Удалить набор"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredAndSortedSuites.length === 0 && (
                    <div className="text-center py-12">
                      <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Нет тестовых наборов</h3>
                      <p className="text-gray-600 mb-4">Создайте первый тестовый набор для начала автоматизации тестирования</p>
                      {!readonly && (
                        <button
                          onClick={() => setShowNewTestModal(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
                        >
                          <Plus className="w-4 h-4" />
                          Создать тестовый набор
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'results' && (
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Результаты выполнения</h3>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {executionResults.map(result => (
                    <div key={`${result.suiteId}-${result.testId}`} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.status)}
                          <span className="font-medium text-gray-900">{result.testId}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {(result.executionTime / 1000).toFixed(2)}с
                        </div>
                      </div>

                      {result.error && (
                        <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <span className="font-medium text-red-800">Ошибка</span>
                          </div>
                          <p className="text-sm text-red-700">{result.error.message}</p>
                        </div>
                      )}

                      <div className="text-sm text-gray-600">
                        Assertions: {result.assertions.filter(a => a.passed).length}/{result.assertions.length}
                      </div>
                    </div>
                  ))}

                  {executionResults.length === 0 && (
                    <div className="text-center py-12">
                      <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Нет результатов</h3>
                      <p className="text-gray-600">Результаты выполненных тестов появятся здесь</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'coverage' && showCoverage && (
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Покрытие кода</h3>
                  <button
                    onClick={() => setShowCoverageView(!showCoverageView)}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Детальный вид
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Данные о покрытии</h3>
                  <p className="text-gray-600">Информация о покрытии кода будет отображаться здесь после выполнения тестов</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'statistics' && showStatistics && (
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Статистика и аналитика</h3>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Статистика тестирования</h3>
                  <p className="text-gray-600">Детальная статистика и тренды будут доступны после накопления данных</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно создания нового теста */}
      {showNewTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Создание нового тестового набора</h3>
                <button
                  onClick={() => setShowNewTestModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Целевой модуль</label>
                  <input
                    type="text"
                    value={newTestOptions.targetModule}
                    onChange={(e) => setNewTestOptions(prev => ({ ...prev, targetModule: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Введите имя модуля"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newTestOptions.includeUnitTests}
                      onChange={(e) => setNewTestOptions(prev => ({ ...prev, includeUnitTests: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Unit тесты</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newTestOptions.includeIntegrationTests}
                      onChange={(e) => setNewTestOptions(prev => ({ ...prev, includeIntegrationTests: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Интеграционные тесты</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newTestOptions.includeSmokeTests}
                      onChange={(e) => setNewTestOptions(prev => ({ ...prev, includeSmokeTests: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Smoke тесты</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newTestOptions.includeRegressionTests}
                      onChange={(e) => setNewTestOptions(prev => ({ ...prev, includeRegressionTests: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Регрессионные тесты</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Язык шаблонов</label>
                  <select
                    value={newTestOptions.templateLanguage}
                    onChange={(e) => setNewTestOptions(prev => ({ ...prev, templateLanguage: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="RU">Русский</option>
                    <option value="EN">English</option>
                    <option value="BSL">BSL</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowNewTestModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateTestSuite}
                disabled={isExecuting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isExecuting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Создание...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Создать
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Панель настроек */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Настройки тестирования</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Таймаут (мс)</label>
                  <input
                    type="number"
                    value={testConfig.timeout}
                    onChange={(e) => setTestConfig(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Количество повторов</label>
                  <input
                    type="number"
                    value={testConfig.retryCount}
                    onChange={(e) => setTestConfig(prev => ({ ...prev, retryCount: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={testConfig.parallelExecution}
                    onChange={(e) => setTestConfig(prev => ({ ...prev, parallelExecution: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Параллельное выполнение</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={testConfig.screenshotsOnFailure}
                    onChange={(e) => setTestConfig(prev => ({ ...prev, screenshotsOnFailure: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Скриншоты при ошибках</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={testConfig.logsEnabled}
                    onChange={(e) => setTestConfig(prev => ({ ...prev, logsEnabled: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Включить логирование</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={testConfig.debugMode}
                    onChange={(e) => setTestConfig(prev => ({ ...prev, debugMode: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Режим отладки</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestRunner;