/**
 * Saga Pattern - управление распределенными транзакциями
 */

export interface SagaStep {
  id: string;
  name: string;
  service: string;
  operation: () => Promise<StepResult>;
  compensate?: () => Promise<void>;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
}

export interface StepResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface SagaContext {
  id: string;
  type: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'COMPENSATING' | 'COMPENSATED';
  steps: SagaStepExecution[];
  startTime: Date;
  endTime?: Date;
  error?: string;
  compensationStarted?: boolean;
  compensationCompleted?: boolean;
  metadata?: Record<string, any>;
}

export interface SagaStepExecution {
  stepId: string;
  stepName: string;
  service: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'COMPENSATING' | 'COMPENSATED';
  startTime?: Date;
  endTime?: Date;
  result?: StepResult;
  compensationResult?: StepResult;
  attempt: number;
  maxAttempts: number;
  error?: string;
}

export class SagaOrchestrator {
  private sagas: Map<string, SagaContext> = new Map();
  private stepExecutors: Map<string, (step: SagaStep) => Promise<StepResult>> = new Map();

  constructor() {
    // Регистрируем стандартные исполнители шагов
    this.registerDefaultExecutors();
  }

  /**
   * Регистрация исполнителя шагов
   */
  registerStepExecutor(service: string, executor: (step: SagaStep) => Promise<StepResult>): void {
    this.stepExecutors.set(service, executor);
  }

  /**
   * Создание новой саги
   */
  createSaga(type: string, steps: SagaStep[], metadata?: Record<string, any>): SagaContext {
    const sagaId = this.generateSagaId();
    
    const context: SagaContext = {
      id: sagaId,
      type,
      status: 'PENDING',
      steps: steps.map((step, index) => ({
        stepId: step.id,
        stepName: step.name,
        service: step.service,
        status: 'PENDING',
        attempt: 0,
        maxAttempts: step.retryCount || 3
      })),
      startTime: new Date(),
      metadata
    };

    this.sagas.set(sagaId, context);
    return context;
  }

  /**
   * Выполнение саги
   */
  async executeSaga(sagaId: string): Promise<SagaContext> {
    const saga = this.sagas.get(sagaId);
    if (!saga) {
      throw new Error(`Saga not found: ${sagaId}`);
    }

    saga.status = 'RUNNING';

    try {
      // Выполняем все шаги последовательно
      for (const stepExecution of saga.steps) {
        await this.executeStep(saga, stepExecution);
        
        if (stepExecution.status === 'FAILED') {
          throw new Error(`Step failed: ${stepExecution.stepName}`);
        }
      }

      saga.status = 'COMPLETED';
      saga.endTime = new Date();
      
      console.log(`Saga ${sagaId} completed successfully`);
      return saga;
    } catch (error) {
      saga.status = 'FAILED';
      saga.error = error instanceof Error ? error.message : String(error);
      saga.endTime = new Date();

      console.error(`Saga ${sagaId} failed:`, saga.error);
      return saga;
    }
  }

  /**
   * Компенсация саги
   */
  async compensateSaga(sagaId: string): Promise<SagaContext> {
    const saga = this.sagas.get(sagaId);
    if (!saga) {
      throw new Error(`Saga not found: ${sagaId}`);
    }

    saga.status = 'COMPENSATING';
    saga.compensationStarted = true;

    try {
      // Выполняем компенсацию в обратном порядке
      for (let i = saga.steps.length - 1; i >= 0; i--) {
        const stepExecution = saga.steps[i];
        
        if (stepExecution.status === 'COMPLETED') {
          await this.compensateStep(saga, stepExecution);
        }
      }

      saga.status = 'COMPENSATED';
      saga.compensationCompleted = true;
      saga.endTime = new Date();

      console.log(`Saga ${sagaId} compensated successfully`);
      return saga;
    } catch (error) {
      console.error(`Saga ${sagaId} compensation failed:`, error);
      return saga; // Оставляем статус COMPENSATING в случае неудачи
    }
  }

