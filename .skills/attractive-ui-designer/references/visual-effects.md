# Visual Effects System

## Table of Contents
1. Morphism Family (Glass, Neu, Clay, Liquid, Skeu)
2. Shadow & Depth Systems
3. Glow & Light Effects
4. Glass & Reflection Effects
5. Texture & Noise
6. 3D Object Treatments

---

## 1. Morphism Family

### Glassmorphism
- **Core**: Frosted glass effect using `backdrop-filter: blur()` + semi-transparent backgrounds
- **CSS recipe**: `background: rgba(255,255,255,0.1); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.2);`
- **Borders**: 1px subtle white border at 10-30% opacity creates the glass edge
- **Shadows**: Soft diffuse shadow beneath, `box-shadow: 0 8px 32px rgba(0,0,0,0.1)`
- **Best on**: Vibrant, colorful, or gradient backgrounds where content shows through
- **Dark mode variant**: Use `rgba(0,0,0,0.3)` background with `blur(16px)`, border `rgba(255,255,255,0.05)`
- **Depth stacking**: Multiple glass layers at different blur intensities (8px, 16px, 24px) create hierarchy
- **Avoid**: Busy backgrounds with high-frequency patterns; ensure 4.5:1 contrast for text

### Neumorphism (Soft UI)
- **Core**: Elements appear extruded from or pressed into background using dual shadows
- **Color rule**: Element color must match background almost exactly (monochromatic)
- **Raised element shadow pair**:
  - Light shadow: `inset` false, color lighter than bg (white at 80% opacity), x:-6px y:-6px blur:12px
  - Dark shadow: `inset` false, color darker than bg (black at 20% opacity), x:6px y:6px blur:12px
- **Pressed element shadow pair**:
  - Inner light: `inset` true, white at 50%, x:-4px y:-4px blur:8px
  - Inner dark: `inset` true, black at 15%, x:4px y:4px blur:8px
