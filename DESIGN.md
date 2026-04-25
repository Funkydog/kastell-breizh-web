# Kastell Breizh - Design System

## Brand Foundation

### Register: Heritage, Authentic, Refined

**Heritage** — Deep respect for Breton history, architecture, and regional character  
**Authentic** — Genuine connections, real local knowledge, transparent service  
**Refined** — Sophisticated without pretension, quality without ostentation

Voice is warm and knowledgeable — like a trusted local friend who happens to be an expert.

### Anti-References

- Generic hotel booking sites (Booking.com, Airbnb) — cold, transactional
- Overly modern/minimal — stark, brutalist, ignores warmth
- Too rustic/countryside cliché — farm imagery, dated bucolic aesthetics
- Corporate real estate — institutional, no personality

---

## Color System

### Primary Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--primary-bg` | `#5a7d9b` | Hero sections, primary brand color (Glaz) |
| `--secondary` | `#749194` | Secondary elements, muted accents |
| `--button` | `#55abc7` | CTAs, interactive elements (Cyan) |
| `--button-hover` | `#3d94b0` | Button hover states |

### Supporting Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--glaz` | `#5a7d9b` | Mapped to primary-bg |
| `--glaz-dark` | `#4a6a85` | Darker accent |
| `--cyan` | `#55abc7` | Mapped to button |
| `--cyan-dark` | `#3d94b0` | Mapped to button-hover |

### Neutral Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--white` | `#FFFFFF` | Pure white |
| `--off-white` | `#FAFAFA` | Page backgrounds |
| `--grey-light` | `#F3F4F6` | Subtle backgrounds |
| `--grey` | `#4B5563` | Muted text |
| `--grey-dark` | `#1F2937` | Dark elements |
| `--text-main` | `#111827` | Primary text |
| `--text-muted` | `#4B5563` | Secondary text |
| `--text-inverse` | `#FFFFFF` | Text on dark backgrounds |

### Legacy Mapping

```css
--navy-blue: #5a7d9b      /* → --primary-bg */
--gold: #55abc7           /* → --button (was gold, now cyan) */
```

---

## Typography

### Font Families

```css
--font-heading: 'Playfair Display', serif;
--font-body: 'Inter', sans-serif;
```

### Type Scale

| Element | Font | Size | Weight | Line Height |
|---------|------|------|--------|-------------|
| H1 (Hero) | Playfair | 3.5rem | 600 | 1.2 |
| H2 | Playfair | 2.5rem | 600 | 1.3 |
| H3 | Playfair | 1.75rem | 600 | 1.4 |
| H4 | Playfair | 1.25rem | 600 | 1.4 |
| Body Large | Inter | 1.125rem | 400 | 1.6 |
| Body | Inter | 1rem | 400 | 1.6 |
| Small | Inter | 0.875rem | 400 | 1.5 |
| Caption | Inter | 0.75rem | 500 | 1.4 |

### Typography Rules

- **Headings:** Playfair Display, navy blue (`--primary-bg`)
- **Body:** Inter, dark gray (`--text-main`)
- **Line Length:** Max 65-75ch for readability
- **Hierarchy:** Use scale + weight contrast (≥1.25 ratio)

---

## Layout

### Container

```css
--container-max: 1200px;
.container {
    width: 100%;
    max-width: var(--container-max);
    margin: 0 auto;
    padding: 0 2rem;
}
```

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| Section padding | `6rem 0` | Major sections |
| Section compact | `4rem 0` | Smaller sections |
| Component gap | `2rem` | Grid gaps |
| Card padding | `2.5rem` | Card interiors |
| Element margin | `1rem` | Between elements |

### Border Radius

```css
--border-radius-sm: 4px;    /* Small elements */
--border-radius-md: 8px;    /* Cards, inputs */
--border-radius-lg: 16px;   /* Large cards, sections */
```

---

## Components

### Buttons

**Primary Button**
```css
.btn-primary {
    background: var(--button);
    color: var(--white);
    padding: 0.875rem 2rem;
    border-radius: var(--border-radius-md);
    font-weight: 600;
    transition: var(--transition-normal);
}
.btn-primary:hover {
    background: var(--button-hover);
    transform: translateY(-2px);
}
```

**Secondary Button**
```css
.btn-secondary {
    background: transparent;
    border: 2px solid var(--white);
    color: var(--white);
}
```

**Outline Button**
```css
.btn-outline {
    background: transparent;
    border: 2px solid var(--glaz);
    color: var(--glaz);
}
```

