// PWA Installer Component - предлагает установку PWA
import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, Wifi, WifiOff } from 'lucide-react';
import { usePWA } from '../../services/pwa-service';

interface PWAInstallerProps {
  className?: string;
  showOnMobileOnly?: boolean;
  autoShowDelay?: number;
}

const PWAInstaller: React.FC<PWAInstallerProps> = ({
  className = '',
  showOnMobileOnly = false,
  autoShowDelay = 5000
}) => {
  const {
    isInstallable,
    isInstalled,
    installPWA,
    isOffline,
    isOnline,
    getPlatform,
    getDisplayMode
  } = usePWA();

  const [showBanner, setShowBanner] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const platform = getPlatform();
  const displayMode = getDisplayMode();

  // Автоматическое отображение через задержку
  useEffect(() => {
    if (!isInstallable || isInstalled || isDismissed) {
      return;
    }

    // На мобильных показываем быстрее
    const delay = showOnMobileOnly && platform !== 'iOS' && platform !== 'Android' 
      ? autoShowDelay * 2 
      : autoShowDelay;

    const timer = setTimeout(() => {
      setShowBanner(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [isInstallable, isInstalled, isDismissed, platform, autoShowDelay, showOnMobileOnly]);

  // Скрываем баннер если PWA уже установлен или на десктопе в standalone режиме
  useEffect(() => {
    if (isInstalled || displayMode === 'standalone') {
      setShowBanner(false);
    }
  }, [isInstalled, displayMode]);

  const handleInstall = async () => {
    if (!isInstallable) return;

    setIsInstalling(true);
    try {
      const success = await installPWA();
      if (success) {
        setShowBanner(false);
      }
    } catch (error) {
      console.error('PWA installation failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setIsDismissed(true);
    
    // Сохраняем состояние на 24 часа
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);
    localStorage.setItem('pwa-installer-dismissed', expiry.toISOString());
  };

  // Проверяем, не был ли баннер недавно скрыт
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-installer-dismissed');
    if (dismissed) {
      const expiry = new Date(dismissed);
      if (expiry > new Date()) {
        setIsDismissed(true);
      } else {
        localStorage.removeItem('pwa-installer-dismissed');
      }
    }
  }, []);

  // Не показываем если не установлен или уже установлен
  if (!isInstallable || isInstalled || !showBanner || isDismissed) {
    return null;
  }

  // Определяем подходящую иконку для платформы
  const getPlatformIcon = () => {
    if (platform === 'iOS' || platform === 'Android') {
      return <Smartphone className="w-5 h-5" />;
    }
    return <Monitor className="w-5 h-5" />;
  };

  // Получаем текст в зависимости от платформы
  const getInstallText = () => {
    switch (platform) {
      case 'iOS':
        return 'Установить на домашний экран';
      case 'Android':
        return 'Установить приложение';
      default:
        return 'Установить PWA';
    }
  };

  const getDescription = () => {
    if (!isOnline) {
      return 'Работает офлайн. Установите для лучшего опыта.';
    }
    
    switch (platform) {
      case 'iOS':
        return 'Нажмите "Поделиться" → "На экран Домой"';
      case 'Android':
        return 'Быстрый доступ и работа офлайн';
      default:
        return 'Быстрый доступ, офлайн работа и push-уведомления';
    }
  };

  return (
    <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 ${className}`}>
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-xl border border-blue-500/30 p-4 transform transition-all duration-300 ease-out animate-in slide-in-from-bottom-4">
        {/* Заголовок */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getPlatformIcon()}
            <h3 className="font-semibold text-sm">
              Установить приложение
            </h3>
          </div>
          
          <div className="flex items-center space-x-1">
            {!isOnline && (
              <WifiOff className="w-4 h-4 text-yellow-300" title="Офлайн" />
            )}
            {isOnline && (
              <Wifi className="w-4 h-4 text-green-300" title="Онлайн" />
            )}
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              aria-label="Закрыть"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Описание */}
        <p className="text-blue-100 text-xs mb-4 leading-relaxed">
          {getDescription()}
        </p>

        {/* Кнопки */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-blue-200">
            <span className="font-medium">{platform}</span>
            {displayMode !== 'browser' && (
              <span className="ml-2 px-2 py-0.5 bg-blue-500/30 rounded text-xs">
                {displayMode}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-xs text-blue-200 hover:text-white transition-colors"
            >
              Позже
            </button>
            
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex items-center space-x-1 px-3 py-1.5 bg-white text-blue-600 rounded text-xs font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isInstalling ? (
                <>
                  <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span>Установка...</span>
                </>
              ) : (
                <>
                  <Download className="w-3 h-3" />
                  <span>{getInstallText()}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Дополнительная информация для iOS */}
        {platform === 'iOS' && (
          <div className="mt-3 pt-3 border-t border-blue-500/30">
            <p className="text-xs text-blue-200">
              📱 Нажмите кнопку "Поделиться" внизу экрана, затем "На экран Домой"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PWAInstaller;
