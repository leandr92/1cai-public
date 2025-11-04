import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Cpu, 
  Database, 
  Shield,
  RefreshCw,
  Download,
  FileText,
  BarChart3,
  PieChart,
  TrendingDown
} from 'lucide-react';
import { 
  PerformanceMetrics, 
  ScalabilityProjection, 
  PerformanceBottleneck, 
  OptimizationRecommendation 
} from '../../services/performance-calculator-service';

interface PerformanceDashboardProps {
  metrics: PerformanceMetrics;
  projection?: ScalabilityProjection;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  className?: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
  icon: React.ComponentType<any>;
  description?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  unit, 
  trend, 
  status, 
  icon: Icon, 
  description 
}) => {
  const statusColors = {
    good: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400',
    critical: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
  };

  const trendIcons = {
    up: TrendingUp,
    down: TrendingDown,
    stable: Activity
  };

  const TrendIcon = trend ? trendIcons[trend] : Activity;

  return (
    <div className={`p-4 rounded-lg border-2 transition-all ${statusColors[status]}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon size={20} />
        {trend && <TrendIcon size={16} className="opacity-60" />}
      </div>
      <div className="mb-1">
        <span className="text-2xl font-bold">{value}</span>
        {unit && <span className="text-sm ml-1 opacity-75">{unit}</span>}
      </div>
      <div className="text-sm opacity-90">{title}</div>
      {description && <div className="text-xs mt-1 opacity-75">{description}</div>}
    </div>
  );
};

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  metrics,
  projection,
  onMetricsUpdate,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'bottlenecks' | 'optimization' | 'projection'>('overview');
  const [bottlenecks, setBottlenecks] = useState<PerformanceBottleneck[]>([]);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    analyzePerformance();
  }, [metrics]);

  const analyzePerformance = async () => {
    setLoading(true);
    try {
      // Импортируем сервис
      const { performanceCalculatorService } = await import('../../services/performance-calculator-service');
      
      // Анализируем узкие места (создаем массив из одного элемента)
      const detectedBottlenecks = await performanceCalculatorService.analyzeBottlenecks([metrics]);
      setBottlenecks(detectedBottlenecks);

      // Генерируем рекомендации
      const generatedRecommendations = await performanceCalculatorService.generateOptimizationRecommendations(
        [metrics],
        detectedBottlenecks
      );
      setRecommendations(generatedRecommendations);
    } catch (error) {
      console.error('Performance analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusFromValue = (value: number, thresholds: { good: number; warning: number }): 'good' | 'warning' | 'critical' => {
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.warning) return 'warning';
    return 'critical';
  };

  const getResponseTimeStatus = (time: number): 'good' | 'warning' | 'critical' => {
    if (time <= 100) return 'good';
    if (time <= 500) return 'warning';
    return 'critical';
  };

  const getThroughputStatus = (throughput: number): 'good' | 'warning' | 'critical' => {
    if (throughput >= 1000) return 'good';
    if (throughput >= 500) return 'warning';
    return 'critical';
  };

  const getCpuStatus = (cpu: number): 'good' | 'warning' | 'critical' => {
    if (cpu <= 70) return 'good';
    if (cpu <= 85) return 'warning';
    return 'critical';
  };

  const getMemoryStatus = (memory: number): 'good' | 'warning' | 'critical' => {
    if (memory <= 1024) return 'good';
    if (memory <= 4096) return 'warning';
    return 'critical';
  };

  const getCacheStatus = (hitRate: number): 'good' | 'warning' | 'critical' => {
    if (hitRate >= 90) return 'good';
    if (hitRate >= 70) return 'warning';
    return 'critical';
  };

  const getErrorStatus = (errorRate: number): 'good' | 'warning' | 'critical' => {
    if (errorRate <= 0.1) return 'good';
    if (errorRate <= 1) return 'warning';
    return 'critical';
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds.toFixed(0)}с`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}м ${remainingSeconds}с`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'moderate': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400';
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'moderate': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400';
      case 'urgent': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getBottleneckIcon = (type: string) => {
    switch (type) {
      case 'cpu': return Cpu;
      case 'memory': return Activity;
      case 'database': return Database;
      case 'network': return TrendingUp;
      case 'io': return RefreshCw;
      case 'cache': return Shield;
      default: return AlertTriangle;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Обзор', icon: BarChart3 },
    { id: 'bottlenecks', label: 'Узкие места', icon: AlertTriangle },
    { id: 'optimization', label: 'Оптимизация', icon: TrendingUp },
    { id: 'projection', label: 'Прогноз', icon: PieChart }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="text-blue-600" size={24} />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Калькулятор производительности
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={analyzePerformance}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
            Анализ
          </button>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
            <Download size={16} />
            Отчет
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Время отклика"
              value={metrics.responseTime}
              unit="мс"
              status={getResponseTimeStatus(metrics.responseTime)}
              icon={Clock}
              description="Среднее время обработки запроса"
            />
            
            <MetricCard
              title="Пропускная способность"
              value={metrics.throughput}
              unit="req/s"
              trend={metrics.throughput > 1000 ? 'up' : 'down'}
              status={getThroughputStatus(metrics.throughput)}
              icon={TrendingUp}
              description="Количество запросов в секунду"
            />
            
            <MetricCard
              title="Использование CPU"
              value={metrics.cpuUsage}
              unit="%"
              trend={metrics.cpuUsage > 80 ? 'up' : 'down'}
              status={getCpuStatus(metrics.cpuUsage)}
              icon={Cpu}
              description="Загрузка процессора"
            />
            
            <MetricCard
              title="Использование памяти"
              value={Math.round(metrics.memoryUsage / 1024)}
              unit="GB"
              trend={metrics.memoryUsage > 2048 ? 'up' : 'down'}
              status={getMemoryStatus(metrics.memoryUsage)}
              icon={Activity}
              description="Оперативная память"
            />
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Эффективность кэша"
              value={metrics.cacheHitRate}
              unit="%"
              status={getCacheStatus(metrics.cacheHitRate)}
              icon={Shield}
              description="Процент попаданий в кэш"
            />
            
            <MetricCard
              title="Соединения с БД"
              value={metrics.databaseConnections}
              unit=""
              status={metrics.databaseConnections > 100 ? 'warning' : 'good'}
              icon={Database}
              description="Активные соединения"
            />
            
            <MetricCard
              title="Уровень ошибок"
              value={metrics.errorRate}
              unit="%"
              status={getErrorStatus(metrics.errorRate)}
              icon={XCircle}
              description="Процент ошибок"
            />
          </div>

          {/* Overall Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Общий статус системы
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">A</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Общая оценка</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">99.9%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Доступность</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">85%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Производительность</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">72%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Безопасность</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottlenecks Tab */}
      {activeTab === 'bottlenecks' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Выявленные узкие места ({bottlenecks.length})
          </h3>
          
          {bottlenecks.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
              <p className="text-gray-600 dark:text-gray-400">Критических узких мест не обнаружено</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bottlenecks.map((bottleneck, index) => {
                const Icon = getBottleneckIcon(bottleneck.type);
                return (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getSeverityColor(bottleneck.severity)}`}>
                          <Icon size={16} />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {bottleneck.component}
                            </h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(bottleneck.severity)}`}>
                              {bottleneck.severity}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {bottleneck.description}
                          </p>
                          
                          <div className="space-y-1">
                            <p className="text-sm">
                              <span className="font-medium text-gray-700 dark:text-gray-300">Влияние:</span>
                              <span className="text-gray-600 dark:text-gray-400 ml-1">{bottleneck.impact}</span>
                            </p>
                            
                            <p className="text-sm">
                              <span className="font-medium text-gray-700 dark:text-gray-300">Рекомендация:</span>
                              <span className="text-gray-600 dark:text-gray-400 ml-1">{bottleneck.recommendation}</span>
                            </p>
                            
                            <p className="text-sm">
                              <span className="font-medium text-gray-700 dark:text-gray-300">Ожидаемое улучшение:</span>
                              <span className="text-green-600 dark:text-green-400 ml-1">+{bottleneck.estimatedImprovement}%</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Optimization Tab */}
      {activeTab === 'optimization' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Рекомендации по оптимизации ({recommendations.length})
          </h3>
          
          {recommendations.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="mx-auto text-blue-500 mb-2" size={32} />
              <p className="text-gray-600 dark:text-gray-400">Нет доступных рекомендаций</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.map((recommendation, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {recommendation.title}
                        </h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(recommendation.priority)}`}>
                          {recommendation.priority}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {recommendation.description}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Усилия</span>
                          <div className="text-sm text-gray-900 dark:text-white">{recommendation.estimatedEffort}</div>
                        </div>
                        
                        <div>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Влияние</span>
                          <div className="text-sm text-gray-900 dark:text-white">{recommendation.estimatedImpact}</div>
                        </div>
                        
                        <div>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">ROI</span>
                          <div className="text-sm text-green-600 dark:text-green-400">
                            {recommendation.roi.savings > 0 ? '+' : ''}{((recommendation.roi.savings / recommendation.roi.investment) * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                      
                      {recommendation.steps && recommendation.steps.length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Шаги реализации:</span>
                          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            {recommendation.steps.slice(0, 3).map((step, stepIndex) => (
                              <li key={stepIndex} className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    <button className="ml-4 px-3 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 rounded transition-colors">
                      Выполнить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Projection Tab */}
      {activeTab === 'projection' && projection && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Прогноз масштабирования
          </h3>
          
          {/* Growth Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {projection.currentUsers.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Текущие пользователи</div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {projection.projectedUsers.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Прогнозируемые пользователи</div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {projection.growthRate}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Рост в год</div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {projection.timeHorizon}г
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Временной горизонт</div>
            </div>
          </div>

          {/* Scaling Recommendations */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
              Рекомендации по масштабированию
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Горизонтальное масштабирование серверов: +{Math.ceil((projection.projectedUsers / projection.currentUsers - 1) * 100)}%
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Оптимизация базы данных: шардирование при объеме {'>'}100GB
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Внедрение CDN для статического контента
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceDashboard;