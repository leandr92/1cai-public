// Real-time Chat Component - чат для коллаборативной сессии
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Users, Smile, Paperclip } from 'lucide-react';
import { useWebSocketCollaboration } from '../../services/websocket-service';
import { ChatMessage } from '../../services/websocket-service';
import toast from 'react-hot-toast';

interface RealTimeChatProps {
  className?: string;
  maxHeight?: string;
  showUserList?: boolean;
}

const RealTimeChat: React.FC<RealTimeChatProps> = ({
  className = '',
  maxHeight = '400px',
  showUserList = true
}) => {
  const {
    isInReadySession,
    chatMessages,
    participants,
    userId,
    userName,
    sendChatMessage
  } = useWebSocketCollaboration();

  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Автоматический скролл к последнему сообщению
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Имитация статуса печати от других пользователей
  useEffect(() => {
    if (!isInReadySession) return;

    // Случайные уведомления о печати (для демонстрации)
    const typingIntervals = participants
      .filter(p => p.userId !== userId)
      .map(participant => {
        return setInterval(() => {
          if (Math.random() < 0.1) { // 10% шанс каждые 5 секунд
            showTypingIndicator(participant.name);
          }
        }, 5000);
      });

    return () => {
      typingIntervals.forEach(interval => clearInterval(interval));
    };
  }, [participants, userId, isInReadySession]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const showTypingIndicator = (userName: string) => {
    setTypingUsers(prev => [...prev.filter(name => name !== userName), userName]);
    
    setTimeout(() => {
      setTypingUsers(prev => prev.filter(name => name !== userName));
    }, 3000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim()) return;
    
    sendChatMessage(messageInput.trim());
    setMessageInput('');
    setIsTyping(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessageInput(value);
    
    // Показываем индикатор печати
    if (value.trim() && !isTyping) {
      setIsTyping(true);
    }
    
    // Сбрасываем таймер печати
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const formatTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('ru-RU', { 
        day: '2-digit', 
        month: '2-digit',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isInReadySession) {
    return (
      <div className={`bg-slate-800/30 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2 text-slate-400">
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm">Присоединитесь к сессии для участия в чате</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800/30 rounded-lg flex flex-col ${className}`}>
      {/* Заголовок чата */}
      <div className="flex items-center justify-between p-3 border-b border-slate-600">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-slate-200">
            Чат сессии
          </span>
          <span className="text-xs text-slate-400">
            ({chatMessages.length})
          </span>
        </div>
        
        {showUserList && (
          <div className="flex items-center space-x-1 text-xs text-slate-400">
            <Users className="w-3 h-3" />
            <span>{participants.length}</span>
          </div>
        )}
      </div>

      {/* Сообщения */}
      <div 
        className="flex-1 overflow-y-auto p-3 space-y-3"
        style={{ maxHeight }}
      >
        {chatMessages.length === 0 ? (
          <div className="text-center text-slate-400 py-8">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Пока нет сообщений</p>
            <p className="text-xs mt-1">Начните общение!</p>
          </div>
        ) : (
          chatMessages.map((message) => {
            const isCurrentUser = message.userId === userId;
            const sender = participants.find(p => p.userId === message.userId);
            
            return (
              <div
                key={message.id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                    isCurrentUser
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {!isCurrentUser && sender && (
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs">
                        {getUserInitials(sender.name)}
                      </div>
                      <span className="text-xs font-medium opacity-80">
                        {sender.name}
                      </span>
                    </div>
                  )}
                  
                  <p className="text-sm">{message.message}</p>
                  
                  <div className={`text-xs mt-1 ${
                    isCurrentUser ? 'text-blue-200' : 'text-slate-400'
                  }`}>
                    {formatTimestamp(new Date(message.timestamp))}
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {/* Индикатор печати */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-slate-700 text-slate-300 px-3 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200" />
                </div>
                <span className="text-xs">
                  {typingUsers.length === 1 
                    ? `${typingUsers[0]} печатает...`
                    : `${typingUsers.length} пользователей печатает...`
                  }
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода сообщения */}
      <div className="border-t border-slate-600 p-3">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={messageInput}
              onChange={handleInputChange}
              placeholder="Напишите сообщение..."
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              maxLength={500}
            />
            
            {/* Счетчик символов */}
            {messageInput.length > 400 && (
              <div className="absolute -top-6 right-0 text-xs text-slate-400">
                {messageInput.length}/500
              </div>
            )}
          </div>
          
          {/* Кнопки действий */}
          <div className="flex items-center space-x-1">
            <button
              type="button"
              className="p-2 text-slate-400 hover:text-slate-300 transition-colors"
              title="Добавить эмодзи"
            >
              <Smile className="w-4 h-4" />
            </button>
            
            <button
              type="button"
              className="p-2 text-slate-400 hover:text-slate-300 transition-colors"
              title="Прикрепить файл"
            >
              <Paperclip className="w-4 h-4" />
            </button>
          </div>
          
          <button
            type="submit"
            disabled={!messageInput.trim() || messageInput.length > 500}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            title="Отправить сообщение"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        
        {/* Подсказки */}
        <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
          <span>Нажмите Enter для отправки</span>
          <span>{messageInput.length}/500</span>
        </div>
      </div>
    </div>
  );
};

export default RealTimeChat;
