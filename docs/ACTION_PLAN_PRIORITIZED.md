# Plano de Ação Priorizado - Social Sense

**Objetivo:** De 6.75/10 → 9+/10 em 4-6 semanas  
**Timeline:** 11/05 - 22/06/2026

---

## 🔴 CRÍTICOS (Semanas 1-2) - P0

Estes itens **BLOQUEIAM produção**. Sem eles, não sai deploy.

### 1. SQL Injection Fix
- **Problema:** String interpolation em queries dinâmicas
- **Risco:** Segurança crítica
- **Ação:**
  ```bash
  grep -r "\${" src/backend/src/main.ts | grep "SELECT\|INSERT\|UPDATE"
  # Localizar todas as queries vulneráveis
  # Converter para parameterized queries
  ```
- **Tempo:** 2-3 horas
- **Assign:** Dev backend
- **Deadline:** 12/05 (amanhã)

### 2. Validação de Entrada (Zod)
- **Problema:** UUIDs, state codes, entity IDs não validados
- **Risco:** Dados inválidos no banco
- **Ação:**
  ```typescript
  // Criar schemas/entity.ts
  export const CreateEntitySchema = z.object({
    name: z.string().min(1).max(255),
    type: z.enum(['politician', 'influencer', 'brand']),
    description: z.string().optional(),
    url: z.string().url().optional(),
  });
  
  // Aplicar em todos POST/PUT endpoints
  ```
- **Tempo:** 3-4 horas
- **Assign:** Dev backend
- **Deadline:** 13/05

### 3. Testes Automatizados (Jest/Supertest)
- **Problema:** Zero cobertura de testes
- **Risco:** Impossível validar qualidade
- **Ação:**
  ```typescript
  // Criar test files:
  src/backend/tests/
  ├── sentiment-analysis.test.ts
  ├── regional-aggregation.test.ts
  ├── api-endpoints.test.ts
  └── validation.test.ts
  
  // Target: 30% coverage mínimo
  ```
- **Tempo:** 5-7 dias
- **Assign:** 1-2 devs
- **Deadline:** 18/05

### 4. Onboarding Wizard (UX Critical)
- **Problema:** Usuário novo vê Dashboard vazio, desiste
- **Risco:** 40-60% churn
- **Ação:**
  ```typescript
  // Criar novo componente:
  src/frontend/src/components/OnboardingWizard.tsx
  
  Step 1: Criar primeira entidade
  Step 2: Explicar features
  Step 3: Navegar para Dashboard
  
  // Trigger: if (entities.length === 0) show wizard
  ```
- **Tempo:** 3-5 dias
- **Assign:** Dev frontend
- **Deadline:** 17/05

### 5. Error Handling Claude API
- **Problema:** Chat pode falhar silenciosamente
- **Risco:** Usuário sem feedback, experiência ruim
- **Ação:**
  ```typescript
  // Implementar em src/backend/src/utils/claude-handler.ts
  - Circuit breaker (falhas > 3 = pause 30s)
  - Retry logic (exponential backoff, max 3x)
  - Timeout (30s com fallback)
  - Diferenciar tipos de erro
  ```
- **Tempo:** 6-8 horas
- **Assign:** Dev backend
- **Deadline:** 14/05

---

## 🟠 ALTOS (Semanas 2-3) - P1

Estes itens melhoram significativamente qualidade/UX mas não bloqueiam launch.

### 6. Empty States (UX)
- **Problema:** Páginas vazias sem contexto
- **Impacto:** Confusão, abandono
- **Ação:**
  ```typescript
  // Criar componente:
  src/frontend/src/components/EmptyState.tsx
  
  Props:
  - icon: string (emoji)
  - title: string
  - description: string
  - action?: { label, onClick }
  
  // Aplicar em:
  - Dashboard (zero entities)
  - Monitoramento (zero news)
  - Competidores (zero group)
  ```
- **Tempo:** 2-3 dias
- **Assign:** Dev frontend
- **Deadline:** 19/05

### 7. Chat Context Management
- **Problema:** Histórico não persistido, contexto limitado
- **Impacto:** Chat não é inteligente
- **Ação:**
  ```typescript
  // Melhorar src/backend/src/main.ts route /api/chat
  - Implementar sliding window (últimas 10 msgs)
  - Persistir cada mensagem individualmente
  - Adicionar summarization de contexto antigo
  - Implementar busca em conversas
  ```
