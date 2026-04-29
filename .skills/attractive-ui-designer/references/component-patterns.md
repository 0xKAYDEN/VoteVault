# Component Patterns

## Table of Contents
1. Button Systems
2. Navigation Patterns
3. Dashboard Widgets
4. Form Elements
5. Data Visualization
6. Feedback & Status

---

## 1. Button Systems

### Button Hierarchy
| Type | Visual | Use |
|------|--------|-----|
| Primary | Filled, brand color, shadow | Main CTA, submit, purchase |
| Secondary | Outlined, brand color border | Alternative action, cancel |
| Tertiary | Text only, subtle hover | Low priority, navigation |
| Ghost | Transparent on dark/light | Toolbar actions, icon + label |
| Destructive | Red/rose fill | Delete, remove, unsubscribe |
| Icon | Circle or rounded square | Toolbar, floating action |

### Primary Button Anatomy
- Height: 40px-48px (mobile 48px minimum touch)
- Padding: 16px horizontal (20px for wide emphasis)
- Border-radius: 8px-12px (match card radius or slightly less)
- Font: 14px-16px, weight 500-600
- Shadow: colored shadow at 25% opacity (`0 4px 14px rgba(99,102,241,0.4)`)
- Hover: brightness(1.1) or translateY(-1px) + shadow increase
- Active: brightness(0.95) + translateY(0) + inset shadow

### Gradient Buttons
- Background: linear-gradient(135deg, primary, secondary)
- Hover: gradient angle shifts or brightness increases
- Optional shimmer animation: sheen sweeps across every 5s
- Text: white or near-white for contrast

### Neumorphic Buttons
- Dual shadow system (see Visual Effects)
- On press: swap to inset shadows (appears pressed into surface)
- Color matches background exactly
- Small icon inside with accent color for affordance

### Glass Buttons
- Frosted background at 10-20% opacity
- 1px white border at 20-30% opacity
- Hover: opacity increases to 30-40%, blur decreases slightly
- Often float over gradient/aurora backgrounds

### Button Groups
- Joined buttons: shared container, 1px divider, first/last radius only
- Spaced buttons: 12px gap between
- Segmented control: pill shape, active fill + indicator slide animation

---

## 2. Navigation Patterns

### Top Navigation
- Height: 56px-72px
- Background: transparent -> solid on scroll (glass transition)
- Left: Logo + 4-6 links
- Right: Search, actions, avatar
- Links: 14px-16px, weight 500, subtle hover underline
- Active: primary color or underline indicator
- Mobile: Hamburger -> full-screen overlay or drawer

### Sidebar Navigation
- Width: 240px expanded, 64px collapsed
- Sections: Dashboard, Main, Secondary, Account (dividers between)
- Item height: 40px-44px
- Icon + label layout; icon 20px, gap 12px
- Active: primary background tint + primary icon/text
- Hover: background tint at 50% of active intensity
- Collapse: icons only with tooltip on hover

### Bottom Navigation (Mobile)
- Height: 56px-64px + safe area inset
- 3-5 items, icon + short label
- Active: icon filled + primary color
- Inactive: outline icon + muted text
- Optional: center item elevated (FAB style)

### Breadcrumbs
- Separator: "/" or chevron icon, muted color
- Current page: muted text, not clickable
- Prior pages: link style, hover underline
- Font: 12px-14px

### Tabs
- Height: 40px-48px
- Underline style: 2px indicator slides between active tabs
- Pill style: filled background on active, rounded container
- Content padding-top: 24px below tab bar
- Smooth indicator transition: 300ms spring ease

---

## 3. Dashboard Widgets

### Stat Card
```
[ Icon    ]  [ Sparkline ]
 Label
 ###,###
 ▲ 12.5%    vs last period
```
- Number: 32px-48px, weight 700
- Label: 14px, muted
- Delta: 12px, color-coded (green/red)
- Height: 120px-160px

### Activity Feed
- Items: Avatar + Title + Description + Timestamp
- Height per item: 64px-80px
- Separator: 1px border or 16px whitespace
- Unread: left accent border or dot indicator
- Hover: subtle background tint

### Progress Widget
- Circular: SVG ring, stroke-dasharray animated, center shows %
- Linear: rounded track, animated fill, label at end
- Multi-segment: stacked bars showing composition
- Colors: gradient fill for premium feel

### Chart Widget
- Container: card with padding
- Header: Title + filter dropdown
- Chart area: min 200px height
- Tooltip: follows cursor, glass style
- Legend: below or inline, clickable to toggle series

### Calendar / Date Widget
- Mini calendar: 280px wide, day cells 36px
- Selected: filled primary circle
- Today: primary border circle
- Events: dot indicator below date
- Range: rounded start/end, filled between

---

## 4. Form Elements

### Text Input
- Height: 40px-48px
- Padding: 12px-16px horizontal
- Border: 1px solid border-color, radius 8px-12px
- Focus: border primary + box-shadow glow (0 0 0 3px primary-20%)
- Label: 14px above input, 8px gap; or floating animation
- Error: border red + error message below at 12px
- Icon: left-aligned inside input, 16px, muted

