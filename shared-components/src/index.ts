// Общая библиотека компонентов 1C AI Ecosystem
// Экспорты из всех подбиблиотек

// UI компоненты
export * from './ui';

// Charts и аналитика
export * from './charts';

// Мобильные компоненты
export * from './mobile';

// Хуки
export * from './hooks';

// Утилиты
export * from './utils';

// Типы
export * from './types';

// Стили
export * from './styles';

// Базовая информация
export const LIBRARY_VERSION = '2.0.0';
export const LIBRARY_NAME = '1c-ai-shared-components';
export const LIBRARY_DESCRIPTION = 'Общая библиотека компонентов для 1C AI Ecosystem';

// Конфигурация
export const COMPONENTS_CONFIG = {
  version: LIBRARY_VERSION,
  theme: 'dark',
  responsive: true,
  accessibility: true,
  i18n: true
};