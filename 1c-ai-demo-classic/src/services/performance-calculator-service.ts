export interface PerformanceMetrics {
  responseTime: number; // milliseconds
  throughput: number; // requests per second
  errorRate: number; // percentage
  availability: number; // percentage
  cpuUsage: number; // percentage
  memoryUsage: number; // percentage
  diskUsage: number; // percentage
  networkLatency: number; // milliseconds
  concurrentUsers: number;
  cacheHitRate: number; // percentage
  databaseConnections: number; // active connections
}

export interface PerformanceTarget {
  metric: keyof PerformanceMetrics;
  threshold: number;
  comparison: 'less_than' | 'greater_than' | 'equals';
  weight: number; // Importance weight (0-1)
}

export interface PerformanceBenchmark {
  id: string;
  name: string;
  description: string;
  category: 'load_test' | 'stress_test' | 'endurance_test' | 'volume_test';
  targets: PerformanceTarget[];
  historical: PerformanceMetrics[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  result?: {
    passed: boolean;
    score: number; // 0-100
    issues: string[];
  };
}

export interface PerformanceReport {
  id: string;
  benchmarkId: string;
  metrics: PerformanceMetrics;
  recommendations: string[];
  actionItems: {
    priority: 'low' | 'moderate' | 'high' | 'critical';
    description: string;
    estimatedImpact: string;
  }[];
  generatedAt: Date;
}

export class PerformanceCalculatorService {
  private benchmarks: Map<string, PerformanceBenchmark> = new Map();
  private reports: Map<string, PerformanceReport> = new Map();
  private realTimeMetrics: PerformanceMetrics | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeDefaultBenchmarks();
  }

  private initializeDefaultBenchmarks(): void {
    const defaultBenchmarks: Omit<PerformanceBenchmark, 'id' | 'historical' | 'status' | 'createdAt'>[] = [
      {
        name: 'Базовый нагрузочный тест',
        description: 'Проверка производительности при нормальной нагрузке',
        category: 'load_test',
        targets: [
          { metric: 'responseTime', threshold: 2000, comparison: 'less_than', weight: 0.3 },
          { metric: 'errorRate', threshold: 1, comparison: 'less_than', weight: 0.25 },
          { metric: 'availability', threshold: 99.5, comparison: 'greater_than', weight: 0.2 },
          { metric: 'cpuUsage', threshold: 80, comparison: 'less_than', weight: 0.15 },
          { metric: 'memoryUsage', threshold: 75, comparison: 'less_than', weight: 0.1 }
        ]
      },
      {
        name: 'Стресс тест',
        description: 'Проверка поведения системы под высокой нагрузкой',
        category: 'stress_test',
        targets: [
          { metric: 'responseTime', threshold: 5000, comparison: 'less_than', weight: 0.25 },
          { metric: 'errorRate', threshold: 5, comparison: 'less_than', weight: 0.2 },
          { metric: 'availability', threshold: 95, comparison: 'greater_than', weight: 0.2 },
          { metric: 'cpuUsage', threshold: 95, comparison: 'less_than', weight: 0.2 },
          { metric: 'memoryUsage', threshold: 90, comparison: 'less_than', weight: 0.15 }
        ]
      },
      {
        name: 'Выносливость системы',
        description: 'Долговременная стабильность под нагрузкой',
        category: 'endurance_test',
        targets: [
          { metric: 'responseTime', threshold: 1500, comparison: 'less_than', weight: 0.25 },
          { metric: 'errorRate', threshold: 0.5, comparison: 'less_than', weight: 0.25 },
          { metric: 'availability', threshold: 99.9, comparison: 'greater_than', weight: 0.3 },
          { metric: 'memoryUsage', threshold: 70, comparison: 'less_than', weight: 0.2 }
        ]
      }
    ];

    defaultBenchmarks.forEach(benchmark => {
      const id = this.generateBenchmarkId();
      this.benchmarks.set(id, {
        id,
        ...benchmark,
        historical: [],
        status: 'pending',
        createdAt: new Date()
      });
    });
  }

