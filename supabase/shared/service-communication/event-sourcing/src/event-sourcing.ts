/**
 * Event Sourcing - событийное хранение и audit trail
 */

export interface DomainEvent {
  id: string;
  aggregateId: string;
  aggregateType: string;
  type: string;
  version: number;
  timestamp: Date;
  actorId?: string;
  actorType?: string;
  data: any;
  metadata?: Record<string, any>;
  causationId?: string;
  correlationId?: string;
  eventId?: string;
}

export interface AggregateSnapshot {
  aggregateId: string;
  aggregateType: string;
  version: number;
  state: any;
  timestamp: Date;
  eventId: string;
}

export interface EventStore {
  save(event: DomainEvent): Promise<void>;
  save(events: DomainEvent[]): Promise<void>;
  getEvents(aggregateId: string, fromVersion?: number): Promise<DomainEvent[]>;
  getEventsByType(eventType: string, limit?: number): Promise<DomainEvent[]>;
  getEventsByTimeRange(startTime: Date, endTime: Date, limit?: number): Promise<DomainEvent[]>;
  getEventById(eventId: string): Promise<DomainEvent | null>;
}

export interface SnapshotStore {
  save(snapshot: AggregateSnapshot): Promise<void>;
  getLatestSnapshot(aggregateId: string): Promise<AggregateSnapshot | null>;
  deleteSnapshots(aggregateId: string): Promise<void>;
}

export class EventStoreImpl implements EventStore {
  private events: Map<string, DomainEvent[]> = new Map();
  private eventIndex: Map<string, string> = new Map(); // eventId -> aggregateId

  async save(event: DomainEvent): Promise<void> {
    const events = this.events.get(event.aggregateId) || [];
    events.push(event);
    this.events.set(event.aggregateId, events);
    this.eventIndex.set(event.id, event.aggregateId);
  }

