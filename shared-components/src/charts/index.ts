// Charts и аналитические компоненты

// Отчеты и дашборды
export { ReportsDashboard } from './ReportsDashboard';
export { KPIChart } from './KPIChart';
export { PerformanceChart } from './PerformanceChart';
export { AnalyticsDashboard } from './AnalyticsDashboard';

// Аналитические утилиты
export { calculateROI } from './utils/calculations';
export { formatMetrics } from './utils/formatters';
export { generateChartData } from './utils/generators';

// Типы для аналитики
export type { KPIMetric } from './types';
export type { ChartDataPoint } from './types';
export type { DashboardConfig } from './types';