  async startRealTimeMonitoring(): Promise<void> {
    if (this.monitoringInterval) {
      return;
    }

    this.monitoringInterval = setInterval(async () => {
      try {
        const metrics = await this.collectMetrics();
        this.realTimeMetrics = metrics;
        this.notifyMetricsUpdate(metrics);
      } catch (error) {
        console.error('Error collecting metrics:', error);
      }
    }, 5000); // Collect metrics every 5 seconds
  }

  async stopRealTimeMonitoring(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  private async collectMetrics(): Promise<PerformanceMetrics> {
    // Mock implementation - in real app would collect from various sources
    const mockMetrics: PerformanceMetrics = {
      responseTime: Math.random() * 3000 + 100,
      throughput: Math.random() * 1000 + 100,
      errorRate: Math.random() * 5,
      availability: Math.random() * 10 + 90,
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 100,
      diskUsage: Math.random() * 100,
      networkLatency: Math.random() * 500 + 10,
      concurrentUsers: Math.floor(Math.random() * 1000),
      cacheHitRate: Math.random() * 100,
      databaseConnections: Math.floor(Math.random() * 200)
    };

    return mockMetrics;
  }

  async calculatePerformanceScore(
    metrics: PerformanceMetrics,
    targets: PerformanceTarget[]
  ): Promise<{
    score: number;
    passedTargets: number;
    totalTargets: number;
    details: Array<{
      target: PerformanceTarget;
      actualValue: number;
      passed: boolean;
      score: number;
    }>;
  }> {
    let totalScore = 0;
    let totalWeight = 0;
    let passedTargets = 0;
    const details: Array<{
      target: PerformanceTarget;
      actualValue: number;
      passed: boolean;
      score: number;
    }> = [];

    targets.forEach(target => {
      const actualValue = metrics[target.metric];
      
      // Проверяем, является ли значение числом (игнорируем Date и другие нечисловые типы)
      if (typeof actualValue !== 'number') {
        console.warn(`Метрика ${target.metric} имеет нечисловой тип:`, typeof actualValue);
        return; // Пропускаем эту метрику
      }
      
      let passed = false;
      let targetScore = 0;

      switch (target.comparison) {
        case 'less_than':
          passed = actualValue <= target.threshold;
          targetScore = passed ? target.weight : (target.threshold / actualValue) * target.weight;
          break;
        case 'greater_than':
          passed = actualValue >= target.threshold;
          targetScore = passed ? target.weight : (actualValue / target.threshold) * target.weight;
          break;
        case 'equals':
          passed = Math.abs(actualValue - target.threshold) < (target.threshold * 0.1);
          targetScore = passed ? target.weight : Math.max(0, 1 - Math.abs(actualValue - target.threshold) / target.threshold) * target.weight;
          break;
      }

      if (passed) {
        passedTargets++;
      }

      totalScore += Math.min(targetScore, target.weight);
      totalWeight += target.weight;

      details.push({
        target,
        actualValue,
        passed,
        score: targetScore
      });
    });

    const finalScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;

    return {
      score: Math.round(finalScore),
      passedTargets,
      totalTargets: targets.length,
      details
    };
  }

  async runBenchmark(
    benchmarkId: string,
    duration: number = 60000 // 1 minute default
  ): Promise<PerformanceReport> {
    const benchmark = this.benchmarks.get(benchmarkId);
    if (!benchmark) {
      throw new Error(`Benchmark with id ${benchmarkId} not found`);
    }

    benchmark.status = 'running';
    benchmark.historical = [];

    const startTime = Date.now();
    const endTime = startTime + duration;

    // Simulate benchmark running
    while (Date.now() < endTime) {
      const metrics = await this.collectMetrics();
      benchmark.historical.push(metrics);
      
      // Simulate some delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    benchmark.status = 'completed';
    benchmark.completedAt = new Date();

    // Calculate final metrics
    const finalMetrics = this.calculateAggregatedMetrics(benchmark.historical);
    const { score, passedTargets, totalTargets, details } = await this.calculatePerformanceScore(
      finalMetrics,
      benchmark.targets
    );

    const passed = passedTargets === totalTargets && score >= 80;
    
    benchmark.result = {
      passed,
      score,
      issues: details.filter(d => !d.passed).map(d => 
        `${d.target.metric}: ${d.actualValue} не соответствует критерию (${d.target.threshold})`
      )
    };

    // Generate report
    const report = await this.generateReport(benchmarkId, finalMetrics);
    this.reports.set(report.id, report);

    return report;
  }

  private calculateAggregatedMetrics(historical: PerformanceMetrics[]): PerformanceMetrics {
    if (historical.length === 0) {
      throw new Error('No historical data available');
    }

    const latest = historical[historical.length - 1];
    
    return {
      ...latest,
      responseTime: this.average(historical.map(h => h.responseTime)),
      throughput: this.average(historical.map(h => h.throughput)),
      errorRate: this.average(historical.map(h => h.errorRate)),
      availability: this.average(historical.map(h => h.availability)),
      cpuUsage: this.average(historical.map(h => h.cpuUsage)),
      memoryUsage: this.average(historical.map(h => h.memoryUsage)),
      diskUsage: this.average(historical.map(h => h.diskUsage)),
      networkLatency: this.average(historical.map(h => h.networkLatency)),
      concurrentUsers: Math.max(...historical.map(h => h.concurrentUsers))
    };
  }

  private average(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private async generateReport(
    benchmarkId: string,
    metrics: PerformanceMetrics
  ): Promise<PerformanceReport> {
    const benchmark = this.benchmarks.get(benchmarkId)!;
    
    const recommendations: string[] = [];
    const actionItems: PerformanceReport['actionItems'] = [];

    // Generate recommendations based on metrics
    if (metrics.responseTime > 2000) {
      recommendations.push('Рассмотрите оптимизацию запросов к базе данных');
      actionItems.push({
        priority: 'high',
        description: 'Оптимизировать производительность запросов',
        estimatedImpact: 'Снижение времени отклика на 30-50%'
      });
    }

    if (metrics.errorRate > 1) {
      recommendations.push('Необходимо улучшить обработку ошибок');
      actionItems.push({
        priority: 'critical',
        description: 'Исправить источники ошибок',
        estimatedImpact: 'Повышение стабильности системы'
      });
    }

    if (metrics.cpuUsage > 80) {
      recommendations.push('Рекомендуется увеличить вычислительные ресурсы');
      actionItems.push({
        priority: 'moderate',
        description: 'Масштабирование CPU',
        estimatedImpact: 'Снижение нагрузки на процессор'
      });
    }

    if (metrics.memoryUsage > 80) {
      recommendations.push('Необходимо оптимизировать использование памяти');
      actionItems.push({
        priority: 'high',
        description: 'Оптимизация управления памятью',
        estimatedImpact: 'Снижение потребления памяти на 20-30%'
      });
    }

    const report: PerformanceReport = {
      id: this.generateReportId(),
      benchmarkId,
      metrics,
      recommendations,
      actionItems,
      generatedAt: new Date()
    };

    return report;
  }

  getBenchmark(id: string): PerformanceBenchmark | null {
    return this.benchmarks.get(id) || null;
  }

  getAllBenchmarks(): PerformanceBenchmark[] {
    return Array.from(this.benchmarks.values());
  }

  getReport(id: string): PerformanceReport | null {
    return this.reports.get(id) || null;
  }

  getReportsByBenchmark(benchmarkId: string): PerformanceReport[] {
    return Array.from(this.reports.values()).filter(report => report.benchmarkId === benchmarkId);
  }

  getRealTimeMetrics(): PerformanceMetrics | null {
    return this.realTimeMetrics;
  }

  async createCustomBenchmark(
    name: string,
    description: string,
    category: PerformanceBenchmark['category'],
    targets: PerformanceTarget[]
  ): Promise<string> {
    const benchmark: PerformanceBenchmark = {
      id: this.generateBenchmarkId(),
      name,
      description,
      category,
      targets,
      historical: [],
      status: 'pending',
      createdAt: new Date()
    };

    this.benchmarks.set(benchmark.id, benchmark);
    return benchmark.id;
  }

  async compareBenchmarks(benchmarkId1: string, benchmarkId2: string): Promise<{
    comparison: Array<{
      metric: keyof PerformanceMetrics;
      benchmark1Value: number;
      benchmark2Value: number;
      improvement: number; // percentage
    }>;
    overallWinner: string;
    summary: string;
  }> {
    const benchmark1 = this.getBenchmark(benchmarkId1);
    const benchmark2 = this.getBenchmark(benchmarkId2);

    if (!benchmark1 || !benchmark2) {
      throw new Error('One or both benchmarks not found');
    }

    if (benchmark1.historical.length === 0 || benchmark2.historical.length === 0) {
      throw new Error('Historical data not available for one or both benchmarks');
    }

    const metrics1 = this.calculateAggregatedMetrics(benchmark1.historical);
    const metrics2 = this.calculateAggregatedMetrics(benchmark2.historical);

    const comparison = Object.keys(metrics1)
      .filter(key => typeof metrics1[key as keyof PerformanceMetrics] === 'number')
      .map(metric => {
        const value1 = metrics1[metric as keyof PerformanceMetrics] as number;
        const value2 = metrics2[metric as keyof PerformanceMetrics] as number;
        
        let improvement = 0;
        if (metric === 'errorRate') {
          improvement = value1 < value2 ? ((value2 - value1) / value2) * 100 : 0;
        } else {
          improvement = value2 > value1 ? ((value2 - value1) / value1) * 100 : 0;
        }

        return {
          metric: metric as keyof PerformanceMetrics,
          benchmark1Value: value1,
          benchmark2Value: value2,
          improvement: Math.round(improvement)
        };
      });

    // Determine overall winner based on average improvement
    const averageImprovement = comparison.reduce((sum, comp) => sum + comp.improvement, 0) / comparison.length;
    const overallWinner = averageImprovement > 0 ? benchmarkId2 : benchmarkId1;

    const summary = `Среднее улучшение: ${Math.round(averageImprovement)}%`;

    return {
      comparison,
      overallWinner,
      summary
    };
  }

  async analyzeBottlenecks(metrics: PerformanceMetrics[]): Promise<PerformanceBottleneck[]> {
    const bottlenecks: PerformanceBottleneck[] = [];
    
    metrics.forEach((metric, index) => {
      // CPU bottlenecks
      if (metric.cpuUsage > 80) {
        bottlenecks.push({
          id: `cpu_${index}`,
          type: 'cpu',
          severity: metric.cpuUsage > 90 ? 'critical' : 'high',
          description: `High CPU usage detected: ${metric.cpuUsage}%`,
          impactedMetrics: ['responseTime', 'throughput'],
          rootCause: 'CPU intensive operations or insufficient resources',
          recommendedActions: [
            'Optimize CPU-intensive operations',
            'Scale horizontally or vertically',
            'Profile application for optimization opportunities'
          ],
          estimatedImpact: {
            performance: 25,
            cost: -10
          }
        });
      }
      
      // Memory bottlenecks
      if (metric.memoryUsage > 85) {
        bottlenecks.push({
          id: `memory_${index}`,
          type: 'memory',
          severity: metric.memoryUsage > 95 ? 'critical' : 'high',
          description: `High memory usage detected: ${metric.memoryUsage}%`,
          impactedMetrics: ['responseTime', 'errorRate'],
          rootCause: 'Memory leaks or insufficient memory allocation',
          recommendedActions: [
            'Identify and fix memory leaks',
            'Increase memory allocation',
            'Optimize data structures'
          ],
          estimatedImpact: {
            performance: 20,
            cost: -5
          }
        });
      }
    });
    
    return bottlenecks;
  }

  async generateOptimizationRecommendations(
    metrics: PerformanceMetrics[],
    bottlenecks: PerformanceBottleneck[]
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];
    
    // Generate recommendations based on bottlenecks
    bottlenecks.forEach(bottleneck => {
      switch (bottleneck.type) {
        case 'cpu':
          recommendations.push({
            id: `cpu_opt_${bottleneck.id}`,
            category: 'code',
            priority: bottleneck.severity,
            title: 'CPU Performance Optimization',
            description: bottleneck.description,
            implementation: {
              complexity: 'moderate',
              estimatedTime: '2-4 weeks',
              requiredResources: ['Development team', 'Performance testing environment'],
              steps: [
                'Profile application to identify CPU hotspots',
                'Optimize algorithms and data structures',
                'Implement caching strategies',
                'Test and validate improvements'
              ]
            },
            expectedImpact: {
              performance: 30,
              cost: -15,
              reliability: 5
            },
            roi: {
              investment: 10000,
              savings: 25000,
              paybackPeriod: 4
            }
          });
          break;
          
        case 'memory':
          recommendations.push({
            id: `memory_opt_${bottleneck.id}`,
            category: 'code',
            priority: bottleneck.severity,
            title: 'Memory Management Optimization',
            description: bottleneck.description,
            implementation: {
              complexity: 'easy',
              estimatedTime: '1-2 weeks',
              requiredResources: ['Development team'],
              steps: [
                'Identify memory leaks using profiling tools',
                'Fix object lifecycle management',
                'Implement proper garbage collection',
                'Monitor memory usage after fixes'
              ]
            },
            expectedImpact: {
              performance: 25,
              cost: -8,
              reliability: 10
            },
            roi: {
              investment: 5000,
              savings: 15000,
              paybackPeriod: 3
            }
          });
          break;
      }
    });
    
    return recommendations;
  }

  private notifyMetricsUpdate(metrics: PerformanceMetrics): void {
    // This would typically emit events or trigger callbacks
    console.log('Performance metrics updated:', metrics);
  }

  private generateBenchmarkId(): string {
    return `benchmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Additional interfaces for performance analysis
export interface ScalabilityProjection {
  currentUsers: number;
  projectedUsers: number;
  scalingFactor: number;
  growthRate?: number; // percentage growth rate
  timeHorizon?: string; // e.g., "6 months", "1 year"
  recommendedResources: {
    cpu: number;
    memory: number;
    storage: number;
    network: number;
  };
  estimatedCosts: {
    infrastructure: number;
    maintenance: number;
    total: number;
  };
  timeline: {
    phase: string;
    users: number;
    resources: any;
  }[];
}

export interface PerformanceBottleneck {
  id: string;
  type: 'cpu' | 'memory' | 'io' | 'network' | 'database';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  description: string;
  component?: string; // Component or service where bottleneck occurs
  impactedMetrics: string[];
  rootCause: string;
  recommendedActions: string[];
  estimatedImpact: {
    performance: number; // percentage improvement
    cost: number; // cost change
  };
  // Additional properties used by components
  impact?: string;
  recommendation?: string;
  estimatedImprovement?: string;
}

export interface OptimizationRecommendation {
  id: string;
  category: 'code' | 'infrastructure' | 'database' | 'cache' | 'network';
  priority: 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  description: string;
  implementation: {
    complexity: 'easy' | 'moderate' | 'hard';
    estimatedTime: string;
    requiredResources: string[];
    steps: string[];
  };
  expectedImpact: {
    performance: number; // percentage improvement
    cost: number; // cost change
    reliability: number; // percentage improvement
  };
  roi: {
    investment: number;
    savings: number;
    paybackPeriod: number; // months
  };
  // Additional properties used by components
  estimatedEffort?: string;
  estimatedImpact?: string;
  steps?: string[];
}

// Export singleton instance
export const performanceCalculatorService = new PerformanceCalculatorService();