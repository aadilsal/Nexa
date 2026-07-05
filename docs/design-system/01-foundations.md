# 01 — Foundations

Design tokens, typography, spacing, elevation, icons, and illustration guidelines.

---

## Color System

All colors meet **WCAG AA** (4.5:1 body text, 3:1 large text/UI components) against their intended backgrounds.

### Brand & Primary

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--primary` | `#5E6AD2` | `#7C85E3` | CTAs, active nav, links, focus rings |
| `--primary-foreground` | `#FFFFFF` | `#FFFFFF` | Text on primary |
| `--primary-muted` | `#EEF0FC` | `#1E2040` | Subtle primary backgrounds (Safe To Spend card) |

**Rationale:** Indigo conveys intelligence and trust (Stripe/Linear lineage) without generic "money green."

### Secondary & Accent

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--secondary` | `#F4F4F5` | `#1A1A1F` | Secondary buttons, chips |
| `--secondary-foreground` | `#18181B` | `#FAFAFA` | Text on secondary |
| `--accent` | `#F4F4F5` | `#222228` | Hover states, selected rows |
| `--accent-foreground` | `#18181B` | `#FAFAFA` | Text on accent |

### Semantic

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--success` | `#059669` | `#34D399` | On-track goals, under budget, positive delta |
| `--success-foreground` | `#FFFFFF` | `#052E1C` | Text on success |
| `--warning` | `#D97706` | `#FBBF24` | Approaching limits, delayed goals |
| `--warning-foreground` | `#FFFFFF` | `#451A03` | Text on warning |
| `--destructive` | `#DC2626` | `#F87171` | Errors, over budget, delete |
| `--destructive-foreground` | `#FFFFFF` | `#450A0A` | Text on destructive |
| `--info` | `#2563EB` | `#60A5FA` | Informational banners, tips |

### Financial Indicators (Semantic — NOT Primary)

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--financial-positive` | `#059669` | `#34D399` | Income, savings, under expected |
| `--financial-negative` | `#DC2626` | `#F87171` | Expenses, over expected |
| `--financial-neutral` | `#71717A` | `#A1A1AA` | Transfers, neutral amounts |

Use **mono font** for all currency values. Prefix income with `+`, expenses with `−`.

### Neutrals & Surfaces

#### Light Theme

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#FAFAFA` | Page background |
| `--foreground` | `#09090B` | Primary text |
| `--card` | `#FFFFFF` | Cards, modals |
| `--card-foreground` | `#09090B` | Card text |
| `--muted` | `#F4F4F5` | Skeleton, disabled bg |
| `--muted-foreground` | `#71717A` | Secondary text, labels |
| `--border` | `#E4E4E7` | Dividers, inputs |
| `--input` | `#E4E4E7` | Input borders |
| `--ring` | `#5E6AD2` | Focus ring |

#### Dark Theme (Layered Surfaces)

| Token | Value | Elevation | Usage |
|-------|-------|-----------|-------|
| `--background` | `#0C0C0E` | 0 | Page background |
| `--foreground` | `#FAFAFA` | — | Primary text |
| `--card` | `#131316` | 1 | Cards |
| `--surface-2` | `#1A1A1F` | 2 | Nested cards, dropdowns |
| `--surface-3` | `#222228` | 3 | Popovers, tooltips |
| `--muted` | `#1A1A1F` | — | Muted backgrounds |
| `--muted-foreground` | `#A1A1AA` | — | Secondary text |
| `--border` | `#2E2E38` | — | Borders (subtle) |
| `--input` | `#2E2E38` | — | Input borders |
| `--ring` | `#7C85E3` | — | Focus ring |

### Chart Palette

Ordered for Recharts series — distinguishable in both themes:

| Token | Light | Dark |
|-------|-------|------|
| `--chart-1` | `#5E6AD2` | `#7C85E3` |
| `--chart-2` | `#059669` | `#34D399` |
| `--chart-3` | `#D97706` | `#FBBF24` |
| `--chart-4` | `#2563EB` | `#60A5FA` |
| `--chart-5` | `#9333EA` | `#C084FC` |

### Sidebar (Admin)

| Token | Light | Dark |
|-------|-------|------|
| `--sidebar` | `#FAFAFA` | `#0C0C0E` |
| `--sidebar-foreground` | `#09090B` | `#FAFAFA` |
| `--sidebar-accent` | `#F4F4F5` | `#1A1A1F` |
| `--sidebar-border` | `#E4E4E7` | `#2E2E38` |

---

## Typography

### Font Pairing

| Role | Font | Fallback | Source |
|------|------|----------|--------|
| **Sans (UI)** | Inter | system-ui, sans-serif | `next/font/google` |
| **Display** | Inter | — | Same family, different weight/tracking |
| **Mono (Financial)** | JetBrains Mono | ui-monospace | `next/font/google` |

Financial figures **always** use `font-mono` for alignment and trust (Stripe pattern).

### Type Scale

| Token | Size | Line Height | Weight | Letter Spacing | Usage |
|-------|------|-------------|--------|----------------|-------|
| `display-2xl` | 72px / 4.5rem | 1.0 | 700 | -0.03em | Marketing hero |
| `display-xl` | 60px / 3.75rem | 1.0 | 700 | -0.03em | Marketing sections |
| `display-lg` | 48px / 3rem | 1.1 | 700 | -0.02em | Page heroes |
| `heading-xl` | 36px / 2.25rem | 1.2 | 600 | -0.02em | Dashboard title |
| `heading-lg` | 30px / 1.875rem | 1.25 | 600 | -0.02em | Section headers |
| `heading-md` | 24px / 1.5rem | 1.3 | 600 | -0.01em | Card titles |
| `heading-sm` | 20px / 1.25rem | 1.4 | 600 | 0 | Subsections |
| `title` | 18px / 1.125rem | 1.4 | 500 | 0 | List item titles |
| `body-lg` | 18px / 1.125rem | 1.6 | 400 | 0 | Marketing body |
| `body` | 16px / 1rem | 1.6 | 400 | 0 | Default body |
| `body-sm` | 14px / 0.875rem | 1.5 | 400 | 0 | Card descriptions |
| `caption` | 12px / 0.75rem | 1.4 | 400 | 0.01em | Timestamps, meta |
| `label` | 12px / 0.75rem | 1.2 | 500 | 0.05em | Form labels, uppercase nav |
| `button` | 14px / 0.875rem | 1 | 500 | 0 | Button text |
| `code` | 13px / 0.8125rem | 1.5 | 400 | 0 | Inline code |

