/**
 * Service Communication Main - основной файл для экспорта всех компонентов
 */

// Service Discovery
export { ServiceRegistry } from './registry/src/service-registry';
export type { ServiceInstance, ServiceRegistration } from './registry/src/service-registry';

// Health Checking
export { HealthChecker, CompositeHealthChecker } from './health-check/src/health-checker';
export type { HealthCheckConfig, HealthCheckResult } from './health-check/src/health-checker';

// Load Balancing
export { LoadBalancer, LoadBalancingStrategy } from './load-balancer/src/load-balancer';
export type { ServiceCallOptions, ServiceCallResult, LoadBalancerConfig } from './load-balancer/src/load-balancer';

// Inter-Service Communication
export { 
  HttpCommunication, 
  AsyncMessageCommunication, 
  EventDrivenCommunication 
} from './communication/src/inter-service-communication';
export type { 
  CommunicationResult, 
  Message, 
  MessageHandler, 
  DomainEvent, 
  EventHandler,
  PublishResult,
  EventRecord
} from './communication/src/inter-service-communication';

// Service Client SDK
export { ServiceClient } from './client-sdk/src/service-client';
export type { ServiceClientConfig, ServiceMethodOptions, ServiceClientResult } from './client-sdk/src/service-client';

// Error Handling & Retry
export { ErrorHandler, RetryManager } from './client-sdk/src/error-handler';
export type { ErrorContext, ErrorMetrics, ErrorRecord } from './client-sdk/src/error-handler';

// Distributed Tracing
export { TracingService, CorrelationUtils } from './tracing/src/tracing-service';
export type { TraceContext, TraceSpan, TraceData, TraceLog } from './tracing/src/tracing-service';

// Saga Pattern
export { SagaOrchestrator, SagaFactory, SagaUtils } from './saga/src/saga-pattern';
export type { 
  SagaStep, 
  StepResult, 
  SagaContext, 
  SagaStepExecution 
} from './saga/src/saga-pattern';

// Event Sourcing
export { 
  EventStoreImpl, 
  SnapshotStoreImpl, 
  EventSourcingRepository, 
  AuditTrail,
  EventStoreFactory,
  EventSourcedAggregate
} from './event-sourcing/src/event-sourcing';
export type { 
  DomainEvent, 
  AggregateSnapshot, 
  EventStore, 
  SnapshotStore,
  AuditEntry,
  ChangeRecord,
  AuditStats
} from './event-sourcing/src/event-sourcing';

// Monitoring & Observability
export { MetricsCollector, AlertingSystem, StructuredLogger } from './monitoring/src/monitoring-observability';
export type { 
  ServiceMetrics, 
  RequestMetrics, 
  PerformanceMetrics, 
  ErrorMetrics, 
  ResourceMetrics, 
  DependencyMetrics,
  AlertRule, 
  AlertCondition, 
  Alert 
} from './monitoring/src/monitoring-observability';