/**
 * Examples - Примеры использования компонентов межсервисного взаимодействия
 */

import {
  ServiceCommunicationManager,
  ServiceClient,
  LoadBalancingStrategy,
  SagaFactory,
  EventStoreFactory,
  AuditTrail
} from '../src/index';

// ============================================
// 1. БАЗОВАЯ ИНИЦИАЛИЗАЦИЯ СИСТЕМЫ
// ============================================

async function basicSetupExample() {
  console.log('=== Basic Setup Example ===');
  
  const serviceComm = ServiceCommunicationManager.getInstance({
    serviceName: 'order-service',
    serviceVersion: '1.0.0',
    baseUrl: 'http://order-service:3002',
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    loadBalancerStrategy: LoadBalancingStrategy.ROUND_ROBIN,
    circuitBreakerEnabled: true,
    maxRetries: 3,
    tracingEnabled: true,
    metricsEnabled: true
  });

  await serviceComm.initialize();
  console.log('Service Communication initialized');
}

// ============================================
// 2. SERVICE CLIENT ПРИМЕРЫ
// ============================================

async function serviceClientExamples() {
  console.log('=== Service Client Examples ===');
  
  const serviceComm = ServiceCommunicationManager.getInstance({
    serviceName: 'api-gateway',
    serviceVersion: '1.0.0',
    baseUrl: 'http://api-gateway:3000',
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    tracingEnabled: true,
    metricsEnabled: true
  });

  await serviceComm.initialize();

  // Создание клиентов для других сервисов
  const userClient = serviceComm.createServiceClient('user-service', {
    baseUrl: 'http://user-service:3001',
    timeout: 30000,
    retries: 3
  });

  const productClient = serviceComm.createServiceClient('product-service', {
    baseUrl: 'http://product-service:3003',
    timeout: 20000,
    retries: 5
  });

  // HTTP вызовы
  console.log('Making HTTP requests...');
  
  const user = await userClient.get('/api/users/123', {
    correlationId: 'req-order-123'
  });
  console.log('User retrieved:', user.success ? user.data : user.error);

  const newOrder = await userClient.post('/api/orders', {
    userId: '123',
    items: [
      { productId: 'prod-1', quantity: 2, price: 29.99 },
      { productId: 'prod-2', quantity: 1, price: 49.99 }
    ]
  }, {
    correlationId: 'req-order-123',
    metadata: { orderType: 'standard' }
  });
  
  console.log('Order created:', newOrder.success ? 'Success' : newOrder.error);

  // Получение метрик клиента
  const clientMetrics = userClient.getMetrics();
  console.log('Client metrics:', {
    totalRequests: clientMetrics.totalRequests,
    successRate: clientMetrics.successRate,
    avgDuration: clientMetrics.avgDuration
  });
}

// ============================================
// 3. ASYNC COMMUNICATION ПРИМЕРЫ
// ============================================

async function asyncCommunicationExamples() {
  console.log('=== Async Communication Examples ===');
  
  const serviceComm = ServiceCommunicationManager.getInstance({
    serviceName: 'notification-service',
    serviceVersion: '1.0.0',
    baseUrl: 'http://notification-service:3004',
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  });

  await serviceComm.initialize();

  // Подписка на сообщения
  console.log('Subscribing to messages...');
  
  const unsubscribeUser = serviceComm.subscribeToMessages('user-events', async (message) => {
    console.log('User event received:', message);
    
    // Обработка события пользователя
    switch (message.payload.action) {
      case 'user.created':
        await sendWelcomeEmail(message.payload.userId);
        break;
      case 'user.deleted':
        await cleanupUserData(message.payload.userId);
        break;
    }
  });

  const unsubscribeOrder = serviceComm.subscribeToMessages('order-events', async (message) => {
    console.log('Order event received:', message);
    
    // Отправка уведомлений
    await sendOrderNotification(message.payload);
  });

  // Отправка сообщений
  console.log('Sending messages...');
  
  await serviceComm.sendAsyncMessage('user-events', {
    action: 'user.created',
    userId: 'user-123',
    email: 'user@example.com',
    timestamp: new Date()
  });

  await serviceComm.sendAsyncMessage('order-events', {
    action: 'order.created',
    orderId: 'order-456',
    userId: 'user-123',
    total: 109.97,
    timestamp: new Date()
  });
}

// ============================================
// 4. EVENT-DRIVEN COMMUNICATION ПРИМЕРЫ
// ============================================

