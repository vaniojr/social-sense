# 🎨 Design System - Social Sense

**Versão:** 2.0  
**Data:** 11/05/2026  
**Status:** ✅ Implementado

---

## 📐 Paleta de Cores

### Cores Principais
```
PRIMARY:    #2563eb (Blue-600)     - Ações principais, CTAs
SECONDARY:  #6b7280 (Gray-500)     - Conteúdo secundário
SUCCESS:    #16a34a (Green-600)    - Sucesso, aprovado, positivo
WARNING:    #ea580c (Orange-600)   - Aviso, cuidado
DANGER:     #dc2626 (Red-600)      - Erro, crítico, remover
INFO:       #0891b2 (Cyan-600)     - Informação adicional
```

### Escalas de Cinza
```
Gray-50:    #f9fafb - Fundo de página
Gray-100:   #f3f4f6 - Fundo de card alt
Gray-200:   #e5e7eb - Bordas
Gray-300:   #d1d5db - Bordas suaves
Gray-500:   #6b7280 - Texto secundário
Gray-700:   #374151 - Texto padrão
Gray-900:   #111827 - Texto escuro
```

### Estados
```
Success:    #10b981 (Green-500)
Warning:    #f59e0b (Amber-500)
Error:      #ef4444 (Red-500)
Info:       #06b6d4 (Cyan-500)
```

---

## 🔤 Tipografia

### Escalas de Tamanho
```
H1:   2.0rem (32px) | font-bold    | leading-9   | tracking-tight
H2:   1.5rem (24px) | font-bold    | leading-8   | tracking-tight
H3:   1.25rem (20px) | font-semibold | leading-7  | tracking-normal
H4:   1.125rem (18px) | font-semibold | leading-6  | tracking-normal

Body: 1.0rem (16px) | font-normal  | leading-6   | tracking-normal
Small: 0.875rem (14px) | font-normal  | leading-5   | tracking-normal
Tiny:  0.75rem (12px) | font-normal  | leading-4   | tracking-normal
```

### Font Stack
```
Font Family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
Line Height: Relaxed (1.75) para body, Tight (1.25) para headings
```

---

## 🎯 Componentes Comuns

### Button
```tsx
import { Button } from '@/components/common';

// Variantes: primary | secondary | danger | ghost
// Tamanhos: sm | md | lg

<Button variant="primary" size="md">
  Salvar
</Button>

<Button variant="secondary" size="sm">
  Cancelar
</Button>

<Button variant="danger" isLoading>
  Deletando...
</Button>

<Button variant="ghost" disabled>
  Inativo
</Button>
```

### Card
```tsx
import { Card } from '@/components/common';

<Card title="Análise de Sentimento" subtitle="Últimos 30 dias">
  <div>Conteúdo aqui</div>
</Card>

<Card
  title="Entities"
  actions={<Button size="sm">Novo</Button>}
>
  <table>...</table>
</Card>
```

### Badge
```tsx
import { Badge } from '@/components/common';

// Variantes: default | success | warning | danger | info

<Badge variant="success">Ativo</Badge>
<Badge variant="warning">Pendente</Badge>
<Badge variant="danger">Crítico</Badge>
```

---

## 📏 Espaçamento (Margin & Padding)

```
Escala:  0    4    8    12   16   20   24   32   40   48
Rem:     0   0.25 0.5  0.75  1   1.25  1.5   2   2.5   3
Px:      0    4    8    12   16   20   24   32   40   48
```

### Padrões Comuns
```
Card Padding:      1.5rem (24px)
Input Padding:     0.75rem (12px)
Button Padding-X:  1rem (16px) | Padding-Y: 0.5rem (8px)
Section Gap:       1rem (16px)
Item Gap:          0.5rem (8px)
```

---

## 🎨 Componentes de Layout

### Card
- **Padding:** 1.5rem (24px)
- **Border Radius:** 0.5rem (8px)
- **Border:** 1px solid #e5e7eb
- **Shadow:** 0 1px 2px 0 rgba(0,0,0,0.05)
- **Hover Shadow:** 0 4px 6px -1px rgba(0,0,0,0.1)

### Input
- **Height:** 2.5rem (40px)
- **Padding:** 0.75rem (12px)
- **Border Radius:** 0.375rem (6px)
- **Border:** 1px solid #d1d5db
- **Focus Ring:** 2px ring offset-2 ring-blue-500

### Button
- **Min Height:** 2.5rem (40px)
- **Border Radius:** 0.375rem (6px)
- **Font Weight:** 500
- **Transition:** colors 200ms

---

## 🎬 Transições e Animações

### Padrão
```
Padrão: transition-{property} duration-{time} ease-{type}

Propriedades:  all, colors, opacity, transform, shadow
Duração:       100ms (rápido) | 200ms (normal) | 300ms (lento)
Easing:        ease-in-out (padrão)
```

### Exemplos
```tsx
// Hover em card
transition-shadow duration-200

// Mudança de cor em botão
transition-colors duration-200

// Sidebar collapse
transition-all duration-300
```

---

## 🚨 Estados e Feedback

### Carregamento
```tsx
<Button isLoading>Salvando...</Button>
// Mostra spinner + texto "Carregando..."
```

### Estados de Input
```
Default:  border-gray-300
Focus:    border-blue-500 ring-2 ring-blue-100
Error:    border-red-500 ring-2 ring-red-100
Disabled: bg-gray-100 cursor-not-allowed opacity-50
```

### Badges de Status
```
success:  Green   - ✓ Ativo, Aprovado
warning:  Amber   - ⚠️ Pendente, Aviso
danger:   Red     - ✗ Erro, Crítico
info:     Blue    - ℹ️ Informação
```

---

## 📱 Responsividade

### Breakpoints (Tailwind)
```
sm:  640px   - Tablets pequenos
md:  768px   - Tablets
lg:  1024px  - Desktop
xl:  1280px  - Desktop grande
2xl: 1536px  - Ultra wide
```

### Padrões
```
- Sidebar: collapsa em sm
- Cards: 1 col em sm, 2 em md, 3+ em lg
- Botões: full-width em sm, auto em lg
- Margens: reduzem em sm (16px → 8px)
```

---

## ✅ Checklist de Uso

Ao criar novos componentes:

- [ ] Use componentes do `common/` para buttons, cards, badges
- [ ] Siga escala de tamanhos de tipografia
- [ ] Respeite espaçamento padrão (múltiplos de 4px)
- [ ] Use cores da paleta padrão
- [ ] Adicione transições suaves
- [ ] Teste em mobile (sm breakpoint)
- [ ] Documente propTypes/interfaces
- [ ] Reutilize componentes (não duplique)

---

## 🔄 Migrando Componentes Antigos

1. Identifique componentes que usam estilos inline
2. Extraia para uso de componentes comuns
3. Remova classes Tailwind duplicadas
4. Teste visualmente
5. Atualize documentação

### Exemplo
```tsx
// ANTES
<button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
  Salvar
</button>

// DEPOIS
<Button variant="primary">Salvar</Button>
```

---

## 📞 Suporte

Para adicionar novos componentes ao Design System:
1. Crie arquivo em `components/common/`
2. Adicione export em `components/common/index.ts`
3. Documente aqui com exemplos
4. Procure oportunidades de reutilização

**Última atualização:** 11/05/2026
