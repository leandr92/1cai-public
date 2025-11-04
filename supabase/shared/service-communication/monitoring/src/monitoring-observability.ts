/**
 * Monitoring & Observability - мониторинг и наблюдаемость микросервисов
 */

import { TracingService } from '../tracing/src/tracing-service';

export interface ServiceMetrics {
  serviceName: string;
  timestamp: Date;
  requests: RequestMetrics;
  performance: PerformanceMetrics;
  errors: ErrorMetrics;
  resources: ResourceMetrics;
  dependencies: DependencyMetrics[];
}

export interface RequestMetrics {
  total: number;
  successful: number;
  failed: number;
  averageLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  throughput: number; // requests per second
}

export interface PerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  responseTime: number;
  queueSize: number;
  activeConnections: number;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorRate: number;
  errorTypes: Map<string, number>;
  recentErrors: ErrorRecord[];
}

export interface ResourceMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

export interface DependencyMetrics {
  serviceName: string;
  status: 'UP' | 'DOWN' | 'DEGRADED';
  responseTime: number;
  errorRate: number;
  calls: number;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: AlertCondition;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  enabled: boolean;
  notificationChannels: string[];
  cooldown: number; // seconds
  lastTriggered?: Date;
}

export interface AlertCondition {
  metric: string;
  operator: '>' | '<' | '==' | '!=' | '>=' | '<=';
  threshold: number;
  duration: number; // seconds
  aggregation?: 'avg' | 'sum' | 'max' | 'min';
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  triggeredAt: Date;
  resolvedAt?: Date;
  status: 'ACTIVE' | 'RESOLVED' | 'SUPPRESSED';
  context: Record<string, any>;
}

export class MetricsCollector {
  private metrics: Map<string, ServiceMetrics[]> = new Map();
  private errorRecords: ErrorRecord[] = [];
  private maxMetricsHistory = 1000;
  private maxErrorsHistory = 10000;

  constructor(private tracingService: TracingService) {}

  /**
   * Запись метрик сервиса
   */
  recordServiceMetrics(serviceName: string, metrics: Omit<ServiceMetrics, 'serviceName' | 'timestamp'>): void {
    const fullMetrics: ServiceMetrics = {
      serviceName,
      timestamp: new Date(),
      ...metrics
    };

    const serviceMetrics = this.metrics.get(serviceName) || [];
    serviceMetrics.push(fullMetrics);

    // Ограничиваем размер истории
    if (serviceMetrics.length > this.maxMetricsHistory) {
      serviceMetrics.splice(0, serviceMetrics.length - this.maxMetricsHistory);
    }

    this.metrics.set(serviceName, serviceMetrics);

    // Проверяем правила алертинга
    this.checkAlertRules(serviceName, fullMetrics);
  }

  /**
   * Запись HTTP запроса
   */
  recordHttpRequest(
    serviceName: string,
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    error?: Error
  ): void {
    const serviceData = this.getOrCreateServiceMetrics(serviceName);
    
    // Обновляем метрики запросов
    serviceData.requests.total++;
    if (statusCode >= 200 && statusCode < 300) {
      serviceData.requests.successful++;
    } else {
      serviceData.requests.failed++;
    }

    // Обновляем метрики производительности
    this.updateLatencyMetrics(serviceData.requests, duration);

    // Записываем ошибку если есть
    if (error) {
      this.recordError(serviceName, {
        type: this.getErrorType(statusCode),
        message: error.message,
        service: serviceName,
        context: { method, path, statusCode },
        timestamp: new Date()
      });
    }

    this.recordServiceMetrics(serviceName, serviceData);
  }

  /**
   * Запись метрик производительности
   */
  recordPerformanceMetrics(serviceName: string, metrics: Omit<PerformanceMetrics, 'responseTime'>): void {
    const serviceData = this.getOrCreateServiceMetrics(serviceName);
    serviceData.performance = {
      ...serviceData.performance,
      ...metrics,
      responseTime: this.calculateAverageResponseTime(serviceName)
    };

    this.recordServiceMetrics(serviceName, serviceData);
  }

