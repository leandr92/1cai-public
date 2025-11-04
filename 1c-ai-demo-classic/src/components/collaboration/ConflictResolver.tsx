// Conflict Resolver Component - разрешение конфликтов при совместной работе
import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, X, GitMerge, History, Users, Clock } from 'lucide-react';
import { useWebSocketCollaboration } from '../../services/websocket-service';
import toast from 'react-hot-toast';

interface ConflictData {
  id: string;
  type: 'state_conflict' | 'demo_conflict' | 'permission_conflict';
  title: string;
  description: string;
  participants: Array<{
    userId: string;
    userName: string;
    action: string;
    timestamp: string;
  }>;
  suggestedResolution?: {
    type: string;
    description: string;
    data?: any;
  };
  priority: 'low' | 'moderate' | 'high';
  status: 'pending' | 'resolving' | 'resolved';
}

interface ConflictResolverProps {
  className?: string;
  onConflictResolved?: (conflictId: string, resolution: any) => void;
}

const ConflictResolver: React.FC<ConflictResolverProps> = ({
  className = '',
  onConflictResolved
}) => {
  const {
    isInReadySession,
    isSessionHost,
    participants,
    resolveConflict
  } = useWebSocketCollaboration();

  const [conflicts, setConflicts] = useState<ConflictData[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<ConflictData | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Симуляция конфликтов (в реальном приложении приходили бы от сервера)
  useEffect(() => {
    if (!isInReadySession) return;

    // Создаем демо конфликты для демонстрации
    const demoConflicts: ConflictData[] = [
      {
        id: 'conflict_1',
        type: 'state_conflict',
        title: 'Конфликт изменений состояния',
        description: 'Два пользователя одновременно изменили настройки демо',
        participants: [
          {
            userId: 'user_1',
            userName: 'Алексей Иванов',
            action: 'Изменил роль на "Архитектор"',
            timestamp: new Date(Date.now() - 120000).toISOString()
          },
          {
            userId: 'user_2', 
            userName: 'Мария Петрова',
            action: 'Изменил роль на "Разработчик"',
            timestamp: new Date(Date.now() - 115000).toISOString()
          }
        ],
        suggestedResolution: {
          type: 'last_write_wins',
          description: 'Применить последнее изменение',
          data: { prefer: 'user_2', reason: 'Более позднее время' }
        },
        priority: 'moderate',
        status: 'pending'
      },
      {
        id: 'conflict_2',
        type: 'demo_conflict',
        title: 'Конфликт выполнения демо',
        description: 'Попытка запустить разные демо одновременно',
        participants: [
          {
            userId: 'user_3',
            userName: 'Дмитрий Козлов',
            action: 'Запустил демо "Архитектура системы"',
            timestamp: new Date(Date.now() - 60000).toISOString()
          }
        ],
        priority: 'high',
        status: 'resolving'
      }
    ];

    // Случайно показываем конфликты для демонстрации
    if (Math.random() < 0.3) { // 30% шанс
      setConflicts(demoConflicts);
    }

    // Автоматически скрываем конфликты через некоторое время
    const timer = setTimeout(() => {
      setConflicts([]);
      setSelectedConflict(null);
    }, 10000);

    return () => clearTimeout(timer);
  }, [isInReadySession]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-900/20 border-red-500/30';
      case 'moderate': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      case 'low': return 'text-blue-400 bg-blue-900/20 border-blue-500/30';
      default: return 'text-slate-400 bg-slate-900/20 border-slate-500/30';
    }
  };

  const getConflictTypeIcon = (type: string) => {
    switch (type) {
      case 'state_conflict': return <GitMerge className="w-4 h-4" />;
      case 'demo_conflict': return <AlertTriangle className="w-4 h-4" />;
      case 'permission_conflict': return <Users className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const handleResolveConflict = (conflictId: string, resolution: any) => {
    resolveConflict(conflictId, resolution);
    
    setConflicts(prev => 
      prev.map(conflict => 
        conflict.id === conflictId 
          ? { ...conflict, status: 'resolved' as const }
          : conflict
      )
    );
    
    if (selectedConflict?.id === conflictId) {
      setSelectedConflict(null);
    }
    
    if (onConflictResolved) {
      onConflictResolved(conflictId, resolution);
    }
    
    toast.success('Конфликт успешно разрешен');
  };

  const handleAcceptSuggestion = (conflict: ConflictData) => {
    if (conflict.suggestedResolution) {
      handleResolveConflict(conflict.id, conflict.suggestedResolution);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return 'только что';
    if (diffMinutes < 60) return `${diffMinutes} мин назад`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} ч назад`;
    
    return time.toLocaleDateString('ru-RU');
  };

  if (!isInReadySession) {
    return null;
  }

  if (conflicts.length === 0) {
    return (
      <div className={`bg-slate-800/30 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-400">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Все конфликты разрешены</span>
          </div>
          
          {showHistory && (
            <button
              onClick={() => setShowHistory(false)}
              className="text-xs text-slate-400 hover:text-slate-300"
            >
              Скрыть историю
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800/30 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span>Конфликты ({conflicts.length})</span>
        </h3>
        
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-300"
        >
          <History className="w-3 h-3" />
          <span>История</span>
        </button>
      </div>

      {/* Список конфликтов */}
      <div className="space-y-3">
        {conflicts.map((conflict) => (
          <div
            key={conflict.id}
            className={`border rounded-lg p-3 transition-all cursor-pointer hover:bg-slate-700/20 ${
              selectedConflict?.id === conflict.id 
                ? 'border-blue-500/50 bg-blue-900/10' 
                : 'border-slate-600'
            }`}
            onClick={() => setSelectedConflict(conflict)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${getPriorityColor(conflict.priority)}`}>
                  {getConflictTypeIcon(conflict.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-sm font-medium text-white">
                      {conflict.title}
                    </h4>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      conflict.priority === 'high' ? 'bg-red-900/30 text-red-300' :
                      conflict.priority === 'moderate' ? 'bg-yellow-900/30 text-yellow-300' :
                      'bg-blue-900/30 text-blue-300'
                    }`}>
                      {conflict.priority === 'high' ? 'Высокий' :
                       conflict.priority === 'moderate' ? 'Средний' : 'Низкий'}
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-400 mb-2">
                    {conflict.description}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-xs text-slate-500">
                    <div className="flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>{conflict.participants.length} участников</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {conflict.participants[0] ? 
                          formatTimeAgo(conflict.participants[0].timestamp) : 
                          'недавно'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {conflict.status === 'resolved' && (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                )}
                
                {isSessionHost && conflict.status !== 'resolved' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedConflict(conflict);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Детали конфликта */}
      {selectedConflict && (
        <div className="mt-4 p-4 bg-slate-700/30 rounded-lg border border-slate-600">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-white">
              Детали конфликта
            </h4>
            <button
              onClick={() => setSelectedConflict(null)}
              className="text-slate-400 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Участники конфликта */}
          <div className="mb-4">
            <h5 className="text-xs font-medium text-slate-300 mb-2">
              Участники конфликта:
            </h5>
            <div className="space-y-1">
              {selectedConflict.participants.map((participant, index) => (
                <div key={index} className="flex items-center space-x-2 text-xs">
                  <div className="w-2 h-2 bg-slate-400 rounded-full" />
                  <span className="text-slate-300">{participant.userName}</span>
                  <span className="text-slate-400">{participant.action}</span>
                  <span className="text-slate-500 ml-auto">
                    {formatTimeAgo(participant.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Предложенное решение */}
          {selectedConflict.suggestedResolution && (
            <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <h5 className="text-xs font-medium text-blue-300 mb-2">
                Предлагаемое решение:
              </h5>
              <p className="text-xs text-slate-300 mb-2">
                {selectedConflict.suggestedResolution.description}
              </p>
              
              {isSessionHost && selectedConflict.status !== 'resolved' && (
                <button
                  onClick={() => handleAcceptSuggestion(selectedConflict)}
                  className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                >
                  Применить решение
                </button>
              )}
            </div>
          )}

          {/* Действия */}
          {isSessionHost && selectedConflict.status !== 'resolved' && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleResolveConflict(selectedConflict.id, {
                  type: 'manual_resolution',
                  description: 'Разрешено хостом вручную'
                })}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors"
              >
                Разрешить
              </button>
              
              <button
                onClick={() => handleResolveConflict(selectedConflict.id, {
                  type: 'revert_changes',
                  description: 'Отменить все изменения'
                })}
                className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded-lg transition-colors"
              >
                Отменить изменения
              </button>
              
              <button
                onClick={() => setSelectedConflict(null)}
                className="px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white text-xs rounded-lg transition-colors"
              >
                Закрыть
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConflictResolver;
