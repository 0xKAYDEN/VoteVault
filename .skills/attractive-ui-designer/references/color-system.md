# Color System

## Table of Contents
1. Color Theory for Digital UI
2. Premium Color Palettes
3. Gradient Systems
4. Color Mixing & Harmony
5. Dark Mode Color Adaptation
6. Accessibility & Contrast

---

## 1. Color Theory for Digital UI

### Digital-First Color Relationships
- **Complementary**: Opposite on wheel (Blue/Orange, Purple/Yellow) — high energy, use 70/30 or 80/20 ratio
- **Analogous**: Adjacent on wheel (Teal/Blue/Indigo) — calming, cohesive, great for dashboards
- **Triadic**: Equally spaced (Red/Yellow/Blue) — vibrant, balanced; pick one dominant, two accents
- **Split-Complementary**: Base + two adjacent to its complement — dynamic but less jarring
- **Monochromatic**: Single hue with varying lightness/saturation — sophisticated, safe, modern
- **Tetradic**: Four colors in rectangle on wheel — rich, complex; needs clear hierarchy

### Temperature Psychology
| Temperature | Feelings | Best For |
|-------------|----------|----------|
| Warm (red-orange-yellow) | Energy, urgency, appetite, warmth | CTAs, food, fitness, alerts |
| Cool (blue-green-purple) | Trust, calm, focus, professionalism | Tech, finance, health, SaaS |
| Neutral (gray-beige-brown) | Balance, sophistication, timelessness | Luxury, editorial, architecture |

### Saturation Strategy
- **High saturation** (80-100%): CTAs, alerts, badges, primary buttons — demands attention
- **Medium saturation** (40-70%): Backgrounds, cards, secondary elements — readable, friendly
- **Low saturation** (10-35%): Page backgrounds, dividers, disabled states — subtle, elegant
- **Desaturated + vibrant accent**: Most premium SaaS formula — think Linear, Notion, Vercel

---

## 2. Premium Color Palettes

### Dark Mode Power Palettes
**Midnight Tech**
- Background: #0A0A0F (near-black with blue undertone)
- Surface: #13131F (elevated cards)
- Primary: #6366F1 (indigo)
- Secondary: #22D3EE (cyan)
- Accent: #F472B6 (pink)
- Text primary: #F8FAFC (off-white)
- Text secondary: #94A3B8 (slate)

**Neon Cyber**
- Background: #050505
- Surface: #111111
- Primary: #00F0FF (electric cyan)
- Secondary: #FF00AA (hot magenta)
- Accent: #BFFF00 (acid lime)
- Glow: #00F0FF at 30% opacity

**Deep Ocean**
- Background: #020617 (navy-black)
- Surface: #0F172A
- Primary: #3B82F6 (ocean blue)
- Secondary: #06B6D4 (teal)
- Accent: #F59E0B (amber)
- Text: #E2E8F0

### Light Mode Elegance Palettes
**Soft SaaS**
- Background: #FAFBFC (warm gray-white)
- Surface: #FFFFFF
- Primary: #4F46E5 (indigo)
- Secondary: #0EA5E9 (sky)
- Accent: #F43F5E (rose)
- Text: #1E293B (slate-800)
- Border: #E2E8F0

**Clay Pastel**
- Background: #FDF6F0 (cream)
- Surface: #FFFFFF
- Primary: #FFB7B2 (coral)
- Secondary: #B5EAD7 (mint)
- Accent: #FFDAC1 (peach)
- Text: #5D5D5D (warm gray)
- Shadow tint: rgba(255,183,178,0.2)

**Editorial Minimal**
- Background: #F5F5F0 (warm paper)
- Surface: #FFFFFF
- Primary: #1A1A1A (near-black)
- Secondary: #D4AF37 (gold)
- Accent: #8B0000 (deep red)
- Text: #2D2D2D
- Use sparingly, high contrast

### Luxury / Premium Palettes
**Obsidian Gold**
- Background: #0D0D0D
- Surface: #1A1A1A
- Primary: #D4AF37 (gold)
- Secondary: #C0C0C0 (silver)
- Accent: #8B0000 (deep burgundy)
- Text: #E5E5E5
- Gradients: Gold to copper linear

**Platinum**
- Background: #F8F9FA
- Surface: #FFFFFF
- Primary: #495057 (charcoal)
- Secondary: #ADB5BD (platinum)
- Accent: #212529 (ink)
- Use space, typography, and subtle shadows as primary design tools

---

## 3. Gradient Systems

### Aurora Gradient (Northern Lights)
- **Method**: Multiple blurred shapes (ellipses) layered at 30-50% opacity
- **Colors**: 3-5 colors blending seamlessly — cool to warm transitions (blue -> purple -> pink -> peach)
- **Animation**: Slow drift (20-60s loop) of background-position or shape movement
- **Placement**: Hero backgrounds, login screens, empty states
- **Dark mode**: Saturated colors on black; Light mode: Pastel colors on white
- **Recipe**: Create 3 absolute divs with `border-radius: 50%; filter: blur(80px);`, animate translate

