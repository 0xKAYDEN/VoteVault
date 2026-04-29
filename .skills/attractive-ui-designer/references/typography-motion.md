# Typography & Motion System

## Table of Contents
1. Typography Architecture
2. Font Pairing & Selection
3. Kinetic & Animated Typography
4. Micro-Interactions
5. Scroll & Parallax Effects
6. Animation Timing & Easing

---

## 1. Typography Architecture

### Type Scale (Major Third - 1.25)
| Token | Desktop | Mobile | Weight | Line-Height | Letter-Spacing |
|-------|---------|--------|--------|-------------|----------------|
| Display | 72-96px | 40-48px | 700-900 | 1.0-1.1 | -0.02em |
| H1 | 48-60px | 32-40px | 700-800 | 1.1-1.2 | -0.01em |
| H2 | 36-48px | 28-32px | 600-700 | 1.2 | -0.01em |
| H3 | 24-30px | 20-24px | 600 | 1.3 | 0 |
| H4 | 20-24px | 18-20px | 600 | 1.4 | 0 |
| Body | 16px | 16px | 400-500 | 1.6-1.7 | 0 |
| Small | 14px | 14px | 400 | 1.5 | 0.01em |
| Caption | 12px | 12px | 400-500 | 1.4 | 0.02em |

### Modern Scale (Perfect Fourth - 1.333)
| Token | Desktop | Weight | Use |
|-------|---------|--------|-----|
| Display | 80-120px | 800 | Hero statement |
| H1 | 60px | 700 | Page title |
| H2 | 45px | 600 | Section header |
| H3 | 34px | 600 | Feature title |
| H4 | 24px | 600 | Card title |
| Body | 16-18px | 400 | Reading text |

### Display Type Principles
- **Tight leading**: 0.9-1.1 for display text creates impact
- **Negative tracking**: -0.02em to -0.04em on large text reduces perceived gaps
- **Uppercase sparingly**: Use for labels, badges, navigation; never for body
- **Fluid sizing**: `clamp(min, preferred, max)` for seamless scaling

---

## 2. Font Pairing & Selection

### Premium SaaS Pairing
- **Headings**: Inter, SF Pro Display, Manrope, or Geist (clean, geometric)
- **Body**: Inter, SF Pro Text, or Manrope (same family, different weights)
- **Mono**: JetBrains Mono or SF Mono for code/data

### Editorial / Luxury Pairing
- **Headings**: Playfair Display, Cormorant Garamond, or Editorial New (serif, high contrast)
- **Body**: Source Sans Pro, Inter, or Suisse Int'l (sans, neutral)
- **Accent**: Same serif italic for pull quotes

### Tech / Futuristic Pairing
- **Headings**: Space Grotesk, Syne, or Rajdhani (engineered, wide)
- **Body**: Inter or Roboto (neutral, readable)
- **Data**: JetBrains Mono

### Friendly / Creative Pairing
- **Headings**: Poppins, Nunito, or Fredoka (rounded, approachable)
- **Body**: Open Sans, Nunito Sans (humanist)
- **Accent**: Handwritten script for occasional flair

### Variable Fonts
- Use weight axis for responsive font-weight (wght 400-700)
- Use width axis for condensed headers in tight spaces
- Animate font-variation-settings for "breathing" text effects

### Web Font Loading
- Use `font-display: swap` to prevent invisible text
- Subset fonts to required character sets
- Preload critical font weights (headings weight)

---

## 3. Kinetic & Animated Typography

### Entrance Animations
- **Fade + Rise**: `opacity 0->1, translateY(30px->0)`, duration 600ms, ease-out
- **Stagger children**: Each line/word delays by 80-120ms
- **Clip reveal**: Text revealed by expanding clip-path or sliding mask
- **Typewriter**: Character-by-character reveal for code/tech feel
- **Blur in**: `filter: blur(8px)` to `blur(0)` for ethereal entrances

### Scroll Typography
- **Text scale on scroll**: Heading grows/shrinks with scroll position
- **Color shift**: Text changes color as it crosses viewport center
- **Split parallax**: Individual letters move at different speeds
- **Opacity fade**: Text fades as it nears viewport edge
- **Sticky tracking**: Fixed text that changes content on scroll (scrollytelling)

### Hover Typography
- **Letter spacing expand**: `letter-spacing: 0 -> 0.05em` on hover
- **Underline draw**: Border-bottom animates width 0% -> 100% from left
- **Gradient sweep**: Gradient background-position shifts on hover
- **Weight shift**: Variable font weight increases on hover (400 -> 600)

### Text as Texture
- **Text masking**: Video or gradient clipped inside text shape
- **Outlined text**: `-webkit-text-stroke: 1px black; color: transparent;`
- **Text shadow layers**: Multiple offset shadows creating 3D extrusion
- **Glitch effect**: RGB channel split + skew for cyber aesthetic

---

## 4. Micro-Interactions

### Button Interactions
- **Hover**: `translateY(-1px)`, shadow elevation +1, 200ms ease-out
- **Active/Press**: `translateY(1px)`, shadow elevation -1, 100ms ease-in
- **Loading**: Width morphs to circle, spinner appears, text fades
- **Success**: Checkmark draws via SVG stroke-dashoffset, green pulse
- **Magnetic**: Button subtly follows cursor within 20px radius (CSS transform on :hover area)

