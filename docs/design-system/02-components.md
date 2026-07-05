# 02 — Component Library

Production specifications for all reusable UI components. Built on shadcn/ui (New York style) with Nexa token overrides.

---

## Buttons

### Variants

| Variant | Appearance | Usage |
|---------|------------|-------|
| `default` | Primary fill | Primary CTA — one per view |
| `secondary` | Muted fill | Secondary actions |
| `outline` | Border only | Tertiary, OAuth, cancel |
| `ghost` | No border | Toolbar, nav, subtle actions |
| `destructive` | Red fill | Delete, irreversible |
| `link` | Text + underline | Inline navigation |

### Sizes

| Size | Height | Padding | Usage |
|------|--------|---------|-------|
| `sm` | 32px | `px-3` | Tables, compact UI |
| `default` | 40px | `px-4` | Standard |
| `lg` | 48px | `px-6` | Marketing, auth |
| `icon` | 40×40 | — | Icon-only |

### States

```
Default → Hover (opacity 90% / bg-muted) → Active (scale 0.98) → Focus (ring-2 ring-ring) → Disabled (opacity 50%)
```

### Motion

- Hover: `transition-colors duration-150`
- Active: `active:scale-[0.98]` (respect reduced motion)
- Loading: spinner replaces label, width preserved

### Examples

```tsx
<Button>Get Started</Button>
<Button variant="outline" size="lg">Sign In</Button>
<Button variant="ghost" size="icon"><Menu /></Button>
```

---

## Inputs

### Text Input

| Property | Value |
|----------|-------|
| Height | 40px (`h-10`) |
| Radius | `rounded-lg` |
| Border | `border-input` |
| Focus | `ring-2 ring-ring ring-offset-2 ring-offset-background` |
| Error | `border-destructive` + error message below |
| Disabled | `opacity-50 cursor-not-allowed` |

### Financial Input

- Right-aligned text
- `font-mono tabular-nums`
- PKR prefix label inside field: `Rs.` or `₨`
- Thousand separators on blur

### Textarea

- Min height 80px
- Resize vertical only

---

## Cards

### Variants

| Variant | Classes | Usage |
|---------|---------|-------|
| Default | `rounded-xl border bg-card shadow-sm p-6` | Standard content |
| Hero | `border-primary/20 bg-primary-muted` | Safe To Spend |
| Interactive | `hover:shadow-md transition-shadow cursor-pointer` | Clickable cards |
| Flat | `border-0 bg-muted` | Nested content |

### Anatomy

```
┌─────────────────────────────────┐
│ CardDescription (label)         │
│ CardTitle or metric (hero)      │
│ Supporting text / chart         │
│ [Optional action]               │
└─────────────────────────────────┘
```

---

## Safe To Spend Card (Hero Component)

The most important UI element in Nexa.

```
┌─────────────────────────────────────────────┐
│  Safe to spend today                        │  ← caption, muted
│                                             │
│  ₨ 4,250                                    │  ← font-mono text-4xl text-primary
│                                             │
│  Baseline ₨ 3,800 · Trend ×1.12             │  ← caption
│  ─────────────────────────────────────────  │
│  12 days left in cycle                      │  ← optional footer
└─────────────────────────────────────────────┘
```

- Background: `bg-primary-muted border-primary/20`
- Number animates on change: count-up over 400ms
- Tap opens breakdown sheet (future)

---

## Badges & Tags

| Variant | Color | Usage |
|---------|-------|-------|
| `default` | Primary muted | Status neutral |
| `success` | Green muted | On track |
| `warning` | Amber muted | Delayed, attention |
| `destructive` | Red muted | Over budget |
| `outline` | Border only | Categories |

Category tags use outline variant with category icon.

---

## Progress

### Linear Progress

- Track: `h-2 rounded-full bg-muted`
- Fill: `bg-primary` (goals) or semantic color
- Animate width on mount: 500ms ease-out

### Goal Progress Ring

- SVG circle, 64px default
- Stroke: track muted, fill primary
- Center: percentage in `font-mono text-sm`
- Complete state: success color + subtle scale pulse

---

## Navigation

### App Sidebar (Desktop)

- Width: 256px fixed
- Active item: `bg-primary text-primary-foreground`
- Inactive: `text-muted-foreground hover:bg-muted`
- Logo + wordmark in header row (64px height)

### Mobile Sheet Nav

- Slide from left, 256px width
- Same nav items as desktop

### Marketing Nav

- Sticky top, `backdrop-blur bg-background/80`
- Logo left, links center (desktop), CTA right
- Mobile: hamburger → full-screen sheet

### Breadcrumbs

- Separator: `/` or ChevronRight
- Current page not linked, `text-foreground font-medium`
- Ancestors: `text-muted-foreground hover:text-foreground`

---

## Tables

Admin and analytics primary data display.

| Property | Value |
|----------|-------|
| Header | `text-xs font-medium text-muted-foreground uppercase tracking-wider` |
| Row | `border-b border-border hover:bg-muted/50` |
| Cell padding | `px-4 py-3` |
| Sortable columns | Chevron indicator, click header |
| Empty | Centered empty state component |
| Loading | Skeleton rows (5 default) |