  async save(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.save(event);
    }
  }

  async getEvents(aggregateId: string, fromVersion: number = 1): Promise<DomainEvent[]> {
    const events = this.events.get(aggregateId) || [];
    return events.filter(event => event.version >= fromVersion);
  }

  async getEventsByType(eventType: string, limit: number = 100): Promise<DomainEvent[]> {
    const allEvents: DomainEvent[] = [];
    
    for (const events of this.events.values()) {
      for (const event of events) {
        if (event.type === eventType) {
          allEvents.push(event);
        }
      }
    }

    return allEvents
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getEventsByTimeRange(startTime: Date, endTime: Date, limit: number = 100): Promise<DomainEvent[]> {
    const allEvents: DomainEvent[] = [];
    
    for (const events of this.events.values()) {
      for (const event of events) {
        if (event.timestamp >= startTime && event.timestamp <= endTime) {
          allEvents.push(event);
        }
      }
    }

    return allEvents
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getEventById(eventId: string): Promise<DomainEvent | null> {
    const aggregateId = this.eventIndex.get(eventId);
    if (!aggregateId) return null;

    const events = this.events.get(aggregateId) || [];
    return events.find(event => event.id === eventId) || null;
  }

  getAllAggregates(): string[] {
    return Array.from(this.events.keys());
  }

  getEventCount(aggregateId: string): number {
    return (this.events.get(aggregateId) || []).length;
  }
}

export class SnapshotStoreImpl implements SnapshotStore {
  private snapshots: Map<string, AggregateSnapshot[]> = new Map();

  async save(snapshot: AggregateSnapshot): Promise<void> {
    const snapshots = this.snapshots.get(snapshot.aggregateId) || [];
    snapshots.push(snapshot);
    snapshots.sort((a, b) => b.version - a.version);
    this.snapshots.set(snapshot.aggregateId, snapshots);
  }

  async getLatestSnapshot(aggregateId: string): Promise<AggregateSnapshot | null> {
    const snapshots = this.snapshots.get(aggregateId) || [];
    return snapshots.length > 0 ? snapshots[0] : null;
  }

  async deleteSnapshots(aggregateId: string): Promise<void> {
    this.snapshots.delete(aggregateId);
  }

  getAllSnapshots(): AggregateSnapshot[] {
    const allSnapshots: AggregateSnapshot[] = [];
    for (const snapshots of this.snapshots.values()) {
      allSnapshots.push(...snapshots);
    }
    return allSnapshots.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

export class EventSourcingRepository<T> {
  private eventStore: EventStore;
  private snapshotStore: SnapshotStore;
  private aggregateType: string;
  private aggregateFactory: () => T;

  constructor(
    eventStore: EventStore,
    snapshotStore: SnapshotStore,
    aggregateType: string,
    aggregateFactory: () => T
  ) {
    this.eventStore = eventStore;
    this.snapshotStore = snapshotStore;
    this.aggregateType = aggregateType;
    this.aggregateFactory = aggregateFactory;
  }

  async save(aggregate: any): Promise<void> {
    const uncommittedEvents = aggregate.getUncommittedEvents();
    
    if (uncommittedEvents.length === 0) {
      return; // Нет новых событий
    }

    // Преобразуем события домена в события
    const events = uncommittedEvents.map((event: any) => this.toDomainEvent(event, aggregate));
    
    // Сохраняем события
    await this.eventStore.save(events);

    // Создаем снепшот, если необходимо
    if (this.shouldCreateSnapshot(aggregate)) {
      await this.createSnapshot(aggregate);
    }

    // Очищаем несохраненные события
    aggregate.clearUncommittedEvents();
  }

  async load(aggregateId: string): Promise<any> {
    const aggregate = this.aggregateFactory();
    
    // Пытаемся загрузить последний снепшот
    const latestSnapshot = await this.snapshotStore.getLatestSnapshot(aggregateId);
    
    let events: DomainEvent[] = [];
    let startVersion = 1;

    if (latestSnapshot) {
      // Загружаем состояние из снепшота
      aggregate.loadFromSnapshot(latestSnapshot.state);
      startVersion = latestSnapshot.version + 1;
    }

    // Загружаем события после снепшота
    events = await this.eventStore.getEvents(aggregateId, startVersion);

    // Применяем события к агрегату
    for (const event of events) {
      aggregate.handleEvent(this.fromDomainEvent(event));
    }

    return aggregate;
  }

  private toDomainEvent(domainEvent: any, aggregate: any): DomainEvent {
    return {
      id: domainEvent.id || this.generateEventId(),
      aggregateId: aggregate.id,
      aggregateType: this.aggregateType,
      type: domainEvent.type,
      version: aggregate.version,
      timestamp: domainEvent.timestamp || new Date(),
      actorId: domainEvent.actorId,
      actorType: domainEvent.actorType,
      data: domainEvent.data,
      metadata: domainEvent.metadata,
      causationId: domainEvent.causationId,
      correlationId: domainEvent.correlationId
    };
  }

  private fromDomainEvent(event: DomainEvent): any {
    return {
      id: event.id,
      type: event.type,
      data: event.data,
      timestamp: event.timestamp,
      actorId: event.actorId,
      actorType: event.actorType,
      metadata: event.metadata,
      causationId: event.causationId,
      correlationId: event.correlationId
    };
  }

  private shouldCreateSnapshot(aggregate: any): boolean {
    const version = aggregate.version || 0;
    return version % 10 === 0; // Каждые 10 событий
  }

  private async createSnapshot(aggregate: any): Promise<void> {
    const snapshot: AggregateSnapshot = {
      aggregateId: aggregate.id,
      aggregateType: this.aggregateType,
      version: aggregate.version,
      state: aggregate.getState(),
      timestamp: new Date(),
      eventId: this.generateEventId()
    };

    await this.snapshotStore.save(snapshot);
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export class AuditTrail {
  private eventStore: EventStore;
  private auditEntries: AuditEntry[] = [];

  constructor(eventStore: EventStore) {
    this.eventStore = eventStore;
  }

  async recordAccess(
    resourceId: string,
    resourceType: string,
    actorId: string,
    action: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const event: DomainEvent = {
      id: this.generateEventId(),
      aggregateId: resourceId,
      aggregateType: 'AuditEntry',
      type: 'ResourceAccessed',
      version: 1,
      timestamp: new Date(),
      actorId,
      data: {
        resourceType,
        action,
        metadata
      }
    };

    await this.eventStore.save(event);
    
    this.auditEntries.push({
      id: event.id,
      resourceId,
      resourceType,
      actorId,
      action,
      timestamp: event.timestamp,
      metadata
    });
  }

  async recordChange(
    resourceId: string,
    resourceType: string,
    actorId: string,
    changes: any,
    metadata?: Record<string, any>
  ): Promise<void> {
    const event: DomainEvent = {
      id: this.generateEventId(),
      aggregateId: resourceId,
      aggregateType: 'AuditEntry',
      type: 'ResourceChanged',
      version: 1,
      timestamp: new Date(),
      actorId,
      data: {
        resourceType,
        changes,
        metadata
      }
    };

    await this.eventStore.save(event);
  }

  async getAuditTrail(
    resourceId: string,
    limit: number = 100
  ): Promise<AuditEntry[]> {
    const events = await this.eventStore.getEventsByTimeRange(
      new Date(0),
      new Date(),
      limit
    );

    return events
      .filter(event => event.aggregateId === resourceId)
      .map(event => ({
        id: event.id,
        resourceId: event.aggregateId,
        resourceType: event.data.resourceType,
        actorId: event.actorId || 'unknown',
        action: event.type,
        timestamp: event.timestamp,
        metadata: event.data
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async getActorActivity(
    actorId: string,
    limit: number = 100
  ): Promise<AuditEntry[]> {
    const events = await this.eventStore.getEventsByTimeRange(
      new Date(0),
      new Date(),
      limit
    );

    return events
      .filter(event => event.actorId === actorId)
      .map(event => ({
        id: event.id,
        resourceId: event.aggregateId,
        resourceType: event.data.resourceType,
        actorId: event.actorId,
        action: event.type,
        timestamp: event.timestamp,
        metadata: event.data
      }))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getChangeHistory(
    resourceId: string,
    fromDate?: Date,
    toDate?: Date
  ): Promise<ChangeRecord[]> {
    const events = await this.eventStore.getEvents(resourceId);
    
    return events
      .filter(event => event.type === 'ResourceChanged')
      .filter(event => {
        if (fromDate && event.timestamp < fromDate) return false;
        if (toDate && event.timestamp > toDate) return false;
        return true;
      })
      .map(event => ({
        id: event.id,
        resourceId: event.aggregateId,
        actorId: event.actorId,
        changes: event.data.changes,
        timestamp: event.timestamp,
        metadata: event.data.metadata
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async getAuditStats(): Promise<AuditStats> {
    const events = await this.eventStore.getEventsByTimeRange(
      new Date(0),
      new Date(),
      10000
    );

    const totalEvents = events.length;
    const eventsByType = new Map<string, number>();
    const eventsByActor = new Map<string, number>();
    const eventsByHour = new Map<string, number>();

    for (const event of events) {
      // По типу
      eventsByType.set(event.type, (eventsByType.get(event.type) || 0) + 1);
      
      // По актору
      const actorId = event.actorId || 'unknown';
      eventsByActor.set(actorId, (eventsByActor.get(actorId) || 0) + 1);
      
      // По часам
      const hour = event.timestamp.toISOString().substr(0, 13);
      eventsByHour.set(hour, (eventsByHour.get(hour) || 0) + 1);
    }

    return {
      totalEvents,
      eventsByType,
      eventsByActor,
      eventsByHour,
      recentActivity: events
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10)
    };
  }

  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export interface AuditEntry {
  id: string;
  resourceId: string;
  resourceType: string;
  actorId: string;
  action: string;
  timestamp: Date;
  metadata?: any;
}

export interface ChangeRecord {
  id: string;
  resourceId: string;
  actorId: string;
  changes: any;
  timestamp: Date;
  metadata?: any;
}

export interface AuditStats {
  totalEvents: number;
  eventsByType: Map<string, number>;
  eventsByActor: Map<string, number>;
  eventsByHour: Map<string, number>;
  recentActivity: DomainEvent[];
}

/**
 * Базовый класс агрегата с поддержкой event sourcing
 */
export abstract class EventSourcedAggregate {
  protected id: string;
  protected version: number = 0;
  private uncommittedEvents: any[] = [];

  constructor(id: string) {
    this.id = id;
  }

  getId(): string {
    return this.id;
  }

  getVersion(): number {
    return this.version;
  }

  getUncommittedEvents(): any[] {
    return [...this.uncommittedEvents];
  }

  clearUncommittedEvents(): void {
    this.uncommittedEvents = [];
  }

  abstract getState(): any;
  abstract handleEvent(event: any): void;

  protected apply(event: any): void {
    // Применяем событие к состоянию
    this.handleEvent(event);
    
    // Увеличиваем версию
    this.version++;
    
    // Добавляем в несохраненные события
    event.id = event.id || this.generateEventId();
    event.timestamp = event.timestamp || new Date();
    event.version = this.version;
    
    this.uncommittedEvents.push(event);
  }

  protected loadFromSnapshot(state: any): void {
    // Восстанавливаем состояние из снепшота
    Object.assign(this, state);
  }

  private generateEventId(): string {
    return `evt_${this.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Factory для создания event store систем
 */
export class EventStoreFactory {
  static createInMemoryEventStore(): EventStore {
    return new EventStoreImpl();
  }

  static createInMemorySnapshotStore(): SnapshotStore {
    return new SnapshotStoreImpl();
  }

  static createRepository<T>(
    eventStore: EventStore,
    snapshotStore: SnapshotStore,
    aggregateType: string,
    aggregateFactory: () => T
  ): EventSourcingRepository<T> {
    return new EventSourcingRepository(eventStore, snapshotStore, aggregateType, aggregateFactory);
  }

  static createAuditTrail(eventStore: EventStore): AuditTrail {
    return new AuditTrail(eventStore);
  }
}