### Tailwind Mapping

```tsx
// Display
className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight"

// Page heading
className="text-2xl font-semibold tracking-tight"

// Financial hero number
className="font-mono text-3xl font-bold tabular-nums"

// Muted label
className="text-sm text-muted-foreground"
```

---

## Spacing System (8pt Grid)

| Token | Value | Usage |
|-------|-------|-------|
| `0` | 0px | — |
| `0.5` | 4px | Icon-text gap, tight padding |
| `1` | 8px | Inline spacing |
| `2` | 16px | Card padding (compact) |
| `3` | 24px | Card padding (default), section gap |
| `4` | 32px | Section margins |
| `5` | 40px | Large section gaps |
| `6` | 48px | Page section padding |
| `8` | 64px | Marketing section vertical |
| `12` | 96px | Hero padding |
| `16` | 128px | Marketing hero vertical |

### Component Spacing Rules

| Component | Padding | Gap |
|-----------|---------|-----|
| Card | `p-6` (24px) | — |
| Card compact | `p-4` (16px) | — |
| Button default | `h-10 px-4` | — |
| Button lg | `h-12 px-6` | — |
| Input | `h-10 px-3` | — |
| Form field group | — | `space-y-4` |
| Dashboard grid | — | `gap-4 md:gap-6` |
| Nav item | `px-3 py-2` | `gap-3` |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 6px | Badges, tags |
| `--radius-md` | 8px | Buttons, inputs |
| `--radius-lg` | 12px | Cards |
| `--radius-xl` | 16px | Modals, large cards |
| `--radius-2xl` | 24px | Marketing cards, hero elements |
| `--radius-full` | 9999px | Pills, avatars, FAB |

Base token: `--radius: 0.75rem` (12px) — shadcn default.

---

## Elevation & Shadows

Avoid heavy shadows. Use subtle depth.

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `shadow-xs` | `0 1px 2px rgba(0,0,0,0.04)` | none | Buttons |
| `shadow-sm` | `0 1px 3px rgba(0,0,0,0.06)` | `0 0 0 1px var(--border)` | Cards |
| `shadow-md` | `0 4px 12px rgba(0,0,0,0.08)` | `0 0 0 1px var(--border)` | Dropdowns |
| `shadow-lg` | `0 8px 24px rgba(0,0,0,0.10)` | `0 8px 24px rgba(0,0,0,0.4)` | Modals |
| `shadow-floating` | `0 12px 40px rgba(0,0,0,0.12)` | `0 12px 40px rgba(0,0,0,0.5)` | Dialogs, Can I Buy |

Dark mode relies on **surface layering + border** rather than shadows.

---

## Icons

**Library:** [Lucide React](https://lucide.dev) (already in stack)

| Rule | Detail |
|------|--------|
| Default size | `16px` (`h-4 w-4`) inline, `20px` nav |
| Stroke width | Default 2 — do not mix with filled icons in same context |
| Color | Inherit from text — use semantic colors only for status |
| Filled variant | Use sparingly for active nav states only |

### Icon Semantic Map

| Context | Icon |
|---------|------|
| Dashboard | `LayoutDashboard` |
| Safe To Spend | `Wallet` or `CircleDollarSign` |
| Can I Buy | `ShoppingBag` |
| Goals | `Target` |
| Health | `Activity` |
| AI Coach | `Sparkles` |
| Transactions | `Receipt` |
| Settings | `Settings` |
| Security | `Shield` |
| Success | `CheckCircle2` |
| Warning | `AlertTriangle` |
| Error | `XCircle` |

---

## Illustrations

### Style Guide

- **Style:** Minimal line + soft flat fill, 2–3 colors max per illustration
- **Palette:** Primary indigo, muted neutrals, one accent (success green for growth scenes only)
- **Stroke:** 1.5px consistent weight
- **Characters:** Abstract/geometric — no stock photo people
- **Background:** Transparent or `--muted` subtle circle/blob

### Use Cases

| State | Illustration Concept |
|-------|---------------------|
| Empty transactions | Open wallet with dotted outline |
| No goals | Mountain peak with flag at base |
| Onboarding welcome | Compass or horizon line |
| 404 | Disconnected path/node |
| 500 | Gentle warning shield |
| Loading | Pulsing Nexa mark (not spinner-only) |
| Goal achieved | Subtle confetti + ring completion |
| AI thinking | Orbiting dots around Nexa mark |

### Format

- SVG inline or `@/components/illustrations/*`
- Max file size 8KB per illustration
- `aria-hidden="true"` — always pair with descriptive text

---

## Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `z-base` | 0 | Default |
| `z-dropdown` | 10 | Dropdowns, popovers |
| `z-sticky` | 20 | Sticky headers |
| `z-sidebar` | 30 | App sidebar |
| `z-modal` | 40 | Dialogs, sheets |
| `z-toast` | 50 | Sonner toasts |
| `z-tooltip` | 60 | Tooltips |
| `z-command` | 70 | Command palette |