  /**
   * Запись метрик ресурсов
   */
  recordResourceMetrics(serviceName: string, metrics: ResourceMetrics): void {
    const serviceData = this.getOrCreateServiceMetrics(serviceName);
    serviceData.resources = metrics;
    this.recordServiceMetrics(serviceName, serviceData);
  }

  /**
   * Запись метрик зависимостей
   */
  recordDependencyMetrics(serviceName: string, dependencies: DependencyMetrics[]): void {
    const serviceData = this.getOrCreateServiceMetrics(serviceName);
    serviceData.dependencies = dependencies;
    this.recordServiceMetrics(serviceName, serviceData);
  }

  /**
   * Запись ошибки
   */
  recordError(serviceName: string, error: Omit<ErrorRecord, 'id'>): void {
    const errorRecord: ErrorRecord = {
      id: this.generateErrorId(),
      ...error,
      timestamp: error.timestamp || new Date()
    };

    this.errorRecords.push(errorRecord);

    // Ограничиваем размер истории ошибок
    if (this.errorRecords.length > this.maxErrorsHistory) {
      this.errorRecords = this.errorRecords.slice(-this.maxErrorsHistory);
    }

    // Обновляем метрики ошибок
    const serviceData = this.getOrCreateServiceMetrics(serviceName);
    serviceData.errors.totalErrors++;
    serviceData.errors.errorRate = (serviceData.errors.totalErrors / serviceData.requests.total) * 100;
    serviceData.errors.errorTypes.set(errorRecord.type, 
      (serviceData.errors.errorTypes.get(errorRecord.type) || 0) + 1
    );

    this.recordServiceMetrics(serviceName, serviceData);
  }

  /**
   * Получение текущих метрик сервиса
   */
  getCurrentMetrics(serviceName: string): ServiceMetrics | null {
    const serviceMetrics = this.metrics.get(serviceName);
    return serviceMetrics && serviceMetrics.length > 0 
      ? serviceMetrics[serviceMetrics.length - 1] 
      : null;
  }

  /**
   * Получение истории метрик сервиса
   */
  getMetricsHistory(serviceName: string, limit: number = 100): ServiceMetrics[] {
    const serviceMetrics = this.metrics.get(serviceName) || [];
    return serviceMetrics.slice(-limit);
  }

  /**
   * Получение метрик всех сервисов
   */
  getAllServicesMetrics(): ServiceMetrics[] {
    return Array.from(this.metrics.values())
      .map(metrics => metrics[metrics.length - 1])
      .filter(metrics => metrics !== undefined);
  }

  /**
   * Получение недавних ошибок
   */
  getRecentErrors(serviceName?: string, limit: number = 50): ErrorRecord[] {
    let errors = this.errorRecords;

    if (serviceName) {
      errors = errors.filter(error => error.service === serviceName);
    }

    return errors
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Получение общей статистики
   */
  getOverallStats(): {
    totalServices: number;
    totalRequests: number;
    totalErrors: number;
    averageResponseTime: number;
    errorRate: number;
    serviceStatus: Map<string, 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY'>;
  } {
    const allMetrics = this.getAllServicesMetrics();
    
    const totalRequests = allMetrics.reduce((sum, m) => sum + m.requests.total, 0);
    const totalErrors = allMetrics.reduce((sum, m) => sum + m.requests.failed, 0);
    const averageResponseTime = allMetrics.length > 0
      ? allMetrics.reduce((sum, m) => sum + m.requests.averageLatency, 0) / allMetrics.length
      : 0;

    const serviceStatus = new Map<string, 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY'>();
    
    for (const metrics of allMetrics) {
      let status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
      
      const errorRate = (metrics.requests.failed / metrics.requests.total) * 100;
      const avgLatency = metrics.requests.averageLatency;

      if (errorRate > 50 || avgLatency > 5000) {
        status = 'UNHEALTHY';
      } else if (errorRate > 10 || avgLatency > 2000) {
        status = 'DEGRADED';
      } else {
        status = 'HEALTHY';
      }

      serviceStatus.set(metrics.serviceName, status);
    }

    return {
      totalServices: allMetrics.length,
      totalRequests,
      totalErrors,
      averageResponseTime,
      errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
      serviceStatus
    };
  }

  /**
   * Проверка правил алертинга
   */
  private checkAlertRules(serviceName: string, metrics: ServiceMetrics): void {
    // Здесь была бы логика проверки правил алертинга
    // Для примера создаем несколько базовых проверок
  }

  /**
   * Получение или создание метрик сервиса
   */
  private getOrCreateServiceMetrics(serviceName: string): Omit<ServiceMetrics, 'serviceName' | 'timestamp'> {
    const current = this.getCurrentMetrics(serviceName);
    
    if (current) {
      return {
        requests: { ...current.requests },
        performance: { ...current.performance },
        errors: {
          totalErrors: current.errors.totalErrors,
          errorRate: current.errors.errorRate,
          errorTypes: new Map(current.errors.errorTypes),
          recentErrors: [...current.errors.recentErrors]
        },
        resources: { ...current.resources },
        dependencies: [...current.dependencies]
      };
    }

    // Создаем новые метрики
    return {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        averageLatency: 0,
        p50Latency: 0,
        p95Latency: 0,
        p99Latency: 0,
        throughput: 0
      },
      performance: {
        cpuUsage: 0,
        memoryUsage: 0,
        responseTime: 0,
        queueSize: 0,
        activeConnections: 0
      },
      errors: {
        totalErrors: 0,
        errorRate: 0,
        errorTypes: new Map<string, number>(),
        recentErrors: []
      },
      resources: {
        cpu: 0,
        memory: 0,
        disk: 0,
        network: 0
      },
      dependencies: []
    };
  }

