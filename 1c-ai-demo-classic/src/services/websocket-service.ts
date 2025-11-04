export interface WebSocketMessage {
  type: 'message' | 'notification' | 'system' | 'collaboration';
  data: any;
  timestamp: Date;
  userId?: string;
  roomId?: string;
}

export interface Room {
  id: string;
  name: string;
  users: Set<string>;
  lastActivity: Date;
}

export interface ChatMessage {
  id: string;
  text: string;
  message: string;
  user: User;
  userId: string;
  userName?: string;
  timestamp: Date | string;
  type: 'text' | 'system' | 'file';
}

export interface User {
  id: string;
  userId: string;
  name: string;
  userName?: string;
  avatar?: string;
  isOnline: boolean;
  isActive: boolean;
  status: 'online' | 'offline' | 'away';
  role?: string;
  permissions?: string[];
  lastSeen: Date;
}

export interface DemoResult {
  id: string;
  type: 'document' | 'code' | 'data' | 'diagram';
  title: string;
  description: string;
  filename: string;
  content: string;
  size?: string;
  timestamp?: string;
}

export interface GeneratedCode {
  title: string;
  content: string;
  language: string;
  filename: string;
}

export interface SessionState {
  roleId?: string;
  scenarioId?: string;
  isRunning?: boolean;
  currentStep?: number;
  results?: DemoResult[];
  codeExamples?: GeneratedCode[];
  executionTime?: number;
  isConnected: boolean;
  currentRoom: string | null;
  users: User[];
  messages: ChatMessage[];
  sessionId?: string;
  participants?: User[];
  participantCount?: number;
  activeParticipantCount?: number;
  connectionStatus?: 'connected' | 'connecting' | 'reconnecting' | 'disconnected';
  lastActivity?: Date;
}

export class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private rooms: Map<string, Room> = new Map();
  private messageHandlers: Map<string, (message: WebSocketMessage) => void> = new Map();

  constructor(private serverUrl: string) {}

  async connect(): Promise<void> {
    try {
      this.socket = new WebSocket(this.serverUrl);
      
      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.handleConnectionOpen();
      };

      this.socket.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
        this.handleConnectionClose();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.handleConnectionError();
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      throw error;
    }
  }

  private handleConnectionOpen() {
    // Notify all registered handlers
    this.messageHandlers.forEach((handler) => {
      handler({
        type: 'system',
        data: { event: 'connected' },
        timestamp: new Date()
      });
    });
  }

  private handleConnectionClose() {
    // Attempt to reconnect
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, Math.pow(2, this.reconnectAttempts) * 1000); // Exponential backoff
    }
  }

  private handleConnectionError() {
    this.messageHandlers.forEach((handler) => {
      handler({
        type: 'system',
        data: { event: 'error' },
        timestamp: new Date()
      });
    });
  }

  private handleMessage(data: string) {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      
      if (message.roomId && this.rooms.has(message.roomId)) {
        // Handle room-based messaging
        const room = this.rooms.get(message.roomId);
        if (room) {
          room.lastActivity = new Date();
        }
      }

      // Route message to appropriate handler
      this.messageHandlers.forEach((handler) => {
        handler(message);
      });
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  send(message: Omit<WebSocketMessage, 'timestamp'>): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    const fullMessage: WebSocketMessage = {
      ...message,
      timestamp: new Date()
    };

    this.socket.send(JSON.stringify(fullMessage));
  }

  joinRoom(roomId: string, roomName: string, userId: string): void {
    const room: Room = {
      id: roomId,
      name: roomName,
      users: new Set([userId]),
      lastActivity: new Date()
    };

    this.rooms.set(roomId, room);

    this.send({
      type: 'collaboration',
      data: { action: 'join_room', roomId, userId },
      userId,
      roomId
    });
  }

  leaveRoom(roomId: string, userId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.users.delete(userId);
      if (room.users.size === 0) {
        this.rooms.delete(roomId);
      }
    }

    this.send({
      type: 'collaboration',
      data: { action: 'leave_room', roomId, userId },
      userId,
      roomId
    });
  }

  onMessage(type: string, handler: (message: WebSocketMessage) => void): void {
    this.messageHandlers.set(type, handler);
  }

  offMessage(type: string): void {
    this.messageHandlers.delete(type);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.rooms.clear();
    this.messageHandlers.clear();
  }

  getRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService('ws://localhost:8080');

// React hook for WebSocket collaboration
import React from 'react';

