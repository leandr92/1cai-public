import React, { useState, useEffect, useRef } from 'react';
import { 
  Network, 
  Download, 
  Settings, 
  RefreshCw,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  AlertCircle,
  Code,
  Palette
} from 'lucide-react';
import mermaid from 'mermaid';
import { ArchitectureDiagram, SystemComponent, IntegrationPoint, DiagramType } from '../../services/mermaid-diagram-service';

interface MermaidDiagramViewerProps {
  diagram: ArchitectureDiagram;
  onUpdate?: (diagram: ArchitectureDiagram) => void;
  editable?: boolean;
  theme?: 'default' | 'dark' | 'forest' | 'neutral' | 'base' | 'null';
  className?: string;
}

interface DiagramTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  parameters: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array';
    default: any;
    description: string;
  }>;
}

const diagramTemplates: DiagramTemplate[] = [
  {
    id: 'system-architecture',
    name: 'Архитектура системы',
    description: 'Диаграмма компонентов системы с интеграциями',
    template: 'system-architecture',
    parameters: [
      { name: 'components', type: 'array', default: [], description: 'Компоненты системы' },
      { name: 'integrations', type: 'array', default: [], description: 'Точки интеграции' }
    ]
  },
  {
    id: 'sequence-diagram',
    name: 'Диаграмма последовательности',
    description: 'Последовательность действий в системе',
    template: 'sequence',
    parameters: [
      { name: 'title', type: 'string', default: 'Процесс выполнения', description: 'Заголовок диаграммы' },
      { name: 'steps', type: 'array', default: [], description: 'Шаги процесса' }
    ]
  },
  {
    id: 'class-diagram',
    name: 'Диаграмма классов',
    description: 'Объектная модель системы',
    template: 'class',
    parameters: [
      { name: 'classes', type: 'array', default: [], description: 'Классы системы' }
    ]
  },
  {
    id: 'state-diagram',
    name: 'Диаграмма состояний',
    description: 'Состояния и переходы системы',
    template: 'state',
    parameters: [
      { name: 'title', type: 'string', default: 'Состояния системы', description: 'Заголовок диаграммы' },
      { name: 'states', type: 'array', default: [], description: 'Состояния системы' }
    ]
  },
  {
    id: 'er-diagram',
    name: 'Диаграмма ER',
    description: 'Модель данных и связи',
    template: 'er',
    parameters: [
      { name: 'entities', type: 'array', default: [], description: 'Сущности БД' },
      { name: 'relationships', type: 'array', default: [], description: 'Связи между сущностями' }
    ]
  },
  {
    id: 'gantt-chart',
    name: 'Диаграмма Ганта',
    description: 'План выполнения проекта',
    template: 'gantt',
    parameters: [
      { name: 'title', type: 'string', default: 'Проектный план', description: 'Заголовок диаграммы' },
      { name: 'tasks', type: 'array', default: [], description: 'Задачи проекта' }
    ]
  }
];

const componentTypes = [
  { value: 'database', label: 'База данных', color: '#3b82f6' },
  { value: 'service', label: 'Микросервис', color: '#10b981' },
  { value: 'api', label: 'API Gateway', color: '#8b5cf6' },
  { value: 'frontend', label: 'Frontend', color: '#f59e0b' },
  { value: 'backend', label: 'Backend', color: '#ef4444' },
  { value: 'cache', label: 'Кэш', color: '#6b7280' },
  { value: 'queue', label: 'Очередь', color: '#ec4899' },
  { value: 'external', label: 'Внешняя система', color: '#6366f1' }
];