  /**
   * Обновление метрик латентности
   */
  private updateLatencyMetrics(requests: RequestMetrics, latency: number): void {
    // Простая реализация обновления метрик латентности
    // В реальной системе здесь была бы более сложная логика
    requests.averageLatency = (requests.averageLatency * requests.total + latency) / (requests.total + 1);
    
    // Обновляем перцентили (упрощенно)
    requests.p50Latency = requests.averageLatency * 0.8;
    requests.p95Latency = requests.averageLatency * 1.5;
    requests.p99Latency = requests.averageLatency * 2;

    requests.throughput = requests.total; // Упрощенно
  }

  /**
   * Вычисление среднего времени отклика
   */
  private calculateAverageResponseTime(serviceName: string): number {
    const history = this.getMetricsHistory(serviceName, 10);
    if (history.length === 0) return 0;

    const total = history.reduce((sum, m) => sum + m.requests.averageLatency, 0);
    return total / history.length;
  }

  /**
   * Определение типа ошибки по коду статуса
   */
  private getErrorType(statusCode: number): string {
    if (statusCode >= 500) return 'SERVER_ERROR';
    if (statusCode >= 400) return 'CLIENT_ERROR';
    if (statusCode >= 300) return 'REDIRECT';
    return 'UNKNOWN';
  }

  /**
   * Генерация ID ошибки
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export class AlertingSystem {
  private rules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private notificationHandlers: Map<string, (alert: Alert) => Promise<void>> = new Map();

  /**
   * Создание правила алертинга
   */
  createRule(rule: Omit<AlertRule, 'id'>): string {
    const id = this.generateRuleId();
    const fullRule: AlertRule = {
      id,
      ...rule
    };

    this.rules.set(id, fullRule);
    return id;
  }

