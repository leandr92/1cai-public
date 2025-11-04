/**
 * Service Communication Setup - главный файл инициализации системы межсервисного взаимодействия
 */

import {
  ServiceRegistry,
  HealthChecker,
  LoadBalancer,
  HttpCommunication,
  AsyncMessageCommunication,
  EventDrivenCommunication,
  ServiceClient,
  ErrorHandler,
  RetryManager,
  TracingService,
  SagaOrchestrator,
  EventStoreFactory,
  AuditTrail,
  MetricsCollector,
  AlertingSystem,
  StructuredLogger,
  LoadBalancingStrategy
} from './index';

export interface ServiceCommunicationConfig {
  serviceName: string;
  serviceVersion: string;
  baseUrl: string;
  healthCheckPath?: string;
  
  // Supabase конфигурация
  supabaseUrl?: string;
  supabaseKey?: string;
  
  // Load balancer конфигурация
  loadBalancerStrategy?: LoadBalancingStrategy;
  circuitBreakerEnabled?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  
  // Tracing конфигурация
  tracingEnabled?: boolean;
  
  // Monitoring конфигурация
  metricsEnabled?: boolean;
  alertRules?: Array<{
    name: string;
    description: string;
    metric: string;
    operator: '>' | '<' | '==' | '!=' | '>=' | '<=';
    threshold: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }>;
  
  // Logging конфигурация
  logLevel?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
}

export class ServiceCommunicationManager {
  private static instance: ServiceCommunicationManager;
  
  private serviceName: string;
  private serviceVersion: string;
  private baseUrl: string;
  
  private serviceRegistry: ServiceRegistry;
  private healthChecker: HealthChecker;
  private loadBalancer: LoadBalancer;
  private tracingService: TracingService;
  private metricsCollector: MetricsCollector;
  private alertingSystem: AlertingSystem;
  private sagaOrchestrator: SagaOrchestrator;
  private auditTrail: AuditTrail;
  private logger: StructuredLogger;
  
  private httpCommunication?: HttpCommunication;
  private asyncCommunication?: AsyncMessageCommunication;
  private eventCommunication?: EventDrivenCommunication;
  private serviceClients: Map<string, ServiceClient> = new Map();
  
  private initialized = false;

  private constructor(config: ServiceCommunicationConfig) {
    this.serviceName = config.serviceName;
    this.serviceVersion = config.serviceVersion;
    this.baseUrl = config.baseUrl;
    
    // Инициализируем основные компоненты
    this.serviceRegistry = ServiceRegistry.getInstance();
    this.logger = new StructuredLogger(config.serviceName);
    
    if (config.tracingEnabled !== false) {
      this.tracingService = new TracingService();
    }
    
    if (config.metricsEnabled !== false) {
      this.metricsCollector = new MetricsCollector(this.tracingService);
      this.alertingSystem = new AlertingSystem();
    }
    
    // Настройка load balancer
    this.loadBalancer = new LoadBalancer(this.serviceRegistry, {
      strategy: config.loadBalancerStrategy || LoadBalancingStrategy.ROUND_ROBIN,
      circuitBreakerEnabled: config.circuitBreakerEnabled !== false,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000
    });
    
    // Настройка health checker
    this.healthChecker = new HealthChecker(this.serviceRegistry, {
      path: config.healthCheckPath || '/health'
    });
    
    // Настройка коммуникации
    this.setupCommunication(config);
    
    // Настройка саг и event sourcing
    this.sagaOrchestrator = new SagaOrchestrator();
    this.auditTrail = new AuditTrail(EventStoreFactory.createInMemoryEventStore());
    
    // Настройка алертов
    if (this.alertingSystem && config.alertRules) {
      this.setupAlertRules(config.alertRules);
    }
  }

  static getInstance(config?: ServiceCommunicationConfig): ServiceCommunicationManager {
    if (!ServiceCommunicationManager.instance && config) {
      ServiceCommunicationManager.instance = new ServiceCommunicationManager(config);
    }
    return ServiceCommunicationManager.instance;
  }

  /**
   * Инициализация системы
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      this.logger.info('Initializing Service Communication System', {
        serviceName: this.serviceName,
        version: this.serviceVersion,
        baseUrl: this.baseUrl
      });

      // Регистрируем текущий сервис
      await this.registerService();

      // Запускаем мониторинг
      this.startHealthMonitoring();
      
      if (this.metricsCollector) {
        this.startMetricsCollection();
      }
      
      if (this.alertingSystem) {
        this.startAlertChecking();
      }

      // Настраиваем обработчики событий
      this.setupEventHandlers();

      this.initialized = true;
      this.logger.info('Service Communication System initialized successfully');
      
    } catch (error) {
      this.logger.error('Failed to initialize Service Communication System', { error });
      throw error;
    }
  }

  /**
   * Регистрация сервиса в service registry
   */
  private async registerService(): Promise<void> {
    const instanceId = this.generateInstanceId();
    
    await this.serviceRegistry.registerService({
      serviceName: this.serviceName,
      instanceId,
      host: this.extractHostFromUrl(this.baseUrl),
      port: this.extractPortFromUrl(this.baseUrl),
      version: this.serviceVersion,
      healthCheckUrl: this.baseUrl + '/health',
      metadata: {
        serviceName: this.serviceName,
        version: this.serviceVersion,
        instanceId,
        capabilities: ['http', 'async', 'events']
      }
    });

    this.logger.info('Service registered in registry', { 
      serviceName: this.serviceName,
      instanceId 
    });
  }

