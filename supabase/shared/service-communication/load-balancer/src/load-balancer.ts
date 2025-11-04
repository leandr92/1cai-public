/**
 * Load Balancer - балансировка нагрузки между экземплярами сервисов
 */

import { ServiceRegistry, ServiceInstance } from '../registry/src/service-registry';

export interface LoadBalancerConfig {
  strategy: LoadBalancingStrategy;
  healthCheckEnabled: boolean;
  circuitBreakerEnabled: boolean;
  circuitBreakerThreshold: number; // процент ошибок для открытия
  circuitBreakerTimeout: number; // ms
  maxRetries: number;
  retryDelay: number; // ms
}

export enum LoadBalancingStrategy {
  ROUND_ROBIN = 'round_robin',
  LEAST_CONNECTIONS = 'least_connections',
  RANDOM = 'random',
  WEIGHTED_ROUND_ROBIN = 'weighted_round_robin',
  WEIGHTED_RANDOM = 'weighted_random',
  IP_HASH = 'ip_hash'
}

export interface ServiceCallOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  circuitBreakerEnabled?: boolean;
  correlationId?: string;
}

export interface ServiceCallResult<T = any> {
  success: boolean;
  data?: T;
  status?: number;
  error?: string;
  instance?: ServiceInstance;
  attempts: number;
  totalTime: number;
  correlationId?: string;
}

export class LoadBalancer {
  private registry: ServiceRegistry;
  private config: LoadBalancerConfig;
  private roundRobinCounters: Map<string, number> = new Map();
  private connectionCounters: Map<string, number> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  constructor(registry: ServiceRegistry, config: Partial<LoadBalancerConfig> = {}) {
    this.registry = registry;
    this.config = {
      strategy: LoadBalancingStrategy.ROUND_ROBIN,
      healthCheckEnabled: true,
      circuitBreakerEnabled: true,
      circuitBreakerThreshold: 50,
      circuitBreakerTimeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
      ...config
    };
  }

  /**
   * Вызов сервиса с балансировкой нагрузки
   */
  async callService<T = any>(
    serviceName: string,
    path: string,
    options: ServiceCallOptions = {}
  ): Promise<ServiceCallResult<T>> {
    const startTime = Date.now();
    const attempts = options.retries || this.config.maxRetries;
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        // Получаем доступные экземпляры
        const availableInstances = this.getAvailableInstances(serviceName);
        
        if (availableInstances.length === 0) {
          throw new Error(`No available instances for service: ${serviceName}`);
        }

        // Выбираем экземпляр
        const instance = this.selectInstance(serviceName, availableInstances, options);
        
        if (!instance) {
          throw new Error(`No suitable instance found for service: ${serviceName}`);
        }

        // Проверяем circuit breaker
        if (this.config.circuitBreakerEnabled && options.circuitBreakerEnabled !== false) {
          const circuitBreaker = this.getCircuitBreaker(serviceName, instance.id);
          if (circuitBreaker.isOpen()) {
            throw new Error(`Circuit breaker is open for ${serviceName}@${instance.id}`);
          }
        }

        // Увеличиваем счетчик соединений
        this.incrementConnectionCount(serviceName, instance.id);

        try {
          // Выполняем запрос
          const result = await this.makeRequest<T>(instance, path, options);
          
          // Уменьшаем счетчик соединений
          this.decrementConnectionCount(serviceName, instance.id);

          // Записываем успех в circuit breaker
          if (this.config.circuitBreakerEnabled) {
            const circuitBreaker = this.getCircuitBreaker(serviceName, instance.id);
            circuitBreaker.recordSuccess();
          }

          return {
            success: true,
            data: result.data,
            status: result.status,
            instance,
            attempts: attempt,
            totalTime: Date.now() - startTime,
            correlationId: options.correlationId
          };
        } catch (error) {
          // Уменьшаем счетчик соединений при ошибке
          this.decrementConnectionCount(serviceName, instance.id);

          // Записываем неудачу в circuit breaker
          if (this.config.circuitBreakerEnabled) {
            const circuitBreaker = this.getCircuitBreaker(serviceName, instance.id);
            circuitBreaker.recordFailure();
          }

          lastError = error instanceof Error ? error.message : String(error);
          
          if (attempt < attempts) {
            await this.delay(this.config.retryDelay);
          }
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }
    }