  /**
   * Выполнение одного шага
   */
  private async executeStep(saga: SagaContext, stepExecution: SagaStepExecution): Promise<void> {
    stepExecution.status = 'RUNNING';
    stepExecution.startTime = new Date();
    stepExecution.attempt++;

    const step = saga.steps.find(s => s.stepId === stepExecution.stepId);
    if (!step) {
      throw new Error(`Step not found: ${stepExecution.stepId}`);
    }

    const executor = this.stepExecutors.get(stepExecution.service);
    if (!executor) {
      throw new Error(`No executor found for service: ${stepExecution.service}`);
    }

    // Выполняем шаг с повторными попытками
    while (stepExecution.attempt <= stepExecution.maxAttempts) {
      try {
        const result = await this.executeWithTimeout(
          () => executor(step),
          step.timeout || 30000
        );

        stepExecution.result = result;
        stepExecution.endTime = new Date();

        if (result.success) {
          stepExecution.status = 'COMPLETED';
          break;
        } else {
          throw new Error(result.error || 'Step execution failed');
        }
      } catch (error) {
        stepExecution.error = error instanceof Error ? error.message : String(error);
        
        if (stepExecution.attempt >= stepExecution.maxAttempts) {
          stepExecution.status = 'FAILED';
          stepExecution.endTime = new Date();
          break;
        } else {
          // Ожидание перед повторной попыткой
          await this.delay(step.retryDelay || 1000);
        }
      }
    }
  }

  /**
   * Компенсация шага
   */
  private async compensateStep(saga: SagaContext, stepExecution: SagaStepExecution): Promise<void> {
    const step = saga.steps.find(s => s.stepId === stepExecution.stepId);
    if (!step || !step.compensate) {
      // Если нет компенсации, считаем успешным
      stepExecution.status = 'COMPENSATED';
      return;
    }

    stepExecution.status = 'COMPENSATING';

    try {
      await step.compensate();
      stepExecution.status = 'COMPENSATED';
      console.log(`Step compensated: ${stepExecution.stepName}`);
    } catch (error) {
      stepExecution.error = `Compensation failed: ${error instanceof Error ? error.message : String(error)}`;
      stepExecution.status = 'COMPENSATING'; // Оставляем в состоянии компенсации
      console.error(`Compensation failed for step ${stepExecution.stepName}:`, stepExecution.error);
    }
  }

  /**
   * Получение саги по ID
   */
  getSaga(sagaId: string): SagaContext | null {
    return this.sagas.get(sagaId) || null;
  }

  /**
   * Получение всех саг
   */
  getAllSagas(): SagaContext[] {
    return Array.from(this.sagas.values());
  }

