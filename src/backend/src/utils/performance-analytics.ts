// Performance Analytics Utilities (Bloco K)

export interface MetricDataPoint {
  timestamp: string;
  value: number;
}

export interface MetricStats {
  metricName: string;
  current: number;
  average: number;
  median: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
  stdDev: number;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
}

export interface SLAViolation {
  metricName: string;
  threshold: number;
  currentValue: number;
  severity: 'warning' | 'critical';
  timestamp: string;
}

// SLA thresholds
export const SLA_THRESHOLDS: Record<string, number> = {
  response_time: 500, // ms
  error_rate: 1.0, // percent
  cpu_usage: 80, // percent
  memory_usage: 85, // percent
  cache_hit_rate: 70, // percent (min)
  availability: 99.5, // percent (min)
};

// Calculate basic statistics
export function calculateStats(values: number[]): Partial<MetricStats> {
  if (values.length === 0) {
    return { current: 0, average: 0, median: 0, min: 0, max: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const len = sorted.length;

  const current = values[values.length - 1];
  const average = values.reduce((a, b) => a + b) / len;
  const median = len % 2 === 0 ? (sorted[len / 2 - 1] + sorted[len / 2]) / 2 : sorted[Math.floor(len / 2)];
  const min = sorted[0];
  const max = sorted[len - 1];

  // Calculate percentiles
  const p95Index = Math.ceil((95 / 100) * len) - 1;
  const p99Index = Math.ceil((99 / 100) * len) - 1;
  const p95 = sorted[Math.max(0, p95Index)];
  const p99 = sorted[Math.max(0, p99Index)];

  // Standard deviation
  const squaredDiffs = values.map(v => Math.pow(v - average, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b) / len;
  const stdDev = Math.sqrt(variance);

  return {
    current,
    average,
    median,
    p95,
    p99,
    min,
    max,
    stdDev,
  };
}

// Determine trend direction
export function calculateTrend(values: number[]): { trend: 'up' | 'down' | 'stable'; percent: number } {
  if (values.length < 2) {
    return { trend: 'stable', percent: 0 };
  }

  const recent = values.slice(-Math.ceil(values.length / 2));
  const older = values.slice(0, Math.floor(values.length / 2));

  const recentAvg = recent.reduce((a, b) => a + b) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b) / older.length;

  const change = ((recentAvg - olderAvg) / olderAvg) * 100;

  if (Math.abs(change) < 5) {
    return { trend: 'stable', percent: 0 };
  }

  return {
    trend: change > 0 ? 'up' : 'down',
    percent: Math.abs(change),
  };
}

// Check SLA violation
export function checkSLAViolation(metricName: string, value: number): SLAViolation | null {
  const threshold = SLA_THRESHOLDS[metricName];

  if (!threshold) return null;

  // Different logic for different metrics
  let isViolated = false;
  let severity: 'warning' | 'critical' = 'warning';

  switch (metricName) {
    case 'cache_hit_rate':
    case 'availability':
      // These should be above threshold
      isViolated = value < threshold;
      severity = value < threshold * 0.95 ? 'critical' : 'warning';
      break;
    default:
      // These should be below threshold
      isViolated = value > threshold;
      severity = value > threshold * 1.2 ? 'critical' : 'warning';
  }

  if (isViolated) {
    return {
      metricName,
      threshold,
      currentValue: value,
      severity,
      timestamp: new Date().toISOString(),
    };
  }

  return null;
}

// Aggregate metrics by time bucket
export function aggregateByTimeBucket(
  dataPoints: Array<{ timestamp: string; value: number }>,
  bucketSizeMinutes: number
): MetricDataPoint[] {
  if (dataPoints.length === 0) return [];

  const buckets: Map<string, number[]> = new Map();

  dataPoints.forEach(point => {
    const date = new Date(point.timestamp);
    date.setMinutes(Math.floor(date.getMinutes() / bucketSizeMinutes) * bucketSizeMinutes);
    date.setSeconds(0);
    date.setMilliseconds(0);

    const key = date.toISOString();
    if (!buckets.has(key)) {
      buckets.set(key, []);
    }
    buckets.get(key)!.push(point.value);
  });

  return Array.from(buckets.entries())
    .map(([timestamp, values]) => ({
      timestamp,
      value: values.reduce((a, b) => a + b) / values.length,
    }))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

// Get performance health score (0-100)
export function calculateHealthScore(violations: SLAViolation[]): number {
  if (violations.length === 0) return 100;

  const criticalCount = violations.filter(v => v.severity === 'critical').length;
  const warningCount = violations.filter(v => v.severity === 'warning').length;

  // Deduct points based on violations
  let score = 100;
  score -= criticalCount * 25;
  score -= warningCount * 10;

  return Math.max(0, score);
}

// Format metric value based on type
export function formatMetricValue(metricName: string, value: number): string {
  switch (metricName) {
    case 'response_time':
      return `${value.toFixed(0)}ms`;
    case 'error_rate':
    case 'cpu_usage':
    case 'memory_usage':
    case 'cache_hit_rate':
    case 'availability':
      return `${value.toFixed(2)}%`;
    case 'throughput':
      return `${value.toFixed(0)}/min`;
    default:
      return value.toFixed(2);
  }
}

// Get metric icon
export function getMetricIcon(metricName: string): string {
  const icons: Record<string, string> = {
    response_time: '⚡',
    error_rate: '❌',
    cpu_usage: '🖥️',
    memory_usage: '💾',
    cache_hit_rate: '⚡',
    availability: '✅',
    throughput: '📊',
  };

  return icons[metricName] || '📈';
}

// Get health status
export function getHealthStatus(score: number): { status: string; color: string; icon: string } {
  if (score >= 95) {
    return { status: 'Excelente', color: 'text-green-900', icon: '🟢' };
  } else if (score >= 80) {
    return { status: 'Bom', color: 'text-blue-900', icon: '🔵' };
  } else if (score >= 60) {
    return { status: 'Atenção', color: 'text-yellow-900', icon: '🟡' };
  } else if (score >= 40) {
    return { status: 'Crítico', color: 'text-orange-900', icon: '🟠' };
  } else {
    return { status: 'Severidade Crítica', color: 'text-red-900', icon: '🔴' };
  }
}
