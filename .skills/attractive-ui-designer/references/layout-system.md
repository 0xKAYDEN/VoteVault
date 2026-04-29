# Layout System

## Table of Contents
1. Bento Grid Architecture
2. Spacing Systems
3. Card Design Patterns
4. Dashboard Layouts
5. Hero Section Patterns
6. Responsive Hierarchy

---

## 1. Bento Grid Architecture

### Core Concept
Inspired by Japanese bento boxes: modular, self-contained blocks of varying sizes arranged in asymmetric but balanced compositions. Each block is a complete information unit.

### Structural Rules
- **Grid base**: 4-column or 12-column system
- **Gap consistency**: 12px-24px uniform spacing (never vary within a grid)
- **Corner radius**: 12px-24px consistently applied to ALL blocks
- **Max blocks**: 6-12 per visible section; more becomes chaos
- **Hierarchy through size**: Largest block = primary message; smallest = supporting data

### CSS Implementation
```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}
.bento-item-large  { grid-column: span 2; grid-row: span 2; }
.bento-item-wide   { grid-column: span 2; grid-row: span 1; }
.bento-item-tall   { grid-column: span 1; grid-row: span 2; }
.bento-item-small  { grid-column: span 1; grid-row: span 1; }
```

### Content Patterns per Block
1. **Hero block** (large): Feature image + headline + CTA
2. **Stat block** (small): Big number + label + micro-chart
3. **Icon block** (medium): Icon + 3-word title + 1-line description
4. **Chart block** (wide): Mini graph + axis labels + summary
5. **Quote block** (tall): Avatar + testimonial + name/role
6. **List block** (medium): 3-5 items with checkmarks or bullets

### Bento Psychology
- **Gestalt Proximity**: Elements within one block belong together
- **Law of Similarity**: Uniform radii and gaps tie blocks into a whole
- **Cognitive load reduction**: Snackable content vs wall-of-text
- **Scanning pattern**: Eye moves from large to small in Z-pattern

### Anti-Patterns
- Too many blocks (20+): becomes spreadsheet chaos
- Equal sizing everywhere: destroys hierarchy
- Mixed radii or gaps: breaks visual unity
- No mobile plan: must collapse to 1-2 columns gracefully

---

## 2. Spacing Systems

### Base Unit
- **4px base** (0.25rem) is standard; all spacing is multiple of 4
- Avoid odd numbers (5px scales to 7.5px on 1.5x DPI = blurry)

### Spacing Scale
| Token | Value | Use Case |
|-------|-------|----------|
| space-1 | 4px | Tight padding, icon gaps |
| space-2 | 8px | Inline elements, tight groups |
| space-3 | 12px | Card internal padding (small) |
| space-4 | 16px | Standard card padding |
| space-5 | 20px | Button padding horizontal |
| space-6 | 24px | Section gaps, card gaps |
| space-8 | 32px | Section internal padding |
| space-10 | 40px | Large section margins |
| space-12 | 48px | Hero padding |
| space-16 | 64px | Major section separation |
| space-20 | 80px | Page-level vertical rhythm |

### Container Widths
- **Max width**: 1280px-1440px for content; 1920px for full-bleed heroes
- **Side padding**: 16px mobile, 24px tablet, 32px desktop, 48px wide
- **Content width**: 65ch (characters) for reading text = ~680px max

### Vertical Rhythm
- Line-height as spacing multiplier: heading line-height 1.2, body 1.6
- Section separation: 80px-120px between major sections
- Use `padding` not `margin` where possible to avoid collapse issues

---

## 3. Card Design Patterns

### Card Structure
Every card follows: **Visual -> Title -> Description -> Action**
- Top: Icon, image, or chart (attention grabber)
- Middle: Title in bold, 16-20px
- Below: 1-2 lines description, 14px, muted color
- Bottom: Single CTA or metadata

### Card Variants
**Standard Elevated**
- Background: surface color
- Border-radius: 12px-16px
- Shadow: level 2 (3dp)
- Padding: 16px-24px

**Outlined**
- Background: transparent or same as page
- Border: 1px solid border-color
- No shadow
- Best for dense lists, settings panels

**Filled / Feature**
- Background: primary color at 5-10% opacity
- Border: none
- Subtle left or top accent border: 3px solid primary
- Best for: featured item, recommended plan

**Glass Card**
- See Visual Effects glass recipe
- Best on: gradient or image backgrounds
- Content inside must have sufficient contrast

