/**
 * Страница тестирования расширения разработчика
 * Демонстрация всех инструментов: конструктор форм, редактор кода, тестирование, Git
 */

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Code, 
  GitBranch, 
  Target, 
  TestTube, 
  FileText, 
  Settings, 
  Play, 
  RefreshCw,
  Download,
  Upload,
  Save,
  Eye,
  EyeOff,
  PanelTop,
  PanelBottom,
  PanelLeft,
  PanelRight,
  Maximize,
  Minimize,
  Grid3X3,
  Layout,
  Monitor,
  Smartphone,
  Tablet,
  Lightbulb,
  BookOpen,
  Zap,
  Users,
  Activity,
  BarChart3,
  History,
  Settings2,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Импорт всех компонентов разработчика
import FormBuilder from '../components/developer/FormBuilder';
import CodeEditor from '../components/developer/CodeEditor';
import TestRunner from '../components/developer/TestRunner';
import GitManager from '../components/developer/GitManager';

// Импорт сервисов
import { visualFormBuilderService } from '../services/visual-form-builder-service';
import { codeAutocompleteService } from '../services/code-autocomplete-service';
import { automatedTestingService } from '../services/automated-testing-service';
import { gitIntegrationService, GitRepository } from '../services/git-integration-service';

interface PanelLayout {
  id: string;
  title: string;
  component: 'formbuilder' | 'codeeditor' | 'testrunner' | 'gitmanager' | 'dashboard';
  visible: boolean;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  size: number; // percentage or pixels
  order: number;
}

interface ToolConfig {
  formBuilder: {
    showToolbox: boolean;
    showProperties: boolean;
    showPreview: boolean;
    snapToGrid: boolean;
    gridSize: number;
  };
  codeEditor: {
    theme: 'light' | 'dark' | '1c';
    fontSize: number;
    showMinimap: boolean;
    autocompleteEnabled: boolean;
    autoFormat: boolean;
  };
  testRunner: {
    parallelExecution: boolean;
    screenshotsOnFailure: boolean;
    logsEnabled: boolean;
    debugMode: boolean;
  };
  gitManager: {
    autoSync: boolean;
    showBranches: boolean;
    showCommits: boolean;
    showPR: boolean;
  };
}

