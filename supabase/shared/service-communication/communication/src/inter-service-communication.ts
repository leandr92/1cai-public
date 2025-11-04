/**
 * Inter-Service Communication - межсервисное взаимодействие
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Synchronous HTTP/REST Communication
 */
export class HttpCommunication {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;

  constructor(baseUrl: string, options: {
    headers?: Record<string, string>;
    timeout?: number;
  } = {}) {
    this.baseUrl = baseUrl;
    this.timeout = options.timeout || 30000;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers
    };
  }

  /**
   * GET запрос
   */
  async get<T = any>(path: string, options: {
    headers?: Record<string, string>;
    params?: Record<string, string>;
    timeout?: number;
    correlationId?: string;
  } = {}): Promise<CommunicationResult<T>> {
    return this.request<T>('GET', path, {
      ...options,
      params: options.params
    });
  }

  /**
   * POST запрос
   */
  async post<T = any>(path: string, data?: any, options: {
    headers?: Record<string, string>;
    timeout?: number;
    correlationId?: string;
  } = {}): Promise<CommunicationResult<T>> {
    return this.request<T>('POST', path, {
      ...options,
      body: data
    });
  }

  /**
   * PUT запрос
   */
  async put<T = any>(path: string, data?: any, options: {
    headers?: Record<string, string>;
    timeout?: number;
    correlationId?: string;
  } = {}): Promise<CommunicationResult<T>> {
    return this.request<T>('PUT', path, {
      ...options,
      body: data
    });
  }

  /**
   * DELETE запрос
   */
  async delete<T = any>(path: string, options: {
    headers?: Record<string, string>;
    timeout?: number;
    correlationId?: string;
  } = {}): Promise<CommunicationResult<T>> {
    return this.request<T>('DELETE', path, options);
  }

  /**
   * PATCH запрос
   */
  async patch<T = any>(path: string, data?: any, options: {
    headers?: Record<string, string>;
    timeout?: number;
    correlationId?: string;
  } = {}): Promise<CommunicationResult<T>> {
    return this.request<T>('PATCH', path, {
      ...options,
      body: data
    });
  }

  /**
   * Выполнение HTTP запроса
   */
  private async request<T>(
    method: string,
    path: string,
    options: {
      headers?: Record<string, string>;
      params?: Record<string, string>;
      body?: any;
      timeout?: number;
      correlationId?: string;
    } = {}
  ): Promise<CommunicationResult<T>> {
    const startTime = Date.now();
    const correlationId = options.correlationId || this.generateCorrelationId();

    try {
      const url = new URL(`${this.baseUrl}${path}`);
      
      if (options.params) {
        Object.entries(options.params).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });
      }

      const controller = new AbortController();
      const timeout = options.timeout || this.timeout;

      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const headers = {
        ...this.defaultHeaders,
        'X-Correlation-ID': correlationId,
        ...options.headers
      };

      const response = await fetch(url.toString(), {
        method,
        headers,
        body: method !== 'GET' && options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          duration,
          correlationId
        };
      }

      const contentType = response.headers.get('content-type');
      let data: T;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text() as any;
      }

      return {
        success: true,
        data,
        status: response.status,
        duration,
        correlationId
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration,
        correlationId
      };
    }
  }

  private generateCorrelationId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Asynchronous Message Communication через Supabase Realtime
 */
