# Kastell Breizh Conciergerie - Project Guide

## Project Overview

Kastell Breizh Conciergerie is a luxury concierge service website connecting property owners in Brittany with character homes to travelers seeking authentic, unique accommodations.

**Repository:** `C:/Users/alnor/Kastell Breizh/KB-Web-page`  
**Primary Branch:** `main`  
**Current Branch:** `new_upgrades`

---

## Quick Links

| Page | File | Purpose |
|------|------|---------|
| Home | `index.html` | Landing page with hero, services preview, featured properties |
| Services Propriétaires | `services-proprietaires.html` | Owner services (management, rentals, vigilance) |
| Services Voyageurs | `services-voyageurs.html` | Traveler services (stays, experiences) |
| Properties | `properties.html` | Property listings with map |
| Property Detail | `property-detail.html` | Individual property pages |
| Team | `notre-equipe.html` | About the team |
| Region | `places.html` | Local area guide |
| FAQ | `faq.html` | Frequently asked questions |
| Contact | `contact.html` | Contact form |
| Dashboard | `dashboard.html` | Admin property management |

---

## Architecture

### Tech Stack
- **Frontend:** Static HTML5, CSS3, Vanilla JavaScript
- **Styling:** Custom CSS with CSS variables (design tokens)
- **Fonts:** Google Fonts (Playfair Display, Inter)
- **Icons:** Font Awesome 6
- **Maps:** Leaflet.js with OpenStreetMap/CartoDB
- **No Build Step:** Direct file serving

### File Organization
```
/
├── index.html              # Homepage
├── services-*.html         # Service pages (proprietaires, voyageurs)
├── properties.html         # Property listings
├── property-detail.html    # Property detail view
├── notre-equipe.html       # Team page
├── places.html            # Regional guide
├── contact.html           # Contact page
├── faq.html               # FAQ
├── dashboard.html         # Admin dashboard
├── login.html             # Login page
├── booking.html           # Booking flow
├── nos-services.html      # (Legacy - redirect to new)
├── index.css              # Main stylesheet
├── properties.css         # Property-specific styles
├── places.css             # Places page styles
├── booking.css            # Booking styles
├── index.js               # Main JavaScript
├── Logo/                  # Logo assets
├── images/                # Image assets
│   ├── properties/        # Property photos (organized by ID)
│   ├── Photos principales/
│   ├── Photo_libre_droits/
│   └── Banners/
└── Specs/                 # Documentation & specs
```

---

## Design System

See [DESIGN.md](./DESIGN.md) for complete design documentation.

**Key Design Tokens:**
```css
--primary-bg: #5a7d9b      /* Glaz - Breton slate blue */
--button: #55abc7          /* Cyan accent */
--text-main: #111827
--font-heading: 'Playfair Display', serif
--font-body: 'Inter', sans-serif
```

**Brand Register:** Heritage, Authentic, Refined

---

## Common Tasks

### Adding a New Property

1. Create property folder: `images/properties/{property-id}/`
2. Add images: `01-main.jpg`, `02.jpg`, `03.jpg`, etc.
3. Add property data to `properties.html` (PROPERTIES_MAP_DATA array)
4. Add property data to `property-detail.html` (PROPERTIES object)
5. Add property to `dashboard.html` (MY_PROPS array) for admin management

### Updating Navigation

The navbar is consistent across all pages. Key files to update:
- Desktop nav: All HTML files, look for `.nav-links`
- Mobile nav: All HTML files, look for `.mobile-nav-links`
- Dropdown styles: `index.css` (`.dropdown-menu`)

### Modifying Styles

Global styles go in `index.css`. Page-specific styles should be in:
- `<style>` block in the HTML head for single-page styles
- Separate CSS file (e.g., `properties.css`) for complex pages

---

## Important Notes

### Hidden Features (Future Use)
The "Votre séjour en 3 étapes" section in `index.html` is commented out and reserved for when payment integration is implemented.

### Property Image Structure
Property images follow this structure:
```
images/properties/{property-id}/
├── 01-main.jpg    # Primary image
├── 02.jpg         # Gallery images
├── 03.jpg
└── ...
```

### Published vs Unpublished Properties
Properties have a `published: true/false` flag in the data:
- `published: true` - Visible on public pages
- `published: false` - Hidden from listings but accessible via direct URL

### Directus Backend (Planned)
See `Specs/Directus-Implementation-Plan.md` for backend architecture plans.

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari/Chrome (iOS 14+, Android 10+)

---

## Performance Guidelines

- Images should be optimized (WebP where possible, max 1920px width)
- Lazy loading on images below the fold
- CSS is bundled in index.css for caching
- Minimize JavaScript - prefer vanilla JS over libraries

---

## Accessibility Requirements

- WCAG 2.1 AA compliance target
- All images have descriptive alt text
- Keyboard navigation support
- Focus indicators on interactive elements
- Color contrast ratios maintained
- French language primary

---

## Contact & Resources

- **Business:** Kastell Breizh Conciergerie
- **Location:** Pays de Guingamp, Côtes d'Armor, Brittany
- **Contact:** contact@kastellbreizh.fr
- **Phone:** +33 (0)6 51 26 50 93