- **Radius**: Large radii essential (16px-24px minimum); sharp edges destroy the illusion
- **Light source**: Must be consistent across ALL elements (typically top-left)
- **Background**: Off-white (#F0F0F3) or off-black (#1A1A1D) — never pure white or pure black
- **Accessibility risk**: Low contrast; compensate with larger text, bold weights, or accent colors on interactive elements
- **Best for**: Controls, toggles, dials, music players, IoT dashboards

### Claymorphism
- **Core**: Playful 3D elements with soft inflated shapes, like molded clay
- **Shadow**: Single large diffuse shadow dropped diagonally (not dual like neumorphism)
  - `box-shadow: 6px 6px 0px rgba(0,0,0,0.15), 12px 12px 24px rgba(0,0,0,0.08)`
- **Border**: 2-3px solid border in slightly darker shade of element color
- **Colors**: Pastel, muted, friendly palettes — mint, peach, lavender, butter yellow
- **Radius**: Very large (24px-32px), almost bubbly
- **3D feel**: Inner highlight at top-left (white, 20% opacity, no blur) simulates dome reflection
- **Best for**: Creative tools, children's apps, casual gaming, education, friendly SaaS
- **Typography pairing**: Rounded sans-serif (Nunito, Quicksand, Fredoka)

### Liquid Glass (Apple Vision-era)
- **Core**: Multi-layered physical glass with refraction, reflection, and depth response
- **Properties**:
  - Specular highlights that shift with implied light source
  - Edge refraction (content behind bends slightly at glass edges)
  - Translucency varies by context (more opaque when focused, more transparent when idle)
  - Rounded corners that feel "melting" rather than mechanical (concentric with hardware)
- **Implementation layers**:
  - Base: frosted blur (20-40px)
  - Reflection layer: subtle gradient sweep simulating light bounce
  - Depth layer: content behind shifts slightly via transform to simulate refraction
- **Motion**: Elements fluidly morph shape when expanding/collapsing; tab bars shrink on scroll
- **Best for**: Spatial computing prep, premium iOS/macOS apps, futuristic interfaces
- **Contrast requirement**: Higher than standard glassmorphism; add solid backing behind critical text

### Skeuomorphism (Modern Revival)
- **Core**: Real-world material imitation with texture, sheen, and physical accuracy
- **Textures**: Leather grain, brushed metal, fabric weave, paper fiber, plastic gloss
- **Lighting**: Photorealistic highlights and shadows matching material properties
- **Use sparingly**: One or two realistic elements against clean backgrounds; avoid full skeuomorphic UIs
- **Best for**: Luxury brands, music apps (vinyl, tape), note apps (paper), fashion e-commerce

---

## 2. Shadow & Depth Systems

### Shadow Hierarchy (Material Design 3 + Modern Evolution)
| Level | Elevation | Use Case | Shadow Values (light mode) |
|-------|-----------|----------|---------------------------|
| 0 | Flat | Backgrounds, inactive | none |
| 1 | 1dp | Resting cards, switches | `0 1px 3px rgba(0,0,0,0.12)` |
| 2 | 3dp | Raised buttons, thumbnails | `0 3px 6px rgba(0,0,0,0.15)` |
| 3 | 6dp | Floating buttons, dialogs | `0 6px 12px rgba(0,0,0,0.18)` |
| 4 | 12dp | Modals, drawers | `0 12px 24px rgba(0,0,0,0.22)` |
| 5 | 24dp | Full-screen overlays | `0 24px 48px rgba(0,0,0,0.28)` |

### Soft Shadows (Neumorphic / Modern)
- Use `rgba(0,0,0,0.08)` to `rgba(0,0,0,0.15)` for ambient shadows
- Blur radius should be 2x-3x the spread/y-offset
- Layered shadows create realism:
  - Layer 1 (ambient): `0 4px 20px rgba(0,0,0,0.06)` — broad, soft
  - Layer 2 (direct): `0 2px 8px rgba(0,0,0,0.1)` — sharper, closer

### Colored Shadows
- Shadows tinted with brand color at low opacity create harmony
- Example: `0 8px 24px rgba(99,102,241,0.25)` for indigo-themed card
- Use on buttons and CTAs to extend their visual presence
- Never use pure black shadows on colored backgrounds

### Inner Shadows
- Inset shadows create depression, input fields, pressed states
- `box-shadow: inset 0 2px 4px rgba(0,0,0,0.06)` for subtle inset
- Combine with slight border-top highlight for 3D groove effect

### Light Source Consistency
- Define one primary light source (usually top-left or directly above)
- All shadows cast away from light; all highlights face toward light
- In dark mode, light source appears to emanate from UI elements themselves (glow outward)

---

## 3. Glow & Light Effects

### Neon Glow
- Outer glow: `box-shadow: 0 0 10px #color, 0 0 20px #color, 0 0 40px #color`
- Use neon on dark backgrounds only (black, deep navy, dark purple)
- Effective colors: Cyan (#00F0FF), Magenta (#FF00AA), Lime (#39FF14), Electric Purple (#B026FF)
- Pulsing animation: opacity 0.6 -> 1.0 over 2s ease-in-out infinite
- Border glow: 1px solid neon color + outer spread shadow

### Holographic Glow
- Multi-color shifting glow using conic-gradient or CSS hue-rotate animation
- `filter: hue-rotate(360deg)` animated over 8-12s creates rainbow shimmer
- Combine with semi-transparent mesh gradient overlay
- Best on cards, badges, and premium tier indicators

### Ambient Glow (Soft)
- Large diffuse colored light behind elements
- `box-shadow: 0 0 80px 20px rgba(99,102,241,0.3)` — massive blur, large spread
- Creates "aura" effect around important elements
- Use for hero CTAs, featured cards, or primary buttons

### Spotlight / Cursor Glow
- Radial gradient mask following mouse position
- CSS: `radial-gradient(circle at var(--x) var(--y), transparent 150px, black 250px)`
- Reveals content or illuminates cards as cursor approaches
- Spotlight border: gradient border that rotates or follows cursor
- Combine with `mix-blend-mode: screen` for light-dodge effect

### Text Glow
- `text-shadow: 0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(255,255,255,0.4)`
- Gradient text with glow: clip text to gradient, add matching text-shadow
- Neon text: bright color + matching outer glow layers

---

## 4. Glass & Reflection Effects

### Frosted Glass Recipe
```css
.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
}
```
- `saturate()` enhances colors showing through, making glass feel premium
- On Safari, always include `-webkit-backdrop-filter`
- Performance: limit to 3-5 glass elements per viewport

### Reflection / Sheen
- Linear gradient overlay at 10-20% opacity simulating light bounce
- `background-image: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.2) 45%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.2) 55%, transparent 60%)`
- Animate `background-position` for "shimmer" effect on cards
- Best on dark cards, image overlays, and premium badges

### Caustics / Refraction
- Simulate light bending through glass using displaced content behind
- CSS `transform: scale(1.02) translate(-2px, -2px)` on background content inside glass container
- Chromatic aberration: slight RGB channel separation at edges (advanced, use sparingly)

---

## 5. Texture & Noise

### Grain / Film Noise
- Subtle noise overlay at 2-5% opacity adds tactile quality
- CSS: `background-image: url("data:image/svg+xml,...noise..."); opacity: 0.03; pointer-events: none;`
- Use `mix-blend-mode: overlay` or `soft-light`
- Prevents "flat" digital appearance; essential on solid color backgrounds
- Static noise for texture; animated noise (subtle shift) for film-like quality

### Dot Patterns / Dither
- Ordered dither patterns for retro-futuristic aesthetic
- Halftone dots using radial-gradient repeat: `background: radial-gradient(circle, #000 1px, transparent 1.5px); background-size: 8px 8px;`
- Combine with clip-path to contain within shapes

### Mesh / Grid Lines
- Subtle perspective grid lines for depth and tech feel
- CSS repeating-linear-gradient at 5% opacity
- Perspective transform (`perspective(1000px) rotateX(60deg)`) for floor-grid effect
- Color: brand accent at 8-12% opacity

### Noise on Gradients
- Aurora and mesh gradients benefit from grain overlay to reduce banding
- Apply noise as top layer at 3% opacity, `mix-blend-mode: overlay`
- Creates organic, living feel vs sterile digital gradient

---

## 6. 3D Object Treatments

### Abstract 3D Shapes as Decor
- Floating spheres, tori, cubes, and blobs as background/hero decoration
- Metallic finish: gold, silver, chrome with environment reflections
- Glass finish: refractive with caustic light patterns
- Matte finish: soft plastic/clay with rounded edges
- Position: partially off-screen, floating with gentle parallax or drift animation

### Isometric Illustrations
- 30-degree angle projection (isometric) for tech/building/block diagrams
- Flat color + soft shadow beneath each block
- Use for: feature explanations, process flows, dashboard empty states
- Combine with subtle gradient on each face for depth

### 3D Text
- Thick extrusion with beveled edges
- Metallic or glass material
- Perspective camera with slight rotation on mouse move
- Shadow cast onto "floor" plane beneath

### Floating Depth
- Elements at different Z-levels with parallax response to scroll or mouse
- Near elements: move faster, larger, more blur on background
- Far elements: move slower, smaller, sharper
- Creates immersive depth without full 3D engine
