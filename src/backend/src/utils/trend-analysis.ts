// Trend Analysis Utilities

export interface TimelinePoint {
  date: string;
  sentiment_avg: number;
  sentiment_change_pct: number;
  volume: number;
  regions_positive: string[];
  regions_negative: string[];
}

export interface AnomalyPoint {
  date: string;
  metric: string;
  z_score: number;
  value: number;
  description: string;
}

export interface ThemeEvolution {
  name: string;
  volume_timeline: Array<{ date: string; volume: number }>;
  sentiment_timeline: Array<{ date: string; sentiment: number }>;
  trend: 'rising' | 'falling' | 'stable';
  first_appeared: string;
}

// Calculate baseline (rolling average)
export function calculateBaseline(
  timeline: TimelinePoint[],
  days: number
): number {
  if (timeline.length === 0) return 0;
  const recentDays = timeline.slice(-days);
  const sum = recentDays.reduce((acc, point) => acc + point.sentiment_avg, 0);
  return sum / recentDays.length;
}

// Calculate Z-score for anomaly detection
export function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

// Calculate standard deviation
export function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2)) / values.length;
  return Math.sqrt(variance);
}

// Detect anomalies using Z-score (threshold: 2.5)
export function detectAnomalies(timeline: TimelinePoint[], sensitivity: number = 2.5): AnomalyPoint[] {
  if (timeline.length < 7) return [];

  const sentimentValues = timeline.map(p => p.sentiment_avg);
  const volumeValues = timeline.map(p => p.volume);

  const sentimentMean = sentimentValues.reduce((a, b) => a + b) / sentimentValues.length;
  const sentimentStdDev = calculateStdDev(sentimentValues);

  const volumeMean = volumeValues.reduce((a, b) => a + b) / volumeValues.length;
  const volumeStdDev = calculateStdDev(volumeValues);

  const anomalies: AnomalyPoint[] = [];

  timeline.forEach((point) => {
    const sentimentZ = calculateZScore(point.sentiment_avg, sentimentMean, sentimentStdDev);
    const volumeZ = calculateZScore(point.volume, volumeMean, volumeStdDev);

    if (Math.abs(sentimentZ) > sensitivity) {
      const description =
        sentimentZ > 0
          ? `Sentimento positivo anormal: ${(sentimentZ.toFixed(2))} desvios padrão acima da média`
          : `Sentimento negativo anormal: ${Math.abs(sentimentZ).toFixed(2)} desvios padrão abaixo da média`;

      anomalies.push({
        date: point.date,
        metric: 'sentiment',
        z_score: sentimentZ,
        value: point.sentiment_avg,
        description,
      });
    }

    if (Math.abs(volumeZ) > sensitivity) {
      const volumeChange = ((point.volume - volumeMean) / volumeMean * 100).toFixed(1);
      const description =
        volumeZ > 0
          ? `Volume anormalmente alto: ${volumeChange}% acima da média`
          : `Volume anormalmente baixo: ${Math.abs(parseFloat(volumeChange)).toFixed(1)}% abaixo da média`;

      anomalies.push({
        date: point.date,
        metric: 'volume',
        z_score: volumeZ,
        value: point.volume,
        description,
      });
    }
  });

  return anomalies;
}

// Detect trend reversal
export function detectTrendReversal(timeline: TimelinePoint[]): Array<{
  date: string;
  type: string;
  description: string;
}> {
  if (timeline.length < 2) return [];

  const reversals = [];

  for (let i = 1; i < timeline.length; i++) {
    const prev = timeline[i - 1].sentiment_avg;
    const curr = timeline[i].sentiment_avg;

    if (i > 0) {
      const prevPrev = timeline[i - 1].sentiment_avg;
      const isPrevGrowing = curr > prevPrev;
      const isCurrGrowing = i + 1 < timeline.length ? timeline[i + 1].sentiment_avg > curr : null;

      if (isPrevGrowing && isCurrGrowing === false && isCurrGrowing !== null) {
        reversals.push({
          date: timeline[i].date,
          type: 'reversal',
          description: `Tendência revertida de crescimento para queda`,
        });
      } else if (!isPrevGrowing && isCurrGrowing && isCurrGrowing !== null) {
        reversals.push({
          date: timeline[i].date,
          type: 'reversal',
          description: `Tendência revertida de queda para crescimento`,
        });
      }
    }
  }

  return reversals;
}

// Detect trend acceleration
export function detectAcceleration(timeline: TimelinePoint[]): Array<{
  date: string;
  type: string;
  description: string;
}> {
  if (timeline.length < 3) return [];

  const accelerations = [];

  for (let i = 2; i < timeline.length; i++) {
    const change1 = timeline[i - 1].sentiment_avg - timeline[i - 2].sentiment_avg;
    const change2 = timeline[i].sentiment_avg - timeline[i - 1].sentiment_avg;

    const isAccelerating = Math.abs(change2) > Math.abs(change1) && Math.sign(change1) === Math.sign(change2);

    if (isAccelerating && Math.abs(change2) > 0.1) {
      const direction = change2 > 0 ? 'positiva' : 'negativa';
      accelerations.push({
        date: timeline[i].date,
        type: 'acceleration',
        description: `Aceleração de tendência ${direction}: ${Math.abs(change2).toFixed(3)} pontos`,
      });
    }
  }

  return accelerations;
}

// Find emerging themes
export function findEmergingThemes(
  newThemes: string[],
  historicalThemes: string[]
): string[] {
  return newThemes.filter(theme => !historicalThemes.includes(theme));
}

// Generate timeline report
export function generateTimelineReport(timeline: TimelinePoint[]) {
  if (timeline.length === 0) {
    return {
      timeline: [],
      trends: [],
      anomalies: [],
    };
  }

  const anomalies = detectAnomalies(timeline);
  const reversals = detectTrendReversal(timeline);
  const accelerations = detectAcceleration(timeline);

  const trends = [
    ...reversals.map(r => ({ ...r, severity: 'high' as const })),
    ...accelerations.map(a => ({ ...a, severity: 'medium' as const })),
  ];

  return {
    timeline,
    trends,
    anomalies,
  };
}
