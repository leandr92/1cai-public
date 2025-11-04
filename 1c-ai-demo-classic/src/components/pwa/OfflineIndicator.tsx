// Offline Indicator Component - показывает статус подключения
import React from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { usePWA } from '../../services/pwa-service';

interface OfflineIndicatorProps {
  className?: string;
  showOnlineMessage?: boolean;
  autoHideDelay?: number;
  position?: 'top' | 'bottom' | 'corner';
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className = '',
  showOnlineMessage = true,
  autoHideDelay = 3000,
  position = 'top'
}) => {
  const { isOnline, isOffline, initializePWA } = usePWA();

  const handleRetry = () => {
    // Переинициализируем PWA и проверяем соединение
    initializePWA();
    
    // Принудительно обновляем статус online
    if (navigator.onLine) {
      window.dispatchEvent(new Event('online'));
    }
  };

  // Определяем позицию и стили
  const getPositionClasses = () => {
    const baseClasses = 'fixed z-50 transition-all duration-300 ease-out';
    
    switch (position) {
      case 'top':
        return `${baseClasses} top-4 left-1/2 transform -translate-x-1/2`;
      case 'bottom':
        return `${baseClasses} bottom-4 left-1/2 transform -translate-x-1/2`;
      case 'corner':
        return `${baseClasses} bottom-4 right-4`;
      default:
        return `${baseClasses} top-4 left-1/2 transform -translate-x-1/2`;
    }
  };

  // Offline состояние
  if (isOffline) {
    return (
      <div className={`${getPositionClasses()} ${className}`}>
        <div className="bg-red-600 text-white rounded-lg shadow-lg border border-red-500 px-4 py-3 max-w-sm animate-in slide-in-from-top-4">
          <div className="flex items-center space-x-3">
            <WifiOff className="w-5 h-5 text-red-200 flex-shrink-0" />
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">
                Нет подключения к интернету
              </p>
              <p className="text-xs text-red-200 mt-1">
                Приложение работает в режиме офлайн
              </p>
            </div>
            
            <button
              onClick={handleRetry}
              className="p-1 hover:bg-red-500 rounded transition-colors"
              title="Проверить подключение"
              aria-label="Проверить подключение"
            >
              <RefreshCw className="w-4 h-4 text-red-200" />
            </button>
          </div>
          
          {/* Дополнительная информация */}
          <div className="mt-2 pt-2 border-t border-red-500/30">
            <p className="text-xs text-red-200">
              💡 Сохраненные данные доступны офлайн
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Online состояние (показывается только если включен showOnlineMessage)
  if (showOnlineMessage && isOnline) {
    return (
      <div className={`${getPositionClasses()} ${className}`}>
        <div className="bg-green-600 text-white rounded-lg shadow-lg border border-green-500 px-3 py-2 max-w-xs animate-in slide-in-from-top-4 fade-out-50">
          <div className="flex items-center space-x-2">
            <Wifi className="w-4 h-4 text-green-200" />
            <p className="text-sm text-white">
              Подключение восстановлено
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Если online и не показываем сообщения, ничего не рендерим
  return null;
};

export default OfflineIndicator;