  /**
   * Поиск саг по критериям
   */
  searchSagas(criteria: {
    type?: string;
    status?: string;
    service?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): SagaContext[] {
    let filtered = Array.from(this.sagas.values());

    if (criteria.type) {
      filtered = filtered.filter(saga => saga.type === criteria.type);
    }

    if (criteria.status) {
      filtered = filtered.filter(saga => saga.status === criteria.status);
    }

    if (criteria.service) {
      filtered = filtered.filter(saga => 
        saga.steps.some(step => step.service === criteria.service)
      );
    }

    if (criteria.startDate) {
      filtered = filtered.filter(saga => saga.startTime >= criteria.startDate!);
    }

    if (criteria.endDate) {
      filtered = filtered.filter(saga => 
        saga.startTime <= criteria.endDate!
      );
    }

    const limit = criteria.limit || 100;
    return filtered.slice(-limit);
  }

  /**
   * Получение статистики саг
   */
  getSagaStats(): {
    totalSagas: number;
    byStatus: Map<string, number>;
    byType: Map<string, number>;
    averageDuration: number;
    successRate: number;
  } {
    const sagas = Array.from(this.sagas.values());
    const total = sagas.length;

    const byStatus = new Map<string, number>();
    const byType = new Map<string, number>();
    
    let totalDuration = 0;
    let completedSagas = 0;

    for (const saga of sagas) {
      byStatus.set(saga.status, (byStatus.get(saga.status) || 0) + 1);
      byType.set(saga.type, (byType.get(saga.type) || 0) + 1);

      if (saga.endTime) {
        totalDuration += saga.endTime.getTime() - saga.startTime.getTime();
        completedSagas++;
      }
    }

    const averageDuration = completedSagas > 0 ? totalDuration / completedSagas : 0;
    const successRate = total > 0 ? (byStatus.get('COMPLETED') || 0) / total * 100 : 0;

    return {
      totalSagas: total,
      byStatus,
      byType,
      averageDuration,
      successRate
    };
  }

  /**
   * Регистрация стандартных исполнителей
   */
  private registerDefaultExecutors(): void {
    // HTTP Service Executor
    this.registerStepExecutor('http', async (step) => {
      // Здесь была бы логика вызова HTTP сервиса
      // Для примера возвращаем успех
      return {
        success: true,
        data: { message: `Step ${step.name} executed` }
      };
    });

    // Database Executor
    this.registerStepExecutor('database', async (step) => {
      // Здесь была бы логика работы с базой данных
      return {
        success: true,
        data: { message: `Database step ${step.name} executed` }
      };
    });
  }

  /**
   * Выполнение с таймаутом
   */
  private async executeWithTimeout<T>(operation: () => Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Step execution timeout')), timeout);
      })
    ]);
  }

  /**
   * Задержка
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Генерация ID саги
   */
  private generateSagaId(): string {
    return `saga_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Factory для создания стандартных саг
 */
export class SagaFactory {
  /**
   * Создание саги для обработки заказа
   */
  static createOrderProcessingSaga(orderId: string, customerId: string, items: any[]): SagaStep[] {
    return [
      {
        id: 'reserve-inventory',
        name: 'Reserve Inventory',
        service: 'inventory-service',
        operation: async () => {
          // Логика резервирования товаров
          return { success: true, data: { reserved: true } };
        },
        compensate: async () => {
          // Компенсация: освобождение товаров
          console.log('Compensating inventory reservation');
        }
      },
      {
        id: 'charge-payment',
        name: 'Charge Payment',
        service: 'payment-service',
        operation: async () => {
          // Логика списания средств
          return { success: true, data: { charged: true } };
        },
        compensate: async () => {
          // Компенсация: возврат средств
          console.log('Compensating payment charge');
        }
      },
      {
        id: 'send-confirmation',
        name: 'Send Order Confirmation',
        service: 'notification-service',
        operation: async () => {
          // Логика отправки уведомления
          return { success: true, data: { sent: true } };
        },
        compensate: async () => {
          // Компенсация: отмена уведомления (если возможно)
          console.log('Compensating notification send');
        }
      }
    ];
  }

  /**
   * Создание саги для перевода денег
   */
  static createMoneyTransferSaga(transferId: string, fromAccount: string, toAccount: string, amount: number): SagaStep[] {
    return [
      {
        id: 'debit-source',
        name: 'Debit Source Account',
        service: 'account-service',
        operation: async () => {
          // Логика списания с исходного счета
          return { success: true, data: { debited: amount } };
        },
        compensate: async () => {
          // Компенсация: возврат на исходный счет
          console.log('Compensating source account debit');
        }
      },
      {
        id: 'credit-destination',
        name: 'Credit Destination Account',
        service: 'account-service',
        operation: async () => {
          // Логика зачисления на целевой счет
          return { success: true, data: { credited: amount } };
        },
        compensate: async () => {
          // Компенсация: списание с целевого счета
          console.log('Compensating destination account credit');
        }
      },
      {
        id: 'notify-transfer',
        name: 'Notify Transfer Parties',
        service: 'notification-service',
        operation: async () => {
          // Логика уведомления сторон
          return { success: true, data: { notified: true } };
        },
        compensate: async () => {
          // Компенсация: отмена уведомления
          console.log('Compensating transfer notification');
        }
      }
    ];
  }

  /**
   * Создание саги для регистрации пользователя
   */
  static createUserRegistrationSaga(userId: string, email: string, profile: any): SagaStep[] {
    return [
      {
        id: 'create-user',
        name: 'Create User',
        service: 'user-service',
        operation: async () => {
          // Логика создания пользователя
          return { success: true, data: { userId } };
        },
        compensate: async () => {
          // Компенсация: удаление пользователя
          console.log('Compensating user creation');
        }
      },
      {
        id: 'send-verification',
        name: 'Send Email Verification',
        service: 'email-service',
        operation: async () => {
          // Логика отправки email подтверждения
          return { success: true, data: { sent: true } };
        },
        compensate: async () => {
          // Компенсация: отмена email
          console.log('Compensating email verification');
        }
      },
      {
        id: 'setup-profile',
        name: 'Setup User Profile',
        service: 'profile-service',
        operation: async () => {
          // Логика настройки профиля
          return { success: true, data: { profileCreated: true } };
        },
        compensate: async () => {
          // Компенсация: удаление профиля
          console.log('Compensating profile setup');
        }
      }
    ];
  }
}

/**
 * Утилиты для работы с сагами
 */
export class SagaUtils {
  /**
   * Проверка, можно ли компенсировать сагу
   */
  static canCompensate(saga: SagaContext): boolean {
    return saga.status === 'FAILED' && !saga.compensationCompleted;
  }

  /**
   * Проверка, завершена ли сага
   */
  static isCompleted(saga: SagaContext): boolean {
    return saga.status === 'COMPLETED' || saga.status === 'COMPENSATED';
  }

  /**
   * Получение длительности саги
   */
  static getDuration(saga: SagaContext): number {
    const endTime = saga.endTime || new Date();
    return endTime.getTime() - saga.startTime.getTime();
  }

  /**
   * Получение прогресса саги
   */
  static getProgress(saga: SagaContext): number {
    const completedSteps = saga.steps.filter(step => step.status === 'COMPLETED').length;
    return saga.steps.length > 0 ? (completedSteps / saga.steps.length) * 100 : 0;
  }
}