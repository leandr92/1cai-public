// Collaboration Utilities - утилиты для real-time коллаборации
import { SessionState, User } from '../services/websocket-service';

// Утилиты для работы с состоянием сессии
export class SessionStateManager {
  private static instance: SessionStateManager;
  private localState: SessionState | null = null;
  private subscribers: Array<(state: SessionState) => void> = [];
  private conflictResolver: ConflictResolver;

  private constructor() {
    this.conflictResolver = new ConflictResolver();
  }

  static getInstance(): SessionStateManager {
    if (!SessionStateManager.instance) {
      SessionStateManager.instance = new SessionStateManager();
    }
    return SessionStateManager.instance;
  }

  // Подписка на изменения состояния
  subscribe(callback: (state: SessionState) => void): () => void {
    this.subscribers.push(callback);
    
    // Возвращаем функцию отписки
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  // Уведомление подписчиков об изменениях
  private notifySubscribers(): void {
    if (this.localState) {
      this.subscribers.forEach(callback => callback(this.localState!));
    }
  }

  // Установка локального состояния
  setState(newState: Partial<SessionState>, userId?: string): void {
    if (!this.localState) {
      this.localState = {
        roleId: undefined,
        scenarioId: undefined,
        currentStep: 0,
        isRunning: false,
        results: [],
        codeExamples: [],
        executionTime: 0,
        lastActivity: new Date(),
        participants: [],
        isConnected: false,
        currentRoom: null,
        users: [],
        messages: []
      };
    }

    const oldState = { ...this.localState };
    this.localState = {
      ...this.localState,
      ...newState,
      lastActivity: new Date()
    };

    // Проверяем конфликты
    const conflicts = this.conflictResolver.detectConflicts(oldState, this.localState);
    if (conflicts.length > 0) {
      console.warn('⚠️ State conflicts detected:', conflicts);
      // Обрабатываем конфликты
      this.handleConflicts(conflicts, userId);
    } else {
      this.notifySubscribers();
    }
  }

  // Получение текущего состояния
  getState(): SessionState | null {
    return this.localState;
  }

  // Обработка конфликтов
  private handleConflicts(conflicts: any[], userId?: string): void {
    conflicts.forEach(conflict => {
      const resolution = this.conflictResolver.resolveConflict(conflict);
      if (resolution) {
        console.log('🤝 Conflict resolved:', resolution);
        this.applyResolution(resolution);
      }
    });
  }

  // Применение разрешения конфликта
  private applyResolution(resolution: any): void {
    if (this.localState && resolution.stateUpdate) {
      this.localState = {
        ...this.localState,
        ...resolution.stateUpdate,
        lastActivity: new Date()
      };
      this.notifySubscribers();
    }
  }
}

// Утилиты для работы с конфликтами
export class ConflictResolver {
  // Обнаружение конфликтов между состояниями
  detectConflicts(oldState: SessionState, newState: SessionState): any[] {
    const conflicts: any[] = [];

    // Конфликт роли
    if (oldState.roleId && newState.roleId && oldState.roleId !== newState.roleId) {
      conflicts.push({
        id: 'role_conflict',
        type: 'state_conflict',
        field: 'roleId',
        oldValue: oldState.roleId,
        newValue: newState.roleId,
        description: 'Конфликт изменения роли'
      });
    }

    // Конфликт сценария
    if (oldState.scenarioId && newState.scenarioId && oldState.scenarioId !== newState.scenarioId) {
      conflicts.push({
        id: 'scenario_conflict',
        type: 'state_conflict',
        field: 'scenarioId',
        oldValue: oldState.scenarioId,
        newValue: newState.scenarioId,
        description: 'Конфликт изменения сценария'
      });
    }

    // Конфликт выполнения демо
    if (oldState.isRunning && newState.isRunning && oldState.currentStep !== newState.currentStep) {
      conflicts.push({
        id: 'demo_execution_conflict',
        type: 'demo_conflict',
        field: 'isRunning',
        description: 'Одновременное выполнение демо разными пользователями'
      });
    }

    // Конфликт результатов
    if (this.hasResultsConflict(oldState.results, newState.results)) {
      conflicts.push({
        id: 'results_conflict',
        type: 'state_conflict',
        field: 'results',
        description: 'Конфликт обновления результатов'
      });
    }

    return conflicts;
  }

  // Проверка конфликта результатов
  private hasResultsConflict(oldResults: any[] | undefined, newResults: any[] | undefined): boolean {
    // Проверяем на undefined и приводим к пустому массиву как fallback
    const safeOldResults = oldResults || [];
    const safeNewResults = newResults || [];
    
    if (safeOldResults.length === 0 || safeNewResults.length === 0) return false;
    
    // Простая проверка по количеству и времени изменения
    return safeOldResults.length !== safeNewResults.length || 
           (safeOldResults[0]?.timestamp !== safeNewResults[0]?.timestamp);
  }

  // Разрешение конфликта
  resolveConflict(conflict: any): any | null {
    switch (conflict.type) {
      case 'state_conflict':
        return this.resolveStateConflict(conflict);
      case 'demo_conflict':
        return this.resolveDemoConflict(conflict);
      default:
        console.warn('Unknown conflict type:', conflict.type);
        return null;
    }
  }

