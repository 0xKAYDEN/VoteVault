# Color System Reference

This file contains the color theory and palettes for the Attractive UI Designer skill.

## Table of Contents

1. [Color Theory Fundamentals](#color-theory-fundamentals)
2. [Premium Dark Palettes](#premium-dark-palettes)
3. [Premium Light Palettes](#premium-light-palettes)
4. [Neon Cyberpunk Palettes](#neon-cyberpunk-palettes)
5. [Liquid Glass Palettes](#liquid-glass-palettes)
6. [Obsidian Palettes](#obsidian-palettes)
7. [Trust Palette (AI Ethics)](#trust-palette-ai-ethics)
8. [Gradient Systems](#gradient-systems)
9. [Dark Mode Adaptation](#dark-mode-adaptation)
10. [Accessibility](#accessibility)

---

## 1. Color Theory Fundamentals

### 4px Spacing Base Color Algebra

- **Primary**: Main brand color
- **Secondary**: Supporting color
- **Accent**: Highlight color
- **Neutral**: Backgrounds and text
- **Surface**: Cards and elevated elements
- **Error/Success/Warning**: Feedback colors

### Color Temperature

- **Warm**: Red, Orange, Yellow — Energy, passion, urgency
- **Cool**: Blue, Cyan, Green — Trust, calm, technology
- **Neutral**: Gray, Slate — Balance, restraint

---

## 2. Premium Dark Palettes

### Deep Navy (SaaS Dashboard)

| Role | Color | Hex |
|------|-------|-----|
| Background | Deep Navy | #0A0A1F |
| Surface | Navy | #12122A |
| Surface Elevated | Navy Light | #1A1A35 |
| Primary | Indigo | #6366F1 |
| Accent | Cyan | #22D3EE |
| Text Primary | White | #FFFFFF |
| Text Secondary | Slate | #94A3B8 |
| Border | Slate | #334155 |

### Obsidian Tech

| Role | Color | Hex |
|------|-------|-----|
| Background | Obsidian | #050508 |
| Surface | Charcoal | #0C0C12 |
| Surface Elevated | Dark Gray | #151520 |
| Primary | Electric Blue | #3B82F6 |
| Accent | Cyan | #06B6D4 |
| Text Primary | Off White | #F8FAFC |
| Text Secondary | Gray | #9CA3AF |

### Midnight Finance

| Role | Color | Hex |
|------|-------|-----|
| Background | Deep Blue | #030712 |
| Surface | Blue Gray | #0F172A |
| Primary | Emerald | #10B981 |
| Accent | Amber | #F59E0B |
| Positive | Green | #22C55E |
| Negative | Red | #EF4444 |

---

## 3. Premium Light Palettes

### Soft SaaS

| Role | Color | Hex |
|------|-------|-----|
| Background | Off White | #FAFAFA |
| Surface | White | #FFFFFF |
| Surface Elevated | Pure White | #FFFFFF |
| Primary | Indigo | #4F46E5 |
| Secondary | Violet | #7C3AED |
| Accent | Pink | #EC4899 |
| Text Primary | Slate | #1E293B |
| Text Secondary | Gray | #64748B |
| Border | Light | #E2E8F0 |

### Friendly Clay

| Role | Color | Hex |
|------|-------|-----|
| Background | Warm Gray | #F5F5F0 |
| Surface | Cream | #FAFAF5 |
| Primary | Coral | #F97316 |
| Secondary | Teal | #14B8A6 |
| Accent | Gold | #EAB308 |

---

## 4. Neon Cyberpunk Palettes

### Cyber Cyan

| Role | Color | Hex |
|------|-------|-----|
| Background | Near Black | #050505 |
| Surface | Dark | #0A0A0F |
| Primary | Cyan | #00D4FF |
| Secondary | Magenta | #FF00AA |
| Accent | Acid Lime | #ADFF2F |
| Glow | Cyan Glow | rgba(0, 212, 255, 0.4) |

### Neon Purple

| Role | Color | Hex |
|------|-------|-----|
| Background | Deep Purple | #0A0512 |
| Primary | Electric Purple | #A855F7 |
| Secondary | Hot Pink | #FF1493 |
| Accent | Cyan | #00FFFF |

### Samurai Neon

| Role | Color | Hex |
|------|-------|-----|
| Background | Dark Slate | #0C0C14 |
| Primary | Crimson | #DC143C |
| Secondary | Gold | #FFD700 |
| Accent | Cyan | #00CED1 |
| Surface | Dark Glass | rgba(255,255,255,0.05) |

---

## 5. Liquid Glass Palettes

### Light Mode Liquid

| Role | Color | Usage |
|------|-------|-------|
| Glass BG | rgba(255,255,255,0.1) | Card backgrounds |
| Glass Border | rgba(255,255,255,0.2) | Borders |
| Inner Highlight | rgba(255,255,255,0.3) | Inner shadow |
| Outer Shadow | rgba(0,0,0,0.15) | Drop shadow |

### Dark Mode Liquid (Premium)

| Role | Color | Usage |
|------|-------|-------|
| Glass BG | rgba(0,0,0,0.15-0.22) | Card backgrounds |
| Glass Border | rgba(255,255,255,0.08-0.12) | Borders |
| Inner Highlight | rgba(255,255,255,0.15) | Inner specular |
| Neon Glow | #00D4FF, #FF00AA | Accents |

### Dark Liquid Premium

```css
.liquid-dark-premium {
  background: rgba(10, 10, 20, 0.8);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 
    0 10px 40px rgba(0, 0, 0, 0.4),
    inset 0 2px 4px rgba(255, 255, 255, 0.05);
}
```

---

## 6. Obsidian Palettes

### Obsidian Gold

| Role | Color | Hex |
|------|-------|-----|
| Background | Obsidian | #0A0A0A |
| Surface | Dark | #121212 |
| Primary | Gold | #FFD700 |
| Secondary | Silver | #C0C0C0 |
| Accent | Rose | #FF6B6B |

### Obsidian Silver

| Role | Color | Hex |
|------|-------|-----|
| Background | Obsidian | #0C0C0F |
| Surface | Charcoal | #1A1A20 |
| Primary | Silver | #E5E5E5 |
| Accent | Platinum | #E5E4E2 |

### Industrial Obsidian

| Role | Color | Hex |
|------|-------|-----|
| Background | Graphite | #12151A |
| Surface | Steel | #1E252D |
| Primary | Steel Blue | #4682B4 |
| Accent | Orange | #FF8C00 |

---

## 7. Trust Palette (AI Ethics)

For AI ethics and transparency interfaces.

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Trust Blue | #00D4FF | Trust indicators |
| Cool Blue | #4A90D9 | AI badges |
| Confidence High | #00FF88 | High confidence |
| Warning Amber | #FFAA00 | Bias warnings |
| Success Green | #22C55E | Positive outcomes |
| Error Rose | #FF6666 | Negative/failures |
| Neutral Gray | #6B7280 | Secondary text |

### Implementation

```css
.trust-badge {
  background: rgba(0, 212, 255, 0.15);
  border: 1px solid rgba(0, 212, 255, 0.3);
  color: #00D4FF;
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
}

.confidence-gauge {
  background: linear-gradient(90deg, 
    #00D4FF 0%, 
    #00FF88 50%, 
    #FFAA00 75%, 
    #FF6666 100%
  );
}
```

---

## 8. Gradient Systems

### Aurora (Dark Mode)

```css
.aurora-dark {
  background: 
    radial-gradient(at 40% 20%, rgba(120, 80, 200, 0.4) 0px, transparent 50%),
    radial-gradient(at 80% 0%, rgba(0, 212, 255, 0.3) 0px, transparent 50%),
    radial-gradient(at 0% 50%, rgba(255, 0, 170, 0.2) 0px, transparent 50%),
    radial-gradient(at 80% 50%, rgba(0, 255, 170, 0.2) 0px, transparent 50%),
    #0a0a1a;
}
```

### Aurora (Light Mode)

```css
.aurora-light {
  background: 
    radial-gradient(at 40% 20%, rgba(147, 51, 234, 0.3) 0px, transparent 50%),
    radial-gradient(at 80% 0%, rgba(59, 130, 246, 0.3) 0px, transparent 50%),
    radial-gradient(at 0% 50%, rgba(236, 72, 153, 0.2) 0px, transparent 50%),
    linear-gradient(to bottom, #ffffff, #f8fafc);
}
```

### Mesh Gradient

```css
.mesh-gradient {
  background: 
    radial-gradient(at 25% 25%, rgba(100, 200, 255, 0.4), transparent 50%),
    radial-gradient(at 75% 75%, rgba(255, 100, 200, 0.3), transparent 50%),
    radial-gradient(at 50% 50%, rgba(255, 200, 100, 0.2), transparent 50%),
    #0a0a1a;
}
```

### Spectrum (Creative)

```css
.spectrum {
  background: linear-gradient(
    135deg,
    #667eea 0%,
    #764ba2 25%,
    #f97316 50%,
    #ec4899 75%,
    #8b5cf6 100%
  );
  background-size: 400% 400%;
  animation: spectrum-shift 8s ease infinite;
}

@keyframes spectrum-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

---

## 9. Dark Mode Adaptation

### Core Rules

1. **Desaturate 10-20%**: Pure colors vibrate on dark backgrounds
2. **Lighten backgrounds**: Never pure black (#000)
3. **Increase contrast**: Test 4.5:1 minimum
4. **Add glows**: Neon accents appear to emit light

### Adaptation Formula

```css
/* Light mode */
--primary: #4F46E5;

/* Dark mode - desaturate + lighten */
--primary-dark: color-mix(in srgb, #4F46E5, #1E293B 20%);
--primary-glow: color-mix(in srgb, #4F46E5, transparent 80%);
```

### Background Depth

```css
/* Never use pure black */
--bg-depth-0: #000000;
--bg-depth-1: #050505;
--bg-depth-2: #0A0A0F;
--bg-depth-3: #0F0F15;
--bg-depth-4: #1A1A25;
```

---

## 10. Accessibility

### WCAG Contrast Ratios

| Level | Normal Text | Large Text |
|-------|-----------|----------|
| AAA | 7:1 | 4.5:1 |
| AA | 4.5:1 | 3:1 |

### Contrast Checker Rules

- Text over glass: Always test 4.5:1
- Add scrim if needed: `rgba(0,0,0,0.5)`
- Small text needs higher contrast
- Icons + text = both must meet ratio

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

### High Contrast Mode

```css
@media (prefers-contrast: more) {
  .glass {
    background: rgba(255, 255, 255, 0.95);
    border: 2px solid #000;
  }
}
```

---

## Quick Reference Tables

### Status Colors

| Status | Light Mode | Dark Mode |
|--------|----------|----------|
| Success | #22C55E | #22C55E |
| Warning | #F59E0B | #F59E0B |
| Error | #EF4444 | #EF4444 |
| Info | #3B82F6 | #3B82F6 |

### Interactive States

| State | Light Adjustment | Dark Adjustment |
|-------|----------------|---------------|
| Hover | +10% brightness | +15% brightness |
| Active | -10% brightness | -20% brightness |
| Focus | 2px ring | 2px ring |
| Disabled | 50% opacity | 40% opacity |
