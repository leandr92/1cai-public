// Shared Session Component - управление коллаборативной сессией
import React, { useState, useEffect } from 'react';
import { Share2, Users, Settings, Copy, ExternalLink, Users2, Play, Square, Share } from 'lucide-react';
import { useWebSocketCollaboration } from '../../services/websocket-service';
import UserPresence from './UserPresence';
import toast from 'react-hot-toast';

interface SharedSessionProps {
  currentRoleId?: string;
  currentScenarioId?: string;
  onSessionStateChange?: (state: any) => void;
  className?: string;
}

const SharedSession: React.FC<SharedSessionProps> = ({
  currentRoleId,
  currentScenarioId,
  onSessionStateChange,
  className = ''
}) => {
  const {
    isReady,
    isInReadySession,
    sessionId,
    currentSession,
    participants,
    userId,
    isSessionHost,
    hasEditPermission,
    connectionStatus,
    createSession,
    joinSession,
    leaveSession,
    updateSessionState,
    getSessionInfo
  } = useWebSocketCollaboration();

  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [sessionIdInput, setSessionIdInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // Автоматическое обновление состояния сессии
  useEffect(() => {
    if (currentSession && onSessionStateChange) {
      onSessionStateChange({
        roleId: currentSession.roleId,
        scenarioId: currentSession.scenarioId,
        currentStep: currentSession.currentStep,
        isRunning: currentSession.isRunning,
        results: currentSession.results,
        codeExamples: currentSession.codeExamples,
        executionTime: currentSession.executionTime
      });
    }
  }, [currentSession, onSessionStateChange]);

  // Обновляем состояние сессии при изменении роли или сценария
  useEffect(() => {
    if (isInReadySession && hasEditPermission && (currentRoleId || currentScenarioId)) {
      updateSessionState({
        roleId: currentRoleId || currentSession?.roleId,
        scenarioId: currentScenarioId || currentSession?.scenarioId
      });
    }
  }, [currentRoleId, currentScenarioId, isInReadySession, hasEditPermission, updateSessionState, currentSession]);

  const handleCreateSession = () => {
    createSession();
    setShowJoinDialog(false);
  };

  const handleJoinSession = () => {
    if (!sessionIdInput.trim()) {
      toast.error('Введите ID сессии');
      return;
    }
    
    joinSession(sessionIdInput.trim());
    setShowJoinDialog(false);
    setSessionIdInput('');
  };

  const handleCopySessionLink = () => {
    if (sessionId) {
      const sessionUrl = `${window.location.origin}${window.location.pathname}?session=${sessionId}`;
      navigator.clipboard.writeText(sessionUrl);
      toast.success('Ссылка на сессию скопирована!');
    }
  };

  const handleCopySessionId = () => {
    if (sessionId) {
      navigator.clipboard.writeText(sessionId);
      toast.success('ID сессии скопирован!');
    }
  };

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

  // Если не подключен к серверу коллаборации
  if (!isReady) {
    return (
      <div className={`bg-slate-800/30 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
            <Users2 className="w-5 h-5 text-blue-400" />
            <span>Коллаборация</span>
          </h3>
          
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
            <span className={`text-sm ${getConnectionStatusColor()}`}>
              {getConnectionStatusText()}
            </span>
          </div>
        </div>
        
        <div className="text-center py-8">
          <Users2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">
            Подключение к серверу коллаборации...
          </p>
          <div className="animate-spin w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full mx-auto" />
        </div>
      </div>
    );
  }

  // Если не в сессии
  if (!isInReadySession) {
    return (
      <div className={`bg-slate-800/30 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
            <Users2 className="w-5 h-5 text-blue-400" />
            <span>Коллаборация</span>
          </h3>
          
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-green-400">Подключен</span>
          </div>
        </div>
        
        <div className="space-y-3">
          <p className="text-slate-300 text-sm mb-4">
            Работайте вместе с коллегами в реальном времени
          </p>
          
          <div className="flex space-x-3">
            <button
              onClick={handleCreateSession}
              className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Создать сессию</span>
            </button>
            
            <button
              onClick={() => setShowJoinDialog(true)}
              className="flex-1 flex items-center justify-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>Присоединиться</span>
            </button>
          </div>
        </div>

        {/* Диалог присоединения к сессии */}
        {showJoinDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                Присоединиться к сессии
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    ID сессии или ссылка
                  </label>
                  <input
                    type="text"
                    value={sessionIdInput}
                    onChange={(e) => setSessionIdInput(e.target.value)}
                    placeholder="Введите ID сессии..."
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleJoinSession()}
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleJoinSession}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Присоединиться
                  </button>
                  <button
                    onClick={() => setShowJoinDialog(false)}
                    className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // В сессии - показываем управление сессией
  return (
    <div className={`bg-slate-800/30 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
          <Users2 className="w-5 h-5 text-blue-400" />
          <span>Сессия #{sessionId?.slice(-6)}</span>
          {isSessionHost && (
            <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 text-xs rounded-full">
              Хост
            </span>
          )}
        </h3>
        
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-sm text-green-400">Синхронизировано</span>
        </div>
      </div>

      {/* Управление сессией */}
      <div className="space-y-3">
        {/* Действия с сессией */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopySessionId}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
            title="Копировать ID сессии"
          >
            <Copy className="w-3 h-3" />
            <span>ID</span>
          </button>
          
          <button
            onClick={handleCopySessionLink}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
            title="Копировать ссылку на сессию"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Ссылка</span>
          </button>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
            title="Настройки сессии"
          >
            <Settings className="w-3 h-3" />
            <span>Настройки</span>
          </button>
          
          <button
            onClick={leaveSession}
            className="flex items-center space-x-1 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm rounded-lg transition-colors"
            title="Покинуть сессию"
          >
            <Share className="w-3 h-3" />
            <span>Выйти</span>
          </button>
        </div>

        {/* Статус синхронизации */}
        {currentSession && (
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Синхронизация:</span>
              <div className="flex items-center space-x-2">
                {currentSession.isRunning ? (
                  <>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                    <span className="text-yellow-400">Демо выполняется</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    <span className="text-green-400">Готов к работе</span>
                  </>
                )}
              </div>
            </div>
            
            {currentSession.roleId && (
              <div className="mt-2 text-xs text-slate-400">
                Роль: <span className="text-slate-300">{currentSession.roleId}</span>
                {currentSession.scenarioId && (
                  <> • Сценарий: <span className="text-slate-300">{currentSession.scenarioId}</span></>
                )}
              </div>
            )}
          </div>
        )}

        {/* Настройки сессии */}
        {showSettings && (
          <div className="bg-slate-700/30 rounded-lg p-3 space-y-2">
            <h4 className="text-sm font-medium text-slate-200">Настройки сессии</h4>
            
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  defaultChecked={true}
                  className="w-3 h-3 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                />
                <span className="text-xs text-slate-300">Автосинхронизация результатов</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  defaultChecked={false}
                  className="w-3 h-3 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                />
                <span className="text-xs text-slate-300">Разрешить редактирование всем</span>
              </label>
              
              {isSessionHost && (
                <button className="w-full text-left px-2 py-1 text-xs text-red-400 hover:text-red-300 transition-colors">
                  Завершить сессию
                </button>
              )}
            </div>
          </div>
        )}

        {/* Участники сессии */}
        <UserPresence
          participants={participants}
          currentUserId={userId}
          showActivity={true}
          maxDisplayUsers={4}
        />
      </div>
    </div>
  );
};

export default SharedSession;
