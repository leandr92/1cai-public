/**
 * Error Handler - обработка ошибок в межсервисном взаимодействии
 */

export interface ErrorContext {
  service?: string;
  method?: string;
  action?: string;
  path?: string;
  channel?: string;
  message?: any;
  eventType?: string;
  aggregateId?: string;
  event?: any;
  options?: any;
  correlationId?: string;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Map<string, number>;
  errorsByService: Map<string, number>;
  errorsByCode: Map<string, number>;
  recentErrors: ErrorRecord[];
}

export class ErrorHandler {
  private errorCounts: Map<string, number> = new Map();
  private errorTypes: Map<string, number> = new Map();
  private serviceErrors: Map<string, number> = new Map();
  private recentErrors: ErrorRecord[] = [];
  private maxRecentErrors = 1000;

  /**
   * Обработка ошибки
   */
  handleError(error: any, context: ErrorContext): void {
    const errorRecord: ErrorRecord = {
      id: this.generateErrorId(),
      type: this.getErrorType(error),
      message: error.message || String(error),
      service: context.service || 'unknown',
      context,
      timestamp: new Date(),
      stack: error.stack
    };

    // Записываем в лог
    this.logError(errorRecord);

    // Обновляем метрики
    this.updateMetrics(errorRecord);

    // Выполняем действия на основе типа ошибки
    this.handleByErrorType(error, context);
  }

  /**
   * Определение типа ошибки
   */
  private getErrorType(error: any): string {
    if (error.name) return error.name;
    if (error.code) return `HTTP_${error.code}`;
    if (error.message?.includes('timeout')) return 'TIMEOUT';
    if (error.message?.includes('network')) return 'NETWORK';
    if (error.message?.includes('circuit breaker')) return 'CIRCUIT_BREAKER';
    return 'UNKNOWN';
  }

  /**
   * Логирование ошибки
   */
  private logError(error: ErrorRecord): void {
    const logEntry = {
      level: 'ERROR',
      timestamp: error.timestamp.toISOString(),
      errorId: error.id,
      type: error.type,
      message: error.message,
      service: error.service,
      context: error.context,
      stack: error.stack
    };

    console.error('[ErrorHandler]', JSON.stringify(logEntry));
  }

  /**
   * Обновление метрик
   */
  private updateMetrics(error: ErrorRecord): void {
    // Общий счетчик ошибок
    this.errorCounts.set('total', (this.errorCounts.get('total') || 0) + 1);

    // По типу ошибки
    this.errorTypes.set(error.type, (this.errorTypes.get(error.type) || 0) + 1);

    // По сервису
    this.serviceErrors.set(error.service, (this.serviceErrors.get(error.service) || 0) + 1);

    // Добавляем в недавние ошибки
    this.recentErrors.push(error);

    // Ограничиваем размер массива
    if (this.recentErrors.length > this.maxRecentErrors) {
      this.recentErrors = this.recentErrors.slice(-this.maxRecentErrors);
    }
  }

  /**
   * Обработка по типу ошибки
   */
  private handleByErrorType(error: any, context: ErrorContext): void {
    const errorMessage = error.message || String(error);

    switch (true) {
      case errorMessage.includes('timeout'):
        this.handleTimeoutError(error, context);
        break;
      case errorMessage.includes('network'):
        this.handleNetworkError(error, context);
        break;
      case errorMessage.includes('HTTP 4'):
        this.handleClientError(error, context);
        break;
      case errorMessage.includes('HTTP 5'):
        this.handleServerError(error, context);
        break;
      case errorMessage.includes('circuit breaker'):
        this.handleCircuitBreakerError(error, context);
        break;
      default:
        this.handleUnknownError(error, context);
    }
  }

  /**
   * Обработка ошибок timeout
   */
  private handleTimeoutError(error: any, context: ErrorContext): void {
    console.warn(`[ErrorHandler] Timeout error in ${context.service}:`, error.message);
    
    // Можно добавить специфичную логику для timeout
    // Например, уведомление системы мониторинга
  }

  /**
   * Обработка сетевых ошибок
   */
  private handleNetworkError(error: any, context: ErrorContext): void {
    console.warn(`[ErrorHandler] Network error in ${context.service}:`, error.message);
    
    // Сетевые ошибки могут требовать немедленной повторной попытки
  }

  /**
   * Обработка клиентских ошибок (4xx)
   */
  private handleClientError(error: any, context: ErrorContext): void {
    console.error(`[ErrorHandler] Client error in ${context.service}:`, error.message);
    
    // Клиентские ошибки обычно не повторяются
    // Можно логировать для анализа проблем с API
  }

  /**
   * Обработка серверных ошибок (5xx)
   */
  private handleServerError(error: any, context: ErrorContext): void {
    console.error(`[ErrorHandler] Server error in ${context.service}:`, error.message);
    
    // Серверные ошибки могут повторяться с задержкой
  }

  /**
   * Обработка ошибок circuit breaker
   */
  private handleCircuitBreakerError(error: any, context: ErrorContext): void {
    console.warn(`[ErrorHandler] Circuit breaker error in ${context.service}:`, error.message);
    
    // Circuit breaker ошибки указывают на проблемы с сервисом
  }

  /**
   * Обработка неизвестных ошибок
   */
  private handleUnknownError(error: any, context: ErrorContext): void {
    console.error(`[ErrorHandler] Unknown error in ${context.service}:`, error.message);
  }

  /**
   * Получение метрик ошибок
   */
  getMetrics(): ErrorMetrics {
    const recentErrors24h = this.recentErrors.filter(
      error => Date.now() - error.timestamp.getTime() < 24 * 60 * 60 * 1000
    );

    return {
      totalErrors: this.errorCounts.get('total') || 0,
      errorsByType: this.errorTypes,
      errorsByService: this.serviceErrors,
      errorsByCode: this.extractErrorCodes(),
      recentErrors: recentErrors24h
    };
  }

