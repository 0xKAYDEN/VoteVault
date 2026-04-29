---
name: attractive-ui-designer
description: Comprehensive visual design system for creating premium, modern, attractive UI/UX across web and mobile. Use when agent needs to design, build, or describe user interfaces, dashboards, landing pages, mobile apps, design systems, or any visual digital product requiring contemporary aesthetics. Triggers on requests involving UI design, UX layouts, component styling, color palettes, typography, animations, glassmorphism, neumorphism, bento grids, gradients, dark mode, dashboard design, hero sections, or modern frontend visual architecture. Works across any AI model context.
---

# Attractive UI Designer

Create visually stunning, modern, and highly usable interfaces by applying this comprehensive visual design system. The skill provides production-ready specifications for morphology effects, color theory, layout architecture, typography, motion, and component patterns.

## Core Design Philosophy

1. **Depth without clutter**: Use shadows, glows, and layering to create hierarchy, not decoration
2. **Restraint with moments**: Keep 80% minimal, make 20% extraordinary
3. **Systematic consistency**: One spacing scale, one radius logic, one color algebra
4. **Motion with purpose**: Every animation guides, confirms, or delights
5. **Contrast is king**: Beauty means nothing if users cannot read or navigate

## Workflow

When designing any interface, follow this sequence:

### Step 1: Define the Mood & Mode
- Light or dark mode? (Dark mode default for premium tech; light for friendly SaaS)
- Select base palette from `references/color-system.md` (Section 2)
- Choose morphism direction: Glass (tech), Clay (friendly), Neu (tactile), Liquid (spatial)

### Step 2: Establish Layout Skeleton
- Page type: Dashboard -> bento grid; Landing -> hero + sections; App -> sidebar + main
- Apply spacing system from `references/layout-system.md` (Section 2)
- Define max container width and responsive breakpoints

### Step 3: Build Component Hierarchy
- Buttons, cards, inputs from `references/component-patterns.md`
- Adapt chosen morphism style to each component
- Ensure every interactive element has hover, active, focus, and disabled states

### Step 4: Layer Visual Effects
- Apply depth: shadows, elevation, glows from `references/visual-effects.md`
- Add background atmosphere: gradient, aurora, mesh, or noise from `references/color-system.md` (Section 3)
- Place 3D or decorative elements with parallax from `references/visual-effects.md` (Section 6)

### Step 5: Animate & Refine
- Entrance animations, scroll triggers, micro-interactions from `references/typography-motion.md`
- Typography scale and font pairing from `references/typography-motion.md` (Section 1-2)
- Test contrast and accessibility from `references/color-system.md` (Section 6)

## Reference Library

Load these files when working on their respective domains:

- **`references/visual-effects.md`** — Glassmorphism, neumorphism, claymorphism, liquid glass, shadows, glows, textures, 3D treatments, light physics
- **`references/color-system.md`** — Color theory, premium palettes (dark/light/luxury), gradient systems (aurora, mesh, shape blur), mixing rules, dark mode adaptation, accessibility
- **`references/layout-system.md`** — Bento grid architecture, spacing systems (4px base), card patterns, dashboard anatomy, hero section patterns, responsive hierarchy
- **`references/typography-motion.md`** — Type scales, font pairing, kinetic typography, micro-interactions, scroll/parallax, animation timing and easing
- **`references/component-patterns.md`** — Button systems, navigation patterns, dashboard widgets, form elements, data visualization, feedback states

## Quick Decision Guide

| Context | Recommended Approach |
|---------|---------------------|
| SaaS dashboard (dark) | Bento grid + glass cards + aurora background + indigo/cyan palette |
| SaaS dashboard (light) | Bento grid + elevated cards + soft gradient + soft SaaS palette |
| Fintech / crypto | Dark mode + neon glow + glass panels + cyber palette + sparklines |
| Creative portfolio | Mesh gradient + kinetic type + 3D shapes + editorial typography |
| E-commerce | Light mode + clay cards + pastel palette + magnetic buttons |
| Landing page (tech) | Split hero + gradient text + floating 3D + smooth scroll |
| Mobile app | Low-light UI + rounded components + haptic-style micro-interactions |
| Admin panel | Clean light + outlined cards + data tables + clear status badges |

## Design Principles Summary

- **Use 4px spacing base** for everything: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80
- **Consistent radius logic**: Cards 12-16px, buttons 8-12px, inputs 8-12px, pills full
- **One gradient max per view**: Hero OR card OR button, never all competing
- **Dark mode = desaturate 10-20%**: Pure colors vibrate unnaturally on dark backgrounds
- **Glass needs contrast backing**: Text over glass requires 4.5:1 ratio; add subtle solid layer if needed
- **60fps or nothing**: Animate only transform and opacity; test on low-end devices
- **Respect reduced motion**: Provide instant-state fallbacks for all animations
- **Typography is 80% of UI**: Invest in scale, weight, and spacing before adding effects

## Implementation Notes

- All CSS values provided are production-ready and framework-agnostic
- Tailwind CSS equivalents are implied (e.g., `p-4` = 16px, `rounded-xl` = 12-16px)
- For React/Vue/Angular: translate CSS specs into component props or styled-components
- Design tools (Figma/Sketch): use exact pixel values and hex codes from reference files
- When generating images or describing designs to users: use precise terminology from this system
