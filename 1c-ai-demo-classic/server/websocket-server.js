// WebSocket сервер для real-time коллаборации 1С ИИ-ассистенты
const { Server } = require('socket.io');
const http = require('http');
const express = require('express');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// CORS настройки для WebSocket
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://nqa6f0rc73d0.space.minimax.io'] 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Создаем Socket.IO сервер
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://nqa6f0rc73d0.space.minimax.io'] 
      : ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Хранилище сессий и пользователей
const activeSessions = new Map();
const userSessions = new Map();
const roomStates = new Map();

// Утилиты
const generateSessionId = () => Math.random().toString(36).substr(2, 9);
const generateUserId = () => Math.random().toString(36).substr(2, 9);

class CollaborationSession {
  constructor(sessionId, hostUserId) {
    this.sessionId = sessionId;
    this.hostUserId = hostUserId;
    this.participants = new Map();
    this.state = {
      roleId: null,
      scenarioId: null,
      currentStep: 0,
      isRunning: false,
      results: [],
      codeExamples: [],
      executionTime: 0,
      lastActivity: new Date().toISOString()
    };
    this.settings = {
      autoSync: true,
      conflictResolution: 'last-write-wins',
      realTimeUpdates: true,
      voiceChat: false
    };
    this.createdAt = new Date().toISOString();
  }

  addParticipant(userId, userInfo) {
    this.participants.set(userId, {
      ...userInfo,
      userId,
      joinedAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      isActive: true,
      permissions: this.hostUserId === userId ? ['admin'] : ['read', 'comment']
    });
  }

  removeParticipant(userId) {
    this.participants.delete(userId);
  }

  updateParticipant(userId, updates) {
    const participant = this.participants.get(userId);
    if (participant) {
      this.participants.set(userId, {
        ...participant,
        ...updates,
        lastSeen: new Date().toISOString()
      });
    }
  }

  updateState(newState, userId) {
    const oldState = { ...this.state };
    this.state = {
      ...this.state,
      ...newState,
      lastActivity: new Date().toISOString()
    };

    // Логирование изменений для отладки
    console.log(`Session ${this.sessionId}: State updated by ${userId}`, {
      changes: Object.keys(newState),
      oldState: oldState,
      newState: this.state
    });
  }

  getPublicState() {
    return {
      ...this.state,
      participants: Array.from(this.participants.values()).map(p => ({
        userId: p.userId,
        name: p.name,
        avatar: p.avatar,
        role: p.role,
        permissions: p.permissions,
        isActive: p.isActive,
        joinedAt: p.joinedAt,
        lastSeen: p.lastSeen
      }))
    };
  }

  hasAdmin(userId) {
    const participant = this.participants.get(userId);
    return participant && participant.permissions.includes('admin');
  }

  canEdit(userId) {
    const participant = this.participants.get(userId);
    return participant && (participant.permissions.includes('admin') || participant.permissions.includes('edit'));
  }

  isEmpty() {
    return this.participants.size === 0;
  }

  getSummary() {
    return {
      sessionId: this.sessionId,
      hostUserId: this.hostUserId,
      participantCount: this.participants.size,
      isActive: this.state.isRunning,
      roleId: this.state.roleId,
      scenarioId: this.state.scenarioId,
      createdAt: this.createdAt,
      lastActivity: this.state.lastActivity,
      participants: Array.from(this.participants.values()).map(p => ({
        userId: p.userId,
        name: p.name,
        isActive: p.isActive
      }))
    };
  }
}

// Middleware для аутентификации (простая реализация)
io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;
  const userId = socket.handshake.auth.userId || socket.handshake.query.userId;
  const userName = socket.handshake.auth.userName || socket.handshake.query.userName;

  if (!userId || !userName) {
    return next(new Error('Authentication error: userId and userName required'));
  }

  // Проверяем токен (в реальном приложении здесь была бы полная аутентификация)
  if (token && !isValidToken(token)) {
    return next(new Error('Authentication error: invalid token'));
  }

  socket.userId = userId;
  socket.userName = userName;
  socket.userRole = socket.handshake.auth.userRole || socket.handshake.query.userRole || 'viewer';
  
  next();
});

