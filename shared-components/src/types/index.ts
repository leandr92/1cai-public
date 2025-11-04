// Типы для общей библиотеки

// Базовые типы
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  testId?: string;
}

// UI типы
export interface ButtonProps extends BaseComponentProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

export interface CardProps extends BaseComponentProps {
  title?: string;
  description?: string;
  footer?: React.ReactNode;
}

export interface DialogProps extends BaseComponentProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
}

// API типы
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Аналитика типы
export interface KPIMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: Date;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface DashboardConfig {
  title: string;
  refreshInterval?: number;
  showFilters?: boolean;
  allowExport?: boolean;
}

// Мобильные типы
export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  os: 'ios' | 'android' | 'windows' | 'macos' | 'linux';
  browser: string;
  screenSize: {
    width: number;
    height: number;
  };
  orientation: 'portrait' | 'landscape';
  isTouchDevice: boolean;
}

export interface MobileConfig {
  enableSwipe?: boolean;
  enablePullToRefresh?: boolean;
  optimizedForMobile?: boolean;
  touchTargetSize?: number;
}

// AI типы
export interface AIAgent {
  id: string;
  name: string;
  role: string;
  description: string;
  avatar: string;
  capabilities: string[];
  status: 'active' | 'inactive' | 'busy';
}

export interface AIRequest {
  agentId: string;
  prompt: string;
  context?: Record<string, any>;
  options?: Record<string, any>;
}

export interface AIResponse {
  success: boolean;
  result?: any;
  error?: string;
  tokensUsed?: number;
  executionTime?: number;
}

// Тематизация
export type Theme = 'light' | 'dark' | 'auto';

// Производительность
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  threshold?: number;
  status: 'good' | 'warning' | 'error';
}

// Экспорт
export interface ExportOptions {
  format: 'pdf' | 'excel' | 'json' | 'csv';
  includeCharts?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ExportResult {
  success: boolean;
  downloadUrl?: string;
  fileName?: string;
  error?: string;
}