  /**
   * Настройка коммуникации
   */
  private setupCommunication(config: ServiceCommunicationConfig): void {
    this.httpCommunication = new HttpCommunication(this.baseUrl, {
      timeout: 30000,
      headers: {
        'X-Service-Name': this.serviceName,
        'X-Service-Version': this.serviceVersion
      }
    });

    if (config.supabaseUrl && config.supabaseKey) {
      this.asyncCommunication = new AsyncMessageCommunication(
        config.supabaseUrl,
        config.supabaseKey
      );
      
      this.eventCommunication = new EventDrivenCommunication();
      
      this.logger.info('Async communication configured', {
        supabaseUrl: config.supabaseUrl
      });
    }
  }

  /**
   * Настройка правил алертинга
   */
  private setupAlertRules(rules: Array<any>): void {
    for (const rule of rules) {
      this.alertingSystem.createRule({
        name: rule.name,
        description: rule.description,
        condition: {
          metric: rule.metric,
          operator: rule.operator,
          threshold: rule.threshold,
          duration: 300 // 5 минут
        },
        severity: rule.severity,
        enabled: true,
        notificationChannels: ['console'],
        cooldown: 600 // 10 минут
      });
    }
  }

  /**
   * Создание Service Client для другого сервиса
   */
  createServiceClient(serviceName: string, options: {
    baseUrl?: string;
    version?: string;
    timeout?: number;
    retries?: number;
  } = {}): ServiceClient {
    const client = new ServiceClient({
      serviceName: this.serviceName,
      baseUrl: options.baseUrl || `http://${serviceName}`,
      version: options.version || '1.0.0',
      timeout: options.timeout || 30000,
      retries: options.retries || 3,
      circuitBreakerEnabled: true,
      tracingEnabled: true,
      metricsEnabled: true,
      supabaseUrl: this.asyncCommunication ? 'configured' : undefined,
      supabaseKey: this.asyncCommunication ? 'configured' : undefined
    });

    this.serviceClients.set(serviceName, client);
    return client;
  }

  /**
   * Получение Service Client
   */
  getServiceClient(serviceName: string): ServiceClient | null {
    return this.serviceClients.get(serviceName) || null;
  }

  /**
   * Асинхронная отправка сообщения
   */
  async sendAsyncMessage(channel: string, message: any): Promise<boolean> {
    if (!this.asyncCommunication) {
      throw new Error('Async communication not configured');
    }

    return await this.asyncCommunication.publish(channel, {
      id: this.generateMessageId(),
      type: 'service_message',
      sender: this.serviceName,
      payload: message,
      timestamp: new Date()
    });
  }

  /**
   * Подписка на асинхронные сообщения
   */
  subscribeToMessages(channel: string, handler: (message: any) => void): () => void {
    if (!this.asyncCommunication) {
      throw new Error('Async communication not configured');
    }

    return this.asyncCommunication.subscribe(channel, handler);
  }

  /**
   * Публикация события
   */
  async publishEvent(eventType: string, aggregateId: string, data: any): Promise<boolean> {
    if (!this.eventCommunication) {
      throw new Error('Event communication not configured');
    }

    return await this.eventCommunication.publish({
      id: this.generateEventId(),
      type: eventType,
      aggregateId,
      data,
      timestamp: new Date(),
      metadata: {
        service: this.serviceName,
        version: this.serviceVersion
      }
    });
  }

  /**
   * Подписка на события
   */
  subscribeToEvents(eventType: string, handler: (event: any) => void): () => void {
    if (!this.eventCommunication) {
      throw new Error('Event communication not configured');
    }

    return this.eventCommunication.subscribe(eventType, handler);
  }

  /**
   * Создание саги
   */
  createSaga(type: string, steps: any[]): any {
    return this.sagaOrchestrator.createSaga(type, steps);
  }

  /**
   * Выполнение саги
   */
  async executeSaga(sagaId: string): Promise<any> {
    return await this.sagaOrchestrator.executeSaga(sagaId);
  }

  /**
   * Компенсация саги
   */
  async compensateSaga(sagaId: string): Promise<any> {
    return await this.sagaOrchestrator.compensateSaga(sagaId);
  }