### Search Input
- Rounded pill shape (radius 24px+)
- Search icon left, clear icon right
- Expandable: width grows on focus
- Background: surface or subtle gray

### Select / Dropdown
- Same styling as input
- Dropdown: card shadow, 8px radius, max-height with scroll
- Hover: background tint
- Selected: primary text + checkmark icon
- Group headers: 12px uppercase, muted, sticky

### Checkbox / Radio
- Size: 20px-24px
- Checked: primary fill + white checkmark
- Animation: scale pop on check (1 -> 1.2 -> 1)
- Indeterminate: dash icon
- Label: 14px-16px, 8px gap from control

### Toggle Switch
- Width: 40px-48px, height: 24px-28px
- Track: rounded-full, muted bg -> primary on active
- Knob: 20px-24px circle, white, shadow
- Transition: translateX + color, 200ms spring
- Optional: icon inside knob (sun/moon for theme)

### Slider / Range
- Track: 4px-6px height, rounded-full
- Fill: primary color to left of thumb
- Thumb: 20px-24px circle, white, shadow, border
- Hover: thumb scales to 1.2x
- Tooltip: value appears above thumb on drag

---

## 5. Data Visualization

### Chart Color Palette
- **Categorical**: 6-8 distinct colors; use accessible palette (ColorBrewer)
- **Sequential**: Single hue light to dark (blue: #E0F2FE to #1E3A8A)
- **Diverging**: Two hues from center (red <- white -> blue)
- **Semantic**: Green positive, red negative, blue neutral, amber warning

### Line Charts
- Stroke: 2px-3px, rounded join/cap
- Grid: horizontal only, 1px dashed at 5% opacity
- Points: visible on hover only; 6px-8px circles
- Area fill: gradient to transparent below line
- Multi-line: max 4 series; use stroke-dasharray for distinction

### Bar Charts
- Radius: 4px top (rounded-top bars)
- Gap between bars: 25-40% of bar width
- Grouped: 2-4 bars per group, 8px internal gap
- Horizontal: better for long labels (category names)
- Gradient fills: linear gradient top-to-bottom

### Pie / Donut Charts
- Donut preferred: inner radius 60-70% of outer
- Max segments: 6-7; combine remainder as "Other"
- Segment separation: 2px-4px white/gap
- Labels: outside with connector lines or legend
- Center text: total or primary category label

### Heatmaps
- Color scale: 5-7 steps from light to intense
- Cell size: 24px-32px squares
- Gap: 2px-4px between cells
- Tooltip: exact value on hover
- Labels: top and left axes

### Sparklines
- Height: 24px-40px
- No axes, no labels
- Fill: optional gradient below line
- Last point: dot indicator
- Trend: implicit, immediate comprehension

---

## 6. Feedback & Status

### Toast / Snackbar
- Position: bottom-left, bottom-center, or top-right
- Background: dark (#1A1A1A) or surface color
- Radius: 8px-12px
- Padding: 12px-16px
- Content: icon + message + optional action
- Auto-dismiss: 4-6 seconds with progress bar
- Animation: slide in from edge + fade
- Stacking: max 3, offset vertically by 8px

### Modal / Dialog
- Overlay: black at 50-70% opacity, blur backdrop
- Container: surface color, 16px-24px radius, max-width 480px-560px
- Header: title + close X
- Body: 24px padding
- Footer: action buttons right-aligned
- Entry: scale 0.95->1 + fade, 200ms ease-out
- Exit: reverse
- Focus trap: keyboard navigable only within modal

### Tooltip
- Background: dark tooltip or inverse surface
- Radius: 8px
- Padding: 8px-12px
- Font: 12px-14px
- Arrow: 6px-8px triangle pointing to trigger
- Delay: 300ms hover delay; instant on focus
- Position: auto (flips if near viewport edge)

### Skeleton / Loading
- Base: background color at 5% lighter/darker
- Shimmer: gradient sweep left-to-right, 1.5s loop
- Elements: rounded rectangles matching content shape
- Never use on top of existing content (replace content area)
- Pulse alternative: opacity 0.6-1.0 loop (simpler, less distracting)

### Empty States
- Illustration: 120px-200px, muted or brand-accent
- Title: 18px-20px, "Nothing here yet"
- Description: 14px, muted, what to do next
- CTA: Primary button to create/add first item
- Optional: helpful link or template suggestion

### Error States
- Icon: Warning triangle or error outline, brand red
- Title: "Something went wrong"
- Description: Specific, actionable guidance
- Retry button: Primary CTA
- Fallback: If total failure, show friendly message with support link
- Never show raw error codes to users

### Status Badges
| Status | Style |
|--------|-------|
| Active / Success | Green dot + text, green pill fill |
| Pending / Warning | Amber dot + text, amber outline |
| Error / Failed | Red dot + text, red outline |
| Neutral / Draft | Gray dot + text, gray outline |
| Info / New | Blue dot + text, blue pill fill |
| Premium / Featured | Brand gradient pill, sparkle icon |

- Pill padding: 4px-8px vertical, 8px-12px horizontal
- Dot size: 6px-8px, margin-right 6px
- Radius: rounded-full for pills, 4px for squares