export class AsyncMessageCommunication {
  private supabase: SupabaseClient;
  private channelHandlers: Map<string, MessageHandler[]> = new Map();
  private channelNames: Map<string, string> = new Map();

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Подписка на сообщения канала
   */
  async subscribe(channelName: string, handler: MessageHandler): Promise<() => void> {
    const handlers = this.channelHandlers.get(channelName) || [];
    handlers.push(handler);
    this.channelHandlers.set(channelName, handlers);

    // Если это первая подписка на канал, создаем реальное соединение
    if (!this.channelNames.has(channelName)) {
      const fullChannelName = `service:${channelName}`;
      const channel = this.supabase.channel(fullChannelName);

      channel.on('broadcast', { event: 'message' }, (payload) => {
        const channelHandlers = this.channelHandlers.get(channelName) || [];
        channelHandlers.forEach(h => {
          try {
            h(payload.payload as Message);
          } catch (error) {
            console.error(`Handler error for channel ${channelName}:`, error);
          }
        });
      });

      await channel.subscribe();
      this.channelNames.set(channelName, fullChannelName);

      console.log(`Subscribed to channel: ${channelName}`);
    }

    // Возвращаем функцию отписки
    return () => {
      const handlers = this.channelHandlers.get(channelName) || [];
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
        
        // Если больше нет обработчиков, закрываем канал
        if (handlers.length === 0) {
          this.unsubscribe(channelName);
        }
      }
    };
  }

  /**
   * Отписка от канала
   */
  async unsubscribe(channelName: string): Promise<void> {
    const fullChannelName = this.channelNames.get(channelName);
    if (fullChannelName) {
      await this.supabase.removeChannel(fullChannelName);
      this.channelNames.delete(channelName);
      this.channelHandlers.delete(channelName);
      console.log(`Unsubscribed from channel: ${channelName}`);
    }
  }

  /**
   * Отправка сообщения
   */
  async publish(channelName: string, message: Message): Promise<boolean> {
    try {
      const fullChannelName = `service:${channelName}`;
      
      const { error } = await this.supabase.channel(fullChannelName).send({
        type: 'broadcast',
        event: 'message',
        payload: message
      });

      if (error) {
        console.error('Failed to publish message:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error publishing message:', error);
      return false;
    }
  }

  /**
   * Отправка сообщения с подтверждением доставки
   */
  async publishWithAck(
    channelName: string,
    message: Message,
    ackTimeout: number = 5000
  ): Promise<PublishResult> {
    return new Promise((resolve) => {
      const ackChannel = `${channelName}:ack:${message.id}`;
      let acknowledged = false;

      // Подписываемся на подтверждение
      const unsubscribe = this.supabase.channel(`service:${ackChannel}`)
        .on('broadcast', { event: 'ack' }, (payload) => {
          if (payload.payload.messageId === message.id) {
            acknowledged = true;
            unsubscribe();
            resolve({ success: true, acknowledged: true });
          }
        })
        .subscribe();

      // Отправляем сообщение
      this.publish(channelName, message);

      // Таймаут для подтверждения
      setTimeout(() => {
        if (!acknowledged) {
          unsubscribe();
          resolve({ success: false, acknowledged: false, error: 'ACK timeout' });
        }
      }, ackTimeout);
    });
  }

  /**
   * Получение статистики сообщений
   */
  getMessageStats(): {
    activeChannels: number;
    totalHandlers: number;
    channelStats: Map<string, { handlers: number; subscribed: boolean }>;
  } {
    const channelStats = new Map<string, { handlers: number; subscribed: boolean }>();

    for (const [channelName, handlers] of this.channelHandlers.entries()) {
      channelStats.set(channelName, {
        handlers: handlers.length,
        subscribed: this.channelNames.has(channelName)
      });
    }

    return {
      activeChannels: this.channelNames.size,
      totalHandlers: Array.from(this.channelHandlers.values())
        .reduce((sum, handlers) => sum + handlers.length, 0),
      channelStats
    };
  }
}

/**
 * Event-Driven Communication через события
 */
export class EventDrivenCommunication {
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  private eventHistory: EventRecord[] = [];