  /**
   * Запись в audit trail
   */
  async recordAuditEntry(
    resourceId: string,
    resourceType: string,
    action: string,
    actorId: string,
    metadata?: any
  ): Promise<void> {
    await this.auditTrail.recordAccess(resourceId, resourceType, actorId, action, metadata);
  }

  /**
   * Получение статистики сервиса
   */
  getServiceStats(): any {
    const registryStats = this.serviceRegistry.getAllServices();
    const healthStats = this.healthChecker.getHealthStats();
    const loadBalancerStats = this.loadBalancer.getLoadBalancingStats();
    
    const metrics = this.metricsCollector ? this.metricsCollector.getOverallStats() : null;
    const alerts = this.alertingSystem ? this.alertingSystem.getActiveAlerts() : [];

    return {
      service: {
        name: this.serviceName,
        version: this.serviceVersion,
        status: 'UP'
      },
      registry: registryStats,
      health: healthStats,
      loadBalancer: loadBalancerStats,
      metrics,
      alerts,
      timestamp: new Date()
    };
  }

  /**
   * Запуск health monitoring
   */
  private startHealthMonitoring(): void {
    const services = this.serviceRegistry.getAllServices();
    
    services.forEach(service => {
      if (service.instances > 0) {
        this.healthChecker.startMonitoring(service.name);
      }
    });

    this.logger.info('Health monitoring started', { 
      monitoredServices: services.length 
    });
  }

  /**
   * Запуск сбора метрик
   */
  private startMetricsCollection(): void {
    // Симуляция сбора метрик каждые 30 секунд
    setInterval(() => {
      this.collectMetrics();
    }, 30000);
  }

  /**
   * Запуск проверки алертов
   */
  private startAlertChecking(): void {
    // Проверка алертов каждые 60 секунд
    setInterval(() => {
      this.checkAlerts();
    }, 60000);
  }

  /**
   * Настройка обработчиков событий
   */
  private setupEventHandlers(): void {
    // Обработка регистрации/дерегистрации сервисов
    this.serviceRegistry.subscribe('*', (update) => {
      this.logger.info('Service registry update', { update });
      
      if (this.metricsCollector) {
        this.metricsCollector.recordError(this.serviceName, {
          type: 'SERVICE_REGISTRY_UPDATE',
          message: `Service registry updated: ${update.type}`,
          service: this.serviceName,
          context: update
        });
      }
    });
  }

  /**
   * Сбор метрик
   */
  private collectMetrics(): void {
    if (!this.metricsCollector) return;

    try {
      const stats = this.getServiceStats();
      
      this.metricsCollector.recordServiceMetrics(this.serviceName, {
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
          cpuUsage: 0, // В реальной системе получали бы из OS
          memoryUsage: 0, // В реальной системе получали бы из OS
          responseTime: 0,
          queueSize: 0,
          activeConnections: 0
        },
        errors: {
          totalErrors: 0,
          errorRate: 0,
          errorTypes: new Map(),
          recentErrors: []
        },
        resources: {
          cpu: 0,
          memory: 0,
          disk: 0,
          network: 0
        },
        dependencies: stats.registry.map(service => ({
          serviceName: service.name,
          status: service.status as 'UP' | 'DOWN',
          responseTime: 0,
          errorRate: 0,
          calls: 0
        }))
      });
    } catch (error) {
      this.logger.error('Failed to collect metrics', { error });
    }
  }

  /**
   * Проверка алертов
   */
  private checkAlerts(): void {
    if (!this.alertingSystem || !this.metricsCollector) return;

    const currentMetrics = this.metricsCollector.getCurrentMetrics(this.serviceName);
    if (currentMetrics) {
      this.alertingSystem.checkAlerts(currentMetrics);
    }
  }

  /**
   * Извлечение хоста из URL
   */
  private extractHostFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return 'localhost';
    }
  }

  /**
   * Извлечение порта из URL
   */
  private extractPortFromUrl(url: string): number {
    try {
      const urlObj = new URL(url);
      return parseInt(urlObj.port) || (urlObj.protocol === 'https:' ? 443 : 80);
    } catch {
      return 3000;
    }
  }

  /**
   * Генерация ID экземпляра
   */
  private generateInstanceId(): string {
    return `${this.serviceName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Генерация ID сообщения
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Генерация ID события
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Очистка ресурсов
   */
  destroy(): void {
    if (this.tracingService) {
      this.tracingService.destroy();
    }

    // Очищаем service clients
    this.serviceClients.forEach(client => client.destroy());
    this.serviceClients.clear();

    this.logger.info('Service Communication System destroyed');
  }
}

// Экспорт фабричного метода для удобства использования
export function createServiceCommunication(config: ServiceCommunicationConfig): ServiceCommunicationManager {
  return ServiceCommunicationManager.getInstance(config);
}

// Экспорт типа конфигурации
export type { ServiceCommunicationConfig };