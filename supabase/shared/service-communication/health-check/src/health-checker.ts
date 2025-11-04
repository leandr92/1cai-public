/**
 * Health Checker - мониторинг состояния сервисов
 */

import { ServiceRegistry, ServiceInstance } from '../registry/src/service-registry';

export interface HealthCheckConfig {
  interval: number; // ms между проверками
  timeout: number; // ms таймаут запроса
  retries: number; // количество попыток
  retryDelay: number; // ms задержка между попытками
  path: string; // путь для проверки здоровья
}

export interface HealthCheckResult {
  instanceId: string;
  serviceName: string;
  status: 'HEALTHY' | 'UNHEALTHY' | 'TIMEOUT' | 'ERROR';
  responseTime: number; // ms
  error?: string;
  checkedAt: Date;
  attempts: number;
}

export class HealthChecker {
  private registry: ServiceRegistry;
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private config: HealthCheckConfig;

  constructor(registry: ServiceRegistry, config: Partial<HealthCheckConfig> = {}) {
    this.registry = registry;
    this.config = {
      interval: 30000, // 30 секунд
      timeout: 5000,   // 5 секунд
      retries: 3,
      retryDelay: 1000, // 1 секунда
      path: '/health',
      ...config
    };
  }

  /**
   * Начало мониторинга сервиса
   */
  startMonitoring(serviceName: string): void {
    const intervalKey = `monitor:${serviceName}`;
    
    if (this.intervals.has(intervalKey)) {
      return; // Уже мониторится
    }

    const interval = setInterval(() => {
      this.checkService(serviceName);
    }, this.config.interval);

    this.intervals.set(intervalKey, interval);

    // Начинаем первую проверку немедленно
    this.checkService(serviceName);
    
    console.log(`Started health monitoring for ${serviceName}`);
  }

  /**
   * Остановка мониторинга сервиса
   */
  stopMonitoring(serviceName: string): void {
    const intervalKey = `monitor:${serviceName}`;
    const interval = this.intervals.get(intervalKey);
    
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(intervalKey);
      console.log(`Stopped health monitoring for ${serviceName}`);
    }
  }

  /**
   * Проверка здоровья всех сервисов
   */
  async checkAllServices(): Promise<HealthCheckResult[]> {
    const services = this.registry.getAllServices();
    const results: HealthCheckResult[] = [];

    for (const service of services) {
      if (service.instances > 0) {
        const serviceResults = await this.checkService(service.name);
        results.push(...serviceResults);
      }
    }

    return results;
  }

  /**
   * Проверка здоровья конкретного сервиса
   */
  async checkService(serviceName: string): Promise<HealthCheckResult[]> {
    const instances = this.registry.getInstances(serviceName);
    const results: HealthCheckResult[] = [];

    for (const instance of instances) {
      const result = await this.checkInstance(instance);
      results.push(result);
    }

    return results;
  }

  /**
   * Проверка здоровья конкретного экземпляра
   */
  async checkInstance(instance: ServiceInstance): Promise<HealthCheckResult> {
    const startTime = Date.now();
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        const response = await this.makeHealthCheck(instance, attempt);
        const responseTime = Date.now() - startTime;

        const result: HealthCheckResult = {
          instanceId: instance.id,
          serviceName: instance.serviceName,
          status: response.ok ? 'HEALTHY' : 'UNHEALTHY',
          responseTime,
          error: response.ok ? undefined : response.statusText,
          checkedAt: new Date(),
          attempts: attempt
        };

        // Обновляем статус в реестре
        this.registry.updateInstanceStatus(
          instance.serviceName,
          instance.id,
          response.ok ? 'UP' : 'DOWN'
        );

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        await this.delay(this.config.retryDelay);
      }
    }

    // Все попытки исчерпаны
    const responseTime = Date.now() - startTime;
    const finalStatus = lastError?.includes('timeout') ? 'TIMEOUT' : 'ERROR';

    this.registry.updateInstanceStatus(instance.serviceName, instance.id, 'DOWN');

    return {
      instanceId: instance.id,
      serviceName: instance.serviceName,
      status: finalStatus,
      responseTime,
      error: lastError,
      checkedAt: new Date(),
      attempts: this.config.retries
    };
  }

  /**
   * Выполнение HTTP запроса для проверки здоровья
   */
  private async makeHealthCheck(instance: ServiceInstance, attempt: number): Promise<Response> {
    const url = `${instance.host}:${instance.port}${this.config.path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': `HealthChecker/1.0 (attempt ${attempt})`,
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Получение статистики здоровья сервисов
   */
  getHealthStats(): {
    totalServices: number;
    healthyServices: number;
    unhealthyServices: number;
    totalInstances: number;
    healthyInstances: number;
    unhealthyInstances: number;
  } {
    const services = this.registry.getAllServices();
    const allInstances = Array.from(this.registry.services.values()).flat();

    return {
      totalServices: services.length,
      healthyServices: services.filter(s => s.status === 'UP').length,
      unhealthyServices: services.filter(s => s.status === 'DOWN').length,
      totalInstances: allInstances.length,
      healthyInstances: allInstances.filter(i => i.status === 'UP').length,
      unhealthyInstances: allInstances.filter(i => i.status === 'DOWN').length
    };
  }

  /**
   * Получение истории проверок для сервиса
   */
  getHealthHistory(serviceName: string, limit: number = 100): HealthCheckResult[] {
    // В реальной реализации здесь была бы база данных
    // Для примера возвращаем пустой массив
    return [];
  }

  /**
   * Ожидание
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Очистка ресурсов
   */
  destroy(): void {
    for (const interval of this.intervals.values()) {
      clearInterval(interval);
    }
    this.intervals.clear();
  }
}

/**
 * Custom Health Check для специфических проверок
 */
export interface CustomHealthCheck {
  name: string;
  check: (instance: ServiceInstance) => Promise<{
    status: 'HEALTHY' | 'UNHEALTHY';
    message?: string;
    metadata?: Record<string, any>;
  }>;
}

export class CompositeHealthChecker extends HealthChecker {
  private customChecks: Map<string, CustomHealthCheck> = new Map();

  addCustomCheck(check: CustomHealthCheck): void {
    this.customChecks.set(check.name, check);
  }

  removeCustomCheck(name: string): void {
    this.customChecks.delete(name);
  }

  async checkInstance(instance: ServiceInstance): Promise<HealthCheckResult> {
    // Сначала базовая проверка
    const baseResult = await super.checkInstance(instance);

    // Затем кастомные проверки
    for (const check of this.customChecks.values()) {
      try {
        const customResult = await check.check(instance);
        if (customResult.status === 'UNHEALTHY' && baseResult.status === 'HEALTHY') {
          baseResult.status = 'UNHEALTHY';
          baseResult.error = customResult.message;
          this.registry.updateInstanceStatus(instance.serviceName, instance.id, 'DOWN');
        }
      } catch (error) {
        console.error(`Custom health check ${check.name} failed:`, error);
      }
    }

    return baseResult;
  }
}