### Form Interactions
- **Focus**: Border color transition to primary + subtle glow shadow (0 0 0 3px primary at 20%)
- **Label float**: Placeholder transitions to top-left label on focus/fill
- **Validation**: Green check or red X fades in with 200ms; shake on error (translateX +/- 4px, 3 cycles)
- **Toggle switch**: Knob slides with spring physics; background color transition
- **Checkbox**: Check draws with SVG path animation; subtle scale pop (1.0 -> 1.15 -> 1.0)

### Card Interactions
- **Hover lift**: `translateY(-4px)` + shadow increase + border color shift
- **Image zoom**: Inner image scales 1.05 with overflow hidden on card
- **Info reveal**: Overlay slides up from bottom on hover
- **3D tilt**: Card rotates slightly based on cursor position (perspective 1000px, rotateX/Y +/- 5deg)

### Navigation Interactions
- **Active indicator**: Underline or pill slides between items (layout animation)
- **Mega menu**: Fade + slight slide down; stagger child links
- **Hamburger**: Lines morph to X with rotate + scale transforms
- **Scroll spy**: Active section highlight transitions smoothly

### Feedback Micro-Interactions
- **Toast notification**: Slide in from edge + progress bar countdown + swipe dismiss
- **Badge pulse**: New notification dot scales 0->1 with spring + subtle pulse loop
- **Skeleton loading**: Shimmer gradient sweeps across placeholder blocks
- **Confetti**: Burst of particles on major success (checkout, signup)
- **Cursor**: Custom cursor that scales on clickable elements

---

## 5. Scroll & Parallax Effects

### Parallax Types
- **Layered depth**: Background moves 0.2x, midground 0.5x, foreground 1.0x scroll speed
- **Reveal parallax**: Image fixed until container scrolls past, then releases
- **Text parallax**: Headings move slower than body, creating depth separation
- **Horizontal scroll**: Vertical scroll translates to horizontal movement for gallery sections

### Scroll-Triggered Animations
- **Intersection Observer**: Trigger at 20% visibility for entrance animations
- **Progress bars**: Width tied to scroll position within container
- **Number counters**: Count up when scrolled into view
- **Line draw**: SVG paths draw themselves as user scrolls
- **Fade sections**: Each section fades in as it enters viewport

### Smooth Scrolling
- `scroll-behavior: smooth` for anchor links
- Lenis or Locomotive Scroll for momentum/inertia scrolling
- Pin sections for scrollytelling (GSAP ScrollTrigger)

### Scroll Progress
- Thin bar at top: `position: fixed`, width = scroll percentage
- Circular indicator: SVG stroke-dashoffset animated by scroll
- Section dots: Active dot scales up, inactive dots fade

---

## 6. Animation Timing & Easing

### Duration Guidelines
| Type | Duration | Notes |
|------|----------|-------|
| Micro-feedback | 100-200ms | Button press, toggle, checkbox |
| Hover transitions | 200-300ms | Color, shadow, transform changes |
| UI state change | 300-400ms | Modal open, tab switch, menu |
| Page transition | 400-600ms | Route change, full-screen overlay |
| Entrance animation | 500-800ms | Elements appearing on load/scroll |
| Ambient loop | 8-20s | Background gradient shift, floating elements |

### Easing Functions
| Name | Value | Use Case |
|------|-------|----------|
| Linear | linear | Progress bars, continuous rotation |
| Ease | ease | General purpose, balanced |
| Ease-out | ease-out | Entrances (fast start, gentle stop) |
| Ease-in | ease-in | Exits (gentle start, fast exit) |
| Ease-in-out | ease-in-out | Symmetric transitions (hovers) |
| Spring | cubic-bezier(0.34, 1.56, 0.64, 1) | Playful bouncy effects |
| Smooth decel | cubic-bezier(0.22, 1, 0.36, 1) | Premium entrances (Apple-style) |
| Dramatic | cubic-bezier(0.87, 0, 0.13, 1) | Hero reveals, impactful moments |

### Stagger Patterns
- **Rapid**: 50ms between items (dense lists, quick feel)
- **Standard**: 100-150ms (card grids, nav items)
- **Dramatic**: 200-300ms (hero elements, storytelling)
- **Cascading**: Duration increases per item (first fast, last slow)

### Performance Rules
- **Animate only**: transform and opacity (GPU-accelerated)
- **Avoid**: width, height, top, left, margin, padding animations
- **will-change**: Apply before animation, remove after
- **Reduced motion**: Respect `prefers-reduced-motion`; provide instant-state fallbacks
- **60fps target**: Any jank destroys premium feel

### 3D Element Motion
- **Floating**: translateY +/- 10px with sine wave, 4-6s loop
- **Orbit**: rotate around center point slowly (20-40s)
- **Mouse tilt**: rotateX/Y based on cursor position, max 10deg, smooth lerp
- **Scroll rotate**: element rotates based on scroll progress
- **Breathing**: scale 1.0 -> 1.03 -> 1.0, 6-8s loop