    return {
      success: false,
      error: lastError || 'All attempts failed',
      attempts,
      totalTime: Date.now() - startTime,
      correlationId: options.correlationId
    };
  }

  /**
   * Выбор экземпляра по стратегии
   */
  private selectInstance(
    serviceName: string,
    instances: ServiceInstance[],
    options: ServiceCallOptions
  ): ServiceInstance | null {
    switch (this.config.strategy) {
      case LoadBalancingStrategy.ROUND_ROBIN:
        return this.roundRobinSelection(serviceName, instances);
      
      case LoadBalancingStrategy.LEAST_CONNECTIONS:
        return this.leastConnectionsSelection(instances);
      
      case LoadBalancingStrategy.RANDOM:
        return this.randomSelection(instances);
      
      case LoadBalancingStrategy.WEIGHTED_ROUND_ROBIN:
        return this.weightedRoundRobinSelection(serviceName, instances);
      
      case LoadBalancingStrategy.WEIGHTED_RANDOM:
        return this.weightedRandomSelection(instances);
      
      case LoadBalancingStrategy.IP_HASH:
        return this.ipHashSelection(instances, options.correlationId || 'default');
      
      default:
        return this.roundRobinSelection(serviceName, instances);
    }
  }

  /**
   * Round Robin выбор
   */
  private roundRobinSelection(serviceName: string, instances: ServiceInstance[]): ServiceInstance {
    const current = this.roundRobinCounters.get(serviceName) || 0;
    const next = current % instances.length;
    this.roundRobinCounters.set(serviceName, (current + 1) % instances.length);
    return instances[next];
  }

  /**
   * Least Connections выбор
   */
  private leastConnectionsSelection(instances: ServiceInstance[]): ServiceInstance {
    return instances.reduce((min, current) => {
      const minConnections = this.connectionCounters.get(min.id) || 0;
      const currentConnections = this.connectionCounters.get(current.id) || 0;
      return currentConnections < minConnections ? current : min;
    });
  }

  /**
   * Random выбор
   */
  private randomSelection(instances: ServiceInstance[]): ServiceInstance {
    const index = Math.floor(Math.random() * instances.length);
    return instances[index];
  }

  /**
   * Weighted Round Robin выбор
   */
  private weightedRoundRobinSelection(serviceName: string, instances: ServiceInstance[]): ServiceInstance {
    const weighted = instances.map(instance => {
      const weight = instance.metadata?.weight || 1;
      return { instance, weight };
    });

    const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;

    for (const { instance, weight } of weighted) {
      random -= weight;
      if (random <= 0) {
        return instance;
      }
    }

    return weighted[0].instance;
  }

  /**
   * Weighted Random выбор
   */
  private weightedRandomSelection(instances: ServiceInstance[]): ServiceInstance {
    const weights = instances.map(instance => instance.metadata?.weight || 1);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < instances.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return instances[i];
      }
    }
    
    return instances[0];
  }

  /**
   * IP Hash выбор
   */
  private ipHashSelection(instances: ServiceInstance[], ip: string): ServiceInstance {
    const hash = this.hashString(ip);
    const index = hash % instances.length;
    return instances[index];
  }

  /**
   * Хеш функция
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Выполнение HTTP запроса
   */
  private async makeRequest<T>(
    instance: ServiceInstance,
    path: string,
    options: ServiceCallOptions
  ): Promise<{ data: T; status: number }> {
    const url = `${instance.host}:${instance.port}${path}`;
    const controller = new AbortController();
    const timeout = options.timeout || 30000;

    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-ID': options.correlationId || this.generateCorrelationId(),
          ...options.headers
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { data, status: response.status };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Получение доступных экземпляров
   */
  private getAvailableInstances(serviceName: string): ServiceInstance[] {
    let instances = this.registry.getAvailableInstances(serviceName);
    
    if (this.config.healthCheckEnabled) {
      // Фильтруем экземпляры с открытыми circuit breaker
      instances = instances.filter(instance => {
        if (!this.config.circuitBreakerEnabled) return true;
        const circuitBreaker = this.getCircuitBreaker(serviceName, instance.id);
        return !circuitBreaker.isOpen();
      });
    }

    return instances;
  }

  /**
   * Получение circuit breaker для экземпляра
   */
  private getCircuitBreaker(serviceName: string, instanceId: string): CircuitBreaker {
    const key = `${serviceName}:${instanceId}`;
    
    if (!this.circuitBreakers.has(key)) {
      this.circuitBreakers.set(key, new CircuitBreaker(
        this.config.circuitBreakerThreshold,
        this.config.circuitBreakerTimeout
      ));
    }

    return this.circuitBreakers.get(key)!;
  }

  /**
   * Увеличение счетчика соединений
   */
  private incrementConnectionCount(serviceName: string, instanceId: string): void {
    const key = `${serviceName}:${instanceId}`;
    this.connectionCounters.set(key, (this.connectionCounters.get(key) || 0) + 1);
  }

  /**
   * Уменьшение счетчика соединений
   */
  private decrementConnectionCount(serviceName: string, instanceId: string): void {
    const key = `${serviceName}:${instanceId}`;
    const current = this.connectionCounters.get(key) || 0;
    this.connectionCounters.set(key, Math.max(0, current - 1));
  }

  /**
   * Получение статистики балансировки
   */
  getLoadBalancingStats(): {
    strategy: LoadBalancingStrategy;
    serviceStats: Map<string, {
      totalInstances: number;
      availableInstances: number;
      totalConnections: number;
    }>;
  } {
    const serviceStats = new Map();

    for (const [serviceName, instances] of this.registry.services.entries()) {
      const totalConnections = instances.reduce((sum, instance) => {
        return sum + (this.connectionCounters.get(instance.id) || 0);
      }, 0);

      serviceStats.set(serviceName, {
        totalInstances: instances.length,
        availableInstances: instances.filter(i => i.status === 'UP').length,
        totalConnections
      });
    }

    return {
      strategy: this.config.strategy,
      serviceStats
    };
  }

  /**
   * Генерация correlation ID
   */
  private generateCorrelationId(): string {
    return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Ожидание
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Circuit Breaker для защиты от каскадных сбоев
 */
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold: number, // процент ошибок для открытия
    private timeout: number // ms
  ) {}

  recordSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }

  isOpen(): boolean {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
        return false;
      }
      return true;
    }
    return false;
  }

  getState(): string {
    return this.state;
  }

  getFailureCount(): number {
    return this.failures;
  }
}