// Основные WebSocket события
io.on('connection', (socket) => {
  console.log(`✅ User ${socket.userName} (${socket.userId}) connected`);
  
  // Присоединение к сессии
  socket.on('join-session', (data) => {
    try {
      const { sessionId } = data;
      
      if (!sessionId) {
        socket.emit('error', { message: 'Session ID required' });
        return;
      }

      let session = activeSessions.get(sessionId);
      
      // Создаем новую сессию если не существует
      if (!session) {
        session = new CollaborationSession(sessionId, socket.userId);
        activeSessions.set(sessionId, session);
        console.log(`📝 Created new session: ${sessionId}`);
      }

      // Проверяем лимит участников
      if (session.participants.size >= 10) {
        socket.emit('error', { message: 'Session is full (max 10 participants)' });
        return;
      }

      // Присоединяем пользователя к сессии
      socket.join(sessionId);
      session.addParticipant(socket.userId, {
        name: socket.userName,
        role: socket.userRole,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(socket.userName)}&background=3b82f6&color=fff`
      });

      // Обновляем mapping пользователя
      userSessions.set(socket.userId, sessionId);

      // Отправляем текущее состояние сессии
      socket.emit('session-state', session.getPublicState());
      
      // Уведомляем всех участников о новом пользователе
      socket.to(sessionId).emit('user-joined', {
        userId: socket.userId,
        userName: socket.userName,
        userRole: socket.userRole,
        participantCount: session.participants.size
      });

      // Отправляем информацию о текущих участниках
      socket.emit('participants-update', Array.from(session.participants.values()));

      console.log(`👥 User ${socket.userName} joined session ${sessionId} (${session.participants.size} total)`);
      
    } catch (error) {
      console.error('Error joining session:', error);
      socket.emit('error', { message: 'Failed to join session' });
    }
  });

  // Создание новой сессии
  socket.on('create-session', (data) => {
    try {
      const sessionId = generateSessionId();
      const session = new CollaborationSession(sessionId, socket.userId);
      activeSessions.set(sessionId, session);

      // Присоединяем создателя к сессии
      socket.join(sessionId);
      session.addParticipant(socket.userId, {
        name: socket.userName,
        role: socket.userRole,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(socket.userName)}&background=10b981&color=fff`,
        isHost: true
      });

      userSessions.set(socket.userId, sessionId);

      // Отправляем созданную сессию пользователю
      socket.emit('session-created', {
        sessionId,
        session: session.getPublicState()
      });

      console.log(`🆕 Session ${sessionId} created by ${socket.userName}`);
      
    } catch (error) {
      console.error('Error creating session:', error);
      socket.emit('error', { message: 'Failed to create session' });
    }
  });

  // Покидание сессии
  socket.on('leave-session', () => {
    try {
      const sessionId = userSessions.get(socket.userId);
      if (!sessionId) return;

      const session = activeSessions.get(sessionId);
      if (session) {
        // Удаляем пользователя из сессии
        session.removeParticipant(socket.userId);
        
        // Покидаем комнату
        socket.leave(sessionId);
        
        // Уведомляем остальных участников
        socket.to(sessionId).emit('user-left', {
          userId: socket.userId,
          userName: socket.userName,
          participantCount: session.participants.size
        });

        // Если сессия пуста, удаляем её через некоторое время
        if (session.isEmpty()) {
          setTimeout(() => {
            activeSessions.delete(sessionId);
            console.log(`🗑️ Cleaned up empty session: ${sessionId}`);
          }, 30000); // 30 секунд
        }

        console.log(`👋 User ${socket.userName} left session ${sessionId}`);
      }

      userSessions.delete(socket.userId);
      
    } catch (error) {
      console.error('Error leaving session:', error);
    }
  });

  // Обновление состояния сессии
  socket.on('update-session-state', (data) => {
    try {
      const sessionId = userSessions.get(socket.userId);
      if (!sessionId) return;

      const session = activeSessions.get(sessionId);
      if (!session) return;

      // Проверяем права на редактирование
      if (!session.canEdit(socket.userId)) {
        socket.emit('error', { message: 'Insufficient permissions to edit session' });
        return;
      }

      const { stateUpdates } = data;
      session.updateState(stateUpdates, socket.userId);

      // Рассылаем обновление всем участникам
      socket.to(sessionId).emit('session-state-updated', {
        updates: stateUpdates,
        updatedBy: socket.userId,
        timestamp: new Date().toISOString()
      });

      console.log(`🔄 Session ${sessionId} state updated by ${socket.userId}`);
      
    } catch (error) {
      console.error('Error updating session state:', error);
      socket.emit('error', { message: 'Failed to update session state' });
    }
  });

  // Обновление присутствия пользователя
  socket.on('presence-update', (data) => {
    try {
      const sessionId = userSessions.get(socket.userId);
      if (!sessionId) return;

      const session = activeSessions.get(sessionId);
      if (!session) return;

      session.updateParticipant(socket.userId, {
        isActive: data.isActive,
        currentActivity: data.currentActivity,
        lastActivity: new Date().toISOString()
      });

      // Уведомляем других участников
      socket.to(sessionId).emit('user-presence-updated', {
        userId: socket.userId,
        isActive: data.isActive,
        currentActivity: data.currentActivity,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error updating presence:', error);
    }
  });

  // Синхронизация результатов демо
  socket.on('sync-demo-results', (data) => {
    try {
      const sessionId = userSessions.get(socket.userId);
      if (!sessionId) return;

      const session = activeSessions.get(sessionId);
      if (!session) return;

      const { results, codeExamples, executionTime } = data;
      
      session.updateState({
        results,
        codeExamples,
        executionTime,
        isRunning: false
      }, socket.userId);

      // Рассылаем результаты всем участникам
      io.to(sessionId).emit('demo-results-synced', {
        results,
        codeExamples,
        executionTime,
        syncedBy: socket.userId,
        timestamp: new Date().toISOString()
      });

      console.log(`📊 Demo results synced in session ${sessionId} by ${socket.userId}`);
      
    } catch (error) {
      console.error('Error syncing demo results:', error);
      socket.emit('error', { message: 'Failed to sync demo results' });
    }
  });

  // Разрешение конфликтов
  socket.on('resolve-conflict', (data) => {
    try {
      const sessionId = userSessions.get(socket.userId);
      if (!sessionId) return;

      const session = activeSessions.get(sessionId);
      if (!session || !session.hasAdmin(socket.userId)) {
        socket.emit('error', { message: 'Only host can resolve conflicts' });
        return;
      }

      const { conflictId, resolution } = data;

      // Применяем решение конфликта
      io.to(sessionId).emit('conflict-resolved', {
        conflictId,
        resolution,
        resolvedBy: socket.userId,
        timestamp: new Date().toISOString()
      });

      console.log(`🤝 Conflict ${conflictId} resolved by ${socket.userName} in session ${sessionId}`);
      
    } catch (error) {
      console.error('Error resolving conflict:', error);
      socket.emit('error', { message: 'Failed to resolve conflict' });
    }
  });

  // Chat сообщения
  socket.on('chat-message', (data) => {
    try {
      const sessionId = userSessions.get(socket.userId);
      if (!sessionId) return;

      const session = activeSessions.get(sessionId);
      if (!session) return;

      const { message } = data;
      
      const chatMessage = {
        id: generateSessionId(),
        userId: socket.userId,
        userName: socket.userName,
        message,
        timestamp: new Date().toISOString()
      };

      // Рассылаем сообщение всем участникам
      io.to(sessionId).emit('chat-message-received', chatMessage);

      console.log(`💬 Chat message from ${socket.userName} in session ${sessionId}`);
      
    } catch (error) {
      console.error('Error handling chat message:', error);
    }
  });

  // Отключение
  socket.on('disconnect', () => {
    try {
      const sessionId = userSessions.get(socket.userId);
      if (!sessionId) return;

      const session = activeSessions.get(sessionId);
      if (session) {
        // Временно отмечаем как неактивного (пользователь может вернуться)
        session.updateParticipant(socket.userId, {
          isActive: false,
          disconnectedAt: new Date().toISOString()
        });

        // Если пользователь не вернулся в течение 2 минут, удаляем
        setTimeout(() => {
          const currentSession = activeSessions.get(sessionId);
          if (currentSession && !currentSession.participants.get(socket.userId)?.isActive) {
            currentSession.removeParticipant(socket.userId);
            
            // Уведомляем участников
            socket.to(sessionId).emit('user-disconnected', {
              userId: socket.userId,
              userName: socket.userName,
              participantCount: currentSession.participants.size
            });

            // Очищаем пустые сессии
            if (currentSession.isEmpty()) {
              activeSessions.delete(sessionId);
              console.log(`🗑️ Cleaned up disconnected session: ${sessionId}`);
            }
          }
        }, 120000); // 2 минуты

        console.log(`⚡ User ${socket.userName} disconnected from session ${sessionId}`);
      }

      userSessions.delete(socket.userId);
      
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });

  // Получение информации о сессии
  socket.on('get-session-info', () => {
    try {
      const sessionId = userSessions.get(socket.userId);
      if (!sessionId) {
        socket.emit('session-info', null);
        return;
      }

      const session = activeSessions.get(sessionId);
      if (session) {
        socket.emit('session-info', session.getSummary());
      }
      
    } catch (error) {
      console.error('Error getting session info:', error);
    }
  });
});

// API эндпоинты для управления сессиями
app.get('/api/sessions', (req, res) => {
  try {
    const sessions = Array.from(activeSessions.values()).map(session => session.getSummary());
    res.json({
      success: true,
      sessions,
      totalSessions: sessions.length,
      totalUsers: Array.from(userSessions.keys()).length
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sessions' });
  }
});

app.get('/api/sessions/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = activeSessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    res.json({
      success: true,
      session: session.getSummary()
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch session' });
  }
});

app.delete('/api/sessions/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = activeSessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    // Уведомляем всех участников о завершении сессии
    io.to(sessionId).emit('session-ended', {
      sessionId,
      endedAt: new Date().toISOString()
    });

    // Удаляем сессию
    activeSessions.delete(sessionId);
    
    // Уведомляем всех участников о завершении
    io.in(sessionId).socketsLeave(sessionId);

    res.json({ success: true, message: 'Session ended successfully' });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ success: false, error: 'Failed to end session' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    activeSessions: activeSessions.size,
    connectedUsers: userSessions.size,
    uptime: process.uptime()
  });
});

// Проверка токена (простая реализация)
function isValidToken(token) {
  // В реальном приложении здесь была бы полная валидация JWT или другого токена
  return token && token.length > 10;
}

// Очистка старых сессий (запускается каждые 5 минут)
setInterval(() => {
  const now = new Date();
  const maxAge = 24 * 60 * 60 * 1000; // 24 часа

  for (const [sessionId, session] of activeSessions.entries()) {
    const lastActivity = new Date(session.state.lastActivity);
    const sessionAge = now - lastActivity;

    if (sessionAge > maxAge) {
      console.log(`🧹 Cleaning up old session: ${sessionId}`);
      
      // Уведомляем участников
      io.to(sessionId).emit('session-expired', {
        sessionId,
        reason: 'Session expired due to inactivity'
      });

      // Удаляем сессию
      activeSessions.delete(sessionId);
      
      // Очищаем участников
      io.in(sessionId).socketsLeave(sessionId);
    }
  }
}, 5 * 60 * 1000); // Каждые 5 минут

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 WebSocket server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Allowed origins: ${process.env.NODE_ENV === 'production' ? 'production' : 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };
