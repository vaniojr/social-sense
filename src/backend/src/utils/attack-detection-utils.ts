// Coordinated Attack Detection Utilities (Bloco J)

export interface AttackIndicator {
  type: string;
  confidence: number;
  description: string;
  sources: string[];
}

export interface AttackSignal {
  entityId: string;
  signalType: string;
  intensity: number;
  affectedRegions: string[];
  timestamp: string;
}

// Attack detection types
export const ATTACK_TYPES = {
  SENTIMENT_BOMBING: 'sentiment_bombing',
  VOLUME_SURGE: 'volume_surge',
  COORDINATED_MESSAGING: 'coordinated_messaging',
  HASHTAG_CAMPAIGN: 'hashtag_campaign',
  BOT_ACTIVITY: 'bot_activity',
  NARRATIVE_SHIFT: 'narrative_shift',
  REGIONAL_TARGETING: 'regional_targeting',
};

// Detect sentiment bombing (sudden negative sentiment spike)
export function detectSentimentBombing(
  previousAvgSentiment: number,
  currentAvgSentiment: number,
  volumeChange: number
): AttackIndicator | null {
  const sentimentDrop = previousAvgSentiment - currentAvgSentiment;

  if (sentimentDrop > 0.4 && volumeChange > 2) {
    return {
      type: ATTACK_TYPES.SENTIMENT_BOMBING,
      confidence: Math.min(0.99, sentimentDrop * 0.5 + volumeChange * 0.3),
      description: `Possível ataque: queda de ${(sentimentDrop * 100).toFixed(1)}% em sentimento com aumento de ${(volumeChange * 100).toFixed(1)}% em volume`,
      sources: ['sentiment_analysis', 'volume_monitoring'],
    };
  }

  return null;
}

// Detect volume surge (sudden spike in mentions)
export function detectVolumeSurge(
  baselineVolume: number,
  currentVolume: number
): AttackIndicator | null {
  const volumeMultiplier = currentVolume / baselineVolume;

  if (volumeMultiplier > 5) {
    return {
      type: ATTACK_TYPES.VOLUME_SURGE,
      confidence: Math.min(0.95, (volumeMultiplier - 1) * 0.1),
      description: `Volume ${volumeMultiplier.toFixed(1)}x acima da baseline`,
      sources: ['volume_monitoring'],
    };
  }

  return null;
}

// Detect coordinated messaging (similar messages from multiple sources)
export function detectCoordinatedMessaging(
  similarityScore: number,
  sourceCount: number
): AttackIndicator | null {
  if (similarityScore > 0.8 && sourceCount > 10) {
    return {
      type: ATTACK_TYPES.COORDINATED_MESSAGING,
      confidence: Math.min(0.99, similarityScore * 0.7 + (sourceCount / 100) * 0.3),
      description: `${sourceCount} mensagens similares (${(similarityScore * 100).toFixed(0)}% match)`,
      sources: ['message_analysis', 'pattern_detection'],
    };
  }

  return null;
}

// Detect hashtag campaign (sudden popularity of specific hashtags)
export function detectHashtagCampaign(
  hashtagVolumes: Record<string, number>,
  previousHashtagVolumes: Record<string, number>
): AttackIndicator | null {
  let surgedHashtags = 0;
  let avgIncrease = 1;

  for (const [hashtag, volume] of Object.entries(hashtagVolumes)) {
    const previous = previousHashtagVolumes[hashtag] || 1;
    if (volume / previous > 3) {
      surgedHashtags++;
      avgIncrease += volume / previous;
    }
  }

  if (surgedHashtags >= 3) {
    return {
      type: ATTACK_TYPES.HASHTAG_CAMPAIGN,
      confidence: Math.min(0.95, (surgedHashtags / 5) * 0.6),
      description: `${surgedHashtags} hashtags com crescimento suspeito`,
      sources: ['hashtag_analysis'],
    };
  }

  return null;
}

// Calculate attack severity score (0-100)
export function calculateAttackSeverity(indicators: AttackIndicator[]): number {
  if (indicators.length === 0) return 0;

  const avgConfidence = indicators.reduce((sum, ind) => sum + ind.confidence, 0) / indicators.length;
  const indicatorBonus = Math.min(indicators.length * 10, 30);

  return Math.min(100, (avgConfidence * 70) + indicatorBonus);
}

// Assess if attack is imminent (score > 70)
export function isAttackImminent(severity: number): boolean {
  return severity > 70;
}

// Assess if attack is ongoing (score > 80 with multiple indicators)
export function isAttackOngoing(severity: number, indicatorCount: number): boolean {
  return severity > 80 && indicatorCount > 2;
}

// Generate attack summary
export function generateAttackSummary(
  indicators: AttackIndicator[],
  severity: number
): string {
  const types = [...new Set(indicators.map(i => i.type))];
  const count = indicators.length;

  if (severity > 80) {
    return `🚨 ATAQUE CONFIRMADO: ${count} indicadores, severidade ${severity.toFixed(0)}/100`;
  } else if (severity > 70) {
    return `⚠️ ATAQUE IMINENTE: ${count} indicadores detectados`;
  } else {
    return `📊 ${count} sinais suspeitos monitorados`;
  }
}
