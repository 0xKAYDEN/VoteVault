# Visual Effects Reference

This file contains the visual effects library for the Attractive UI Designer skill. It covers glassmorphism, neumorphism, liquid glass, shadows, glows, textures, 3D treatments, and light physics.

## Table of Contents

1. [Glassmorphism](#glassmorphism)
2. [Neumorphism](#neumorphism)
3. [Claymorphism](#claymorphism)
4. [Liquid Glass (2026)](#liquid-glass-2026)
5. [Dark Glassmorphism](#dark-glassmorphism)
6. [Spatial Design System](#spatial-design-system-2026)
7. [Shadows & Elevation](#shadows--elevation)
8. [Glows & Neon Effects](#glows--neon-effects)
9. [Textures & Backgrounds](#textures--backgrounds)
10. [3D Treatments](#3d-treatments)
11. [AI Ethics Design Layer](#ai-ethics-design-layer)
12. [XAI Visualizations](#xai-visualizations)

---

## 1. Glassmorphism

Classic glass effect with backdrop blur and transparency.

```css
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px) saturate(180%);
  -webkit-backdrop-filter: blur(10px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

### Best Practices

- Use over rich backgrounds (gradients, images, aurora)
- Ensure 4.5:1+ contrast for text
- Limit to 3-5 elements per viewport for performance
- Provide prefers-reduced-motion fallback

---

## 2. Neumorphism

Soft, tactile UI with subtle shadows that create depth.

```css
.neu {
  background: #e0e5ec;
  border-radius: 16px;
  box-shadow: 
    8px 8px 16px #a3b1c6,
    -8px -8px 16px #ffffff;
}
```

### Best Practices

- Best for calm, tactile controls (health/wellness apps)
- Use sparingly due to accessibility risks
- Always test contrast ratios

---

## 3. Claymorphism

Soft, friendly 3D look with inner shadows.

```css
.clay {
  background: linear-gradient(145deg, #f0f0f0, #cacaca);
  border-radius: 20px;
  box-shadow: 
    8px 8px 16px #bebebe,
    -8px -8px 16px #ffffff;
}
```

---

## 4. Liquid Glass (2026)

Apple's flagship dynamic material from WWDC 2025. Features refraction (lensing), adaptive translucency, specular highlights that respond to cursor/motion, and fluid morphing.

### Core Characteristics

- **Lensing & Refraction**: Content behind glass bends/distorts at edges
- **Specular Highlights**: Bright reflections that shift with cursor or device motion
- **Dynamic Translucency**: Opacity/blur adapts based on context
- **Fluidity**: Elements "melt", morph, or ripple during state changes
- **Multi-layered Depth**: Combines backdrop-filter, inner highlights, outer glows, parallax

### Implementation Recipe

```css
.liquid-glass {
  background: rgba(255, 255, 255, 0.10);
  /* Dark mode: rgba(0, 0, 0, 0.15-0.22) */
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.20);
  border-radius: 22px;
  box-shadow: 
    0 10px 40px rgba(0, 0, 0, 0.15),
    inset 0 6px 24px rgba(255, 255, 255, 0.30);
  position: relative;
  overflow: hidden;
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Animated specular shimmer */
.liquid-glass::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%);
  pointer-events: none;
  animation: liquid-shimmer 10-14s linear infinite;
  opacity: 0.65;
}

@keyframes liquid-shimmer {
  0%   { transform: translateX(-150%); }
  100% { transform: translateX(350%); }
}
```

### Variants

- **Regular**: Adaptive, versatile, intelligent legibility
- **Clear**: More transparent for media-rich backgrounds

### Advanced Enhancements

- Cursor-following refraction using `--mouse-x` / `--mouse-y`
- Mouse tilt: `perspective(1200px)` + subtle `rotateX/Y`
- Refraction via SVG filters (`feDisplacementMap`, `feTurbulence`)
- Dark mode: Deep navy/black + neon glows (`mix-blend-mode: screen`)

### Usage Guidelines

- Apply to cards, buttons, panels, navbars, modals
- Always ensure 4.5:1+ contrast for text
- Limit heavy effects for performance
- Provide prefers-reduced-motion fallback

---

## 5. Dark Glassmorphism

Premium moody depth for 2026 with dark backgrounds.

```css
.dark-glass {
  background: rgba(5, 5, 15, 0.7);
  backdrop-filter: blur(24px) saturate(200%);
  -webkit-backdrop-filter: blur(24px) saturate(200%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  box-shadow: 
    0 12px 48px rgba(0, 0, 0, 0.4),
    inset 0 2px 4px rgba(255, 255, 255, 0.05);
}
```

### Color Pairings

- Base: Deep navy (#050510) or Obsidian (#0A0A0F)
- Accents: Cyan (#00D4FF), Magenta (#FF00AA), Acid Lime (#ADFF2F)
- Glow: Use `box-shadow: 0 0 20px rgba(0, 212, 255, 0.3)`

---

## 6. Spatial Design System (2026)

Spatial design bridges 2D screens and spatial computing (visionOS, AR/VR). Depth becomes a functional hierarchy tool.

### Key Techniques

- **Z-Axis Hierarchy**: Important elements advance (sharper focus, stronger highlights), secondary recedes (more blur, lower contrast)
- **Parallax & Floating Layers**: Multiple layers at different speeds create 3D space
- **Adaptive Depth**: Liquid Glass panels adjust translucency based on context
- **3D Interactions**: Mouse-tilt cards, magnetic hover zones
- **Progressive Immersion**: Flat → spatial depth on scroll/focus

### Implementation

```css
.spatial-element {
  perspective: 1200px;
  transform-style: preserve-3d;
}

.spatial-foreground {
  transform: translateZ(20px) scale(0.95);
  filter: blur(0);
}

.spatial-midground {
  transform: translateZ(0);
}

.spatial-background {
  transform: translateZ(-20px) scale(1.05);
  filter: blur(4px);
  opacity: 0.7;
}
```

### Thematic Applications

- **Cyber**: Neon-refracting Liquid Glass + grid overlays
- **Luxury**: Soft Liquid Glass over liquid marble + gold specular
- **Samurai-Cyber**: Asymmetric floating panels

---

## 7. Shadows & Elevation

### Shadow Scale (4px Base)

| Level | Shadow | Usage |
|-------|--------|-------|
| 1 | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| 2 | `0 4px 8px rgba(0,0,0,0.08)` | Cards |
| 3 | `0 8px 16px rgba(0,0,0,0.1)` | Buttons |
| 4 | `0 16px 32px rgba(0,0,0,0.15)` | Modals |
| 5 | `0 24px 48px rgba(0,0,0,0.2)` | Overlays |

### Colored Shadows

```css
.glow-cyan {
  box-shadow: 0 4px 20px rgba(0, 212, 255, 0.4);
}

.glow-magenta {
  box-shadow: 0 4px 20px rgba(255, 0, 170, 0.4);
}

.gold-glow {
  box-shadow: 0 4px 20px rgba(255, 215, 0, 0.3);
}
```

---

## 8. Glows & Neon Effects

### Neon Glow Recipe

```css
.neon-cyan {
  color: #00D4FF;
  text-shadow: 
    0 0 5px #00D4FF,
    0 0 10px #00D4FF,
    0 0 20px #00D4FF,
    0 0 40px #00D4FF;
}

.neon-border {
  border: 1px solid #00D4FF;
  box-shadow: 
    0 0 5px #00D4FF,
    inset 0 0 5px rgba(0, 212, 255, 0.2);
}
```

### Holographic Effect

```css
.holographic {
  background: linear-gradient(
    135deg,
    rgba(255, 0, 170, 0.3),
    rgba(0, 212, 255, 0.3),
    rgba(255, 215, 0, 0.3)
  );
  background-size: 200% 200%;
  animation: holographic-shift 3s ease infinite;
}

@keyframes holographic-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
```

---

## 9. Textures & Backgrounds

### Aurora Gradient

```css
.aurora {
  background: 
    radial-gradient(at 40% 20%, rgba(120, 80, 200, 0.4) 0px, transparent 50%),
    radial-gradient(at 80% 0%, rgba(0, 212, 255, 0.3) 0px, transparent 50%),
    radial-gradient(at 0% 50%, rgba(255, 0, 170, 0.2) 0px, transparent 50%),
    radial-gradient(at 80% 50%, rgba(0, 255, 170, 0.2) 0px, transparent 50%),
    linear-gradient(at 100% 0%, rgba(30, 30, 60, 1) 0%, rgba(10, 10, 20, 1) 100%);
}
```

### Mesh Gradient

```css
.mesh {
  background: 
    radial-gradient(at 25% 25%, rgba(100, 200, 255, 0.4) 0px, transparent 50%),
    radial-gradient(at 75% 75%, rgba(255, 100, 200, 0.3) 0px, transparent 50%),
    radial-gradient(at 50% 50%, rgba(255, 200, 100, 0.2) 0px, transparent 50%),
    #0a0a1a;
}
```

### Grain/Noise Overlay

```css
.noise::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.03;
  pointer-events: none;
}
```

---

## 10. 3D Treatments

### Mouse Tilt Card

```css
.tilt-card {
  perspective: 1200px;
  transform-style: preserve-3d;
}

.tilt-content {
  transform-style: preserve-3d;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tilt-card:hover .tilt-content {
  transform: rotateX(var(--rotate-x, 0deg) rotateY(var(--rotate-y, 0deg));
}
```

### Floating Animation

```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.floating {
  animation: float 4s ease-in-out infinite;
}
```

### Parallax Layer

```css
.parallax-bg {
  transform: translateZ(-50px) scale(1.5);
}

.parallax-mid {
  transform: translateZ(0);
}

.parallax-fg {
  transform: translateZ(50px) scale(0.8);
}
```

---

## 11. AI Ethics Design Layer

Trust-enhancing visual components for ethical AI interfaces.

### Trust Indicators

- **AI Badges**: Small Liquid Glass pill with "AI" label + tooltip
- Trust palette: Soft cyan (#00D4FF), Cool blues (#4A90D9)
- Never hide AI involvement

### Confidence Visualization

```css
.confidence-high {
  background: linear-gradient(90deg, #00D4FF 0%, #00FF88 100%);
}

.confidence-medium {
  background: linear-gradient(90deg, #FFAA00 0%, #FF6600 100%);
}

.confidence-low {
  background: linear-gradient(90deg, #FF4444 0%, #FF6666 100%);
  opacity: 0.7;
}
```

### Ethical Color Language

| Purpose | Color | Hex |
|---------|-------|-----|
| Trust/Transparency | Cool blues | #00D4FF, #4A90D9 |
| Warning/Bias | Amber | #FFAA00 |
| Success | Soft green | #00FF88 |
| Error | Muted rose | #FF6666 |

### Explanation Panels

- Use expandable Liquid Glass panels
- Progressive disclosure for complexity
- Clear, jargon-free language
- Visual aids (flowcharts, highlights)

---

## 12. XAI Visualizations

Explainable AI visualization patterns for premium interfaces.

### SHAP Waterfall (Local Explanation)

```css
.shap-waterfall {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.shap-bar {
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding: 0 12px;
}

.shap-positive {
  background: linear-gradient(90deg, rgba(0, 212, 255, 0.8), rgba(0, 255, 136, 0.6));
}

.shap-negative {
  background: linear-gradient(90deg, rgba(255, 170, 0, 0.6), rgba(255, 100, 100, 0.4));
}
```

### SHAP Beeswarm (Global Overview)

- Dots for each instance
- X-position = SHAP value (impact)
- Color = feature value (low → high)
- Interactive with hover tooltips

### LIME Bar Chart

- Top N features ranked by weight
- Horizontal bars
- Color-coded: Cyan (positive), Amber (negative)

### Attention Heatmap

```css
.attention-high {
  background: rgba(255, 0, 100, 0.4);
}

.attention-medium {
  background: rgba(255, 170, 0, 0.3);
}

.attention-low {
  background: rgba(0, 212, 255, 0.2);
}
```

### Counterfactual Cards

```css
.counterfactual-card {
  background: rgba(255, 170, 0, 0.1);
  border: 1px dashed rgba(255, 170, 0, 0.5);
  border-radius: 12px;
  padding: 16px;
}
```

### Best Practices for XAI UI

1. **Start Simple**: Lead with natural language + one intuitive visual
2. **Build Trust**: Always show confidence level
3. **Enable Agency**: Interactive hover, sliders, regenerate buttons
4. **Avoid Overload**: Spatial layering and progressive disclosure
5. **Ethical Alignment**: Calm bias surfacing, human oversight paths
6. **Performance**: Animate only transforms/opacity
