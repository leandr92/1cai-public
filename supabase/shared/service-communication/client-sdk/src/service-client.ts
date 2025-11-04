/**
 * Service Client SDK - SDK для работы с микросервисами
 */

import { HttpCommunication, AsyncMessageCommunication, EventDrivenCommunication } from '../communication/src/inter-service-communication';
import { LoadBalancer } from '../load-balancer/src/load-balancer';
import { CircuitBreaker } from '../circuit-breaker/src/circuit-breaker';
import { TracingService } from '../tracing/src/tracing-service';
import { ErrorHandler } from './error-handler';
import { RetryManager } from './retry-manager';

export interface ServiceClientConfig {
  serviceName: string;
  version?: string;
  baseUrl: string;
  timeout?: number;
  retries?: number;
  circuitBreakerEnabled?: boolean;
  tracingEnabled?: boolean;
  metricsEnabled?: boolean;
  supabaseUrl?: string;
  supabaseKey?: string;
}

export interface ServiceMethodOptions {
  timeout?: number;
  retries?: number;
  circuitBreakerEnabled?: boolean;
  correlationId?: string;
  metadata?: Record<string, any>;
}

export class ServiceClient {
  private serviceName: string;
  private version: string;
  private httpClient: HttpCommunication;
  private asyncClient?: AsyncMessageCommunication;
  private eventClient?: EventDrivenCommunication;
  private loadBalancer?: LoadBalancer;
  private circuitBreaker: CircuitBreaker;
  private tracingService?: TracingService;
  private errorHandler: ErrorHandler;
  private retryManager: RetryManager;
  private metrics: ClientMetrics;