Sticky header on scroll for tables > 10 rows.

---

## Charts (Recharts)

### Style Rules

- Grid lines: `stroke-border` at 50% opacity — minimal
- Axis labels: `text-xs fill-muted-foreground`
- Tooltip: Card-style custom tooltip with `shadow-md`
- No 3D effects
- Animate on mount: 600ms ease-out

### Chart Types by Context

| Data | Chart |
|------|-------|
| Safe to spend trend | Area (gradient fill primary/20) |
| Income vs expenses | Grouped bar |
| Goal progress | Ring + sparkline |
| Admin DAU | Line |
| Funnel | Horizontal bar |
| Category breakdown | Donut (max 6 slices, rest "Other") |

---

## Dialogs & Sheets

### Dialog (Modal)

- Max width: `sm:max-w-md` (forms), `sm:max-w-lg` (Can I Buy result)
- Overlay: `bg-black/50 backdrop-blur-sm`
- Enter: fade + scale 0.95→1, 200ms
- Exit: reverse, 150ms
- Focus trap enabled

### Sheet (Drawer)

- Mobile nav: left, 256px
- Detail panels: right, 400px
- Filters: bottom on mobile, right on desktop

---

## Toasts (Sonner)

| Type | Usage |
|------|-------|
| Success | Transaction logged, goal updated |
| Error | API failure with retry action |
| Info | Cycle rollover reminder |
| Loading | Long operations (dismiss on complete) |

Position: `top-center` on mobile, `bottom-right` on desktop.

---

## Command Palette

Trigger: `Cmd+K` / `Ctrl+K`

Sections:
1. Quick actions (Log expense, Can I Buy, Ask Coach)
2. Navigation
3. Recent transactions (search)

Style: shadcn Command component, `shadow-floating`, max-height 400px.

---

## Empty States

Anatomy:

```
[Illustration 120×120]
Heading (heading-sm)
Description (body-sm, muted, max-w-sm centered)
[Primary CTA button]
[Optional secondary link]
```

Never show blank space without guidance.

---

## Skeletons

- Base: `animate-pulse rounded-md bg-muted`
- Match exact dimensions of loaded content
- Dashboard: skeleton hero card + 2×2 grid
- Table: 5 skeleton rows
- Never skeleton for > 3 seconds — show error state

---

## Date Picker & Calendar

- shadcn Calendar + Popover
- Highlight today, selected, pay cycle range
- Pay cycle dates shown with subtle primary background band

---

## Avatar

- Sizes: `sm` 24px, `default` 32px, `lg` 40px
- Fallback: initials on `bg-primary-muted text-primary`
- No default gravatar — privacy first

---

## AI Coach Components

### Conversation Bubble

```
User:     right-aligned, bg-primary text-primary-foreground, rounded-2xl rounded-br-md
Coach:    left-aligned, bg-muted, rounded-2xl rounded-bl-md
```

### Suggestion Chips

- Horizontal scroll on mobile
- `rounded-full border px-3 py-1.5 text-sm`
- Tap sends as message

### Insight Card

- Left border accent: `border-l-4 border-primary`
- Sparkles icon + insight text
- Optional "Learn more" ghost button

### Action Card

- Recommended action with impact preview
- Primary + dismiss ghost buttons

---

## Can I Buy This — Component Spec

### Trigger

Floating pill button or prominent dashboard CTA:
`rounded-full shadow-sm gap-2`

### Flow States

1. **Input** — large input, placeholder examples, analyze button
2. **Thinking** — orbiting loader, "Analyzing your cash flow..."
3. **Result** — verdict card:

```
┌─────────────────────────────────────────────┐
│  ✓ Yes, you can afford this                 │  success/warning/destructive
│                                             │
│  Impact on Safe To Spend    −₨ 2,500       │
│  Goal delay                 +2 weeks        │
│  Confidence                 High ●●●○○       │
│                                             │
│  [Log this purchase]  [Ask follow-up]       │
└─────────────────────────────────────────────┘
```

Verdict colors:
- Yes: `--success`
- Caution: `--warning`
- No: `--destructive`

Never show raw algorithm output — human-readable only.

---

## Admin Components

### Stat Card

```
┌──────────────────┐
│ Total Users      │  caption
│ 12,847           │  font-mono text-3xl
│ +4.2% vs last wk │  caption, success/destructive
└──────────────────┘
```

### Status Badge

| Status | Color |
|--------|-------|
| Open | info |
| In Progress | warning |
| Resolved | success |
| Critical | destructive |

### Audit Log Row

- Monospace timestamp
- Actor + action + resource
- Expandable JSON diff (admin only)

---

## Form Patterns (React Hook Form + Zod)

- Label above input, `text-sm font-medium`
- Error below input, `text-sm text-destructive`
- Helper text below label, `text-xs text-muted-foreground`
- Submit button full-width on mobile
- Disable submit while `isSubmitting`
- Success → toast + redirect
