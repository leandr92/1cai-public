/**
 * Tracing Service - распределенная трассировка и correlation IDs
 */

import { v4 as uuidv4 } from 'uuid';

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  service: string;
  operation: string;
  startTime: Date;
  metadata?: Record<string, any>;
}

export interface TraceSpan {
  context: TraceContext;
  children: TraceSpan[];
  logs: TraceLog[];
  tags: Map<string, string>;
  status: 'running' | 'completed' | 'error';
  endTime?: Date;
  error?: any;
}

export interface TraceLog {
  timestamp: Date;
  message: string;
  level: 'info' | 'warn' | 'error';
  data?: any;
}

export interface TraceData {
  traceId: string;
  service: string;
  operation: string;
  duration: number;
  status: 'success' | 'error' | 'timeout';
  spans: TraceSpan[];
  startTime: Date;
  endTime: Date;
}

export class TracingService {
  private spans: Map<string, TraceSpan> = new Map();
  private currentSpans: Map<string, string> = new Map(); // thread/coroutine -> spanId
  private traceStorage: TraceData[] = [];
  private maxStoredTraces = 1000;

  /**
   * Начало нового трейса
   */
  startTrace(operation: string, options: {
    service?: string;
    metadata?: Record<string, any>;
    parentContext?: TraceContext;
  } = {}): TraceSpan {
    const traceId = options.parentContext?.traceId || this.generateTraceId();
    const spanId = this.generateSpanId();
    const service = options.service || 'unknown';

    const context: TraceContext = {
      traceId,
      spanId,
      parentSpanId: options.parentContext?.spanId,
      service,
      operation,
      startTime: new Date(),
      metadata: options.metadata
    };

    const span: TraceSpan = {
      context,
      children: [],
      logs: [],
      tags: new Map(),
      status: 'running'
    };

    this.spans.set(spanId, span);

    if (!options.parentContext) {
      // Это корневой спан
      this.currentSpans.set(traceId, spanId);
    }

    this.log(span, 'Span started', 'info', { operation, service });

    return span;
  }

  /**
   * Начало дочернего спан
   */
  startChildSpan(operation: string, options: {
    service?: string;
    metadata?: Record<string, any>;
  } = {}): TraceSpan {
    const parentTraceId = Array.from(this.currentSpans.keys())[0];
    const parentSpanId = this.currentSpans.get(parentTraceId);
    
    if (!parentSpanId || !this.spans.has(parentSpanId)) {
      throw new Error('No active parent span found');
    }

    const parentSpan = this.spans.get(parentSpanId)!;
    const childSpan = this.startTrace(operation, {
      ...options,
      parentContext: parentSpan.context
    });

    parentSpan.children.push(childSpan);
    return childSpan;
  }

  /**
   * Завершение спан
   */
  finishSpan(span: TraceSpan, options: {
    status?: 'success' | 'error' | 'timeout';
    error?: any;
  } = {}): void {
    span.status = options.status || 'success';
    span.endTime = new Date();

    if (options.error) {
      span.error = options.error;
      this.log(span, 'Span finished with error', 'error', { 
        error: options.error.message || options.error 
      });
    } else {
      this.log(span, 'Span finished', 'info', { 
        duration: this.getSpanDuration(span) 
      });
    }

    // Если это корневой спан, сохраняем трейс
    if (!span.context.parentSpanId) {
      this.saveTrace(span);
      this.currentSpans.delete(span.context.traceId);
    }

    this.spans.delete(span.context.spanId);
  }

  /**
   * Запись лога в спан
   */
  log(span: TraceSpan, message: string, level: 'info' | 'warn' | 'error', data?: any): void {
    const log: TraceLog = {
      timestamp: new Date(),
      message,
      level,
      data
    };

    span.logs.push(log);

    // Также логируем в консоль в development
    if (process.env.NODE_ENV === 'development') {
      const logData = {
        level: level.toUpperCase(),
        timestamp: log.timestamp.toISOString(),
        traceId: span.context.traceId,
        spanId: span.context.spanId,
        operation: span.context.operation,
        message,
        data
      };
      console.log('[Tracing]', JSON.stringify(logData));
    }
  }

