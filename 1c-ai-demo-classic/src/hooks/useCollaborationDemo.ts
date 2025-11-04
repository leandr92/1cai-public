// Collaboration Demo Hook - интеграция real-time коллаборации с демо контроллером
import { useCallback, useEffect } from 'react';
import { useWebSocketCollaboration } from '../services/websocket-service';
import { sessionStateManager } from '../utils/collaboration-utils';
import { DemoResult, GeneratedCode } from '../data/demoContent';
import toast from 'react-hot-toast';

interface UseCollaborationDemoProps {
  roleId?: string;
  scenarioId?: string;
  onDemoStateChange?: (state: {
    isRunning: boolean;
    currentStep: number;
    results: DemoResult[];
    codeExamples: GeneratedCode[];
    executionTime: number;
  }) => void;
}

export const useCollaborationDemo = ({
  roleId,
  scenarioId,
  onDemoStateChange
}: UseCollaborationDemoProps) => {
  const {
    isInReadySession,
    currentSession,
    updateSessionState,
    syncDemoResults,
    hasEditPermission,
    isSessionHost
  } = useWebSocketCollaboration();

  // Синхронизация состояния демо с сессией
  const syncDemoState = useCallback((
    isRunning: boolean,
    currentStep: number,
    results: DemoResult[],
    codeExamples: GeneratedCode[],
    executionTime: number
  ) => {
    if (!isInReadySession) return;

    // Обновляем состояние сессии
    updateSessionState({
      isRunning,
      currentStep,
      results,
      codeExamples,
      executionTime,
      roleId: roleId || undefined,
      scenarioId: scenarioId || undefined
    });

    // Если демо завершено, синхронизируем результаты со всеми участниками
    if (!isRunning && results.length > 0) {
      syncDemoResults(results, codeExamples, executionTime);
      
      if (hasEditPermission) {
        console.log('📊 Demo results synced to all participants');
      }
    }
  }, [isInReadySession, updateSessionState, syncDemoResults, hasEditPermission, roleId, scenarioId]);

  // Обработка изменений состояния сессии
  useEffect(() => {
    if (!currentSession || !onDemoStateChange) return;

    onDemoStateChange({
      isRunning: currentSession.isRunning || false,
      currentStep: currentSession.currentStep || 0,
      results: currentSession.results || [],
      codeExamples: currentSession.codeExamples || [],
      executionTime: currentSession.executionTime || 0
    });

    // Показываем уведомления о синхронизации
    if ((currentSession.results || []).length > 0) {
      toast.success('Результаты демо синхронизированы', {
        duration: 2000,
        icon: '📊'
      });
    }
  }, [currentSession, onDemoStateChange]);

  // Автоматическое обновление роли и сценария
  useEffect(() => {
    if (isInReadySession && hasEditPermission && (roleId || scenarioId)) {
      updateSessionState({
        roleId: roleId || currentSession?.roleId || undefined,
        scenarioId: scenarioId || currentSession?.scenarioId || undefined
      });
    }
  }, [isInReadySession, hasEditPermission, roleId, scenarioId, updateSessionState, currentSession]);

  // Утилита для проверки синхронизации
  const isDemoSynchronized = useCallback(() => {
    if (!currentSession) return false;
    
    return currentSession.roleId === roleId && 
           currentSession.scenarioId === scenarioId &&
           !currentSession.isRunning;
  }, [currentSession, roleId, scenarioId]);

  // Утилита для получения статуса синхронизации
  const getSyncStatus = useCallback(() => {
    if (!isInReadySession) {
      return {
        isActive: false,
        status: 'not_connected',
        message: 'Не подключен к сессии',
        color: 'gray'
      };
    }

    if (!hasEditPermission) {
      return {
        isActive: true,
        status: 'view_only',
        message: 'Только просмотр',
        color: 'yellow'
      };
    }

    if (currentSession?.isRunning) {
      return {
        isActive: true,
        status: 'running',
        message: 'Демо выполняется',
        color: 'blue'
      };
    }

    if (isDemoSynchronized()) {
      return {
        isActive: true,
        status: 'synced',
        message: 'Синхронизировано',
        color: 'green'
      };
    }

    return {
      isActive: true,
      status: 'ready',
      message: 'Готов к синхронизации',
      color: 'blue'
    };
  }, [isInReadySession, hasEditPermission, currentSession, isDemoSynchronized]);

  // Принудительная синхронизация
  const forceSync = useCallback(() => {
    if (!currentSession || !hasEditPermission) {
      toast.error('Недостаточно прав для синхронизации');
      return;
    }

    // Принудительно обновляем состояние
    updateSessionState({
      roleId,
      scenarioId,
      currentStep: 0,
      isRunning: false,
      results: currentSession.results,
      codeExamples: currentSession.codeExamples,
      executionTime: currentSession.executionTime
    });

    toast.success('Синхронизация принудительно обновлена');
  }, [currentSession, hasEditPermission, updateSessionState, roleId, scenarioId]);

  // Получение информации о сессии для демо
  const getSessionInfo = useCallback(() => {
    if (!currentSession) return null;

    return {
      sessionId: currentSession.sessionId,
      participantCount: (currentSession.participants || []).length,
      activeUsers: (currentSession.participants || []).filter(p => p.isActive).length,
      isHost: isSessionHost,
      canEdit: hasEditPermission,
      lastSync: currentSession.lastActivity,
      currentRole: currentSession.roleId,
      currentScenario: currentSession.scenarioId
    };
  }, [currentSession, isSessionHost, hasEditPermission]);

  return {
    // Состояние
    isInSession: isInReadySession,
    currentSession,
    hasEditPermission,
    isSessionHost,
    sessionInfo: getSessionInfo(),
    
    // Действия
    syncDemoState,
    forceSync,
    
    // Утилиты
    isDemoSynchronized: isDemoSynchronized(),
    syncStatus: getSyncStatus(),
    
    // Метаданные
    isCollaborationEnabled: isInReadySession
  };
};

export default useCollaborationDemo;