  /**
   * Подписка на события
   */
  subscribe(eventType: string, handler: EventHandler): () => void {
    const handlers = this.eventHandlers.get(eventType) || [];
    handlers.push(handler);
    this.eventHandlers.set(eventType, handlers);

    console.log(`Subscribed to event: ${eventType}`);

    return () => {
      const eventHandlers = this.eventHandlers.get(eventType) || [];
      const index = eventHandlers.indexOf(handler);
      if (index > -1) {
        eventHandlers.splice(index, 1);
        if (eventHandlers.length === 0) {
          this.eventHandlers.delete(eventType);
        }
      }
      console.log(`Unsubscribed from event: ${eventType}`);
    };
  }

  /**
   * Публикация события
   */
  async publish(event: DomainEvent): Promise<boolean> {
    const startTime = Date.now();

    try {
      // Логируем событие
      const record: EventRecord = {
        id: event.id,
        type: event.type,
        aggregateId: event.aggregateId,
        data: event.data,
        timestamp: event.timestamp,
        version: event.version || 1,
        processedBy: []
      };

      this.eventHistory.push(record);

      // Уведомляем обработчики
      const handlers = this.eventHandlers.get(event.type) || [];
      const results = await Promise.allSettled(
        handlers.map(handler => handler(event))
      );

      // Обновляем статистику обработки
      record.processedBy = handlers.map((_, index) => {
        const result = results[index];
        return {
          handlerIndex: index,
          success: result.status === 'fulfilled',
          error: result.status === 'rejected' ? result.reason : undefined,
          processedAt: new Date()
        };
      });

      const duration = Date.now() - startTime;
      console.log(`Event ${event.type} processed in ${duration}ms`);

      return true;
    } catch (error) {
      console.error('Error publishing event:', error);
      return false;
    }
  }

  /**
   * Получение истории событий
   */
  getEventHistory(limit: number = 100, offset: number = 0): EventRecord[] {
    return this.eventHistory.slice(offset, offset + limit);
  }

  /**
   * Получение событий по типу
   */
  getEventsByType(eventType: string): EventRecord[] {
    return this.eventHistory.filter(record => record.type === eventType);
  }

  /**
   * Получение событий по агрегату
   */
  getEventsByAggregate(aggregateId: string): EventRecord[] {
    return this.eventHistory.filter(record => record.aggregateId === aggregateId);
  }

  /**
   * Получение статистики событий
   */
  getEventStats(): {
    totalEvents: number;
    eventsByType: Map<string, number>;
    eventsByDate: Map<string, number>;
  } {
    const eventsByType = new Map<string, number>();
    const eventsByDate = new Map<string, number>();

    for (const record of this.eventHistory) {
      // По типу
      eventsByType.set(record.type, (eventsByType.get(record.type) || 0) + 1);
      
      // По дате
      const date = record.timestamp.toISOString().split('T')[0];
      eventsByDate.set(date, (eventsByDate.get(date) || 0) + 1);
    }

    return {
      totalEvents: this.eventHistory.length,
      eventsByType,
      eventsByDate
    };
  }
}

/**
 * Типы и интерфейсы
 */
export interface CommunicationResult<T = any> {
  success: boolean;
  data?: T;
  status?: number;
  error?: string;
  duration: number;
  correlationId: string;
}

export interface Message {
  id: string;
  type: string;
  sender: string;
  recipient?: string;
  payload: any;
  timestamp: Date;
  correlationId?: string;
  replyTo?: string;
}

export type MessageHandler = (message: Message) => void | Promise<void>;

export interface PublishResult {
  success: boolean;
  acknowledged: boolean;
  error?: string;
}

export interface DomainEvent {
  id: string;
  type: string;
  aggregateId: string;
  data: any;
  timestamp: Date;
  version?: number;
  metadata?: Record<string, any>;
}

export type EventHandler = (event: DomainEvent) => void | Promise<void>;

export interface EventRecord {
  id: string;
  type: string;
  aggregateId: string;
  data: any;
  timestamp: Date;
  version: number;
  processedBy: Array<{
    handlerIndex: number;
    success: boolean;
    error?: any;
    processedAt: Date;
  }>;
}