- **Tempo:** 4-5 dias
- **Assign:** Dev backend
- **Deadline:** 21/05

### 8. Monitoramento em Produção
- **Problema:** Sem alertas, sem visibility
- **Impacto:** Problemas detectados tardio
- **Ação:**
  ```typescript
  // Setup Sentry + structured logging:
  npm install --save @sentry/node winston
  
  // Em main.ts:
  Sentry.init({ dsn: process.env.SENTRY_DSN })
  logger.error({ timestamp, service, error, duration })
  ```
- **Tempo:** 2-3 dias
- **Assign:** Dev backend
- **Deadline:** 20/05

### 9. Mobile Responsividade
- **Problema:** Nav não cabe em mobile
- **Impacto:** Usuários mobile não conseguem navegar
- **Ação:**
  ```typescript
  // Implementar hamburger menu:
  src/frontend/src/components/MobileNav.tsx
  
  // Breakpoints:
  - Mobile: < 768px (hamburger)
  - Tablet: 768px-1024px (sidebar)
  - Desktop: > 1024px (top nav)
  
  // Testar em: iPhone SE, iPad, Desktop
  ```
- **Tempo:** 2-3 dias
- **Assign:** Dev frontend
- **Deadline:** 22/05

### 10. Design System Tokens
- **Problema:** Componentes inconsistentes
- **Impacto:** Código lento, aparência amadora
- **Ação:**
  ```typescript
  // Atualizar tailwind.config.js:
  export default {
    theme: {
      colors: {
        sentiment: {
          very_negative: '#dc2626',
          negative: '#ef4444',
          neutral: '#fbbf24',
          positive: '#84cc16',
          very_positive: '#22c55e',
        },
        severity: {
          low: '#3b82f6',
          medium: '#fbbf24',
          high: '#f97316',
          critical: '#dc2626',
        }
      },
      components: { ... }
    }
  }
  ```
- **Tempo:** 3-4 dias
- **Assign:** Dev frontend + designer
- **Deadline:** 24/05

---

## 📋 MÉDIOS (Semana 4+) - P2

Importantes mas menos críticos.

### 11. LGPD Compliance Roadmap
- **Problema:** Sem encryption, audit log, deletion policy
- **Risco:** Legal blocker
- **Ação:**
  - [ ] Encryption de fields sensíveis (pgcrypto)
  - [ ] Audit trail (quem acessou que dados)
  - [ ] Data retention policy (delete após 2 anos)
  - [ ] Delete account API
  - [ ] Consent tracking
- **Tempo:** 3-4 semanas (ongoing)
- **Assign:** 1 dev + legal
- **Deadline:** 30/06

### 12. Testes de Performance/Load
- **Problema:** Desconhecimento de limites
- **Risco:** Crash em produção sob carga
- **Ação:**
  ```bash
  # Usar k6 para teste de carga:
  k6 run script.js --vus 100 --duration 5m
  
  # Medir:
  - P50, P95, P99 latency
  - Error rate
  - Queries lentas (> 100ms)
  ```
- **Tempo:** 2-3 dias
- **Assign:** Dev ops/perf
- **Deadline:** 28/05

### 13. Documentação de Testes
- **Problema:** Sem manual test cases
- **Risco:** QA manual é caótico
- **Ação:**
  ```markdown
  # docs/TESTING.md
  ## Manual Test Cases
  - Geographic Analysis (mapa, ranking, edge cases)
  - Chat Copilot (messages, context, errors)
  - Alerts (detection, dismissal)
  - Competitor tracking (CRUD)
  
  ## Pre-Release Checklist
  - [ ] All critical flows tested
  - [ ] Edge cases handled
  - [ ] Error states validated
  ```
- **Tempo:** 4-6 horas
- **Assign:** QA/Dev
- **Deadline:** 26/05

### 14. Toast Notifications System
- **Problema:** Feedback visual fraco
- **Impacto:** Usuário não sabe se ação funcionou
- **Ação:**
  ```typescript
  // npm install react-hot-toast
  // Usar em todos endpoints:
  toast.success("Entidade criada!")
  toast.error("Erro ao salvar")
  toast.loading("Salvando...")
  ```
- **Tempo:** 2 dias
- **Assign:** Dev frontend
- **Deadline:** 25/05

### 15. Acessibilidade (WCAG AA)
- **Problema:** Sem testes de acessibilidade
- **Risco:** Plataforma inacessível
- **Ação:**
  ```bash
  npm install --save-dev axe-core jest-axe
  
  # Adicionar testes:
  test('Dashboard is accessible', async () => {
    const { container } = render(<Dashboard />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  ```
- **Tempo:** 2-3 dias
- **Assign:** Dev frontend
- **Deadline:** 27/05

---

## 📊 TIMELINE VISUAL

```
SEMANA 1 (11-15/05)
├─ Mon 11: SQL fix + Zod setup + Error handling
├─ Tue 12: Validação continuação
├─ Wed 13: Testes setup + Onboarding init
├─ Thu 14: Chat improvements
└─ Fri 15: Review + Deploy staging

SEMANA 2 (18-22/05)
├─ Mon 18: Onboarding continuação
├─ Tue 19: Empty states + Toast
├─ Wed 20: Monitoramento setup
├─ Thu 21: Chat context mgmt
└─ Fri 22: Mobile nav + Testing

SEMANA 3 (25-29/05)
├─ Mon 25: Design tokens
├─ Tue 26: Documentação testes
├─ Wed 27: Acessibilidade
├─ Thu 28: Load testing
└─ Fri 29: Integration testing

SEMANA 4 (01-05/06)
├─ Mon 01: Pre-production checklist
├─ Tue 02: Security audit
├─ Wed 03: Performance baseline
├─ Thu 04: Final QA pass
└─ Fri 05: Ready for launch
```

---

## 🎯 DAILY STANDUP TEMPLATE

**Cada manhã (10:00), usar este template:**

```markdown
## 🔴 Bloqueadores de hoje?
- [ ] SQL fix completo?
- [ ] Validação com Zod pronta?
- [ ] Testes passando?
- [ ] Onboarding funcional?

## 🟠 Progresso
- [ ] Quantos testes completados?
- [ ] Quantas issues resolvidas?
- [ ] Mobile testing feito?

## 🟢 Não Bloqueador
- [ ] Design tokens criados?
- [ ] Documentação atualizada?
- [ ] Performance baseline medido?
```

---

## ✅ DEFINIÇÃO DE "PRONTO PARA PRODUÇÃO"

Uma tarefa é "pronta" quando:

- ✅ Código escrito
- ✅ Testes verdes (unit + integration)
- ✅ Code review aprovado
- ✅ Deployed em staging
- ✅ Testado manualmente em staging
- ✅ Documentação atualizada
- ✅ Sem bloqueadores de produção

**Exemplo:**
```
Feature: Onboarding Wizard

✅ Código: src/frontend/src/components/OnboardingWizard.tsx
✅ Testes: 5 testes cobrindo happy path + edge cases
✅ Review: Aprovado por 1+ dev
✅ Staging: Deployado, funciona
✅ Manual: Testado em 3+ browsers
✅ Docs: docs/ONBOARDING.md atualizado
✅ Production: Sem blockers identificados
```

---

## 📞 Escalation Path

Se um item ficar bloqueado > 1 dia:

1. **Primeira tentativa:** Conversa com assignee (5 min)
2. **Se ainda bloqueado:** Chamar stand-up team (15 min)
3. **Se ainda bloqueado:** Revisar prioridades (replan)

**Exemplo bloqueador:**
```
⚠️ BLOCKED: "Onboarding Wizard"
   Reason: Unsure about entity type enum values
   Blocker: Need clarification from product
   Action: Schedule 30min sync com product
   Timeline impact: +1 dia
```

---

## 🚀 SUCCESS METRICS

Quando isso pode considerar "sucesso":

| Métrica | Target | Verificar |
|---------|--------|-----------|
| Testes coverage | > 60% | `npm test -- --coverage` |
| Critical issues | 0 | Nenhum P0 aberto |
| Security audit | Passed | Manual review OWASP |
| Load test | 100 users @ <5s | k6 resultado |
| Mobile responsividade | 3+ devices OK | Manual test |
| WCAG compliance | AA ou melhor | axe-core report |
| Uptime staging | > 99% | 7 dias |

---

**Status:** Ready to Execute  
**Last Updated:** 11/05/2026  
**Next Review:** 18/05/2026
