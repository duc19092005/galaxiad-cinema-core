# Design Plan — Cinema UI Redesign

## Brand
**Word**: DEPTH  
**Vibe**: A24-meets-premium-cinema — warm, editorial, tactile  
**Market**: Vietnam, urban 18-35  
**Competitor gap**: CGV/Galaxy feel generic → we feel like a film still

## Color Palette (6 named values)

```
accent     = #d97706 (amber-600 dark) / #b45309 (amber-700 light) — warm, not aggressive red
accent-soft= tinted variant for badges/tags
surface    = 3-layer hierarchy (base → card → elevated)
text       = primary / secondary / muted
border     = subtle dividers
gold       = rating stars
```

## Typography
- **Body**: Inter, 15px / 1.65 line-height
- **Display**: Inter, weight 400–500 (never >500)
- **Scale**: xs(11) sm(13) base(15) lg(18) xl(22) 2xl(28)

## Layout Signature
**"The amber glow"** — All interactive elements pulse with a warm amber ring on focus. Cards have 1px borders that shift color on hover. Page titles use a vertical amber bar + thin letter-spacing.

## Page Concepts

### HomePage (public)
```
┌─────────────────────────────────────────┐
│ NAV: 52px, bg-surface, amber accent dot│
├─────────────────────────────────────────┤
│ HERO: full-bleed image, centered CTA    │
│    "Cinematic Adventure"                │
├─────────────────────────────────────────┤
│ Now Showing: 5-col grid, poster cards   │
│ Coming Soon: same grid layout           │
└─────────────────────────────────────────┘
```

### AdminPage
```
┌──────────┬──────────────────────────────┐
│ SIDEBAR  │ MAIN CONTENT                 │
│ 272px    │ tabs: users / audit / jobs   │
│ bg-base  │ transfer                      │
│          │ Table: clean, sortable rows   │
└──────────┴──────────────────────────────┘
```

### MovieManagerPage
```
┌─────────────────────────────────────────┐
│ HEADER: title + add button              │
├─────────────────────────────────────────┤
│ TABLE: poster thumbnail, name, genres,  │
│ duration, status, actions               │
│ Inline edit modal on row click          │
└─────────────────────────────────────────┘
```

### BookingPage
```
┌─────────────────────────────────────────┐
│ Screen indicator (curved)               │
│ Seat grid: 3-section (left/right/top)   │
│ Legend: available / selected / taken    │
│ Bottom bar: selected count + price +    │
│   "Continue" button                     │
└─────────────────────────────────────────┘
```

## Signature Element
**"The amber accent line"** — Every section heading gets a thin vertical bar (`--accent` color, 3px wide, 24px tall) on its left. This tiny detail ties the entire UI together and is instantly recognizable.

## Dark/Light Logic
- Single `.dark` class on `<html>`, no "modern" mode needed visually
- Modern mode: keep as alias for `.dark` with indigo accent override via CSS var
- Persist to localStorage('theme'), read before first paint
- Every styled element: `transition: background-color 500ms, color 500ms, border-color 500ms`