  /**
   * Обновление правила алертинга
   */
  updateRule(ruleId: string, updates: Partial<AlertRule>): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      Object.assign(rule, updates);
    }
  }

  /**
   * Удаление правила алертинга
   */
  deleteRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  /**
   * Получение всех правил
   */
  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Получение активных алертов
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values())
      .filter(alert => alert.status === 'ACTIVE');
  }

  /**
   * Получение всех алертов
   */
  getAllAlerts(limit: number = 100): Alert[] {
    return Array.from(this.activeAlerts.values())
      .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime())
      .slice(0, limit);
  }

  /**
   * Регистрация обработчика уведомлений
   */
  registerNotificationHandler(channel: string, handler: (alert: Alert) => Promise<void>): void {
    this.notificationHandlers.set(channel, handler);
  }

  /**
   * Проверка условий алертинга
   */
  checkAlerts(metrics: ServiceMetrics): void {
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      const metricValue = this.getMetricValue(metrics, rule.condition.metric);
      if (metricValue === null) continue;

      const conditionMet = this.evaluateCondition(metricValue, rule.condition.threshold, rule.condition.operator);
      
      if (conditionMet) {
        this.triggerAlert(rule, metrics, metricValue);
      } else {
        this.resolveAlert(rule.id, metrics);
      }
    }
  }

  /**
   * Триггер алерта
   */
  private triggerAlert(rule: AlertRule, metrics: ServiceMetrics, metricValue: number): void {
    const existingAlert = Array.from(this.activeAlerts.values())
      .find(alert => alert.ruleId === rule.id && alert.status === 'ACTIVE');

    if (existingAlert) {
      // Алерт уже активен
      return;
    }

    // Проверяем кулдаун
    if (rule.lastTriggered && this.isInCooldown(rule)) {
      return;
    }

    const alert: Alert = {
      id: this.generateAlertId(),
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      message: this.formatAlertMessage(rule, metricValue),
      triggeredAt: new Date(),
      status: 'ACTIVE',
      context: {
        serviceName: metrics.serviceName,
        metricValue,
        threshold: rule.condition.threshold
      }
    };

    this.activeAlerts.set(alert.id, alert);
    rule.lastTriggered = new Date();

    // Отправляем уведомления
    this.sendNotifications(alert);
  }

  /**
   * Разрешение алерта
   */
  private resolveAlert(ruleId: string, metrics: ServiceMetrics): void {
    const activeAlert = Array.from(this.activeAlerts.values())
      .find(alert => alert.ruleId === ruleId && alert.status === 'ACTIVE');

    if (activeAlert) {
      activeAlert.status = 'RESOLVED';
      activeAlert.resolvedAt = new Date();
    }
  }

  /**
   * Отправка уведомлений
   */
  private async sendNotifications(alert: Alert): Promise<void> {
    const rule = this.rules.get(alert.ruleId);
    if (!rule) return;

    for (const channel of rule.notificationChannels) {
      const handler = this.notificationHandlers.get(channel);
      if (handler) {
        try {
          await handler(alert);
        } catch (error) {
          console.error(`Failed to send alert to channel ${channel}:`, error);
        }
      }
    }
  }

  /**
   * Получение значения метрики
   */
  private getMetricValue(metrics: ServiceMetrics, metricPath: string): number | null {
    const parts = metricPath.split('.');
    let current: any = metrics;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return null;
      }
    }

    return typeof current === 'number' ? current : null;
  }

  /**
   * Оценка условия
   */
  private evaluateCondition(value: number, threshold: number, operator: string): boolean {
    switch (operator) {
      case '>': return value > threshold;
      case '<': return value < threshold;
      case '==': return value === threshold;
      case '!=': return value !== threshold;
      case '>=': return value >= threshold;
      case '<=': return value <= threshold;
      default: return false;
    }
  }

  /**
   * Проверка кулдауна
   */
  private isInCooldown(rule: AlertRule): boolean {
    if (!rule.lastTriggered) return false;
    
    const timeSinceLastTrigger = Date.now() - rule.lastTriggered.getTime();
    return timeSinceLastTrigger < rule.cooldown * 1000;
  }

  /**
   * Форматирование сообщения алерта
   */
  private formatAlertMessage(rule: AlertRule, metricValue: number): string {
    return `${rule.name}: ${rule.description} (текущее значение: ${metricValue}, порог: ${rule.condition.threshold})`;
  }

  /**
   * Генерация ID правила
   */
  private generateRuleId(): string {
    return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Генерация ID алерта
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Logger для структурированного логирования
 */
export class StructuredLogger {
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('INFO', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('WARN', message, context);
  }

  error(message: string, context?: Record<string, any>, error?: Error): void {
    this.log('ERROR', message, {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log('DEBUG', message, context);
  }

  private log(level: string, message: string, context?: Record<string, any>): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
      ...(context && { context })
    };

    // В production это должно отправляться в систему централизованного логирования
    console.log(JSON.stringify(logEntry));
  }
}

export interface ErrorRecord {
  id: string;
  type: string;
  message: string;
  service: string;
  context: Record<string, any>;
  timestamp: Date;
  stack?: string;
}