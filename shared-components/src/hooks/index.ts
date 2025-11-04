// Хуки для общей библиотеки

// React хуки
export { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// Кастомные хуки
export { useMobile } from './use-mobile';
export { useLocalStorage } from './use-local-storage';
export { useDebounce } from './use-debounce';
export { useApi } from './use-api';
export { useErrorBoundary } from './use-error-boundary';
export { useCollaboration } from './use-collaboration';
export { useExport } from './use-export';
export { useForm } from './use-form';

// Хуки для аналитики
export { useAnalytics } from './use-analytics';
export { usePerformance } from './use-performance';

// Типы хуков
export type { UseMobileResult } from './use-mobile';
export type { UseApiResult } from './use-api';
export type { UseCollaborationResult } from './use-collaboration';
export type { UseExportResult } from './use-export';