  constructor(config: ServiceClientConfig) {
    this.serviceName = config.serviceName;
    this.version = config.version || '1.0.0';
    this.httpClient = new HttpCommunication(config.baseUrl, {
      timeout: config.timeout || 30000,
      headers: {
        'X-Service-Name': this.serviceName,
        'X-Service-Version': this.version
      }
    });

    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 50,
      timeout: 30000,
      resetTimeout: 60000
    });

    this.errorHandler = new ErrorHandler();
    this.retryManager = new RetryManager(config.retries || 3);
    this.metrics = new ClientMetrics();

    if (config.supabaseUrl && config.supabaseKey) {
      this.asyncClient = new AsyncMessageCommunication(config.supabaseUrl, config.supabaseKey);
      this.eventClient = new EventDrivenCommunication();
    }

    if (config.tracingEnabled) {
      this.tracingService = new TracingService();
    }
  }

  /**
   * HTTP GET запрос
   */
  async get<T = any>(
    path: string,
    options: ServiceMethodOptions = {}
  ): Promise<ServiceClientResult<T>> {
    const span = this.createSpan('GET', path, options);

    try {
      const result = await this.executeWithRetry(
        () => this.makeHttpRequest('GET', path, options),
        options
      );

      this.metrics.recordRequest(this.serviceName, 'GET', path, true, result.duration);
      span.finish();

      return {
        success: result.success,
        data: result.data,
        error: result.error,
        duration: result.duration,
        correlationId: result.correlationId
      };
    } catch (error) {
      this.metrics.recordRequest(this.serviceName, 'GET', path, false);
      this.errorHandler.handleError(error, {
        service: this.serviceName,
        method: 'GET',
        path,
        options
      });
      span.recordError(error);
      span.finish();

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: 0,
        correlationId: options.correlationId
      };
    }
  }

  /**
   * HTTP POST запрос
   */
  async post<T = any>(
    path: string,
    data?: any,
    options: ServiceMethodOptions = {}
  ): Promise<ServiceClientResult<T>> {
    const span = this.createSpan('POST', path, options);

    try {
      const result = await this.executeWithRetry(
        () => this.makeHttpRequest('POST', path, { ...options, body: data }),
        options
      );

      this.metrics.recordRequest(this.serviceName, 'POST', path, true, result.duration);
      span.finish();

      return {
        success: result.success,
        data: result.data,
        error: result.error,
        duration: result.duration,
        correlationId: result.correlationId
      };
    } catch (error) {
      this.metrics.recordRequest(this.serviceName, 'POST', path, false);
      this.errorHandler.handleError(error, {
        service: this.serviceName,
        method: 'POST',
        path,
        options
      });
      span.recordError(error);
      span.finish();

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: 0,
        correlationId: options.correlationId
      };
    }
  }

  /**
   * HTTP PUT запрос
   */
  async put<T = any>(
    path: string,
    data?: any,
    options: ServiceMethodOptions = {}
  ): Promise<ServiceClientResult<T>> {
    return this.request('PUT', path, data, options);
  }

  /**
   * HTTP PATCH запрос
   */
  async patch<T = any>(
    path: string,
    data?: any,
    options: ServiceMethodOptions = {}
  ): Promise<ServiceClientResult<T>> {
    return this.request('PATCH', path, data, options);
  }

  /**
   * HTTP DELETE запрос
   */
  async delete<T = any>(
    path: string,
    options: ServiceMethodOptions = {}
  ): Promise<ServiceClientResult<T>> {
    return this.request('DELETE', path, undefined, options);
  }

  /**
   * Асинхронная отправка сообщения
   */
  async sendMessage(
    channel: string,
    message: any,
    options: ServiceMethodOptions = {}
  ): Promise<boolean> {
    if (!this.asyncClient) {
      throw new Error('Async messaging not configured');
    }

    const correlationId = options.correlationId || this.generateCorrelationId();
    const msg = {
      id: correlationId,
      type: 'service_message',
      sender: this.serviceName,
      payload: message,
      timestamp: new Date(),
      correlationId
    };

    try {
      return await this.asyncClient.publish(channel, msg);
    } catch (error) {
      this.errorHandler.handleError(error, {
        service: this.serviceName,
        action: 'send_message',
        channel,
        message
      });
      return false;
    }
  }

  /**
   * Подписка на сообщения
   */
  subscribeToMessages(
    channel: string,
    handler: (message: any) => void | Promise<void>
  ): () => void {
    if (!this.asyncClient) {
      throw new Error('Async messaging not configured');
    }

    const messageHandler = (msg: any) => {
      const span = this.createSpan('MESSAGE_RECEIVED', `channel:${channel}`, {
        correlationId: msg.correlationId
      });

      try {
        handler(msg.payload);
        span.finish();
      } catch (error) {
        this.errorHandler.handleError(error, {
          service: this.serviceName,
          action: 'message_handler',
          channel,
          message: msg
        });
        span.recordError(error);
        span.finish();
      }
    };

    return this.asyncClient.subscribe(channel, messageHandler);
  }

  /**
   * Публикация события
   */
  async publishEvent(
    eventType: string,
    aggregateId: string,
    data: any,
    options: ServiceMethodOptions = {}
  ): Promise<boolean> {
    if (!this.eventClient) {
      throw new Error('Event publishing not configured');
    }

    const correlationId = options.correlationId || this.generateCorrelationId();
    const event = {
      id: correlationId,
      type: eventType,
      aggregateId,
      data,
      timestamp: new Date(),
      metadata: {
        service: this.serviceName,
        version: this.version,
        ...options.metadata
      }
    };

    try {
      return await this.eventClient.publish(event);
    } catch (error) {
      this.errorHandler.handleError(error, {
        service: this.serviceName,
        action: 'publish_event',
        eventType,
        aggregateId,
        event
      });
      return false;
    }
  }

  /**
   * Подписка на события
   */
  subscribeToEvents(
    eventType: string,
    handler: (event: any) => void | Promise<void>
  ): () => void {
    if (!this.eventClient) {
      throw new Error('Event subscription not configured');
    }

    const eventHandler = (event: any) => {
      const span = this.createSpan('EVENT_RECEIVED', `event:${eventType}`, {
        correlationId: event.id
      });

      try {
        handler(event);
        span.finish();
      } catch (error) {
        this.errorHandler.handleError(error, {
          service: this.serviceName,
          action: 'event_handler',
          eventType,
          event
        });
        span.recordError(error);
        span.finish();
      }
    };

    return this.eventClient.subscribe(eventType, eventHandler);
  }

  /**
   * Выполнение запроса с повторными попытками
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: ServiceMethodOptions
  ): Promise<T> {
    const maxRetries = options.retries || 3;
    const circuitBreakerEnabled = options.circuitBreakerEnabled !== false;

    return this.retryManager.executeWithRetry(operation, {
      maxRetries,
      shouldRetry: (error) => {
        // Не повторяем для клиентских ошибок (4xx)
        if (error.message.includes('HTTP 4')) {
          return false;
        }
        return circuitBreakerEnabled ? !this.circuitBreaker.isOpen() : true;
      },
      onRetry: (attempt, error) => {
        console.warn(`Retry attempt ${attempt} for ${this.serviceName}:`, error.message);
        if (circuitBreakerEnabled && attempt > 1) {
          this.circuitBreaker.recordFailure();
        }
      },
      onSuccess: () => {
        if (circuitBreakerEnabled) {
          this.circuitBreaker.recordSuccess();
        }
      }
    });
  }

  /**
   * Выполнение HTTP запроса
   */
  private async makeHttpRequest(
    method: string,
    path: string,
    options: ServiceMethodOptions & { body?: any }
  ): Promise<any> {
    const correlationId = options.correlationId || this.generateCorrelationId();

    const httpOptions = {
      headers: {
        'X-Correlation-ID': correlationId,
        ...options.metadata
      },
      timeout: options.timeout || 30000
    };

    switch (method) {
      case 'GET':
        return await this.httpClient.get(path, httpOptions);
      case 'POST':
        return await this.httpClient.post(path, options.body, httpOptions);
      case 'PUT':
        return await this.httpClient.put(path, options.body, httpOptions);
      case 'PATCH':
        return await this.httpClient.patch(path, options.body, httpOptions);
      case 'DELETE':
        return await this.httpClient.delete(path, httpOptions);
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
  }

  /**
   * Универсальный метод запроса
   */
  private async request<T>(
    method: string,
    path: string,
    data?: any,
    options: ServiceMethodOptions = {}
  ): Promise<ServiceClientResult<T>> {
    const span = this.createSpan(method, path, options);

    try {
      const result = await this.executeWithRetry(
        () => this.makeHttpRequest(method, path, { ...options, body: data }),
        options
      );

      this.metrics.recordRequest(this.serviceName, method, path, true, result.duration);
      span.finish();

      return {
        success: result.success,
        data: result.data,
        error: result.error,
        duration: result.duration,
        correlationId: result.correlationId
      };
    } catch (error) {
      this.metrics.recordRequest(this.serviceName, method, path, false);
      this.errorHandler.handleError(error, {
        service: this.serviceName,
        method,
        path,
        options
      });
      span.recordError(error);
      span.finish();

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: 0,
        correlationId: options.correlationId
      };
    }
  }

  /**
   * Создание tracing span
   */
  private createSpan(operation: string, target: string, options: ServiceMethodOptions): any {
    if (!this.tracingService) {
      return { finish: () => {}, recordError: () => {} };
    }

    return this.tracingService.startSpan(`${operation} ${target}`, {
      correlationId: options.correlationId,
      service: this.serviceName,
      metadata: options.metadata
    });
  }

  /**
   * Получение метрик клиента
   */
  getMetrics(): ClientMetricsData {
    return this.metrics.getData();
  }

  /**
   * Получение состояния circuit breaker
   */
  getCircuitBreakerStatus(): CircuitBreakerStatus {
    return {
      state: this.circuitBreaker.getState(),
      failureCount: this.circuitBreaker.getFailureCount(),
      lastFailureTime: this.circuitBreaker.getLastFailureTime()
    };
  }

  /**
   * Генерация correlation ID
   */
  private generateCorrelationId(): string {
    return `svc_${this.serviceName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Очистка ресурсов
   */
  destroy(): void {
    this.metrics.clear();
    if (this.tracingService) {
      this.tracingService.destroy();
    }
  }
}

/**
 * Результат вызова сервиса
 */
export interface ServiceClientResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  duration: number;
  correlationId?: string;
}

/**
 * Метрики клиента
 */
class ClientMetrics {
  private requests: RequestMetrics[] = [];

  recordRequest(service: string, method: string, path: string, success: boolean, duration?: number): void {
    this.requests.push({
      service,
      method,
      path,
      success,
      duration: duration || 0,
      timestamp: new Date()
    });

    // Ограничиваем количество хранимых записей
    if (this.requests.length > 10000) {
      this.requests = this.requests.slice(-5000);
    }
  }

  getData(): ClientMetricsData {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentRequests = this.requests.filter(r => r.timestamp > last24h);

    const totalRequests = recentRequests.length;
    const successfulRequests = recentRequests.filter(r => r.success).length;
    const avgDuration = recentRequests.length > 0
      ? recentRequests.reduce((sum, r) => sum + r.duration, 0) / recentRequests.length
      : 0;

    const requestsByMethod = recentRequests.reduce((acc, r) => {
      acc[r.method] = (acc[r.method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const requestsByService = recentRequests.reduce((acc, r) => {
      acc[r.service] = (acc[r.service] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRequests,
      successfulRequests,
      failedRequests: totalRequests - successfulRequests,
      successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
      avgDuration,
      requestsByMethod,
      requestsByService,
      requests
    };
  }

  clear(): void {
    this.requests = [];
  }
}

interface RequestMetrics {
  service: string;
  method: string;
  path: string;
  success: boolean;
  duration: number;
  timestamp: Date;
}

export interface ClientMetricsData {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;
  avgDuration: number;
  requestsByMethod: Record<string, number>;
  requestsByService: Record<string, number>;
  requests: RequestMetrics[];
}

/**
 * Circuit Breaker для Service Client
 */
class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;

  constructor(private config: {
    failureThreshold: number;
    timeout: number;
    resetTimeout: number;
  }) {}

  isOpen(): boolean {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
        this.state = 'HALF_OPEN';
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState(): string {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }

  getLastFailureTime(): number {
    return this.lastFailureTime;
  }
}

interface CircuitBreakerStatus {
  state: string;
  failureCount: number;
  lastFailureTime: number;
}