**Interactive Hover States**
- Hover: translateY(-2px to -4px) + shadow level increase (2->3 or 3->4)
- Transition: 200ms-300ms ease-out
- Active/pressed: translateY(0) + shadow decrease
- Focus: 2px outline offset 2px in primary color

### Card Spacing Internals
- Padding: 20px-24px all sides
- Gap between internal elements: 12px-16px
- Icon to text: 12px
- Title to description: 8px
- Description to button: 16px

---

## 4. Dashboard Layouts

### Classic Dashboard Anatomy
```
[ Sidebar ] [ Header ]
            [ KPI Row (3-4 metrics) ]
            [ Main Chart Area    | Side Panel ]
            [ Secondary Charts Row          ]
            [ Data Table / Recent Activity  ]
```

### KPI Cards Row
- 3-4 cards max in a row
- Each card: Icon + Label + Big Number + Delta indicator (+/- %)
- Height: 120px-160px
- Use sparklines (tiny line charts) for trend context
- Delta colors: green positive, red negative (or brand colors)

### Chart Containers
- Consistent padding: 20px-24px
- Header: Chart title (left) + time filter/legend (right)
- Minimum height: 300px for main charts, 200px for secondary
- Use subtle grid lines: 1px dashed at 5% opacity
- Tooltips: glass or dark background, 8px radius, 12px padding

### Sidebar Design
- Width: 240px-280px fixed (64px collapsed for icon-only)
- Background: slightly different from main (surface-1 vs surface-2)
- Active item: primary color background at 10% + primary text
- Hover: background lightens/darkens 5%
- Divider: 1px border between sections

### Header / Top Bar
- Height: 56px-64px
- Content: Logo (left) | Search | Actions | Avatar (right)
- Background: transparent or glass over scrolling content
- Shadow: appears only after scroll (scroll-triggered elevation)

---

## 5. Hero Section Patterns

### Centered Text Hero
- Background: solid, gradient, or image with overlay
- Content: centered, max-width 800px
- Title: 48px-72px, font-weight 700-800, tight line-height (1.1)
- Subtitle: 18px-20px, muted, max-width 560px, centered
- CTA: 1-2 buttons, 16px padding vertical, 32px horizontal
- Spacing: title to subtitle 16px-24px; subtitle to buttons 32px-40px

### Split Hero (Text + Visual)
- Layout: 50/50 or 60/40 split
- Left: Text content, vertically centered
- Right: Image, illustration, 3D element, or product mockup
- Mobile: stack vertically, visual first or text first depending on priority

### Typography-Only Hero
- Oversized text filling 80% of viewport width
- Kinetic or scroll-responsive text
- Minimal other elements; let type be the image
- Background: subtle texture or single accent color

### Bento Hero
- Entire hero is a bento grid of 4-6 feature blocks
- No separate title area; title is one of the blocks
- Immediately shows product capability through modular preview

### Full-Bleed Hero
- Edge-to-edge image or video
- Text overlaid with scrim/gradient for readability
- Text positioned: bottom-left (classic), center (impactful), or asymmetric
- Scroll indicator at bottom center

---

## 6. Responsive Hierarchy

### Breakpoint System
| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | < 640px | Single column, stacked, full-width buttons |
| Tablet | 640-1024px | 2 columns, sidebar collapses to hamburger |
| Desktop | 1024-1440px | Full layout, sidebar visible |
| Wide | > 1440px | Max-width container centers, more whitespace |

### Responsive Typography
- Base size: 16px (never smaller for body)
- Scale ratio: 1.25 (major third) for mobile, 1.333 (perfect fourth) for desktop
- Fluid type: `clamp(2rem, 5vw + 1rem, 4rem)` for headings
- Minimum readable: 12px for captions only with strong contrast

### Responsive Spacing
- Halve section spacing on mobile (80px -> 40px)
- Card padding reduces 24px -> 16px
- Grid gaps: 24px -> 12px -> 8px
- Maintain touch targets: minimum 44x44px for buttons

### Touch Adaptations
- Hover effects convert to active/pressed states
- No cursor-follow effects on touch
- Swipe gestures replace hover-reveal
- Glassmorphism reduced (performance + contrast)
- Bottom sheets replace modal dialogs

### Content Prioritization
- Mobile: show only primary CTA and essential content
- Tablet: secondary content in collapsible drawers
- Desktop: full sidebar, all metadata visible
- Progressive disclosure: hide complexity, reveal on demand
