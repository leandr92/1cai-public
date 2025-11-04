// Update Notification Component - уведомляет о доступности обновлений
import React, { useState, useEffect } from 'react';
import { RefreshCw, Download, X, Clock } from 'lucide-react';
import { usePWA } from '../../services/pwa-service';

interface UpdateNotificationProps {
  className?: string;
  autoShowDelay?: number;
  showDownloadProgress?: boolean;
  onUpdateApplied?: () => void;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({
  className = '',
  autoShowDelay = 0,
  showDownloadProgress = false,
  onUpdateApplied
}) => {
  const {
    updateAvailable,
    applyUpdate,
    updateInfo
  } = usePWA();

  const [showNotification, setShowNotification] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [timeSinceUpdate, setTimeSinceUpdate] = useState(0);

  // Автоматическое отображение уведомления
  useEffect(() => {
    if (updateAvailable && !showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(true);
      }, autoShowDelay);
      
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [updateAvailable, showNotification, autoShowDelay]);

  // Счетчик времени с момента появления обновления
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (showNotification) {
      interval = setInterval(() => {
        setTimeSinceUpdate(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showNotification]);

  const handleUpdate = async () => {
    if (!updateAvailable || isUpdating) return;

    setIsUpdating(true);
    setUpdateProgress(0);

    try {
      // Симулируем прогресс загрузки
      const progressInterval = setInterval(() => {
        setUpdateProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await applyUpdate();
      
      // Завершаем прогресс
      clearInterval(progressInterval);
      setUpdateProgress(100);
      
      // Вызываем callback
      if (onUpdateApplied) {
        onUpdateApplied();
      }
      
      // Автоматически скрываем уведомление
      setTimeout(() => {
        setShowNotification(false);
      }, 2000);
      
    } catch (error) {
      console.error('Update failed:', error);
      setIsUpdating(false);
      setUpdateProgress(0);
    }
  };

  const handleDismiss = () => {
    setShowNotification(false);
  };

  // Форматирование времени
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}м ${remainingSeconds}с`;
    }
    return `${remainingSeconds}с`;
  };

  // Получаем текст уведомления в зависимости от времени
  const getNotificationMessage = () => {
    if (timeSinceUpdate < 30) {
      return 'Доступно обновление приложения';
    } else if (timeSinceUpdate < 60) {
      return 'Новая версия готова к установке';
    } else {
      return 'Рекомендуем обновить приложение';
    }
  };

  if (!updateAvailable || !showNotification) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm ${className}`}>
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-xl border border-blue-500/30 p-4 transform transition-all duration-300 ease-out animate-in slide-in-from-right-4">
        {/* Заголовок */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Download className="w-5 h-5 text-blue-200" />
            <h3 className="font-semibold text-sm">
              Обновление доступно
            </h3>
          </div>
          
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            aria-label="Закрыть уведомление"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Сообщение */}
        <p className="text-blue-100 text-sm mb-4">
          {getNotificationMessage()}
        </p>

        {/* Прогресс обновления */}
        {isUpdating && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-blue-200 mb-2">
              <span>Обновление...</span>
              <span>{updateProgress}%</span>
            </div>
            <div className="w-full bg-blue-500/30 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-300 ease-out"
                style={{ width: `${updateProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Информация о времени */}
        {!isUpdating && (
          <div className="flex items-center space-x-2 text-xs text-blue-200 mb-4">
            <Clock className="w-3 h-3" />
            <span>Доступно {formatTime(timeSinceUpdate)}</span>
          </div>
        )}

        {/* Кнопки действий */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 text-xs text-blue-200 hover:text-white transition-colors"
          >
            Позже
          </button>
          
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="flex items-center space-x-1 px-3 py-1.5 bg-white text-blue-600 rounded text-xs font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Обновление...</span>
              </>
            ) : (
              <>
                <Download className="w-3 h-3" />
                <span>Обновить</span>
              </>
            )}
          </button>
        </div>

        {/* Дополнительная информация */}
        {showDownloadProgress && !isUpdating && (
          <div className="mt-3 pt-3 border-t border-blue-500/30">
            <p className="text-xs text-blue-200">
              📱 Обновление загрузится в фоновом режиме
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateNotification;
