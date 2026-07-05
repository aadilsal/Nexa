# 05 — Developer Handoff

Implementation guide for frontend engineers. Maps design tokens to code.

---

## File Locations

| Asset | Path |
|-------|------|
| Design tokens (CSS) | `apps/web/app/globals.css` |
| Font loading | `apps/web/app/layout.tsx` |
| shadcn config | `apps/web/components.json` |
| UI components | `apps/web/components/ui/*` |
| App shell | `apps/web/components/layouts/*` |
| Utilities | `apps/web/lib/utils.ts` |

---

## CSS Variables (Complete Reference)

Implemented in `globals.css`. shadcn/ui compatible.

### shadcn Required Tokens

```css
--background
--foreground
--card / --card-foreground
--popover / --popover-foreground
--primary / --primary-foreground
--secondary / --secondary-foreground
--muted / --muted-foreground
--accent / --accent-foreground
--destructive / --destructive-foreground
--border
--input
--ring
--radius
--chart-1 … --chart-5
--sidebar-* (admin)
```

### Nexa Extensions

```css
--primary-muted       /* Hero card backgrounds */
--success / --success-foreground
--warning / --warning-foreground
--info / --info-foreground
--financial-positive
--financial-negative
--financial-neutral
--surface-2 / --surface-3   /* Dark elevation only */
--shadow-floating
```

---

## Tailwind v4 Mapping

Defined via `@theme inline` in `globals.css`:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-muted: var(--primary-muted);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-info: var(--info);
  --color-financial-positive: var(--financial-positive);
  --color-financial-negative: var(--financial-negative);
  /* ... all tokens */
  --font-sans: var(--font-inter);
  --font-mono: var(--font-jetbrains-mono);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
```

### Usage Examples

```tsx
// Hero card
className="rounded-xl border border-primary/20 bg-primary-muted"

// Financial positive amount
className="font-mono text-financial-positive"

// Dark elevated nested card
className="bg-card dark:bg-surface-2"

// Floating dialog
className="shadow-floating"
```

---

## Typography Setup

```tsx
// apps/web/app/layout.tsx
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

// <html className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
// <body className="font-sans antialiased">
```

Display headings use same Inter with `font-bold tracking-tight` — no separate display font file.

---

## shadcn/ui Compatibility

Config (`components.json`):
- Style: **new-york**
- Base color: **slate** (overridden by Nexa tokens)
- CSS variables: **true**
- Icon library: **lucide**

### Adding New Components

```bash
cd apps/web
npx shadcn@latest add [component]
```

Post-install: verify component in both themes. Override radius to match `--radius-lg` for cards.

### CVA Pattern (Buttons)

Migrate custom Button to shadcn CVA pattern when scaling variants:

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        // ...
      },
      size: {
        default: "h-10 px-4 py-2 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);
```

---

## Theme Implementation

```tsx
// providers.tsx — already configured
<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
```

```tsx
// theme-toggle.tsx
import { useTheme } from "next-themes";
// Toggle between light / dark / system
```

Dark mode: `.dark` class on `<html>` triggers dark token set in `globals.css`.

---

## Component Implementation Priority

### Phase 1 — Foundation (Current)

- [x] Design tokens in globals.css
- [x] Typography in layout
- [x] Base shadcn components
- [x] App layout shell
- [ ] Migrate primary from green to indigo across pages
- [ ] Auth split layout

### Phase 2 — Core Product

- [ ] Dashboard visual polish (hero cards, stagger animation)
- [ ] Can I Buy full-page experience
- [ ] AI Coach chat UI
- [ ] Goal progress rings
- [ ] Empty states with illustrations

### Phase 3 — Marketing

- [ ] Full landing page sections
- [ ] Scroll animations
- [ ] SEO metadata per section

### Phase 4 — Admin & Analytics

- [ ] Admin stat cards with trends
- [ ] Analytics charts (Recharts)
- [ ] Support ticket UI

---

## Recharts Configuration

```tsx
const chartConfig = {
  safeToSpend: { color: "hsl(var(--chart-1))" },
  income: { color: "hsl(var(--financial-positive))" },
  expenses: { color: "hsl(var(--financial-negative))" },
};

// Use CSS variables for theme-aware charts
<Area stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.15} />
```

Install when needed: `pnpm add recharts --filter @nexa/web`

---

## Form Pattern

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1).max(200),
});

const form = useForm({ resolver: zodResolver(schema) });
```

---

## Currency Formatting

Always use shared utility:

```tsx
import { formatPKR } from "@/lib/utils";

<span className="font-mono tabular-nums">{formatPKR(4250)}</span>
// → "₨ 4,250"
```

---

## Analytics Events (Design-Aligned)

Track key interactions for analytics dashboard:

| Event | Trigger |
|-------|---------|
| `safe_to_spend_viewed` | Dashboard load |
| `can_i_buy_opened` | Dialog/page open |
| `can_i_buy_completed` | Result shown |
| `transaction_logged` | Expense saved |
| `ai_coach_message_sent` | Chat submit |
| `onboarding_step_completed` | Each onboarding step |
| `theme_changed` | Theme toggle |

---

## Performance Guidelines

- Lazy load marketing illustrations
- Dashboard: TanStack Query staleTime 60s (configured)
- Skeleton → content swap, no layout shift (reserve heights)
- Motion: GPU-accelerated properties only (`opacity`, `transform`)
- Images: Next.js `<Image>` with priority on hero only

---

## Design Token Change Process

1. Update `docs/design-system/01-foundations.md`
2. Update `apps/web/app/globals.css`
3. Verify light + dark in Storybook or manual QA
4. Run contrast check on changed pairs
5. Update components if semantic meaning changed

---

## Quick Migration: Green → Indigo Primary

Find/replace audit needed in:

- `globals.css` — ✅ tokens updated
- Dashboard Safe To Spend card — uses `text-primary` (auto-updates)
- Any hardcoded `#059669` or `emerald-*` Tailwind classes → use semantic tokens

```bash
# Find hardcoded greens
rg "059669|emerald|green-" apps/web
```

---

## Support

Design system questions: reference `docs/design-system/`  
Product context: `docs/PRD.md`  
Engine algorithms: `docs/algorithms-decision-engine-spec.md`