async function eventDrivenExamples() {
  console.log('=== Event-Driven Examples ===');
  
  const serviceComm = ServiceCommunicationManager.getInstance({
    serviceName: 'inventory-service',
    serviceVersion: '1.0.0',
    baseUrl: 'http://inventory-service:3005',
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  });

  await serviceComm.initialize();

  // Подписка на события
  const unsubscribeOrderCreated = serviceComm.subscribeToEvents('OrderCreated', async (event) => {
    console.log('Processing OrderCreated event:', event);
    
    // Резервируем товары
    await reserveInventory(event.aggregateId, event.data.items);
    
    // Публикуем событие о резервировании
    await serviceComm.publishEvent('InventoryReserved', event.aggregateId, {
      items: event.data.items,
      reservedBy: event.aggregateId
    });
  });

  const unsubscribePaymentCompleted = serviceComm.subscribeToEvents('PaymentCompleted', async (event) => {
    console.log('Processing PaymentCompleted event:', event);
    
    // Подтверждаем резервирование
    await confirmInventoryReservation(event.aggregateId);
    
    await serviceComm.publishEvent('OrderReady', event.aggregateId, {
      orderId: event.aggregateId,
      status: 'ready_for_shipment'
    });
  });

  // Публикация события
  await serviceComm.publishEvent('InventoryUpdated', 'product-123', {
    productId: 'product-123',
    newQuantity: 50,
    change: -2,
    reason: 'order_reservation'
  });
}

// ============================================
// 5. SAGA PATTERN ПРИМЕРЫ
// ============================================

