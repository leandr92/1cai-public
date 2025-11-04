// Collaboration Status Component - индикация real-time статуса для демо
import React from 'react';
import { Users, Wifi, WifiOff, RefreshCw, Crown, Eye, Edit3 } from 'lucide-react';
import { useWebSocketCollaboration } from '../../services/websocket-service';

interface CollaborationStatusProps {
  className?: string;
  showDetails?: boolean;
}

const CollaborationStatus: React.FC<CollaborationStatusProps> = ({
  className = '',
  showDetails = true
}) => {
  const {
    isInReadySession,
    sessionId,
    participants,
    userId,
    isSessionHost,
    hasEditPermission,
    participantCount,
    activeParticipantCount,
    connectionStatus
  } = useWebSocketCollaboration();

  // Не показываем если не в сессии
  if (!isInReadySession) {
    return (
      <div className={`flex items-center space-x-2 text-slate-400 ${className}`}>
        <WifiOff className="w-4 h-4" />
        <span className="text-sm">Не подключен к коллаборации</span>
      </div>
    );
  }

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-400';
      case 'connecting': return 'text-yellow-400';
      case 'reconnecting': return 'text-orange-400';
      default: return 'text-red-400';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Подключен';
      case 'connecting': return 'Подключение...';
      case 'reconnecting': return 'Переподключение...';
      default: return 'Отключен';
    }
  };

  return (
    <div className={`bg-slate-800/50 rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Основной статус */}
        <div className="flex items-center space-x-3">
          {/* Иконка соединения */}
          <div className="relative">
            <Wifi className={`w-4 h-4 ${getConnectionStatusColor()}`} />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          </div>

          {/* Информация о сессии */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-300">
              Сессия #{sessionId?.slice(-6)}
            </span>
            
            {/* Иконка роли пользователя */}
            <div className="flex items-center space-x-1">
              {isSessionHost ? (
                <Crown className="w-3 h-3 text-yellow-400" title="Хост сессии" />
              ) : hasEditPermission ? (
                <Edit3 className="w-3 h-3 text-blue-400" title="Может редактировать" />
              ) : (
                <Eye className="w-3 h-3 text-slate-400" title="Только просмотр" />
              )}
            </div>
          </div>
        </div>

        {/* Участники */}
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-300">
            {activeParticipantCount}/{participantCount}
          </span>
        </div>
      </div>

      {/* Детали (если включены) */}
      {showDetails && (
        <div className="mt-2 pt-2 border-t border-slate-600">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <span className={getConnectionStatusColor()}>
                {getConnectionStatusText()}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {isSessionHost && (
                <span className="px-2 py-0.5 bg-yellow-900/30 text-yellow-300 rounded-full">
                  Хост
                </span>
              )}
              
              {hasEditPermission && !isSessionHost && (
                <span className="px-2 py-0.5 bg-blue-900/30 text-blue-300 rounded-full">
                  Редактор
                </span>
              )}
              
              {!hasEditPermission && (
                <span className="px-2 py-0.5 bg-slate-700/30 text-slate-400 rounded-full">
                  Наблюдатель
                </span>
              )}
            </div>
          </div>

          {/* Статус синхронизации */}
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Real-time синхронизация активна
            </span>
            
            <div className="flex items-center space-x-1">
              <RefreshCw className="w-3 h-3 text-green-400" />
              <span className="text-xs text-green-400">Live</span>
            </div>
          </div>
        </div>
      )}

      {/* Быстрые действия для хоста */}
      {isSessionHost && (
        <div className="mt-2 pt-2 border-t border-slate-600">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Управление сессией</span>
            <div className="flex items-center space-x-1">
              <button
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                title="Копировать ID сессии"
                onClick={() => {
                  navigator.clipboard.writeText(sessionId || '');
                }}
              >
                Копировать ID
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborationStatus;