export function useWebSocketCollaboration() {
  const [isConnected, setIsConnected] = React.useState(false);
  const [currentRoom, setCurrentRoom] = React.useState<string | null>(null);
  const [users, setUsers] = React.useState<User[]>([]);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  
  // Новые состояния для коллаборации
  const [isReady, setIsReady] = React.useState(false);
  const [sessionId, setSessionId] = React.useState<string | undefined>(undefined);
  const [participants, setParticipants] = React.useState<User[]>([]);
  const [userId] = React.useState<string>(() => 'user_' + Math.random().toString(36).substr(2, 9));
  const [userName] = React.useState<string>(() => 'Пользователь ' + Math.floor(Math.random() * 1000));
  const [isSessionHost, setIsSessionHost] = React.useState<boolean>(() => Math.random() > 0.7);
  const [hasEditPermission, setHasEditPermission] = React.useState<boolean>(() => Math.random() > 0.3);
  const [connectionStatus, setConnectionStatus] = React.useState<'connected' | 'connecting' | 'reconnecting' | 'disconnected'>('disconnected');
  const [isInReadySession, setIsInReadySession] = React.useState<boolean>(() => Math.random() > 0.5);
  const [participantCount] = React.useState<number>(() => Math.floor(Math.random() * 5) + 1);
  const [activeParticipantCount] = React.useState<number>(() => Math.floor(Math.random() * 3) + 1);
  
  // Состояние чата
  const [chatMessages, setChatMessages] = React.useState<Array<{
    id: string;
    message: string;
    userId: string;
    userName: string;
    timestamp: string;
    type: 'text' | 'system';
  }>>([]);
  
  // Текущая сессия
  const [currentSession, setCurrentSession] = React.useState<SessionState>({
    sessionId,
    roleId: 'architect',
    scenarioId: 'demo_scenario',
    isRunning: false,
    currentStep: 0,
    results: [],
    codeExamples: [],
    executionTime: 0,
    participants: participants,
    lastActivity: new Date(),
    isConnected: false,
    currentRoom: null,
    users: [],
    messages: []
  });

  React.useEffect(() => {
    const connect = async () => {
      try {
        setConnectionStatus('connecting');
        await webSocketService.connect();
        setIsConnected(true);
        setConnectionStatus('connected');
        setIsReady(true);
      } catch (error) {
        console.error('Failed to connect:', error);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        setIsReady(false);
      }
    };

    connect();

    // Set up message handlers
    webSocketService.onMessage('collaboration', (message) => {
      if (message.type === 'collaboration') {
        // Handle collaboration messages
        if (message.data.action === 'user_joined') {
          const newUser = {
            ...message.data.user,
            userId: message.data.user.id,
            userName: message.data.user.name,
            isActive: true,
            permissions: ['view'],
            role: 'participant'
          };
          setUsers(prev => [...prev, newUser]);
          setParticipants(prev => [...prev, newUser]);
        } else if (message.data.action === 'user_left') {
          setUsers(prev => prev.filter(u => u.id !== message.data.userId));
          setParticipants(prev => prev.filter(u => u.userId !== message.data.userId));
        }
      }
    });

    webSocketService.onMessage('message', (message) => {
      if (message.type === 'message') {
        setMessages(prev => [...prev, message.data]);
        
        // Обновляем чат сообщения
        const chatMessage = {
          id: message.data.id || Math.random().toString(36).substr(2, 9),
          message: message.data.text,
          userId: message.data.userId,
          userName: message.data.userName || 'Пользователь',
          timestamp: message.data.timestamp || new Date().toISOString(),
          type: 'text' as const
        };
        setChatMessages(prev => [...prev, chatMessage]);
      }
    });

    return () => {
      webSocketService.disconnect();
    };
  }, []);

  // Функции для управления сессией
  const createSession = React.useCallback(() => {
    const newSessionId = 'session_' + Math.random().toString(36).substr(2, 9);
    setSessionId(newSessionId);
    setIsInReadySession(true);
    setIsSessionHost(true);
    setHasEditPermission(true);
    
    const newSession = {
      ...currentSession,
      sessionId: newSessionId,
      isHost: true,
      canEdit: true
    };
    setCurrentSession(newSession);
    
    console.log('📝 Session created:', newSessionId);
  }, [currentSession]);

  const joinSession = React.useCallback((sessionIdToJoin: string) => {
    setSessionId(sessionIdToJoin);
    setIsInReadySession(true);
    setConnectionStatus('connected');
    
    const session = {
      ...currentSession,
      sessionId: sessionIdToJoin,
      isHost: false,
      canEdit: Math.random() > 0.5
    };
    setCurrentSession(session);
    
    console.log('🚀 Joined session:', sessionIdToJoin);
  }, [currentSession]);

  const leaveSession = React.useCallback(() => {
    setSessionId(undefined);
    setIsInReadySession(false);
    setParticipants([]);
    setChatMessages([]);
    
    const clearedSession = {
      ...currentSession,
      sessionId: undefined,
      roleId: undefined,
      scenarioId: undefined,
      isRunning: false,
      currentStep: 0,
      results: [],
      participants: []
    };
    setCurrentSession(clearedSession);
    
    console.log('👋 Left session');
  }, [currentSession]);

  const updateSessionState = React.useCallback((stateUpdate: Partial<SessionState>) => {
    const updatedSession: SessionState = {
      ...currentSession,
      ...stateUpdate,
      lastActivity: new Date()
    };
    setCurrentSession(updatedSession);
    
    console.log('🔄 Session state updated:', stateUpdate);
  }, [currentSession]);

  const getSessionInfo = React.useCallback(() => {
    return {
      sessionId,
      participants: participants.length,
      isHost: isSessionHost,
      canEdit: hasEditPermission,
      lastActivity: new Date(),
      status: connectionStatus
    };
  }, [sessionId, participants.length, isSessionHost, hasEditPermission, connectionStatus]);

  // Функция разрешения конфликтов
  interface ConflictResolution {
    type: 'accept' | 'reject' | 'merge';
    data?: any;
    comment?: string;
  }
  
  const resolveConflict = React.useCallback((conflictId: string, resolution: ConflictResolution) => {
    console.log('🔧 Resolving conflict:', conflictId, resolution);
    // Логика разрешения конфликтов
  }, []);

  // Функции чата
  const sendChatMessage = React.useCallback((message: string) => {
    const chatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      message,
      userId,
      userName,
      timestamp: new Date().toISOString(),
      type: 'text' as const
    };
    
    setChatMessages(prev => [...prev, chatMessage]);
    
    // Отправляем через WebSocket
    webSocketService.send({
      type: 'message',
      data: chatMessage,
      userId,
      roomId: currentRoom || 'default'
    });
  }, [userId, userName, currentRoom]);

  // Функция синхронизации результатов демо
  const syncDemoResults = React.useCallback((results: DemoResult[], codeExamples: GeneratedCode[], executionTime: number) => {
    const updatedSession: SessionState = {
      ...currentSession,
      results,
      codeExamples,
      executionTime,
      lastActivity: new Date()
    };
    setCurrentSession(updatedSession);
    
    console.log('📊 Demo results synced:', { results: results.length, codeExamples: codeExamples.length });
  }, [currentSession]);

  const sendMessage = React.useCallback((text: string, roomId: string, userIdParam: string) => {
    webSocketService.send({
      type: 'message',
      data: { text, userId: userIdParam },
      userId: userIdParam,
      roomId
    });
  }, []);

  const joinRoom = React.useCallback((roomId: string, roomName: string, userIdParam: string) => {
    webSocketService.joinRoom(roomId, roomName, userIdParam);
    setCurrentRoom(roomId);
  }, []);

  const leaveRoom = React.useCallback((roomId: string, userIdParam: string) => {
    webSocketService.leaveRoom(roomId, userIdParam);
    setCurrentRoom(null);
  }, []);

  return {
    // Основные состояния
    isConnected,
    currentRoom,
    users,
    messages,
    isReady,
    
    // Состояние сессии
    isInReadySession,
    sessionId,
    currentSession,
    participants,
    participantCount,
    activeParticipantCount,
    connectionStatus,
    
    // Информация о пользователе
    userId,
    userName,
    isSessionHost,
    hasEditPermission,
    
    // Сообщения чата
    chatMessages,
    
    // Функции сессии
    createSession,
    joinSession,
    leaveSession,
    updateSessionState,
    getSessionInfo,
    resolveConflict,
    
    // Функции чата
    sendChatMessage,
    
    // Синхронизация демо
    syncDemoResults,
    
    // Базовая функциональность
    sendMessage,
    joinRoom,
    leaveRoom,
    connect: () => webSocketService.connect(),
    disconnect: () => webSocketService.disconnect()
  };
}