export const MermaidDiagramViewer: React.FC<MermaidDiagramViewerProps> = ({
  diagram,
  onUpdate,
  editable = false,
  theme = 'dark',
  className = ''
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [svgContent, setSvgContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DiagramType>(diagram.type as DiagramType);
  const [editableDiagram, setEditableDiagram] = useState<ArchitectureDiagram>(diagram);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    initializeMermaid();
    renderDiagram();
  }, [diagram, theme]);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [copied]);

  const initializeMermaid = async () => {
    try {
      const mermaidTheme = theme === 'dark' ? 'dark' : theme === 'forest' ? 'forest' : theme === 'neutral' ? 'neutral' : 'default';
      
      mermaid.initialize({
        startOnLoad: false,
        theme: mermaidTheme as 'default' | 'dark' | 'forest' | 'neutral' | 'base' | 'null',
        themeVariables: theme === 'dark' ? {
          primaryColor: '#3b82f6',
          primaryTextColor: '#fff',
          primaryBorderColor: '#1e40af',
          lineColor: '#64748b',
          secondaryColor: '#1e293b',
          tertiaryColor: '#334155',
          background: '#0f172a',
          mainBkg: '#1e293b',
          secondBkg: '#334155',
          tertiaryBkg: '#475569'
        } : undefined,
        securityLevel: 'loose',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 14,
        flowchart: {
          htmlLabels: true,
          curve: 'basis'
        },
        sequence: {
          actorMargin: 50,
          width: 150,
          height: 65,
          boxMargin: 10,
          boxTextMargin: 5,
          noteMargin: 10,
          messageMargin: 35,
          mirrorActors: true,
          bottomMarginAdj: 10,
          useMaxWidth: true,
          rightAngles: false,
          showSequenceNumbers: false
        }
      });
    } catch (err) {
      console.error('Failed to initialize Mermaid:', err);
      setError('Ошибка инициализации Mermaid');
      // Типизация ошибки: err может быть Error или любым другим типом
      if (err instanceof Error) {
        console.error('Error details:', err.message);
      }
    }
  };

  const renderDiagram = async () => {
    if (!diagram.mermaidCode) return;

    setIsLoading(true);
    setError(null);

    try {
      const { svg } = await mermaid.render(`mermaid-${diagram.id}`, diagram.mermaidCode || '');
      setSvgContent(svg);
    } catch (err) {
      console.error('Mermaid rendering error:', err);
      setError(`Ошибка рендеринга: ${err instanceof Error ? err.message : String(err)}`);
      // Типизация ошибки: проверяем, является ли err экземпляром Error
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      const code = diagram.mermaidCode || '';
      if (!code) return;
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch (err) {
      console.error('Failed to copy code:', err);
      // Типизация ошибки: err может быть Error или любым другим типом
    }
  };

  const handleDownloadSVG = () => {
    if (!svgRef.current) return;

    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `${(diagram.title || 'diagram').replace(/\s+/g, '_')}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  const handleDownloadPNG = async () => {
    if (!svgRef.current) return;

    try {
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = `${(diagram.title || 'diagram').replace(/\s+/g, '_')}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(url);
          }
        });
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    } catch (err) {
      console.error('Failed to download PNG:', err);
      // Типизация ошибки: err может быть Error или любым другим типом
    }
  };

  const handleExportMermaid = () => {
    const code = diagram.mermaidCode || '';
    const mermaidBlob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(mermaidBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `${(diagram.title || 'diagram').replace(/\s+/g, '_')}.mmd`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'text-green-400';
      case 'moderate': return 'text-yellow-400';
      case 'complex': return 'text-red-400';
      case 'unknown': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getTypeIcon = (type: DiagramType) => {
    switch (type) {
      case 'flowchart': return '🔄';
      case 'sequence': return '📊';
      case 'class': return '🏛️';
      case 'state': return '🔀';
      case 'gantt': return '📅';
      case 'er': return '🗃️';
      case 'user-journey': 
      case 'journey': return '🛤️';
      case 'mindmap': return '🧠';
      case 'timeline': return '📈';
      case 'requirement': return '📋';
      case 'gitgraph': return '🌿';
      default: return '📋';
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{getTypeIcon(diagram.type)}</div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{diagram.title}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Сложность: <span className={getComplexityColor(diagram.complexity || 'unknown')}>{diagram.complexity || 'unknown'}</span></span>
              <span>•</span>
              <span>{(diagram.tags || []).join(', ')}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {editable && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`p-2 rounded-lg transition-colors ${
                isEditing 
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={isEditing ? 'Режим просмотра' : 'Редактирование'}
            >
              <Settings size={16} />
            </button>
          )}

          <button
            onClick={handleCopyCode}
            className={`p-2 rounded-lg transition-colors ${
              copied 
                ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Копировать код"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>

          <button
            onClick={renderDiagram}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Перерисовать"
          >
            <RefreshCw size={16} />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={isFullscreen ? 'Выйти из полноэкранного режима' : 'Полноэкранный режим'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Description */}
      {diagram.description && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-700 dark:text-gray-300">{diagram.description || ''}</p>
        </div>
      )}

      {/* Diagram Content */}
      <div className="relative">
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3">
              <RefreshCw className="animate-spin text-blue-500" size={24} />
              <span className="text-gray-600 dark:text-gray-400">Рендеринг диаграммы...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-64 p-6">
            <div className="text-center">
              <AlertCircle className="text-red-500 mx-auto mb-2" size={32} />
              <p className="text-red-600 dark:text-red-400 font-medium">Ошибка рендеринга</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {!isLoading && !error && svgContent && (
          <div 
            className="p-4 overflow-auto max-h-96"
            dangerouslySetInnerHTML={{ __html: svgContent }}
            ref={(el) => {
              if (el) {
                const svg = el.querySelector('svg');
                if (svg) {
                  svg.style.maxWidth = '100%';
                  svg.style.height = 'auto';
                  svg.setAttribute('ref', 'svgRef');
                }
              }
            }}
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Формат: Mermaid • Сложность: {diagram.complexity || 'unknown'}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportMermaid}
            className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 rounded transition-colors"
            title="Экспорт в Mermaid"
          >
            <Code size={12} />
            MMD
          </button>

          <button
            onClick={handleDownloadSVG}
            className="flex items-center gap-1 px-3 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800 rounded transition-colors"
            title="Экспорт в SVG"
          >
            <Download size={12} />
            SVG
          </button>

          <button
            onClick={handleDownloadPNG}
            className="flex items-center gap-1 px-3 py-1 text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:hover:bg-purple-800 rounded transition-colors"
            title="Экспорт в PNG"
          >
            <Download size={12} />
            PNG
          </button>
        </div>
      </div>
    </div>
  );
};

export default MermaidDiagramViewer;

// Компонент для создания новых диаграмм
interface DiagramCreatorProps {
  onCreate: (diagram: ArchitectureDiagram) => void;
  onCancel: () => void;
}

export const DiagramCreator: React.FC<DiagramCreatorProps> = ({ onCreate, onCancel }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<DiagramType | ''>('');
  const [diagramTitle, setDiagramTitle] = useState('');
  const [diagramDescription, setDiagramDescription] = useState('');
  const [mermaidCode, setMermaidCode] = useState('');

  useEffect(() => {
    if (selectedTemplate && typeof selectedTemplate === 'string' && selectedTemplate.trim()) {
      const template = diagramTemplates.find(t => t.id === selectedTemplate);
      if (template) {
        // Загружаем пример кода для шаблона
        // В реальном приложении это будет из сервиса
        setMermaidCode(getTemplateExample(template.id));
      }
    }
  }, [selectedTemplate]);

  const getTemplateExample = (templateId: string): string => {
    const examples: Record<string, string> = {
      'system-architecture': `graph TB
  subgraph "Client Layer"
    WebApp[Web Application]
    MobileApp[Mobile App]
  end
  
  subgraph "API Layer"
    Gateway[API Gateway]
  end
  
  subgraph "Services"
    UserService[User Service]
    OrderService[Order Service]
  end
  
  subgraph "Data Layer"
    UserDB[(User Database)]
    OrderDB[(Order Database)]
  end
  
  WebApp --> Gateway
  MobileApp --> Gateway
  Gateway --> UserService
  Gateway --> OrderService
  UserService --> UserDB
  OrderService --> OrderDB`,
      
      'sequence': `sequenceDiagram
  participant Client
  participant Server
  participant Database
  
  Client->>Server: Request
  Server->>Database: Query
  Database-->>Server: Result
  Server-->>Client: Response`,
      
      'class': `classDiagram
  class User {
    +int id
    +string name
    +string email
    +login()
    +logout()
  }
  
  class Order {
    +int id
    +float amount
    +create()
    +cancel()
  }
  
  User ||--o{ Order : places`,
      
      'state': `stateDiagram-v2
  [*] --> Draft
  Draft --> Review
  Review --> Approved
  Approved --> Published
  Review --> Rejected
  Rejected --> Draft`,
      
      'er': `erDiagram
  CUSTOMER {
    string id PK
    string name
    string email
  }
  
  ORDER {
    string id PK
    string customer_id FK
    float amount
    date order_date
  }
  
  CUSTOMER ||--o{ ORDER : places`,
      
      'gantt': `gantt
  title Project Timeline
  dateFormat YYYY-MM-DD
  section Development
  Backend API    :2024-01-01, 30d
  Frontend       :2024-01-15, 25d
  Testing        :2024-02-10, 10d
  section Deployment
  Staging       :2024-02-20, 5d
  Production    :2024-02-25, 2d`
    };
    
    return examples[templateId] || '';
  };

  const handleCreate = () => {
    if (!diagramTitle || !mermaidCode || !selectedTemplate || (typeof selectedTemplate === 'string' && !selectedTemplate.trim())) return;

    const newDiagram: ArchitectureDiagram = {
      id: `diagram-${Date.now()}`,
      title: diagramTitle,
      description: diagramDescription,
      mermaidCode,
      type: (selectedTemplate as DiagramType) || 'flowchart',
      complexity: 'moderate',
      tags: ['generated']
    };

    onCreate(newDiagram);
  };

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Шаблон диаграммы
        </label>
        <select
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value as DiagramType)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="">Выберите шаблон...</option>
          {diagramTemplates.map(template => (
            <option key={template.id} value={template.id}>
              {template.name} - {template.description}
            </option>
          ))}
        </select>
      </div>

      {/* Diagram Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Название диаграммы
          </label>
          <input
            type="text"
            value={diagramTitle}
            onChange={(e) => setDiagramTitle(e.target.value)}
            placeholder="Введите название..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Описание
          </label>
          <input
            type="text"
            value={diagramDescription}
            onChange={(e) => setDiagramDescription(e.target.value)}
            placeholder="Краткое описание..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Mermaid Code Editor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Mermaid код
        </label>
        <textarea
          value={mermaidCode}
          onChange={(e) => setMermaidCode(e.target.value)}
          rows={12}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
          placeholder="Введите Mermaid код..."
        />
      </div>

      {/* Preview */}
      {mermaidCode && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Предварительный просмотр
          </label>
          <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
            <MermaidDiagramViewer
              diagram={{
                id: 'preview',
                title: diagramTitle || 'Предпросмотр',
                description: diagramDescription,
                mermaidCode,
                type: (selectedTemplate as DiagramType) || 'flowchart',
                complexity: 'moderate',
                tags: ['preview']
              }}
              editable={false}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          Отмена
        </button>
        <button
          onClick={handleCreate}
          disabled={!diagramTitle || !mermaidCode || !selectedTemplate || (typeof selectedTemplate === 'string' && !selectedTemplate.trim())}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          <Network size={16} />
          Создать диаграмму
        </button>
      </div>
    </div>
  );
};