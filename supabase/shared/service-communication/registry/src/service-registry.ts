/**
 * Service Registry - регистрация и обнаружение сервисов
 */

export interface ServiceInstance {
  id: string;
  serviceName: string;
  host: string;
  port: number;
  version: string;
  healthCheckUrl: string;
  metadata: Record<string, any>;
  status: 'UP' | 'DOWN' | 'OUT_OF_SERVICE';
  registeredAt: Date;
  lastHeartbeat: Date;
}

export interface ServiceRegistration {
  serviceName: string;
  instanceId: string;
  host: string;
  port: number;
  version: string;
  healthCheckUrl: string;
  metadata?: Record<string, any>;
}

export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services: Map<string, ServiceInstance[]> = new Map();
  private subscriptions: Map<string, Set<ServiceUpdateCallback>> = new Map();

  static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  /**
   * Регистрация нового сервиса
   */
  async registerService(registration: ServiceRegistration): Promise<void> {
    const instance: ServiceInstance = {
      id: registration.instanceId,
      serviceName: registration.serviceName,
      host: registration.host,
      port: registration.port,
      version: registration.version,
      healthCheckUrl: registration.healthCheckUrl,
      metadata: registration.metadata || {},
      status: 'UP',
      registeredAt: new Date(),
      lastHeartbeat: new Date()
    };

    const instances = this.services.get(registration.serviceName) || [];
    
    // Удаляем старую регистрацию того же instanceId
    const filtered = instances.filter(s => s.id !== instance.id);
    filtered.push(instance);
    
    this.services.set(registration.serviceName, filtered);
    
    // Уведомляем подписчиков
    this.notifySubscribers(registration.serviceName, {
      type: 'SERVICE_REGISTERED',
      instance
    });

    console.log(`Service registered: ${registration.serviceName}@${instance.id}`);
  }

  /**
   * Удаление сервиса
   */
  async deregisterService(serviceName: string, instanceId: string): Promise<void> {
    const instances = this.services.get(serviceName) || [];
    const filtered = instances.filter(s => s.id !== instanceId);
    
    if (filtered.length === 0) {
      this.services.delete(serviceName);
    } else {
      this.services.set(serviceName, filtered);
    }

    // Уведомляем подписчиков
    this.notifySubscribers(serviceName, {
      type: 'SERVICE_DEREGISTERED',
      instanceId
    });

    console.log(`Service deregistered: ${serviceName}@${instanceId}`);
  }

  /**
   * Получение всех экземпляров сервиса
   */
  getInstances(serviceName: string): ServiceInstance[] {
    return this.services.get(serviceName) || [];
  }

  /**
   * Получение доступных экземпляров сервиса
   */
  getAvailableInstances(serviceName: string): ServiceInstance[] {
    return this.getInstances(serviceName)
      .filter(instance => instance.status === 'UP');
  }

  /**
   * Обновление состояния сервиса
   */
  updateInstanceStatus(serviceName: string, instanceId: string, status: ServiceInstance['status']): void {
    const instances = this.services.get(serviceName) || [];
    const instance = instances.find(s => s.id === instanceId);
    
    if (instance) {
      instance.status = status;
      instance.lastHeartbeat = new Date();
      
      this.notifySubscribers(serviceName, {
        type: 'SERVICE_STATUS_CHANGED',
        instance
      });
    }
  }

  /**
   * Обновление heartbeat сервиса
   */
  updateHeartbeat(serviceName: string, instanceId: string): void {
    const instances = this.services.get(serviceName) || [];
    const instance = instances.find(s => s.id === instanceId);
    
    if (instance) {
      instance.lastHeartbeat = new Date();
      if (instance.status === 'DOWN') {
        instance.status = 'UP';
      }
    }
  }

  /**
   * Поиск сервисов по паттерну
   */
  findServices(pattern: string): Array<{name: string, instances: number}> {
    return Array.from(this.services.entries())
      .filter(([name]) => name.includes(pattern))
      .map(([name, instances]) => ({ name, instances: instances.length }));
  }

  /**
   * Подписка на обновления сервиса
   */
  subscribe(serviceName: string, callback: ServiceUpdateCallback): () => void {
    const subscribers = this.subscriptions.get(serviceName) || new Set();
    subscribers.add(callback);
    this.subscriptions.set(serviceName, subscribers);

    // Возвращаем функцию отписки
    return () => {
      const subs = this.subscriptions.get(serviceName);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscriptions.delete(serviceName);
        }
      }
    };
  }

  /**
   * Получение списка всех зарегистрированных сервисов
   */
  getAllServices(): Array<{
    name: string;
    instances: number;
    availableInstances: number;
    status: ServiceInstance['status'];
  }> {
    return Array.from(this.services.entries()).map(([name, instances]) => ({
      name,
      instances: instances.length,
      availableInstances: instances.filter(i => i.status === 'UP').length,
      status: instances.length === 0 ? 'DOWN' : 
             instances.every(i => i.status === 'DOWN') ? 'DOWN' : 'UP'
    }));
  }

  private notifySubscribers(serviceName: string, update: ServiceUpdate): void {
    const subscribers = this.subscriptions.get(serviceName);
    if (subscribers) {
      subscribers.forEach(callback => callback(update));
    }
  }

  /**
   * Сборка мусора - удаление устаревших сервисов
   */
  async cleanup(heartbeatTimeoutMs: number = 30000): Promise<void> {
    const now = new Date();
    const timeout = heartbeatTimeoutMs;

    for (const [serviceName, instances] of this.services.entries()) {
      const activeInstances = instances.filter(instance => {
        const timeSinceHeartbeat = now.getTime() - instance.lastHeartbeat.getTime();
        return timeSinceHeartbeat < timeout;
      });

      if (activeInstances.length !== instances.length) {
        this.services.set(serviceName, activeInstances);
        
        this.notifySubscribers(serviceName, {
          type: 'SERVICES_CLEANED',
          removedCount: instances.length - activeInstances.length
        });
      }
    }
  }
}

export type ServiceUpdateCallback = (update: ServiceUpdate) => void;

export type ServiceUpdate =
  | { type: 'SERVICE_REGISTERED'; instance: ServiceInstance }
  | { type: 'SERVICE_DEREGISTERED'; instanceId: string }
  | { type: 'SERVICE_STATUS_CHANGED'; instance: ServiceInstance }
  | { type: 'SERVICES_CLEANED'; removedCount: number };