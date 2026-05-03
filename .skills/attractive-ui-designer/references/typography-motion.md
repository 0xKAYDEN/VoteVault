# Typography & Motion Reference

This file covers typography scales, font pairing, kinetic typography, micro-interactions, scroll/parallax, and animation timing.

## Table of Contents

1. [Typography Scale](#typography-scale)
2. [Font Pairing](#font-pairing)
3. [Futuristic Typography](#futuristic-typography)
4. [Kinetic Typography](#kinetic-typography)
5. [Micro-interactions](#micro-interactions)
6. [Scroll & Parallax](#scroll--parallax)
7. [Animation Timing](#animation-timing)
8. [Generative Typography](#generative-typography)

---

## 1. Typography Scale

### 4px Base Scale

| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| xs | 12px | 1.4 | Captions, labels |
| sm | 14px | 1.5 | Secondary text |
| base | 16px | 1.6 | Body text |
| lg | 18px | 1.5 | Lead text |
| xl | 20px | 1.4 | Subheadings |
| 2xl | 24px | 1.3 | Headings 3 |
| 3xl | 30px | 1.2 | Headings 2 |
| 4xl | 36px | 1.1 | Headings 1 |
| 5xl | 48px | 1.0 | Hero |
| 6xl | 60px | 1.0 | Display |
| 7xl | 72px | 1.0 | Jumbo |

### Fluid Type Scale

```css
:root {
  --text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  --text-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);
  --text-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
  --text-lg: clamp(1.125rem, 1rem + 0.625vw, 1.25rem);
  --text-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);
  --text-2xl: clamp(1.5rem, 1.3rem + 1vw, 1.875rem);
  --text-3xl: clamp(1.875rem, 1.6rem + 1.375vw, 2.25rem);
  --text-4xl: clamp(2.25rem, 2rem + 1.5vw, 3rem);
}
```

### Tracking (Letter Spacing)

| Token | Value | Usage |
|-------|-------|-------|
| tighter | -0.05em | Display/hero |
| tight | -0.025em | Headings |
| normal | 0 | Body |
| wide | 0.025em | Caps labels |
| wider | 0.05em | All caps |

---

## 2. Font Pairing

### Premium Pairs

#### Geometric Sans (Modern Tech)

- **Heading**: Geist, Inter Tight, Manrope
- **Body**: Inter, Geist, Source Sans 3
- **Mono**: JetBrains Mono, Fira Code

```css
/* Recommended import */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');

font-family: 'Manrope', sans-serif;
font-family: 'Inter', sans-serif;
```

#### Editorial Pairs

- **Heading**: Playfair Display, Cormorant Garamond
- **Body**: Lato, Work Sans

#### Brand Pairs

- **Heading**: Poppins, DM Sans
- **Body**: Open Sans, Roboto

### Variable Font Usage

```css
.variable-heading {
  font-variation-settings: 'wght' 700, 'wdth' 100;
  transition: font-variation-settings 0.3s ease;
}

.variable-heading:hover {
  font-variation-settings: 'wght' 800, 'wdth' 110;
}
```

---

## 3. Futuristic Typography

Inspired by GRAXE-BEOSA, cyberpunk styles, and 2026 UI trends.

### Cyberpunk Font Characteristics

- Wide, geometric letterforms
- Sharp angles and cut corners
- High-tech variable weight
- Monospace accents
- Glow effects

### Recommended Cyber Fonts

1. **Orbitron** — Wide, geometric, futuristic
2. **Rajdhani** — Technical, squared
3. **Oxanium** — Gaming, wide
4. **Exo 2** — Clean, futuristic
5. **Chakra Petch** — Sharp, angular
6. **Teko** — Condensed, tech

### Cyber Heading Style

```css
.cyber-heading {
  font-family: 'Orbitron', 'Rajdhani', sans-serif;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  background: linear-gradient(135deg, #00D4FF, #FF00AA);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 30px rgba(0, 212, 255, 0.5);
}

.cyber-sub {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85em;
  letter-spacing: 0.15em;
  color: #00D4FF;
}
```

### Samurai-Cyber Style

Japanese + Cyberpunk fusion.

```css
.samurai-heading {
  font-family: 'Noto Sans JP', 'Oswald', sans-serif;
  font-weight: 700;
  letter-spacing: 0.08em;
  writing-mode: vertical-rl;
  text-orientation: upright;
}
```

### Tesla Cybertruck Style

Industrial, bold, condensed.

```css
.industrial-heading {
  font-family: 'Teko', 'Oswald', sans-serif;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #E5E5E5;
}
```

---

## 4. Kinetic Typography

### Gradient Text

```css
.gradient-text {
  background: linear-gradient(90deg, #667eea, #764ba2, #f97316, #ec4899);
  background-size: 300% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradient-shift 6s ease infinite;
}

@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
```

### Text Reveal

```css
.text-reveal {
  overflow: hidden;
}

.text-reveal span {
  display: inline-block;
  transform: translateY(100%);
  animation: reveal 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes reveal {
  to { transform: translateY(0); }
}
```

### Staggered Entrance

```css
.stagger-enter > * {
  opacity: 0;
  transform: translateY(20px);
  animation: stagger-in 0.6s ease forwards;
}

.stagger-enter > *:nth-child(1) { animation-delay: 0ms; }
.stagger-enter > *:nth-child(2) { animation-delay: 100ms; }
.stagger-enter > *:nth-child(3) { animation-delay: 200ms; }
.stagger-enter > *:nth-child(4) { animation-delay: 300ms; }
.stagger-enter > *:nth-child(5) { animation-delay: 400ms; }

@keyframes stagger-in {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Parallax Type

```css
.parallax-text {
  transform: translateZ(var(--depth, 0px));
  will-change: transform;
}
```

### Glow Pulse

```css
.glow-pulse {
  animation: glow 2s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% { 
    text-shadow: 0 0 10px rgba(0, 212, 255, 0.5); 
  }
  50% { 
    text-shadow: 0 0 30px rgba(0, 212, 255, 0.8),
                0 0 60px rgba(0, 212, 255, 0.4); 
  }
}
```

---

## 5. Micro-interactions

### Button Hover Lift

```css
.btn-lift {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.3s ease;
}

.btn-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.btn-lift:active {
  transform: translateY(0);
}
```

### Magnetic Button

```css
.magnetic-btn {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.magnetic-btn:hover {
  transform: scale(1.05);
}
```

### 3D Tilt Card

```css
.tilt-card {
  perspective: 1200px;
  transform-style: preserve-3d;
}

.tilt-content {
  transition: transform 0.2s ease-out;
}

.tilt-card:hover .tilt-content {
  transform: rotateX(var(--rotate-x)) rotateY(var(--rotate-y));
}
```

### Shimmer Effect

```css
.shimmer {
  position: relative;
  overflow: hidden;
}

.shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transform: translateX(-100%);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  100% { transform: translateX(100%); }
}
```

### Loading Skeleton

```css
.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Input Focus Ring

```css
.input-focus {
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.input-focus:focus {
  outline: none;
  border-color: #4F46E5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
}
```

### Checkbox Morph

```css
.checkbox-morph {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.checkbox-morph:checked {
  background: #4F46E5;
  transform: scale(1.1);
}
```

---

## 6. Scroll & Parallax

### Smooth Scroll

```css
html {
  scroll-behavior: smooth;
}
```

### Parallax Container

```css
.parallax-wrapper {
  perspective: 1px;
  transform-style: preserve-3d;
  overflow-x: hidden;
  overflow-y: auto;
}

.parallax-layer {
  position: absolute;
  inset: 0;
}

.parallax-back {
  transform: translateZ(-1px) scale(2);
}

.parallax-base {
  transform: translateZ(0);
}

.parallax-front {
  transform: translateZ(0.5px) scale(0.5);
}
```

### Scroll Trigger Fade

```css
.scroll-fade {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.scroll-fade.visible {
  opacity: 1;
  transform: translateY(0);
}
```

### Scroll Progress

```css
.scroll-progress {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, #4F46E5, #EC4899);
  transform-origin: 0%;
  transform: scaleX(var(--progress, 0));
}
```

### Sticky Reveal

```css
.sticky-reveal {
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(10px);
}
```

---

## 7. Animation Timing

### Easing Curves

| Name | Value | Usage |
|------|-------|-------|
| easeIn | `cubic-bezier(0.4, 0, 1, 1)` | Fade in |
| easeOut | `cubic-bezier(0, 0, 0.2, 1)` | Fade out |
| easeInOut | `cubic-bezier(0.4, 0, 0.2, 1)` | Standard |
| spring | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Bouncy |
| liquid | `cubic-bezier(0.25, 1, 0.5, 1)` | Smooth |

### Duration Scale

| Token | Duration | Usage |
|-------|---------|-------|
| instant | 0ms | No animation |
| faster | 100ms | Micro-interactions |
| fast | 150ms | Hover states |
| base | 200ms | Standard |
| slow | 300ms | Movement |
| slower | 500ms | Complex |

### Transition Presets

```css
.transition-micro {
  transition: all 150ms ease;
}

.transition-standard {
  transition: all 200ms ease;
}

.transition-bouncy {
  transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.transition-liquid {
  transition: all 400ms cubic-bezier(0.25, 1, 0.5, 1);
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Generative Typography

Adaptive typography for generative UI.

### Adaptive Type Scale

```css
.generative-type {
  --complexity: var(--complexity, 0);
  font-size: calc(1rem + var(--complexity) * 0.25rem);
  font-weight: calc(400 + var(--complexity) * 100);
  letter-spacing: calc(0em - var(--complexity) * 0.02em);
}
```

### Complexity Animation

```css
.complexity-enter {
  animation: complexity-reveal 0.6s ease forwards;
}

@keyframes complexity-reveal {
  from {
    opacity: 0;
    font-weight: 300;
    letter-spacing: 0.2em;
  }
  to {
    opacity: 1;
    font-weight: 600;
    letter-spacing: 0.02em;
  }
}
```

### Font Weight Shift

```css
.weight-shift {
  transition: font-weight 0.3s ease;
}

.weight-shift:hover {
  font-weight: 600;
}
```

### Type Scale Shift on Scroll

```css
.type-scale-scroll {
  font-size: clamp(
    var(--min-size),
    calc(var(--min-size) + var(--scroll) * 1vw),
    var(--max-size)
  );
}
```

### Variable Animation

```css
.variable-animate {
  font-variation-settings: 'wght' 300;
  transition: font-variation-settings 0.3s ease;
}

.variable-animate:hover {
  font-variation-settings: 'wght' 700;
}

/* Animate on scroll */
.variable-animate.scroll-active {
  animation: variable-weight 2s ease-in-out infinite;
}

@keyframes variable-weight {
  0%, 100% { font-variation-settings: 'wght' 400; }
  50% { font-variation-settings: 'wght' 600; }
}
