# Layout System Reference

This file covers bento grid architecture, spacing systems, card patterns, dashboard anatomy, hero sections, and responsive hierarchy.

## Table of Contents

1. [Spacing System](#spacing-system)
2. [Bento Grid Architecture](#bento-grid-architecture)
3. [Dashboard Layouts](#dashboard-layouts)
4. [Hero Section Patterns](#hero-section-patterns)
5. [Responsive Breakpoints](#responsive-breakpoints)
6. [Vertical Rhythm](#vertical-rhythm)
7. [Container System](#container-system)
8. [Navigation Layout](#navigation-layout)
9. [Generative Layout Patterns](#generative-layout-patterns)

---

## 1. Spacing System

### 4px Base Scale

| Token | Value | Usage |
|-------|-------|-------|
| 0 | 0 | Reset |
| 1 | 4px | Tight spacing |
| 2 | 8px | Icon gaps |
| 3 | 12px | Component internal |
| 4 | 16px | Standard padding |
| 5 | 20px | Section padding |
| 6 | 24px | Card padding |
| 8 | 32px | Section gaps |
| 10 | 40px | Large gaps |
| 12 | 48px | Section margin |
| 16 | 64px | Hero spacing |
| 20 | 80px | Page margins |
| 24 | 96px | Major sections |

### Spacing Utilities

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
}
```

---

## 2. Bento Grid Architecture

### Classic 3-Column Bento

```css
.bento-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.bento-item-large {
  grid-column: span 2;
  grid-row: span 2;
}

.bento-item-tall {
  grid-row: span 2;
}
```

### Bento Card Pattern

```css
.bento-card {
  background: var(--surface);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all 0.3s ease;
}

.bento-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}
```

###Responsive Bento

```css
.bento-responsive {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 1280px) {
  .bento-responsive {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1024px) {
  .bento-responsive {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .bento-responsive {
    grid-template-columns: 1fr;
  }
}
```

### Bento Variants

| Layout | Description | Use Case |
|--------|------------|----------|
| 4-col | Full dashboard | Analytics |
| 3-col | Standard | SaaS |
| 2-col | Simplified | Mobile web |
| 1-col | Single | Mobile app |

---

## 3. Dashboard Layouts

### Admin Dashboard Structure

```css
.dashboard-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  grid-template-rows: 64px 1fr;
  min-height: 100vh;
}

.dashboard-header {
  grid-column: 1 / -1;
  position: sticky;
  top: 0;
  z-index: 100;
}

.dashboard-sidebar {
  position: sticky;
  top: 64px;
  height: calc(100vh - 64px);
  overflow-y: auto;
}

.dashboard-main {
  padding: 24px;
  overflow-y: auto;
}
```

### Analytics Dashboard

```css
.analytics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: auto auto auto;
  gap: 16px;
}

.metric-card {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
}

.chart-card {
  grid-column: span 2;
  min-height: 300px;
}

.chart-card-full {
  grid-column: span 4;
  min-height: 400px;
}
```

### Workspace Layout

```css
.workspace {
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  height: 100vh;
}

.workspace-sidebar-left {
  border-right: 1px solid var(--border);
  overflow-y: auto;
}

.workspace-main {
  overflow-y: auto;
}

.workspace-sidebar-right {
  border-left: 1px solid var(--border);
  overflow-y: auto;
}
```

---

## 4. Hero Section Patterns

### Split Hero

```css
.hero-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 90vh;
  align-items: center;
}

.hero-content {
  padding: 64px;
}

.hero-visual {
  position: relative;
  min-height: 90vh;
}
```

### Centered Hero

```css
.hero-centered {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 80vh;
  padding: 64px 24px;
}

.hero-headline {
  max-width: 800px;
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  line-height: 1.1;
}

.hero-subhead {
  max-width: 600px;
  margin-top: 24px;
  font-size: 1.25rem;
}
```

### Full-Bleed Hero

```css
.hero-fullbleed {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(0, 0, 0, 0.8) 100%
  );
}

.hero-content-overlay {
  position: relative;
  z-index: 1;
  max-width: 800px;
  padding: 64px;
}
```

### Bento Hero

```css
.hero-bento {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 24px;
  min-height: 90vh;
  padding: 24px;
}

.hero-main-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 48px;
  border-radius: 24px;
}

.hero-side-cards {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hero-side-card {
  flex: 1;
  padding: 24px;
  border-radius: 20px;
}
```

---

## 5. Responsive Breakpoints

### Breakpoint Scale

| Breakpoint | Width | Columns |
|-----------|-------|----------|
| xs | 0-479px | 1 |
| sm | 480-767px | 1-2 |
| md | 768-1023px | 2-3 |
| lg | 1024-1279px | 3-4 |
| xl | 1280-1535px | 4 |
| 2xl | 1536px+ | 4+ |

### Responsive Grid

```css
.responsive-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 768px) {
  .responsive-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}

@media (min-width: 1024px) {
  .responsive-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
}

@media (min-width: 1280px) {
  .responsive-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
  }
}
```

### Container Queries

```css
.card-container {
  container-type: inline-size;
}

.card-layout {
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;
}

@container (min-width: 400px) {
  .card-layout {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

---

## 6. Vertical Rhythm

### Grid Baseline

```css
.vertical-rhythm {
  display: grid;
  gap: 24px;
  align-content: start;
}

.vertical-rhythm > * + * {
  margin-top: 0;
}
```

### Section Spacing

| Level | Spacing | Usage |
|-------|---------|-------|
| Tight | 24px | Related content |
| Normal | 48px | Standard sections |
| Loose | 64px | Major divisions |
| XL | 96px | Page divisions |

### Content Width

```css
.content-narrow {
  max-width: 640px;
  margin: 0 auto;
}

.content-medium {
  max-width: 800px;
  margin: 0 auto;
}

.content-wide {
  max-width: 1024px;
  margin: 0 auto;
}

.content-full {
  max-width: 1280px;
  margin: 0 auto;
}
```

---

## 7. Container System

### Max Width Scale

```css
.container {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 16px;
}

@media (min-width: 640px) {
  .container {
    padding: 0 24px;
  }
}

@media (min-width: 1024px) {
  .container {
    padding: 0 32px;
  }
}
```

### Aspect Ratios

```css
.aspect-video {
  aspect-ratio: 16 / 9;
}

.aspect-square {
  aspect-ratio: 1 / 1;
}

.aspect-portrait {
  aspect-ratio: 3 / 4;
}

.aspect-4-3 {
  aspect-ratio: 4 / 3;
}

.aspect-21-9 {
  aspect-ratio: 21 / 9;
}
```

---

## 8. Navigation Layout

### Top Nav

```css
.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-links {
  display: flex;
  gap: 32px;
}

.nav-cta {
  display: flex;
  gap: 16px;
}
```

### Sidebar Nav

```css
.sidebar-nav {
  width: 240px;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  padding: 24px 16px;
  overflow-y: auto;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.sidebar-item:hover {
  background: var(--surface-hover);
}
```

### Mobile Nav

```css
.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: var(--surface);
  border-top: 1px solid var(--border);
  z-index: 100;
}

.mobile-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
}
```

---

## 9. Generative Layout Patterns

### Intent-Driven Bento

```css
.generative-bento {
  display: grid;
  grid-template-columns: repeat(var(--cols, 4), 1fr);
  gap: 16px;
  transition: grid-template-columns 0.4s ease;
}

.generative-cell {
  grid-column: span var(--span, 1);
  grid-row: span var(--row-span, 1);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### Progressive Disclosure Layout

```css
.progressive-layout {
  display: grid;
  gap: 16px;
}

.progressive-primary {
  grid-column: 1 / -1;
}

.progressive-secondary {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
  transition: all 0.4s ease;
}

.progressive-layout:has(.progressive-primary:hover) .progressive-secondary {
  opacity: 1;
  max-height: 500px;
}
```

### Adaptive Card Grid

```css
.adaptive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.adaptive-card {
  min-height: 200px;
  transition: all 0.3s ease;
}
```

### Responsive Stack

```css
.responsive-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (min-width: 768px) {
  .responsive-stack {
    flex-direction: row;
    align-items: flex-start;
  }
  
  .responsive-stack > * {
    flex: 1;
  }
}
```

### Floating Panel Layout

```css
.floating-panels {
  position: relative;
  min-height: 400px;
}

.floating-panel {
  position: absolute;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.panel-main {
  inset: 0;
}

.panel-float-1 {
  top: 20%;
  right: 10%;
  transform: scale(0.9);
  opacity: 0.8;
}

.panel-float-2 {
  bottom: 10%;
  left: 5%;
  transform: scale(0.85);
  opacity: 0.6;
}
