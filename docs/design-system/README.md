# Nexa Design System

**Version:** 1.0  
**Status:** Production-ready specification  
**Stack:** Next.js · React · Tailwind CSS v4 · shadcn/ui · Motion · Lucide · next-themes

---

## Philosophy

Nexa is a **Financial Intelligence Platform**, not an expense tracker. Every design decision reinforces:

| Principle | Design Expression |
|-----------|-------------------|
| **Trust** | Calm palette, clear hierarchy, no dark patterns |
| **Simplicity** | One primary action per view, progressive disclosure |
| **Intelligence** | AI surfaces feel like a coach, not a chatbot |
| **Security** | Privacy cues, lock icons, audit trails visible |
| **Premium Quality** | Generous whitespace, refined typography, subtle depth |
| **Financial Confidence** | Safe To Spend™ is always the hero metric |

### What We Avoid

- Bright finance-app greens as primary color
- Cheap gradients and overused glassmorphism
- Generic dashboard templates
- Visual clutter and unnecessary animation
- Copying Stripe/Linear/Monzo — we take inspiration, not imitation

### Inspiration (Reference Only)

Stripe · Linear · Vercel · Apple Wallet · Revolut · Monzo · Arc · Notion · GitHub · Raycast · Clerk · Supabase · shadcn/ui

---

## Document Index

| Document | Contents |
|----------|----------|
| [01 — Foundations](./01-foundations.md) | Color, typography, spacing, elevation, icons, illustrations |
| [02 — Components](./02-components.md) | Full component library specifications |
| [03 — Screens & Flows](./03-screens-and-flows.md) | Marketing, auth, onboarding, dashboard, admin, analytics, support |
| [04 — Motion & Accessibility](./04-motion-and-accessibility.md) | Animation specs, WCAG AA, responsive rules |
| [05 — Developer Handoff](./05-developer-handoff.md) | CSS variables, Tailwind mapping, shadcn tokens, implementation checklist |

---

## Brand Identity

### Name & Mark

- **Wordmark:** Nexa — set in display font, `-0.02em` tracking, semibold
- **Logomark:** Rounded square (`radius-lg`) with single **N** letterform
- **Mark colors:** Primary fill on light; elevated surface on dark

### Voice & Tone (UI Copy)

- Direct, warm, never patronizing
- Lead with outcomes: *"You're on track"* not *"Goal progress: 67%"*
- Errors explain what happened and what to do next
- AI speaks as a financial coach, not a robot

### Core Product Language

| Term | Usage |
|------|-------|
| **Spend with confidence.** | Short tagline — logo lockup, footer, metadata title |
| **Know what you can spend. Stay on track.** | Primary tagline — hero subheads, about, auth panel |
| **Can I afford this? Nexa knows.** | Marketing hook — landing H1, campaigns |
| Safe To Spend™ | Hero daily allowance metric — always prominent |
| Can I Buy This? | Flagship purchase simulation feature |
| Financial Health | 0–100 composite score |
| Cycle | User's pay period (not "month" unless calendar month) |
| Insight | Single AI-generated daily guidance |
| Coach | AI assistant (not "chatbot" or "bot") |

---

## Theme Architecture

Both themes are first-class citizens. Every component must be verified in **light** and **dark** before shipping.

```
┌─────────────────────────────────────────────────────────┐
│  Light Theme          │  Dark Theme                     │
│  ─────────────        │  ──────────                     │
│  bg: #FAFAFA          │  bg: #0C0C0E (not pure black)   │
│  surface: #FFFFFF     │  surface-1: #131316             │
│  soft shadows         │  surface-2: #1A1A1F             │
│  high readability     │  surface-3: #222228             │
│                       │  layered elevation, no glow     │
└─────────────────────────────────────────────────────────┘
```

Theme switching via `next-themes` with `attribute="class"`. No flash of wrong theme — use `suppressHydrationWarning` on `<html>`.

---

## Layout System

### Breakpoints

| Token | Width | Layout Strategy |
|-------|-------|-----------------|
| `xs` | 475px | Single column, bottom nav optional |
| `sm` | 640px | Stacked cards, full-width CTAs |
| `md` | 768px | 2-column grids, sidebar collapses to sheet |
| `lg` | 1024px | Persistent sidebar (app), 12-col grid |
| `xl` | 1280px | Max content width enforced |
| `2xl` | 1536px | Admin/analytics multi-panel layouts |

### Container Widths

| Context | Max Width | Class |
|---------|-----------|-------|
| Marketing hero | 1200px | `max-w-6xl` |
| App content | 1024px | `max-w-5xl` |
| Auth forms | 420px | `max-w-md` |
| Admin tables | 1440px | `max-w-7xl` |
| Prose / legal | 720px | `max-w-3xl` |

### Grid

- **Base unit:** 8px
- **App dashboard:** 12-column grid, 24px gutter at `lg+`
- **Card grids:** `gap-4` (16px) mobile · `gap-6` (24px) desktop

---

## Application Shells

### User App (`AppLayout`)

```
Desktop (lg+)
┌──────────┬────────────────────────────────────┐
│ Sidebar  │  Page Header                       │
│  256px   │  ────────────────────────────────  │
│          │  Content (max-w-5xl)               │
│  Nav     │                                    │
│  Theme   │                                    │
└──────────┴────────────────────────────────────┘

Mobile
┌────────────────────────────────────┐
│ [N] Nexa              [Theme][≡]  │
├────────────────────────────────────┤
│ Content (full width, p-4)          │
└────────────────────────────────────┘
```

### Admin (`AdminLayout`)

- Dark-neutral sidebar (slate tones), dense information density
- Breadcrumb + page title + action bar pattern
- Tab navigation for sub-sections

### Marketing

- Full-bleed sections, sticky nav with blur backdrop
- No sidebar — top navigation only

---

## Quick Reference — Primary Color Decision

**Primary:** `#5E6AD2` (Nexa Indigo) — intelligent, calm, premium  
**NOT:** Emerald/green primary — green reserved for **financial-positive** semantic only

See [01 — Foundations](./01-foundations.md) for complete token tables.

---

## Implementation Status

| Area | Spec | Code |
|------|------|------|
| Design tokens | ✅ Complete | ✅ `apps/web/app/globals.css` |
| Typography | ✅ Complete | ✅ `apps/web/app/layout.tsx` |
| UI component library | ✅ Complete | ✅ `apps/web/components/ui/*` |
| Widgets (StatCard, SafeToSpend, etc.) | ✅ Complete | ✅ `apps/web/components/widgets/*` |
| App shell (sidebar layout) | ✅ Complete | ✅ `(app)/layout.tsx` + `AppLayout` |
| Auth split layout | ✅ Complete | ✅ `(auth)/layout.tsx` |
| Marketing landing | ✅ Complete | ✅ `components/marketing/landing-page.tsx` |
| Dashboard polish | ✅ Complete | ✅ Redesigned with design system |
| Admin overview | ✅ Complete | ✅ Stat cards + sidebar nav |
| Analytics charts (Recharts) | ✅ Spec | ⬜ Next phase |

---

## Review Checklist (Every Screen)

Before shipping any UI:

- [ ] Intuitive for first-time users?
- [ ] Builds trust — no anxiety-inducing colors for neutral states?
- [ ] Reduces cognitive load — one clear primary action?
- [ ] Every element purposeful?
- [ ] Consistent with design system tokens?
- [ ] Works in light **and** dark theme?
- [ ] WCAG AA contrast verified?
- [ ] Responsive at mobile, tablet, desktop?
- [ ] `prefers-reduced-motion` respected?
- [ ] Implementable cleanly with chosen stack?
