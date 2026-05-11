export interface Recommendation {
  id?: string;
  entityId: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  suggestedAction: string;
  confidenceScore: number;
  status?: 'active' | 'approved' | 'under_review' | 'dismissed';
  createdAt?: string;
  dismissReason?: string;
}

export interface ContextData {
  recentAttacks?: any[];
  healthScore?: number;
  slaViolations?: string[];
  detectedAnomalies?: any[];
  sentimentTrend?: 'rising' | 'falling' | 'stable';
}

export const recommendationEngine = {
  generateRecommendations(entityId: string, context: ContextData): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Rule 1: Sentiment bombing detected + regional concentration
    if (
      context.recentAttacks?.some(
        (a: any) => a.type === 'sentiment_bombing' && a.severity > 70
      )
    ) {
      const concentrated = context.recentAttacks?.find(
        (a: any) => a.regions?.length >= 3
      );
      if (concentrated) {
        recommendations.push({
          entityId,
          title: 'Preparar resposta pré-aprovada por região',
          description: `Ataque de bomba de sentimento detectado em ${concentrated.regions?.length} regiões com ${concentrated.indicators?.coordinated_messaging?.toFixed(0) || 80}% de mensagens coordenadas.`,
          priority: 'critical',
          suggestedAction:
            'Revisar e aprovar resposta oficial antes do ataque escalar. Considere resposta regionalizada.',
          confidenceScore: 0.92,
        });
      }
    }

    // Rule 2: Health score degraded + SLA violations
    if (context.healthScore && context.healthScore < 60) {
      const violationCount = context.slaViolations?.length || 0;
      recommendations.push({
        entityId,
        title: `Investigar ${violationCount} violações de SLA`,
        description: `Saúde do sistema em ${context.healthScore}% com múltiplas violações de threshold de performance.`,
        priority: context.healthScore < 40 ? 'critical' : 'high',
        suggestedAction:
          'Analisar logs de erro, aumentar recursos ou otimizar queries lentas. Priorize endpoints afetados.',
        confidenceScore: Math.min(0.95, 0.7 + violationCount * 0.05),
      });
    }

    // Rule 3: Coordinated messaging detected
    if (
      context.recentAttacks?.some(
        (a: any) => a.type === 'coordinated_messaging' && a.severity > 75
      )
    ) {
      const coordAttack = context.recentAttacks?.find(
        (a: any) => a.type === 'coordinated_messaging'
      );
      recommendations.push({
        entityId,
        title: 'Monitorar possível campanha narrativa coordenada',
        description: `${coordAttack?.indicators?.similarity?.toFixed(0) || 85}% de similaridade em mensagens detectada. Padrão sugestivo de coordenação.`,
        priority: 'high',
        suggestedAction:
          'Aumentar monitoramento de temas-chave. Rastrear propagadores principais. Prepare narrativa defensiva.',
        confidenceScore: 0.88,
      });
    }

    // Rule 4: Volume surge in specific regions
    if (
      context.recentAttacks?.some(
        (a: any) => a.type === 'volume_surge' && a.severity > 65
      )
    ) {
      const surge = context.recentAttacks?.find(
        (a: any) => a.type === 'volume_surge'
      );
      recommendations.push({
        entityId,
        title: 'Aumentar monitoramento em regiões-alvo',
        description: `Concentração de atividade detectada em ${surge?.regions?.length || 3} regiões específicas. Pico de ${surge?.indicators?.volume_increase_pct?.toFixed(0) || 300}% acima da baseline.`,
        priority: 'high',
        suggestedAction:
          'Alocar recursos adicionais para monitoramento regionalizado. Contate stakeholders locais.',
        confidenceScore: 0.85,
      });
    }

    // Rule 5: Anomaly detected but not yet critical
    if (
      context.detectedAnomalies &&
      context.detectedAnomalies.length > 0 &&
      !recommendations.some((r) => r.title.includes('investigar'))
    ) {
      const anomalies = context.detectedAnomalies.slice(0, 2);
      if (anomalies.length > 0) {
        recommendations.push({
          entityId,
          title: `Investigar ${anomalies.length} anomalias detectadas`,
          description: `${anomalies.length} picos anormais no comportamento de menções/sentimento detectados nas últimas 24h.`,
          priority: 'medium',
          suggestedAction:
            'Analise causadores de picos (eventos externos, notícias, virais). Atualize critérios de alerta se necessário.',
          confidenceScore: 0.75,
        });
      }
    }

    // Rule 6: Sentiment recovery opportunity
    if (context.sentimentTrend === 'rising') {
      recommendations.push({
        entityId,
        title: 'Capitalizar tendência de sentimento positivo',
        description: 'Sentimento em recuperação detectado. Janela de oportunidade para ampificar narrativa positiva.',
        priority: 'medium',
        suggestedAction:
          'Publique conteúdo reforçando temas positivos. Amplificar depoimentos de apoiadores. Engage com menções favoráveis.',
        confidenceScore: 0.8,
      });
    }

    return this.prioritizeByImpact(recommendations);
  },

  prioritizeByImpact(recommendations: Recommendation[]): Recommendation[] {
    const priorityScore = (rec: Recommendation) => {
      const priorityMap = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityMap[rec.priority] * rec.confidenceScore;
    };

    return recommendations
      .sort((a, b) => priorityScore(b) - priorityScore(a))
      .slice(0, 5);
  },

  formatRecommendationForResponse(rec: Recommendation) {
    return {
      id: rec.id,
      title: rec.title,
      description: rec.description,
      priority: rec.priority,
      suggestedAction: rec.suggestedAction,
      confidenceScore: rec.confidenceScore,
      status: rec.status || 'active',
      createdAt: rec.createdAt,
    };
  },
};