const DeveloperToolsPage: React.FC = () => {
  // Состояние панелей
  const [panels, setPanels] = useState<PanelLayout[]>([
    {
      id: 'formbuilder',
      title: 'Конструктор форм',
      component: 'formbuilder',
      visible: true,
      position: 'left',
      size: 30,
      order: 1
    },
    {
      id: 'codeeditor',
      title: 'Редактор кода',
      component: 'codeeditor',
      visible: true,
      position: 'center',
      size: 40,
      order: 2
    },
    {
      id: 'testrunner',
      title: 'Тестирование',
      component: 'testrunner',
      visible: true,
      position: 'right',
      size: 30,
      order: 3
    },
    {
      id: 'gitmanager',
      title: 'Git интеграция',
      component: 'gitmanager',
      visible: false,
      position: 'bottom',
      size: 50,
      order: 4
    }
  ]);

  // Состояние конфигурации инструментов
  const [config, setConfig] = useState<ToolConfig>({
    formBuilder: {
      showToolbox: true,
      showProperties: true,
      showPreview: false,
      snapToGrid: true,
      gridSize: 10
    },
    codeEditor: {
      theme: '1c',
      fontSize: 14,
      showMinimap: true,
      autocompleteEnabled: true,
      autoFormat: true
    },
    testRunner: {
      parallelExecution: true,
      screenshotsOnFailure: true,
      logsEnabled: true,
      debugMode: false
    },
    gitManager: {
      autoSync: false,
      showBranches: true,
      showCommits: true,
      showPR: true
    }
  });

  // Состояние UI
  const [activeTab, setActiveTab] = useState<'workspace' | 'dashboard'>('workspace');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'tabs' | 'fullscreen'>('grid');
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedPanel, setSelectedPanel] = useState<string>('codeeditor');

  // Состояние данных
  const [formSchema, setFormSchema] = useState<any>(null);
  const [codeContent, setCodeContent] = useState<string>(`// Пример кода 1С:Enterprise
Процедура ОбработатьДанные(Параметр) Экспорт
    
    Если Параметр = Неопределено Тогда
        Сообщить("Параметр не задан");
        Возврат;
    КонецЕсли;
    
    // Основная логика обработки
    Результат = Новый Структура;
    Результат.Вставить("Успех", Истина);
    Результат.Вставить("Сообщение", "Обработка завершена");
    
    Возврат Результат;
    
КонецПроцедуры`);
  const [testSuites, setTestSuites] = useState<any[]>([]);
  const [gitRepository, setGitRepository] = useState<GitRepository | null>(null);

  // Конфигурация разработчика
  const developerProfile = useMemo(() => ({
    name: '1С Разработчик',
    experience: 'Senior',
    skills: ['BSL', 'Конфигуратор', 'Запросы', 'HTTP API', 'Git'],
    preferences: {
      editor: 'VS Code + 1С расширения',
      testing: 'Автоматизированное + ручное',
      git: 'GitHub + SourceTree',
      database: 'PostgreSQL + MSSQL'
    }
  }), []);

  // Демо данные
  const demoStats = useMemo(() => ({
    formsCreated: 15,
    linesOfCode: 2847,
    testsWritten: 89,
    commits: 156,
    projectsCompleted: 12,
    bugFixed: 34
  }), []);

  /**
   * Обработчики панелей
   */
  const togglePanel = useCallback((panelId: string) => {
    setPanels(prev => prev.map(panel => 
      panel.id === panelId 
        ? { ...panel, visible: !panel.visible }
        : panel
    ));
  }, []);

  const updatePanelPosition = useCallback((panelId: string, position: 'top' | 'bottom' | 'left' | 'right' | 'center') => {
    setPanels(prev => prev.map(panel => 
      panel.id === panelId 
        ? { ...panel, position }
        : panel
    ));
  }, []);

  const updatePanelSize = useCallback((panelId: string, size: number) => {
    setPanels(prev => prev.map(panel => 
      panel.id === panelId 
        ? { ...panel, size }
        : panel
    ));
  }, []);

  /**
   * Обработчики событий от компонентов
   */
  const handleFormChange = useCallback((form: any) => {
    setFormSchema(form);
    
    // Автоматическое обновление кода если включено
    if (config.formBuilder.showPreview) {
      // Генерация кода формы в BSL
      const generatedCode = generateFormCode(form);
      setCodeContent(generatedCode);
    }
  }, [config.formBuilder.showPreview]);

  const handleCodeChange = useCallback((code: string) => {
    setCodeContent(code);
    
    // Автоматическое тестирование если включено
    if (config.testRunner.autoFormat) {
      // Создание тестов на основе изменений кода
      // Это заглушка - в реальной реализации здесь был бы анализ кода
    }
  }, [config.testRunner.autoFormat]);

  const handleTestComplete = useCallback((report: any) => {
    console.log('Тестирование завершено:', report);
    
    // Автоматический коммит если все тесты прошли
    if (report.summary.passRate === 100 && config.gitManager.autoSync) {
      // commitToGit(`Авто-коммит: тесты прошли ${report.summary.passRate}%`);
    }
  }, [config.gitManager.autoSync]);

  const handleGitRepositoryChange = useCallback((repo: GitRepository | null) => {
    setGitRepository(repo);
  }, []);

  /**
   * Генерация кода формы
   */
  const generateFormCode = (form: any): string => {
    if (!form || !form.elements) return '// Код формы не сгенерирован';

    let code = `// Сгенерированный код формы "${form.name}"\n`;
    code += `Процедура ПриОткрытии(Отказ)\n`;
    code += `    // Инициализация формы\n`;
    
    form.elements.forEach((element: any) => {
      switch (element.type) {
        case 'input':
          code += `    Элементы.${element.name}.Значение = "${element.properties.defaultValue || ''}";\n`;
          break;
        case 'button':
          code += `    Элементы.${element.name}.Заголовок = "${element.label}";\n`;
          break;
        case 'table':
          code += `    // Инициализация таблицы ${element.name}\n`;
          break;
      }
    });
    
    code += `КонецПроцедуры\n\n`;
    
    // Обработчики событий
    form.elements.forEach((element: any) => {
      if (element.events) {
        element.events.forEach((event: any) => {
          code += `Процедура ${event.handler}()\n`;
          code += `    // Обработчик события ${event.name} для элемента ${element.name}\n`;
          code += `    Сообщить("Событие ${event.name} для ${element.name}");\n`;
          code += `КонецПроцедуры\n\n`;
        });
      }
    });

    return code;
  };

  /**
   * Создание демо сценария
   */
  const createDemoScenario = useCallback(() => {
    // 1. Создание формы
    const form = visualFormBuilderService.createForm('Демо форма');
    
    // 2. Добавление элементов
    const inputField = {
      id: 'demo-input',
      type: 'input' as const,
      name: 'UserName',
      label: 'Имя пользователя',
      position: { x: 20, y: 20 },
      size: { width: 200, height: 30 },
      properties: {
        required: true,
        inputType: 'text',
        maxLength: 100
      }
    };
    
    visualFormBuilderService.addElement(inputField);
    
    // 3. Генерация кода
    const generatedCode = generateFormCode(form);
    setCodeContent(generatedCode);
    
    // 4. Создание тестов
    // automatedTestingService.createTestSuite(generatedCode, {
    //   targetModule: 'DemoModule',
    //   includeUnitTests: true,
    //   includeIntegrationTests: true
    // });
    
    console.log('Демо сценарий создан');
  }, []);

  /**
   * Экспорт проекта
   */
  const exportProject = useCallback(() => {
    const project = {
      formSchema,
      codeContent,
      testSuites,
      gitRepository,
      config,
      exportedAt: new Date(),
      version: '1.0.0'
    };
    
    const blob = new Blob([JSON.stringify(project, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `developer-project-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [formSchema, codeContent, testSuites, gitRepository, config]);

  /**
   * Импорт проекта
   */
  const importProject = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const project = JSON.parse(e.target?.result as string);
        
        setFormSchema(project.formSchema || null);
        setCodeContent(project.codeContent || '');
        setTestSuites(project.testSuites || []);
        setGitRepository(project.gitRepository || null);
        setConfig(project.config || config);
        
        console.log('Проект импортирован');
      } catch (error) {
        console.error('Ошибка импорта проекта:', error);
      }
    };
    reader.readAsText(file);
  }, [config]);

  // Рендеринг панелей
  const renderPanel = (panel: PanelLayout) => {
    if (!panel.visible) return null;

    const panelClass = `
      bg-white border border-gray-200 rounded-lg shadow-sm
      ${panel.position === 'center' ? 'flex-1' : ''}
      ${panel.position === 'left' ? 'w-full' : ''}
      ${panel.position === 'right' ? 'w-full' : ''}
      ${panel.position === 'top' ? 'w-full' : ''}
      ${panel.position === 'bottom' ? 'w-full' : ''}
    `;

    return (
      <div key={panel.id} className={panelClass}>
        <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <div className="flex items-center gap-2">
            {panel.component === 'formbuilder' && <FileText className="w-4 h-4 text-blue-600" />}
            {panel.component === 'codeeditor' && <Code className="w-4 h-4 text-green-600" />}
            {panel.component === 'testrunner' && <TestTube className="w-4 h-4 text-purple-600" />}
            {panel.component === 'gitmanager' && <GitBranch className="w-4 h-4 text-orange-600" />}
            <span className="font-medium text-gray-900 text-sm">{panel.title}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedPanel(selectedPanel === panel.id ? '' : panel.id)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title={selectedPanel === panel.id ? 'Свернуть' : 'Развернуть'}
            >
              {selectedPanel === panel.id ? <Minimize className="w-3 h-3" /> : <Maximize className="w-3 h-3" />}
            </button>
            
            <button
              onClick={() => togglePanel(panel.id)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title="Скрыть панель"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden" style={{ height: 'calc(100% - 48px)' }}>
          {panel.component === 'formbuilder' && (
            <FormBuilder
              width="100%"
              height="100%"
              showRulers={config.formBuilder.showToolbox}
              showGrid={config.formBuilder.snapToGrid}
              snapToGrid={config.formBuilder.snapToGrid}
              gridSize={config.formBuilder.gridSize}
              onFormChange={handleFormChange}
            />
          )}
          
          {panel.component === 'codeeditor' && (
            <CodeEditor
              value={codeContent}
              onChange={handleCodeChange}
              theme={config.codeEditor.theme}
              fontSize={config.codeEditor.fontSize}
              showMinimap={config.codeEditor.showMinimap}
              autoComplete={config.codeEditor.autocompleteEnabled}
              autoFormat={config.codeEditor.autoFormat}
              width="100%"
              height="100%"
            />
          )}
          
          {panel.component === 'testrunner' && (
            <TestRunner
              moduleCode={codeContent}
              targetModule="DemoModule"
              onTestComplete={handleTestComplete}
              showCoverage={true}
              showStatistics={true}
              width="100%"
              height="100%"
            />
          )}
          
          {panel.component === 'gitmanager' && (
            <GitManager
              repository={gitRepository?.name}
              owner={gitRepository?.fullName.split('/')[0]}
              onRepositoryChange={handleGitRepositoryChange}
              onBranchChange={() => {}}
              onCommit={() => {}}
              width="100%"
              height="100%"
            />
          )}
        </div>
      </div>
    );
  };

  // Рендеринг дашборда
  const renderDashboard = () => (
    <div className="space-y-6 p-6">
      {/* Заголовок */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Панель разработчика 1С</h1>
        <p className="text-gray-600">Интегрированная среда разработки с инструментами для создания, тестирования и управления кодом</p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-blue-600">{demoStats.formsCreated}</div>
          <div className="text-sm text-gray-600">Форм создано</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-green-600">{demoStats.linesOfCode.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Строк кода</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-purple-600">{demoStats.testsWritten}</div>
          <div className="text-sm text-gray-600">Тестов написано</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-orange-600">{demoStats.commits}</div>
          <div className="text-sm text-gray-600">Коммитов</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-indigo-600">{demoStats.projectsCompleted}</div>
          <div className="text-sm text-gray-600">Проектов завершено</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-red-600">{demoStats.bugFixed}</div>
          <div className="text-sm text-gray-600">Багов исправлено</div>
        </div>
      </div>

      {/* Профиль разработчика */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Профиль разработчика
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Основная информация</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Имя:</span>
                <span className="text-gray-900">{developerProfile.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Опыт:</span>
                <span className="text-gray-900">{developerProfile.experience}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Навыки:</span>
                <span className="text-gray-900">{developerProfile.skills.join(', ')}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Предпочтения</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Редактор:</span>
                <span className="text-gray-900">{developerProfile.preferences.editor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Тестирование:</span>
                <span className="text-gray-900">{developerProfile.preferences.testing}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Git:</span>
                <span className="text-gray-900">{developerProfile.preferences.git}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Возможности инструментов */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Возможности инструментов
        </h3>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-gray-900">Конструктор форм</h4>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Drag-and-drop интерфейс</li>
              <li>• 16 типов элементов</li>
              <li>• Генерация BSL кода</li>
              <li>• Валидация форм</li>
              <li>• Шаблоны форм</li>
            </ul>
          </div>
          
          <div className="p-4 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Code className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-gray-900">Редактор кода</h4>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Monaco Editor интеграция</li>
              <li>• Автодополнение BSL</li>
              <li>• Синтаксическая подсветка</li>
              <li>• Сниппеты кода</li>
              <li>• Валидация кода</li>
            </ul>
          </div>
          
          <div className="p-4 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TestTube className="w-5 h-5 text-purple-600" />
              <h4 className="font-medium text-gray-900">Тестирование</h4>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Автогенерация тестов</li>
              <li>• Unit, Integration, Smoke</li>
              <li>• Параллельное выполнение</li>
              <li>• Покрытие кода</li>
              <li>• Отчеты и статистика</li>
            </ul>
          </div>
          
          <div className="p-4 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <GitBranch className="w-5 h-5 text-orange-600" />
              <h4 className="font-medium text-gray-900">Git интеграция</h4>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• GitHub/GitLab API</li>
              <li>• Управление ветками</li>
              <li>• Pull Requests</li>
              <li>• Релизы и теги</li>
              <li>• Разрешение конфликтов</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Быстрые действия
        </h3>
        
        <div className="grid md:grid-cols-3 gap-4">
          <button
            onClick={createDemoScenario}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Lightbulb className="w-6 h-6 text-yellow-600" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Создать демо сценарий</div>
              <div className="text-sm text-gray-600">Быстро создать пример проекта</div>
            </div>
          </button>
          
          <button
            onClick={exportProject}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-6 h-6 text-blue-600" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Экспорт проекта</div>
              <div className="text-sm text-gray-600">Сохранить все настройки и код</div>
            </div>
          </button>
          
          <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
            <Upload className="w-6 h-6 text-green-600" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Импорт проекта</div>
              <div className="text-sm text-gray-600">Загрузить сохраненный проект</div>
              <input
                type="file"
                accept=".json"
                onChange={(e) => e.target.files?.[0] && importProject(e.target.files[0])}
                className="hidden"
              />
            </div>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Заголовок */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Code className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">Инструменты разработчика 1С</h1>
            </div>
            
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-1" />
                Дашборд
              </button>
              
              <button
                onClick={() => setActiveTab('workspace')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  activeTab === 'workspace'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Layout className="w-4 h-4 inline mr-1" />
                Рабочая область
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'workspace' && (
              <>
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setLayoutMode('grid')}
                    className={`p-2 rounded-md transition-colors ${
                      layoutMode === 'grid'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Сетка"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => setLayoutMode('tabs')}
                    className={`p-2 rounded-md transition-colors ${
                      layoutMode === 'tabs'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Вкладки"
                  >
                    <PanelTop className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                  title="Настройки"
                >
                  <Settings2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                  title={isFullscreen ? 'Обычный режим' : 'Полноэкранный'}
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Основное содержимое */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'dashboard' ? (
          <div className="h-full overflow-y-auto">
            {renderDashboard()}
          </div>
        ) : (
          <div className="h-full flex">
            {/* Левая панель (если есть панели слева) */}
            {panels.filter(p => p.visible && p.position === 'left').length > 0 && (
              <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                {panels.filter(p => p.visible && p.position === 'left').map(renderPanel)}
              </div>
            )}

            {/* Центральная область */}
            <div className="flex-1 flex flex-col">
              {/* Верхние панели */}
              {panels.filter(p => p.visible && p.position === 'top').length > 0 && (
                <div className="h-64 border-b border-gray-200 overflow-hidden">
                  {panels.filter(p => p.visible && p.position === 'top').map(renderPanel)}
                </div>
              )}

              {/* Основная панель (центр) */}
              {panels.filter(p => p.visible && p.position === 'center').length > 0 ? (
                <div className="flex-1 overflow-hidden">
                  {panels.filter(p => p.visible && p.position === 'center').map(renderPanel)}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <Layout className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Выберите инструмент</h3>
                    <p className="text-gray-600 mb-4">Выберите панель для начала работы</p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => togglePanel('formbuilder')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <FileText className="w-4 h-4" />
                        Конструктор форм
                      </button>
                      <button
                        onClick={() => togglePanel('codeeditor')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <Code className="w-4 h-4" />
                        Редактор кода
                      </button>
                      <button
                        onClick={() => togglePanel('testrunner')}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        <TestTube className="w-4 h-4" />
                        Тестирование
                      </button>
                      <button
                        onClick={() => togglePanel('gitmanager')}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                      >
                        <GitBranch className="w-4 h-4" />
                        Git
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Нижние панели */}
              {panels.filter(p => p.visible && p.position === 'bottom').length > 0 && (
                <div className="h-48 border-t border-gray-200 overflow-hidden">
                  {panels.filter(p => p.visible && p.position === 'bottom').map(renderPanel)}
                </div>
              )}
            </div>

            {/* Правая панель (если есть панели справа) */}
            {panels.filter(p => p.visible && p.position === 'right').length > 0 && (
              <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
                {panels.filter(p => p.visible && p.position === 'right').map(renderPanel)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Панель настроек */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Настройки инструментов</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Настройки конструктора форм */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Конструктор форм
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.formBuilder.showToolbox}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        formBuilder: { ...prev.formBuilder, showToolbox: e.target.checked }
                      }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Показать панель инструментов</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.formBuilder.snapToGrid}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        formBuilder: { ...prev.formBuilder, snapToGrid: e.target.checked }
                      }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Привязка к сетке</span>
                  </label>
                </div>
              </div>

              {/* Настройки редактора кода */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Редактор кода
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Тема</label>
                    <select
                      value={config.codeEditor.theme}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        codeEditor: { ...prev.codeEditor, theme: e.target.value as any }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="1c">1С темная</option>
                      <option value="dark">Темная</option>
                      <option value="light">Светлая</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Размер шрифта</label>
                    <input
                      type="number"
                      value={config.codeEditor.fontSize}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        codeEditor: { ...prev.codeEditor, fontSize: parseInt(e.target.value) }
                      }))}
                      min="10"
                      max="24"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.codeEditor.autocompleteEnabled}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        codeEditor: { ...prev.codeEditor, autocompleteEnabled: e.target.checked }
                      }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Автодополнение</span>
                  </label>
                </div>
              </div>

              {/* Настройки тестирования */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <TestTube className="w-4 h-4" />
                  Тестирование
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.testRunner.parallelExecution}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        testRunner: { ...prev.testRunner, parallelExecution: e.target.checked }
                      }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Параллельное выполнение</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.testRunner.screenshotsOnFailure}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        testRunner: { ...prev.testRunner, screenshotsOnFailure: e.target.checked }
                      }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Скриншоты при ошибках</span>
                  </label>
                </div>
              </div>

              {/* Настройки Git */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  Git интеграция
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.gitManager.autoSync}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        gitManager: { ...prev.gitManager, autoSync: e.target.checked }
                      }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Автоматическая синхронизация</span>
                  </label>
                </div>
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

export default DeveloperToolsPage;