  /**
   * Добавление тегов к спан
   */
  tagSpan(span: TraceSpan, key: string, value: string): void {
    span.tags.set(key, value);
  }

  /**
   * Получение текущего спан
   */
  getCurrentSpan(): TraceSpan | null {
    const traceId = Array.from(this.currentSpans.keys())[0];
    const spanId = this.currentSpans.get(traceId);
    
    if (!spanId || !this.spans.has(spanId)) {
      return null;
    }

    return this.spans.get(spanId)!;
  }

  /**
   * Генерация correlation ID
   */
  generateCorrelationId(prefix?: string): string {
    const id = uuidv4();
    return prefix ? `${prefix}_${id}` : id;
  }

  /**
   * Извлечение correlation ID из заголовков
   */
  extractCorrelationId(headers: Record<string, string>): string | null {
    return headers['x-correlation-id'] || 
           headers['X-Correlation-ID'] || 
           headers['correlation-id'] ||
           null;
  }

  /**
   * Создание headers для передачи correlation ID
   */
  createCorrelationHeaders(correlationId?: string): Record<string, string> {
    const id = correlationId || this.generateCorrelationId();
    return {
      'X-Correlation-ID': id,
      'X-Request-ID': id,
      'X-Trace-ID': this.getCurrentTraceId() || this.generateTraceId()
    };
  }

  /**
   * Получение текущего trace ID
   */
  private getCurrentTraceId(): string | null {
    const traceId = Array.from(this.currentSpans.keys())[0];
    return traceId || null;
  }

  /**
   * Вычисление длительности спан
   */
  private getSpanDuration(span: TraceSpan): number {
    if (!span.endTime) {
      return Date.now() - span.context.startTime.getTime();
    }
    return span.endTime.getTime() - span.context.startTime.getTime();
  }

  /**
   * Сохранение трейса
   */
  private saveTrace(rootSpan: TraceSpan): void {
    const traceData: TraceData = {
      traceId: rootSpan.context.traceId,
      service: rootSpan.context.service,
      operation: rootSpan.context.operation,
      duration: this.getSpanDuration(rootSpan),
      status: rootSpan.error ? 'error' : 'success',
      spans: [rootSpan],
      startTime: rootSpan.context.startTime,
      endTime: rootSpan.endTime || new Date()
    };

    this.traceStorage.push(traceData);

    // Ограничиваем количество хранимых трейсов
    if (this.traceStorage.length > this.maxStoredTraces) {
      this.traceStorage = this.traceStorage.slice(-this.maxStoredTraces);
    }

    this.log(rootSpan, 'Trace completed', 'info', {
      traceId: rootSpan.context.traceId,
      duration: traceData.duration,
      status: traceData.status
    });
  }

  /**
   * Получение всех трейсов
   */
  getTraces(limit: number = 100): TraceData[] {
    return this.traceStorage.slice(-limit);
  }

  /**
   * Получение трейса по ID
   */
  getTraceById(traceId: string): TraceData | null {
    return this.traceStorage.find(trace => trace.traceId === traceId) || null;
  }

