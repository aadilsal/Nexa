# 04 — Motion & Accessibility

Animation specifications and WCAG AA compliance guidelines.

---

## Motion Design

### Library

**Primary:** [Motion](https://motion.dev) (`motion/react`) — already in stack  
**CSS:** Tailwind transitions for micro-interactions  
**Page transitions:** Motion `AnimatePresence` on route segments (optional, Phase 2)

### Principles

1. **Purposeful** — motion communicates state change, not decoration
2. **Subtle** — users should feel polish, not notice animation
3. **Fast** — most transitions ≤ 300ms
4. **Respectful** — honor `prefers-reduced-motion`

### Duration Scale

| Token | Duration | Usage |
|-------|----------|-------|
| `instant` | 0ms | Reduced motion fallback |
| `fast` | 100ms | Hover, focus |
| `normal` | 200ms | Modals, dropdowns |
| `slow` | 300ms | Page sections, cards |
| `slower` | 500ms | Progress bars, charts |
| `slowest` | 800ms | Celebrations (goal complete) |

### Easing

| Token | Value | Usage |
|-------|-------|-------|
| `ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Enter animations |
| `ease-in-out` | `cubic-bezier(0.45, 0, 0.55, 1)` | Loop, progress |
| `spring` | `{ stiffness: 400, damping: 30 }` | Interactive elements |

### Component Animations

#### Fade In (Cards, Insights)

```tsx
initial={{ opacity: 0, y: 8 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
```

#### Scale In (Modals, Can I Buy Result)

```tsx
initial={{ opacity: 0, scale: 0.95 }}
animate={{ opacity: 1, scale: 1 }}
transition={{ duration: 0.2 }}
```

#### Progress Bar Fill

```tsx
initial={{ width: 0 }}
animate={{ width: `${progress}%` }}
transition={{ duration: 0.5, ease: "easeOut" }}
```

#### Number Count-Up (Safe To Spend)

- Use `motion` animate on text or dedicated count-up
- Duration: 400ms
- Only when value changes, not on initial load

#### Stagger Children (Dashboard load)

```tsx
staggerChildren: 0.05
delayChildren: 0.1
```

Max 6 staggered items — avoid cascade fatigue.

#### Button Feedback

```css
active:scale-[0.98]
transition-transform duration-100
```

#### Skeleton Pulse

Tailwind `animate-pulse` — 2s cycle, disabled under reduced motion.

#### Toast (Sonner)

Built-in slide — use default Sonner animations.

### Page Transitions

Optional wrapper for app routes:

```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={pathname}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.15 }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

Skip on admin routes (density over delight).

### Scroll Animations (Marketing Only)

- Intersection Observer + fade-up on sections
- Trigger once (`once: true`)
- Threshold: 0.2
- Disable entirely under reduced motion

### Celebration (Goal 100%)

- Confetti: lightweight canvas, 2s duration, max 50 particles
- Progress ring: success color flash + scale 1→1.05→1
- Toast: "Goal reached! 🎯"

### Reduced Motion

```tsx
// hooks/use-reduced-motion.ts
import { useReducedMotion } from "motion/react";

const prefersReducedMotion = useReducedMotion();

const transition = prefersReducedMotion
  ? { duration: 0 }
  : { duration: 0.25 };
```

Global CSS fallback:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Accessibility (WCAG 2.1 AA)

### Color Contrast

All text/background pairs verified at 4.5:1 (normal) or 3:1 (large ≥18px bold / 24px regular).

| Pair | Ratio | Pass |
|------|-------|------|
| foreground on background | 19:1 / 18:1 | ✅ |
| muted-foreground on background | 4.6:1 | ✅ |
| primary on white | 4.5:1 | ✅ |
| primary-foreground on primary | 8:1+ | ✅ |

Use [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) when adding new colors.

### Focus Management

- All interactive elements: visible focus ring
- Ring: `ring-2 ring-ring ring-offset-2 ring-offset-background`
- Never `outline-none` without replacement
- Modal open: focus first focusable element
- Modal close: return focus to trigger
- Skip link: "Skip to main content" — first focusable element

### Keyboard Navigation

| Context | Keys |
|---------|------|
| Global | `Tab` / `Shift+Tab` navigate |
| Command palette | `Cmd+K` / `Ctrl+K` |
| Submit forms | `Enter` |
| Log expense | `Cmd+Enter` |
| Modals | `Escape` close |
| Dropdowns | `Arrow` keys, `Enter` select |
| Tabs | `Arrow` keys |

### Screen Readers

- Semantic HTML: `main`, `nav`, `header`, `aside`, `section`
- One `h1` per page
- Heading hierarchy never skips levels
- Icons: `aria-hidden="true"` when decorative
- Icon-only buttons: `sr-only` label
- Live regions: `aria-live="polite"` for toasts, AI streaming
- Currency: `aria-label="4,250 Pakistani Rupees"` on hero amounts
- Loading: `aria-busy="true"` on containers during fetch

### Form Accessibility

```tsx
<label htmlFor="email" className="text-sm font-medium">
  Email
</label>
<Input id="email" aria-describedby="email-error" aria-invalid={!!error} />
{error && <p id="email-error" role="alert" className="text-sm text-destructive">{error}</p>}
```

### Data Tables (Admin)

- `<th scope="col">` for headers
- Caption or `aria-label` on table
- Sortable: `aria-sort="ascending|descending|none"`

### Charts

- Provide text alternative summary below chart
- Recharts: `role="img"` + `aria-label` describing trend
- Don't rely on color alone — use patterns/labels

### Theme Switching

- No information conveyed by color alone for financial status (always pair with text/icon)
- High contrast mode: system respects OS preference via CSS variables

### Touch Targets

- Minimum 44×44px on mobile (buttons, nav items)
- Adequate spacing between tappable elements (8px min)

### Language

- `lang="en"` on `<html>`
- PKR amounts: consistent formatting via `formatPKR()`

---

## Responsive Accessibility

- Zoom to 200%: layout must not break (no horizontal scroll on content)
- Mobile: don't disable pinch zoom (`user-scalable` not restricted)
- Orientation: works in portrait and landscape

---

## Testing Checklist

- [ ] axe DevTools — 0 critical violations
- [ ] Keyboard-only navigation complete flow
- [ ] VoiceOver (macOS) / NVDA (Windows) spot check
- [ ] Light + dark theme contrast
- [ ] Reduced motion verified
- [ ] 200% zoom test
- [ ] Mobile touch target audit