**Button Sizes**
- Default: `padding: 0.875rem 2rem`
- Large: `padding: 1rem 2.5rem; font-size: 1.125rem`
- Small: `padding: 0.5rem 1rem; font-size: 0.875rem`

### Cards

**Service Card**
```css
.service-detail-card {
    background: var(--white);
    border-radius: var(--border-radius-md);
    padding: 2.5rem;
    box-shadow: var(--shadow-sm);
    transition: var(--transition-normal);
    position: relative;
}
.service-detail-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--button) 0%, var(--button-hover) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
}
.service-detail-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-md);
}
.service-detail-card:hover::before {
    opacity: 1;
}
```

### Navigation

**Desktop Navbar**
- Fixed position, transparent initially
- White background on scroll (`.scrolled` class)
- Logo left, nav center, CTA right
- Dropdown menu for "Nos services" with Propriétaires/Voyageurs

**Mobile Navbar**
- Hamburger menu
- Full-screen overlay
- Stacked links

### Forms

**Input Fields**
```css
input, select, textarea {
    border: 1px solid var(--grey-light);
    padding: 0.75rem 1rem;
    border-radius: var(--border-radius-md);
    font-family: var(--font-body);
    transition: border-color 0.2s ease;
}
input:focus {
    border-color: var(--button);
    outline: none;
}
```

---

## Shadows & Elevation

```css
--shadow-sm: 0 4px 6px rgba(0, 0, 0, 0.05);
--shadow-md: 0 10px 20px rgba(0, 0, 0, 0.08);
--shadow-lg: 0 20px 40px rgba(17, 94, 89, 0.12);
--shadow-text: 0 2px 4px rgba(0, 0, 0, 0.5); /* Text on images */
```

---

## Transitions & Animation

```css
--transition-fast: 0.2s ease;
--transition-normal: 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
```

**Motion Principles:**
- Don't animate layout properties
- Use ease-out with exponential curves
- No bounce, no elastic
- Respect `prefers-reduced-motion`

---

## Image Guidelines

### Hero Images
- Full-width, 50vh height
- Dark overlay: `rgba(90, 125, 155, 0.7)`
- Text shadow for readability

### Property Images
- Aspect ratio: 16:9 or 4:3
- Border radius: `--border-radius-lg`
- Box shadow: `--shadow-md`

### Team Photos
- Circular or rounded square
- Consistent sizing

### Image Optimization
- Max width: 1920px
- Use WebP where possible
- Lazy load below-fold images

---

## Responsive Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Desktop | > 1024px | Full layout |
| Tablet | 768px - 1024px | Adjusted grids |
| Mobile | < 768px | Single column, hamburger menu |
| Small Mobile | < 480px | Compact spacing |

**Mobile Patterns:**
- Navigation becomes hamburger menu
- Service choice cards stack vertically
- Property grid becomes single column
- Font sizes reduce slightly

---

## Page Templates

### Hero Section
```
┌─────────────────────────────────────┐
│  [Navbar - transparent]             │
│                                     │
│     H1 Title                        │
│     Subtitle description            │
│                                     │
│     [CTA Button]                    │
│                                     │
└─────────────────────────────────────┘
Background: Image with blue overlay
```

### Service Page Structure
```
1. Hero with service-specific image
2. Service choice cards (Propriétaires/Voyageurs toggle)
3. Commitments/engagements
4. Service details (grid of cards)
5. Full-width image sections
6. CTA section
7. Footer
```

### Property Listing Page
```
1. Filter bar (sticky)
2. Split view:
   - Left: Property cards (scrollable)
   - Right: Map (sticky)
3. Mobile: Toggle between list/map
```

---

## Accessibility Standards

- WCAG 2.1 AA compliance
- Color contrast: 4.5:1 minimum for text
- Focus indicators on all interactive elements
- Alt text on all images
- Semantic HTML structure
- Keyboard navigation support
- Skip links for main content
- ARIA labels where needed

---

## Content Guidelines

### Voice & Tone

**Do:**
- Warm and knowledgeable
- Professional but approachable
- Clear and concise
- Use "nous" (we) not "je" (I)

**Don't:**
- Overly formal or stiff
- Technical jargon without explanation
- Em dashes (use commas, colons, periods)
- All caps for emphasis

### Copy Patterns

**Headlines:** Clear, benefit-focused  
**Body copy:** Short paragraphs, scannable  
**CTAs:** Action-oriented ("Découvrir", "Réserver", "Contacter")

---

## File References

- **Main Styles:** `index.css`
- **Properties:** `properties.css`
- **Places:** `places.css`
- **Booking:** `booking.css`
- **Product Context:** `PRODUCT.md`
- **Project Guide:** `CLAUDE.md`