### Mesh Gradient
- **Method**: Freeform color points connected by bezier curves (SVG mesh or CSS conic)
- **Complexity**: 4-8 color anchor points
- **Feel**: Artistic, organic, premium — like oil paint or silk
- **Best for**: Creative portfolios, brand heroes, music apps
- **CSS approach**: `background: radial-gradient(at 40% 20%, hsla(259,100%,66%,1) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,100%,56%,1) 0px, transparent 50%), ...`

### Shape Blur Gradient
- **Method**: Organic blobs with heavy Gaussian blur layered
- **Advantage**: Easier than mesh, more controlled than aurora
- **Colors**: 2-4 colors, overlapping at edges
- **Animation**: Slow scale/pulse of individual blobs (8-15s)
- **Best for**: App backgrounds, card fills, soft atmospheres

### Linear Gradients (Modern Usage)
- **Direction**: 135deg (diagonal) is most dynamic; 180deg (top-bottom) safest
- **Stops**: 2-3 stops max for UI; 4+ for artistic backgrounds
- **Opacity variation**: Start at 100%, end at 0% for overlays on images
- **Use for**: Buttons, text fills, card overlays, section dividers

### Gradient Text
- **CSS**: `background: linear-gradient(90deg, #6366F1, #EC4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent;`
- **Best on**: Large headlines, hero text, brand statements
- **Pair with**: Subtle drop shadow for readability: `text-shadow: 0 2px 10px rgba(0,0,0,0.1)`
- **Dark mode**: Brighter gradient endpoints needed for contrast

### Border Gradients
- **Method**: `background: linear-gradient(...)` on wrapper + `mask` or `background-clip: padding-box` with inner solid fill
- **Animated border**: Conic-gradient rotating creates "border shimmer"
- **Use for**: Featured cards, premium tiers, active states

### Gradient Meshes for Dark UI
- Combine with `mix-blend-mode: screen` or `overlay` on dark backgrounds
- Colors appear to emit light rather than reflect it
- Cyan (#00F0FF), Magenta (#FF00AA), and Purple (#B026FF) create electric atmosphere on black

---

## 4. Color Mixing & Harmony

### The 60-30-10 Rule
- **60%** dominant: Backgrounds, large surfaces
- **30%** secondary: Cards, sections, sidebars
- **10%** accent: Buttons, links, badges, highlights

### Color Functional Roles
| Role | Purpose | Saturation |
|------|---------|------------|
| Primary | Main brand, key actions | High |
| Secondary | Supporting info, tags | Medium |
| Tertiary | Hints, meta, captions | Low |
| Success | Completion, positive | Medium-High (green/blue) |
| Warning | Caution, pending | Medium-High (amber/orange) |
| Error | Failure, critical | High (red/coral) |
| Info | Neutral tips, help | Medium (blue/cyan) |

### Creating Depth with Color
- **Light mode**: Darker colors advance; lighter colors recede
- **Dark mode**: Brighter/lighter colors advance; darker colors recede
- **Atmospheric perspective**: Elements further back are lower contrast, more desaturated, bluer
- **Overlap shadows**: When cards overlap, the one beneath darkens 5-10%

### Tinted Shadows & Highlights
- Shadows tinted with complement or adjacent color (not pure black)
- Example: Blue UI element -> shadow in deep blue-purple; highlight in light cyan
- Creates harmonious depth vs harsh grayscale shadows

---

## 5. Dark Mode Color Adaptation

### Principles
- **Don't just invert**: Light mode shadows become glows in dark mode
- **Elevation = lightness**: In light mode, elevated elements are lighter; in dark mode, elevated elements are lighter too (surface: #1A1A1A vs background #0A0A0A)
- **Desaturate**: Pure colors can vibrate on dark backgrounds; reduce saturation 10-20%
- **Increase contrast**: Dark mode needs slightly higher contrast ratios (aim for 7:1, not just 4.5:1)
- **Blue shift**: Dark mode backgrounds should have slight blue undertone (#0F172A not #1A1A1A) to reduce eye strain

### Dark Mode Palette Structure
```
Background:       #020617 (deepest)
Surface-1:        #0F172A (cards, primary containers)
Surface-2:        #1E293B (elevated cards, hover states)
Surface-3:        #334155 (popovers, menus)
Border:           #334155 or rgba(255,255,255,0.1)
Text-primary:     #F8FAFC
Text-secondary:   #94A3B8
Text-tertiary:    #64748B
Accent-primary:   #6366F1
Accent-secondary: #22D3EE
```

---

## 6. Accessibility & Contrast

### WCAG Compliance
- **AA Normal**: 4.5:1 for text < 18pt
- **AA Large**: 3:1 for text >= 18pt or bold >= 14pt
- **AAA Normal**: 7:1 (ideal for premium readability)
- **UI Components**: 3:1 for graphical elements and interactive borders

### Testing Contrast on Gradients
- Ensure text over gradient meets contrast at ALL points
- Add gradient overlay or scrim behind text: `linear-gradient(to top, rgba(0,0,0,0.7), transparent)`
- Safe gradient text: Use dark gradient on light bg, or vice versa; avoid mid-tone grays in gradient

### Color Blindness Considerations
- Never rely on color alone for status (always pair with icon or text)
- Red-green confusion most common; use blue/orange or purple/yellow for critical distinctions
- Test with simulators: Protanopia, Deuteranopia, Tritanopia
- Pattern/texture overlays on colored elements for data visualization