  // Разрешение конфликта состояния
  private resolveStateConflict(conflict: any): any {
    switch (conflict.field) {
      case 'roleId':
      case 'scenarioId':
        // Last-write-wins стратегия
        return {
          type: 'last_write_wins',
          stateUpdate: {
            [conflict.field]: conflict.newValue
          },
          description: `Применено изменение: ${conflict.newValue}`
        };
      
      default:
        return {
          type: 'skip_change',
          description: 'Изменение пропущено из-за конфликта'
        };
    }
  }

  // Разрешение конфликта демо
  private resolveDemoConflict(conflict: any): any {
    // Блокируем новое выполнение, если демо уже выполняется
    return {
      type: 'block_execution',
      stateUpdate: {
        isRunning: false
      },
      description: 'Выполнение заблокировано из-за активного демо'
    };
  }
}

// Утилиты для работы с пользователями
export class UserManager {
  private static instance: UserManager;
  private users: Map<string, User> = new Map();

  private constructor() {}

  static getInstance(): UserManager {
    if (!UserManager.instance) {
      UserManager.instance = new UserManager();
    }
    return UserManager.instance;
  }

  // Добавление пользователя
  addUser(user: User): void {
    this.users.set(user.userId, {
      ...user,
      lastSeen: new Date()
    });
  }

  // Обновление пользователя
  updateUser(userId: string, updates: Partial<User>): void {
    const user = this.users.get(userId);
    if (user) {
      this.users.set(userId, {
        ...user,
        ...updates,
        lastSeen: new Date()
      });
    }
  }

  // Удаление пользователя
  removeUser(userId: string): void {
    this.users.delete(userId);
  }

  // Получение пользователя
  getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  // Получение всех пользователей
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  // Получение активных пользователей
  getActiveUsers(): User[] {
    return this.getAllUsers().filter(user => user.isActive);
  }

  // Получение хоста сессии
  getHost(): User | undefined {
    return this.getAllUsers().find(user => user.permissions?.includes('admin'));
  }

  // Проверка прав пользователя
  hasPermission(userId: string, permission: string): boolean {
    const user = this.users.get(userId);
    return user ? user.permissions?.includes(permission) || false : false;
  }
}

// Утилиты для работы с сообщениями
export class MessageManager {
  private static instance: MessageManager;
  private messages: any[] = [];

  private constructor() {}

  static getInstance(): MessageManager {
    if (!MessageManager.instance) {
      MessageManager.instance = new MessageManager();
    }
    return MessageManager.instance;
  }

  // Добавление сообщения
  addMessage(message: any): void {
    this.messages.push({
      ...message,
      id: message.id || this.generateMessageId(),
      timestamp: message.timestamp || new Date()
    });

    // Ограничиваем количество сообщений (последние 100)
    if (this.messages.length > 100) {
      this.messages = this.messages.slice(-100);
    }
  }

  // Получение сообщений
  getMessages(): any[] {
    return [...this.messages];
  }

  // Получение последних N сообщений
  getLastMessages(count: number): any[] {
    return this.messages.slice(-count);
  }

  // Очистка сообщений
  clearMessages(): void {
    this.messages = [];
  }

  // Генерация ID сообщения
  private generateMessageId(): string {
    return 'msg_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }
}

// Утилиты для работы с сессиями
export class SessionManager {
  private static instance: SessionManager;
  private sessions: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  // Создание сессии
  createSession(sessionId: string, hostUserId: string): void {
    this.sessions.set(sessionId, {
      sessionId,
      hostUserId,
      createdAt: new Date(),
      lastActivity: new Date(),
      participants: [],
      isActive: true
    });
  }

  // Обновление активности сессии
  updateActivity(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date().toISOString();
    }
  }

  // Завершение сессии
  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      session.endedAt = new Date();
    }
  }

  // Получение сессии
  getSession(sessionId: string): any {
    return this.sessions.get(sessionId);
  }

  // Получение всех активных сессий
  getActiveSessions(): any[] {
    return Array.from(this.sessions.values()).filter(session => session.isActive);
  }

  // Очистка старых сессий
  cleanupOldSessions(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = new Date().getTime();
    
    for (const [sessionId, session] of this.sessions.entries()) {
      const lastActivity = new Date(session.lastActivity).getTime();
      if (now - lastActivity > maxAge) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

// Утилиты для форматирования
export const formatUtils = {
  // Форматирование времени
  formatTimeAgo(timestamp: string): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return 'только что';
    if (diffMinutes < 60) return `${diffMinutes} мин назад`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} ч назад`;
    
    return time.toLocaleDateString('ru-RU');
  },

  // Форматирование длительности
  formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}ч ${minutes % 60}м`;
    } else if (minutes > 0) {
      return `${minutes}м ${seconds % 60}с`;
    } else {
      return `${seconds}с`;
    }
  },

  // Форматирование количества участников
  formatParticipantCount(count: number): string {
    if (count === 1) return '1 участник';
    if (count < 5) return `${count} участника`;
    return `${count} участников`;
  },

  // Генерация инициалов имени
  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  },

  // Генерация цвета для пользователя
  getUserColor(userId: string): string {
    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1'
    ];
    
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  }
};

// Экспорт singleton экземпляров
export const sessionStateManager = SessionStateManager.getInstance();
export const userManager = UserManager.getInstance();
export const messageManager = MessageManager.getInstance();
export const sessionManager = SessionManager.getInstance();

// Автоматическая очистка старых сессий каждые 30 минут
setInterval(() => {
  sessionManager.cleanupOldSessions();
}, 30 * 60 * 1000);