  /**
   * Поиск трейсов по критериям
   */
  searchTraces(criteria: {
    service?: string;
    operation?: string;
    status?: 'success' | 'error' | 'timeout';
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): TraceData[] {
    let filtered = this.traceStorage;

    if (criteria.service) {
      filtered = filtered.filter(trace => 
        trace.service.toLowerCase().includes(criteria.service!.toLowerCase())
      );
    }

    if (criteria.operation) {
      filtered = filtered.filter(trace => 
        trace.operation.toLowerCase().includes(criteria.operation!.toLowerCase())
      );
    }

    if (criteria.status) {
      filtered = filtered.filter(trace => trace.status === criteria.status);
    }

    if (criteria.startDate) {
      filtered = filtered.filter(trace => trace.startTime >= criteria.startDate!);
    }

    if (criteria.endDate) {
      filtered = filtered.filter(trace => trace.endTime <= criteria.endDate!);
    }

    const limit = criteria.limit || 100;
    return filtered.slice(-limit);
  }

  /**
   * Получение статистики трейсов
   */
  getTraceStats(): {
    totalTraces: number;
    successfulTraces: number;
    errorTraces: number;
    averageDuration: number;
    tracesByService: Map<string, number>;
    tracesByOperation: Map<string, number>;
    slowTraces: TraceData[];
  } {
    const total = this.traceStorage.length;
    const successful = this.traceStorage.filter(t => t.status === 'success').length;
    const error = total - successful;
    
    const totalDuration = this.traceStorage.reduce((sum, trace) => sum + trace.duration, 0);
    const averageDuration = total > 0 ? totalDuration / total : 0;

    const tracesByService = new Map<string, number>();
    const tracesByOperation = new Map<string, number>();
    const slowTraces = this.traceStorage
      .filter(trace => trace.duration > 5000) // больше 5 секунд
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    for (const trace of this.traceStorage) {
      tracesByService.set(trace.service, (tracesByService.get(trace.service) || 0) + 1);
      tracesByOperation.set(trace.operation, (tracesByOperation.get(trace.operation) || 0) + 1);
    }

    return {
      totalTraces: total,
      successfulTraces: successful,
      errorTraces: error,
      averageDuration,
      tracesByService,
      tracesByOperation,
      slowTraces
    };
  }

  /**
   * Генерация trace ID
   */
  private generateTraceId(): string {
    return this.generateCorrelationId('trace');
  }

  /**
   * Генерация span ID
   */
  private generateSpanId(): string {
    return this.generateCorrelationId('span');
  }

  /**
   * Экспорт трейсов в формате Jaeger/Zipkin
   */
  exportToJaegerFormat(): any[] {
    return this.traceStorage.map(trace => ({
      traceId: trace.traceId,
      spanId: trace.spans[0].context.spanId,
      parentSpanId: trace.spans[0].context.parentSpanId,
      operationName: trace.operation,
      startTime: trace.startTime.getTime() * 1000, // в микросекундах
      duration: trace.duration * 1000, // в микросекундах
      tags: Array.from(trace.spans[0].tags.entries()).map(([key, value]) => ({
        key,
        value,
        type: 'string'
      })),
      logs: trace.spans[0].logs.map(log => ({
        timestamp: log.timestamp.getTime() * 1000,
        fields: [
          { key: 'message', value: log.message },
          { key: 'level', value: log.level },
          ...(log.data ? [{ key: 'data', value: JSON.stringify(log.data) }] : [])
        ]
      })),
      references: trace.spans[0].context.parentSpanId ? [
        {
          refType: 'CHILD_OF',
          traceId: trace.traceId,
          spanId: trace.spans[0].context.parentSpanId
        }
      ] : []
    }));
  }

  /**
   * Очистка старых трейсов
   */
  cleanup(olderThanHours: number = 24): void {
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    this.traceStorage = this.traceStorage.filter(trace => trace.startTime > cutoff);
  }

  /**
   * Очистка ресурсов
   */
  destroy(): void {
    this.spans.clear();
    this.currentSpans.clear();
    this.traceStorage = [];
  }
}

/**
 * Утилиты для работы с correlation IDs
 */
export class CorrelationUtils {
  /**
   * Генерация нового correlation ID
   */
  static generateCorrelationId(): string {
    return uuidv4();
  }

  /**
   * Извлечение correlation ID из URL
   */
  static extractFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('correlationId');
    } catch {
      return null;
    }
  }

  /**
   * Добавление correlation ID в URL
   */
  static addToUrl(url: string, correlationId: string): string {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('correlationId', correlationId);
      return urlObj.toString();
    } catch {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}correlationId=${correlationId}`;
    }
  }

  /**
   * Валидация correlation ID
   */
  static validateCorrelationId(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }
}