async function sagaExamples() {
  console.log('=== Saga Pattern Examples ===');
  
  const serviceComm = ServiceCommunicationManager.getInstance({
    serviceName: 'order-orchestrator',
    serviceVersion: '1.0.0',
    baseUrl: 'http://order-orchestrator:3006'
  });

  await serviceComm.initialize();

  // Создание саги для обработки заказа
  const orderSaga = serviceComm.createSaga('complete_order', [
    {
      id: 'validate-order',
      name: 'Validate Order',
      service: 'validation-service',
      operation: async () => {
        console.log('Validating order...');
        return { success: true, data: { valid: true } };
      }
    },
    {
      id: 'reserve-inventory',
      name: 'Reserve Inventory',
      service: 'inventory-service',
      operation: async () => {
        console.log('Reserving inventory...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Симуляция
        return { success: true, data: { reserved: true } };
      },
      compensate: async () => {
        console.log('Compensating inventory reservation...');
        // Логика компенсации
      }
    },
    {
      id: 'process-payment',
      name: 'Process Payment',
      service: 'payment-service',
      operation: async () => {
        console.log('Processing payment...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Симуляция
        return { success: true, data: { paymentId: 'pay-123' } };
      },
      compensate: async () => {
        console.log('Compensating payment...');
        // Логика компенсации платежа
      }
    },
    {
      id: 'confirm-order',
      name: 'Confirm Order',
      service: 'order-service',
      operation: async () => {
        console.log('Confirming order...');
        return { success: true, data: { confirmed: true } };
      },
      compensate: async () => {
        console.log('Compensating order confirmation...');
        // Логика компенсации подтверждения
      }
    }
  ]);

  console.log('Executing saga...');
  
  try {
    const result = await serviceComm.executeSaga(orderSaga.id);
    console.log('Saga result:', result.status);
    
    if (result.status === 'FAILED') {
      console.log('Saga failed, starting compensation...');
      await serviceComm.compensateSaga(orderSaga.id);
    }
  } catch (error) {
    console.error('Saga execution error:', error);
  }

  // Создание саги перевода денег
  const transferSaga = serviceComm.createSaga('money_transfer', 
    SagaFactory.createMoneyTransferSaga(
      'transfer-123',
      'account-001',
      'account-002',
      100.00
    )
  );

  const transferResult = await serviceComm.executeSaga(transferSaga.id);
  console.log('Transfer saga result:', transferResult.status);
}

// ============================================
// 6. EVENT SOURCING ПРИМЕРЫ
// ============================================

async function eventSourcingExamples() {
  console.log('=== Event Sourcing Examples ===');
  
  const eventStore = EventStoreFactory.createInMemoryEventStore();
  const snapshotStore = EventStoreFactory.createInMemorySnapshotStore();
  const auditTrail = EventStoreFactory.createAuditTrail(eventStore);

  // Создание агрегата с event sourcing
  class OrderAggregate {
    private id: string;
    private status: string = 'pending';
    private items: any[] = [];
    private version: number = 0;

    constructor(id: string) {
      this.id = id;
    }

    createOrder(items: any[]) {
      if (this.status !== 'pending') {
        throw new Error('Order already created');
      }
      
      this.apply({
        type: 'OrderCreated',
        data: { items },
        version: ++this.version
      });
    }

    addItem(item: any) {
      this.apply({
        type: 'ItemAdded',
        data: { item },
        version: ++this.version
      });
    }

    confirmOrder() {
      if (this.status !== 'pending') {
        throw new Error('Order cannot be confirmed');
      }
      
      this.apply({
        type: 'OrderConfirmed',
        data: {},
        version: ++this.version
      });
    }

    handleEvent(event: any) {
      switch (event.type) {
        case 'OrderCreated':
          this.items = event.data.items;
          break;
        case 'ItemAdded':
          this.items.push(event.data.item);
          break;
        case 'OrderConfirmed':
          this.status = 'confirmed';
          break;
      }
    }

    getState() {
      return {
        id: this.id,
        status: this.status,
        items: this.items,
        version: this.version
      };
    }
  }

  // Использование агрегата
  const order = new OrderAggregate('order-123');
  order.createOrder([
    { productId: 'prod-1', quantity: 2, price: 29.99 }
  ]);
  order.addItem({ productId: 'prod-2', quantity: 1, price: 49.99 });
  order.confirmOrder();

  // Создание репозитория
  const orderRepository = EventStoreFactory.createRepository(
    eventStore,
    snapshotStore,
    'Order',
    () => new OrderAggregate('temp-id')
  );

  // Сохранение агрегата (в реальной системе)
  console.log('Order aggregate created with events:', {
    status: order.getState().status,
    itemsCount: order.getState().items.length,
    version: order.getState().version
  });

  // Audit trail
  await auditTrail.recordAccess(
    'order-123',
    'Order',
    'user-456',
    'view_order'
  );

  await auditTrail.recordChange(
    'order-123',
    'Order',
    'user-456',
    { status: 'confirmed', total: 109.97 }
  );

  // Получение audit trail
  const auditHistory = await auditTrail.getAuditTrail('order-123');
  console.log('Audit trail entries:', auditHistory.length);
}

// ============================================
// 7. MONITORING ПРИМЕРЫ
// ============================================

async function monitoringExamples() {
  console.log('=== Monitoring Examples ===');
  
  const serviceComm = ServiceCommunicationManager.getInstance({
    serviceName: 'monitoring-service',
    serviceVersion: '1.0.0',
    baseUrl: 'http://monitoring-service:3007',
    metricsEnabled: true,
    alertRules: [
      {
        name: 'High Response Time',
        description: 'Response time > 2 seconds',
        metric: 'requests.averageLatency',
        operator: '>',
        threshold: 2000,
        severity: 'MEDIUM'
      },
      {
        name: 'High Error Rate',
        description: 'Error rate > 5%',
        metric: 'requests.failed / requests.total * 100',
        operator: '>',
        threshold: 5,
        severity: 'HIGH'
      }
    ]
  });

  await serviceComm.initialize();

  // Симуляция работы сервиса
  const startTime = Date.now();
  
  // Имитация запросов
  for (let i = 0; i < 100; i++) {
    const isError = Math.random() < 0.1; // 10% ошибок
    const responseTime = Math.random() * 3000 + 100; // 100-3100ms
    
    // В реальной системе это делается автоматически через ServiceClient
    // serviceComm.metricsCollector.recordHttpRequest(
    //   'user-service',
    //   'GET',
    //   '/api/users/123',
    //   isError ? 500 : 200,
    //   responseTime
    // );
    
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  const duration = Date.now() - startTime;
  console.log(`Simulated ${duration}ms of service activity`);

  // Получение статистики
  const stats = serviceComm.getServiceStats();
  console.log('Service stats:', {
    service: stats.service,
    metrics: stats.metrics ? {
      totalRequests: stats.metrics.totalRequests,
      errorRate: stats.metrics.errorRate,
      avgResponseTime: stats.metrics.averageResponseTime
    } : 'Not available',
    alerts: stats.alerts.length
  });
}

// ============================================
// 8. COMPLEX WORKFLOW EXAMPLE
// ============================================

async function complexWorkflowExample() {
  console.log('=== Complex Workflow Example ===');
  
  const serviceComm = ServiceCommunicationManager.getInstance({
    serviceName: 'ecommerce-platform',
    serviceVersion: '1.0.0',
    baseUrl: 'http://ecommerce-platform:3000',
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    tracingEnabled: true,
    metricsEnabled: true
  });

  await serviceComm.initialize();

  // Создаем клиенты для всех необходимых сервисов
  const userClient = serviceComm.createServiceClient('user-service');
  const productClient = serviceComm.createServiceClient('product-service');
  const inventoryClient = serviceComm.createServiceClient('inventory-service');
  const paymentClient = serviceComm.createServiceClient('payment-service');
  const shippingClient = serviceComm.createServiceClient('shipping-service');

  // Подписка на события для обработки различных сценариев
  serviceComm.subscribeToEvents('OrderPlaced', async (event) => {
    console.log('Processing OrderPlaced event:', event.aggregateId);
    
    // Создаем сагу для обработки заказа
    const orderSaga = serviceComm.createSaga('fulfill_order', [
      {
        id: 'validate-payment',
        name: 'Validate Payment',
        service: 'payment-service',
        operation: async () => {
          // Проверка платежа
          const result = await paymentClient.post('/api/payments/validate', {
            orderId: event.aggregateId,
            amount: event.data.total
          });
          return result;
        }
      },
      {
        id: 'reserve-inventory',
        name: 'Reserve Inventory',
        service: 'inventory-service',
        operation: async () => {
          const result = await inventoryClient.post('/api/inventory/reserve', {
            orderId: event.aggregateId,
            items: event.data.items
          });
          return result;
        },
        compensate: async () => {
          // Компенсация: освобождение товаров
          await inventoryClient.post('/api/inventory/release', {
            orderId: event.aggregateId
          });
        }
      },
      {
        id: 'arrange-shipping',
        name: 'Arrange Shipping',
        service: 'shipping-service',
        operation: async () => {
          const result = await shippingClient.post('/api/shipping/arrange', {
            orderId: event.aggregateId,
            address: event.data.shippingAddress
          });
          return result;
        },
        compensate: async () => {
          // Компенсация: отмена доставки
          await shippingClient.post('/api/shipping/cancel', {
            orderId: event.aggregateId
          });
        }
      }
    ]);

    try {
      const result = await serviceComm.executeSaga(orderSaga.id);
      console.log('Order fulfillment saga completed:', result.status);
      
      if (result.status === 'COMPLETED') {
        // Публикуем событие о завершении обработки
        await serviceComm.publishEvent('OrderFulfilled', event.aggregateId, {
          orderId: event.aggregateId,
          status: 'shipped'
        });
      } else {
        await serviceComm.publishEvent('OrderFailed', event.aggregateId, {
          orderId: event.aggregateId,
          error: result.error,
          compensationRequired: true
        });
      }
    } catch (error) {
      console.error('Order fulfillment failed:', error);
      await serviceComm.compensateSaga(orderSaga.id);
    }
  });

  // Симуляция размещения заказа
  console.log('Simulating order placement...');
  
  await serviceComm.sendAsyncMessage('order-events', {
    action: 'order.placed',
    orderId: 'order-complex-123',
    userId: 'user-456',
    items: [
      { productId: 'laptop', quantity: 1, price: 999.99 },
      { productId: 'mouse', quantity: 2, price: 29.99 }
    ],
    total: 1059.97,
    shippingAddress: {
      street: '123 Main St',
      city: 'Anytown',
      zipCode: '12345'
    }
  });

  // Ожидание обработки
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('Complex workflow example completed');
}

// ============================================
// MAIN EXECUTION
// ============================================

async function runExamples() {
  console.log('Starting Service Communication Examples...\n');

  try {
    // Запуск примеров по очереди
    await basicSetupExample();
    console.log('\n');
    
    await serviceClientExamples();
    console.log('\n');
    
    await asyncCommunicationExamples();
    console.log('\n');
    
    await eventDrivenExamples();
    console.log('\n');
    
    await sagaExamples();
    console.log('\n');
    
    await eventSourcingExamples();
    console.log('\n');
    
    await monitoringExamples();
    console.log('\n');
    
    await complexWorkflowExample();
    
    console.log('\n=== All examples completed successfully! ===');
    
  } catch (error) {
    console.error('Example execution failed:', error);
  }
}

// Запуск примеров (раскомментируйте для запуска)
// runExamples();

export {
  basicSetupExample,
  serviceClientExamples,
  asyncCommunicationExamples,
  eventDrivenExamples,
  sagaExamples,
  eventSourcingExamples,
  monitoringExamples,
  complexWorkflowExample
};