  /**
   * Извлечение кодов ошибок
   */
  private extractErrorCodes(): Map<string, number> {
    const codes = new Map<string, number>();
    
    for (const error of this.recentErrors) {
      const code = this.extractErrorCode(error);
      if (code) {
        codes.set(code, (codes.get(code) || 0) + 1);
      }
    }

    return codes;
  }

  /**
   * Извлечение кода ошибки
   */
  private extractErrorCode(error: ErrorRecord): string | null {
    const match = error.message.match(/HTTP (\d{3})/);
    return match ? match[1] : null;
  }

  /**
   * Получение недавних ошибок сервиса
   */
  getRecentErrorsByService(service: string, limit: number = 50): ErrorRecord[] {
    return this.recentErrors
      .filter(error => error.service === service)
      .slice(-limit);
  }

  /**
   * Получение ошибок по типу
   */
  getErrorsByType(errorType: string, limit: number = 50): ErrorRecord[] {
    return this.recentErrors
      .filter(error => error.type === errorType)
      .slice(-limit);
  }

  /**
   * Анализ тенденций ошибок
   */
  getErrorTrends(): {
    totalErrors24h: number;
    errorRateByHour: Map<string, number>;
    topErrorTypes: Array<{ type: string; count: number }>;
    topErrorServices: Array<{ service: string; count: number }>;
  } {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentErrors = this.recentErrors.filter(e => e.timestamp > last24h);

    const errorRateByHour = new Map<string, number>();
    
    // Группируем по часам
    for (let i = 0; i < 24; i++) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourKey = hour.toISOString().substr(0, 13); // YYYY-MM-DDTHH
      errorRateByHour.set(hourKey, 0);
    }

    for (const error of recentErrors) {
      const hourKey = error.timestamp.toISOString().substr(0, 13);
      errorRateByHour.set(hourKey, (errorRateByHour.get(hourKey) || 0) + 1);
    }

    // Топ ошибки по типам
    const topErrorTypes = Array.from(this.errorTypes.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Топ ошибки по сервисам
    const topErrorServices = Array.from(this.serviceErrors.entries())
      .map(([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalErrors24h: recentErrors.length,
      errorRateByHour,
      topErrorTypes,
      topErrorServices
    };
  }

  /**
   * Очистка старых ошибок
   */
  cleanup(olderThanHours: number = 168): void { // 7 дней по умолчанию
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    this.recentErrors = this.recentErrors.filter(error => error.timestamp > cutoff);
  }

  /**
   * Генерация ID ошибки
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Retry Manager - управление повторными попытками
 */
export class RetryManager {
  private defaultMaxRetries: number;

  constructor(defaultMaxRetries: number = 3) {
    this.defaultMaxRetries = defaultMaxRetries;
  }

  /**
   * Выполнение операции с повторными попытками
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: {
      maxRetries?: number;
      shouldRetry?: (error: any) => boolean;
      onRetry?: (attempt: number, error: any) => void;
      onSuccess?: () => void;
      baseDelay?: number;
      maxDelay?: number;
      exponentialBackoff?: boolean;
    } = {}
  ): Promise<T> {
    const {
      maxRetries = this.defaultMaxRetries,
      shouldRetry = () => true,
      onRetry,
      onSuccess,
      baseDelay = 1000,
      maxDelay = 30000,
      exponentialBackoff = true
    } = options;

    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        
        if (attempt > 0 && onSuccess) {
          onSuccess();
        }
        
        return result;
      } catch (error) {
        lastError = error;

        if (attempt === maxRetries) {
          break; // Достигнуто максимальное количество попыток
        }

        if (!shouldRetry(error)) {
          break; // Не следует повторять
        }

        const delay = exponentialBackoff
          ? Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
          : baseDelay;

        if (onRetry) {
          onRetry(attempt + 1, error);
        }

        await this.delay(delay);
      }
    }

    throw lastError;
  }

  /**
   * Экспоненциальная задержка с джиттером
   */
  async exponentialBackoffWithJitter(
    attempt: number,
    baseDelay: number = 1000,
    maxDelay: number = 30000,
    jitter: number = 0.1
  ): Promise<void> {
    const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    const jitterAmount = exponentialDelay * jitter;
    const jitteredDelay = exponentialDelay + (Math.random() - 0.5) * 2 * jitterAmount;
    
    await this.delay(jitteredDelay);
  }

  /**
   * Задержка
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Проверка, является ли ошибка повторяемой
   */
  static isRetryableError(error: any): boolean {
    const errorMessage = error.message || String(error);
    
    // Повторяемые ошибки
    const retryableErrors = [
      'timeout',
      'network',
      'ECONNRESET',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'HTTP 500',
      'HTTP 502',
      'HTTP 503',
      'HTTP 504'
    ];

    return retryableErrors.some(retryable => 
      errorMessage.toLowerCase().includes(retryable.toLowerCase())
    );
  }

  /**
   * Проверка, является ли ошибка окончательной
   */
  static isPermanentError(error: any): boolean {
    const errorMessage = error.message || String(error);
    
    // Окончательные ошибки (не повторяются)
    const permanentErrors = [
      'HTTP 400',
      'HTTP 401',
      'HTTP 403',
      'HTTP 404',
      'HTTP 422',
      'circuit breaker'
    ];

    return permanentErrors.some(permanent => 
      errorMessage.toLowerCase().includes(permanent.toLowerCase())
    );
  }
}

/**
 * Записи об ошибках
 */
export interface ErrorRecord {
  id: string;
  type: string;
  message: string;
  service: string;
  context: ErrorContext;
  timestamp: Date;
  stack?: string;
}