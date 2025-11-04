// Мобильные компоненты

// Навигация
export { MobileNavigation } from './MobileNavigation';
export { MobileSettingsPanel } from './MobileSettingsPanel';

// Адаптивные компоненты
export { ResponsiveDashboard } from './ResponsiveDashboard';
export { DeviceOptimizationView } from './DeviceOptimizationView';
export { MobileOptimizationPage } from './MobileOptimizationPage';

// Хуки для мобильных устройств
export { useMobile } from './hooks/useMobile';
export { useOrientation } from './hooks/useOrientation';
export { useTouchGestures } from './hooks/useTouchGestures';

// Утилиты
export { detectDeviceType } from './utils/deviceDetection';
export { optimizeForMobile } from './utils/mobileOptimization';

// Типы
export type { DeviceInfo } from './types';
export type { MobileConfig } from './types';