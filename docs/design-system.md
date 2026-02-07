# The Todo Way - Design System

> Version: 1.0 | Created: 2026-02-07

## Brand Identity

- **App Name**: The Todo Way
- **Personality**: Clean, focused, productive
- **Font**: Inter (variable, sans-serif)

## Color Palette

### Brand Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `--primary` | Indigo-600 `#4F46E5` | Indigo-500 `#6366F1` | Buttons, active states, links |
| `--primary-foreground` | White `#FFFFFF` | White `#FFFFFF` | Text on primary |
| `--accent` | Amber-500 `#F59E0B` | Amber-400 `#FBBF24` | Highlights, badges |
| `--destructive` | Red-600 `#DC2626` | Red-500 `#EF4444` | Delete actions |
| `--background` | White `#FFFFFF` | Slate-950 `#020617` | Page background |
| `--card` | Slate-50 `#F8FAFC` | Slate-900 `#0F172A` | Cards, panels |
| `--border` | Slate-200 `#E2E8F0` | Slate-700 `#334155` | Borders |
| `--foreground` | Slate-900 `#0F172A` | Slate-50 `#F8FAFC` | Primary text |
| `--muted-foreground` | Slate-500 `#64748B` | Slate-400 `#94A3B8` | Secondary text |

### Priority Colors

| Priority | Color | Tailwind | Hex |
|----------|-------|----------|-----|
| P1 Critical | Red | `text-red-500` | `#EF4444` |
| P2 High | Orange | `text-orange-500` | `#F97316` |
| P3 Medium | Blue | `text-blue-500` | `#3B82F6` |
| P4 Low | Slate | `text-slate-400` | `#94A3B8` |

### Label Colors (Presets)

| Label | Color | Hex |
|-------|-------|-----|
| work | Blue | `#3B82F6` |
| personal | Emerald | `#10B981` |
| urgent | Red | `#EF4444` |
| meeting | Violet | `#8B5CF6` |
| errand | Orange | `#F97316` |
| idea | Pink | `#EC4899` |

## Typography

| Element | Class | Size | Weight |
|---------|-------|------|--------|
| H1 | `text-2xl font-bold` | 24px | 700 |
| H2 | `text-xl font-semibold` | 20px | 600 |
| H3 | `text-lg font-semibold` | 18px | 600 |
| Body | `text-sm font-normal` | 14px | 400 |
| Caption | `text-xs font-medium` | 12px | 500 |

Body text at 14px (`text-sm`) keeps the app compact like Todoist.

## Spacing

| Context | Class | Value |
|---------|-------|-------|
| Base unit | `space-1` | 4px |
| Card padding | `p-3` | 12px |
| Panel padding | `p-4` | 16px |
| Compact list gap | `gap-2` | 8px |
| Section gap | `gap-4` | 16px |
| Sidebar width | `w-[260px]` | 260px |

## Border Radius

| Context | Class | Value |
|---------|-------|-------|
| Cards/Dialogs | `rounded-lg` | 8px |
| Buttons/Inputs | `rounded-md` | 6px |
| Badges/Tags | `rounded-full` | 9999px |

## Shadows

| Context | Class |
|---------|-------|
| Card default | `shadow-sm` |
| Card hover | `shadow-md` |
| Dialog | `shadow-lg` |

## Component Patterns

### Todo Card
- Left border colored by priority (2px, `border-l-2`)
- `rounded-lg shadow-sm border p-3`
- Hover: `hover:shadow-md transition-shadow`
- Title: `text-sm font-medium`
- Meta (date, deadline, duration): `text-xs text-muted-foreground`

### Priority Indicator
- Small colored circle (8px) or colored left border on cards
- P1: red, P2: orange, P3: blue, P4: slate

### Label Tags
- `rounded-full px-2 py-0.5 text-xs font-medium`
- Background: label color at 10% opacity
- Text: label color

### Duration Badge
- `text-xs bg-secondary rounded px-1.5 py-0.5`
- Format: "30m", "1h", "1h 30m", "2h"

## Dark Mode

- Toggle: system preference + manual switch in TopBar
- Strategy: Tailwind `class` (`.dark` on `<html>`)
- All semantic tokens auto-switch via CSS custom properties
- FullCalendar themed via `--fc-*` variable overrides in `.dark` scope
