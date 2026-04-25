# Directus Implementation Plan - Kastell Breizh

## Executive Summary

This document outlines the implementation plan for migrating Kastell Breizh from static HTML files to a dynamic, database-driven architecture using **Directus** as the headless CMS/backend.

**Timeline Estimate:** 4-6 weeks  
**Complexity:** Medium  
**Benefits:** Admin UI out-of-the-box, REST/GraphQL APIs auto-generated, role-based permissions, built-in file management

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER LAYER                           │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Public     │  │   Admin      │  │   New Property   │  │
│  │   Website    │  │   Dashboard  │  │   Submission     │  │
│  │              │  │   (Directus) │  │   Form           │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
└─────────┼────────────────┼───────────────────┼────────────┘
          │                │                   │
          ▼                ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                      DIRECTUS INSTANCE                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Content    │  │   Files     │  │   Authentication    │ │
│  │  API        │  │   API       │  │   & Permissions     │ │
│  │  (REST/     │  │  (Images)   │  │                     │ │
│  │  GraphQL)   │  │             │  │                     │ │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────┘ │
└─────────┼────────────────┼─────────────────────────────────┘
          │                │
          ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA STORAGE LAYER                       │
│  ┌─────────────────────┐  ┌─────────────────────────────┐  │
│  │   PostgreSQL        │  │   Cloudinary / S3           │  │
│  │   (Property data,   │  │   (Property images,         │  │
│  │    bookings, users) │  │    documents)               │  │
│  └─────────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Headless CMS** | Directus 10.x | Backend, admin panel, APIs |
| **Database** | PostgreSQL 14+ | Primary data store |
| **File Storage** | Cloudinary | Image CDN, optimization, resizing |
| **Frontend Hosting** | Netlify/Vercel | Static site hosting (current HTML files) |
| **Backend Hosting** | Railway/Render | Directus instance hosting |
| **Email Service** | SendGrid | Transactional emails |
| **DNS** | Cloudflare | Custom domain, SSL, caching |

---

## 2. Data Model Design (Directus Collections)

### 2.1 Collection: `properties`

**Purpose:** Store all property information

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID (Primary Key) | Auto-generated |
| `slug` | String (Unique) | URL-friendly ID: 'kerollivier', 'saint-guy' |
| `name` | String | Property display name |
| `subtitle` | String | Short tagline |
| `location` | String | Full location text |
| `description` | Text (WYSIWYG) | Full HTML description |
| `short_description` | Text | Card/list view summary (150 chars) |
| `price_per_night` | Integer | Base price in EUR |
| `cleaning_fee` | Integer | Fixed cleaning fee |
| `capacity` | Integer | Max guests |
| `beds` | Integer | Number of bedrooms |
| `baths` | Integer | Number of bathrooms |
| `rating` | Decimal (3,2) | Average rating (e.g., 4.96) |
| `review_count` | Integer | Number of reviews |
| `badge` | String | Display badge text |
| `badge_class` | String | CSS class for styling |
| `latitude` | Decimal (10,8) | Map coordinate |
| `longitude` | Decimal (11,8) | Map coordinate |
| `published` | Boolean | Visibility toggle |
| `status` | String (Dropdown) | 'active', 'pending', 'archived' |
| `owner_name` | String | Property owner contact |
| `owner_email` | String | Owner email |
| `owner_phone` | String | Owner phone |
| `occupancy_rate` | Integer | % occupancy (for dashboard stats) |
| `ytd_revenue` | Integer | Year-to-date revenue |
| `next_booking_date` | Date | Next upcoming booking |
| `created_at` | Timestamp | Auto |
| `updated_at` | Timestamp | Auto |

**Relationships:**
- One-to-Many: `properties` → `property_images`
- One-to-Many: `properties` → `bookings`
- One-to-Many: `properties` → `amenities` (junction table)

### 2.2 Collection: `property_images`

**Purpose:** Store property photos with ordering

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Auto-generated |
| `property_id` | UUID (Foreign Key) | Link to properties |
| `directus_files_id` | UUID | Link to Directus file system |
| `sort_order` | Integer | Display order (0, 1, 2...) |
| `is_main` | Boolean | Featured image flag |
| `alt_text` | String | Accessibility text |
| `created_at` | Timestamp | Auto |

**Notes:**
- Uses Directus built-in file upload handling
- Images stored in Cloudinary via Directus storage adapter
- Automatic thumbnail generation

### 2.3 Collection: `amenities`

**Purpose:** Master list of available amenities

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Auto-generated |
| `name` | String | Display name: 'WiFi', 'Parking' |
| `icon_class` | String | Font Awesome class: 'fas fa-wifi' |
| `category` | String | Group: 'basic', 'comfort', 'luxury' |
| `sort_order` | Integer | Display order |

### 2.4 Collection: `property_amenities` (Junction)

**Purpose:** Many-to-Many relationship

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Auto-generated |
| `property_id` | UUID (FK) | Link to property |
| `amenity_id` | UUID (FK) | Link to amenity |

### 2.5 Collection: `property_submissions`

**Purpose:** New property owner applications

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Auto-generated |
| `owner_name` | String | Applicant name |
| `owner_email` | String | Contact email |
| `owner_phone` | String | Contact phone |
| `property_name` | String | Proposed property name |
| `property_type` | String | Dropdown: 'manoir', 'gite', 'villa' |
| `property_address` | Text | Full address |
| `capacity` | Integer | Estimated capacity |
| `message` | Text | Owner's message |
| `status` | String | 'pending', 'approved', 'rejected' |
| `submitted_at` | Timestamp | Auto |
| `reviewed_at` | Timestamp | When admin reviewed |
| `reviewed_by` | UUID (FK) | Admin user ID |
| `rejection_reason` | Text | If rejected |

### 2.6 Collection: `bookings`

**Purpose:** Reservation data

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Auto-generated |
| `booking_reference` | String (Unique) | 'KB-2601' format |
| `property_id` | UUID (FK) | Link to property |
| `guest_name` | String | Primary guest |
| `guest_email` | String | Contact email |
| `guest_phone` | String | Contact phone |
| `checkin_date` | Date | Arrival |
| `checkout_date` | Date | Departure |
| `guest_count` | Integer | Number of guests |
| `nights` | Integer | Calculated |
| `base_price` | Integer | Night × rate |
| `cleaning_fee` | Integer | Fixed fee |
| `extras_total` | Integer | Add-ons |
| `total_amount` | Integer | Grand total |
| `status` | String | 'confirmed', 'pending', 'cancelled', 'completed' |
| `extras` | JSON | Array of selected services |
| `special_requests` | Text | Guest notes |
| `created_at` | Timestamp | Auto |

### 2.7 Collection: `admin_users`

**Purpose:** Built-in Directus users collection (extended)

Uses Directus native `directus_users` with custom fields:

| Custom Field | Type | Notes |
|--------------|------|-------|
| `role_type` | String | 'admin', 'concierge', 'owner' |
| `phone` | String | Contact number |
| `notification_email` | Boolean | Receive email alerts |

---

## 3. Directus Configuration

### 3.1 Roles & Permissions

**Role 1: Administrator (Conciergerie)**
- Full CRUD on all collections
- Can publish/unpublish properties
- Can approve/reject submissions
- Access to all bookings
- Can manage other users

**Role 2: Property Owner**
- Read-only their own properties
- Read-only their own bookings
- Cannot publish/unpublish
- Can update property description (with admin approval workflow)

**Role 3: Public (Anonymous)**
- Read published properties only
- Read published property images
- Create submissions (property applications)
- No access to bookings

### 3.2 Interface Customization

**Properties Collection Layout:**
```
┌─────────────────────────────────────────────┐
│  [Header: Property Name, Published Toggle]  │
├─────────────────────────────────────────────┤
│  ┌──────────┐  ┌─────────────────────────┐  │
│  │  Main    │  │  Basic Info             │  │
│  │  Image   │  │  - Slug                 │  │
│  │          │  │  - Name                 │  │
│  │          │  │  - Subtitle             │  │
│  │          │  │  - Location             │  │
│  └──────────┘  │  - Coordinates (Map)    │  │
│                └─────────────────────────┘  │
├─────────────────────────────────────────────┤
│  [Gallery: Draggable Image Grid]            │
├─────────────────────────────────────────────┤
│  [Description: Rich Text Editor]            │
├─────────────────────────────────────────────┤
│  [Pricing & Capacity Section]               │
├─────────────────────────────────────────────┤
│  [Amenities: Checkbox Grid]                 │
├─────────────────────────────────────────────┤
│  [Owner Info Section]                       │
├─────────────────────────────────────────────┤
│  [Statistics: Occupancy, Revenue, etc.]     │
└─────────────────────────────────────────────┘
```

**Custom Module: Dashboard**
- Widget: Pending submissions count
- Widget: Recent bookings
- Widget: Revenue this month
- Widget: Occupancy rates by property

---

## 4. Migration Strategy

### 4.1 Current State Inventory

**Files to Migrate:**
1. Property data from `properties.html` (PROPERTIES_MAP_DATA array)
2. Property images from `images/properties/{id}/`
3. Static content from `property-detail.html`
4. Owner data from `dashboard.html` (MY_PROPS, ADMIN_PROPS)

### 4.2 Migration Steps

**Step 1: Data Extraction**
- Create JSON export of all hardcoded property data
- Normalize image paths to new structure
- Create mapping: old ID → new UUID

**Step 2: Directus Setup**
- Create collections with field types
- Configure relationships
- Set up roles and permissions
- Configure Cloudinary storage adapter

**Step 3: Data Import**
- Use Directus SDK or API to seed data
- Upload images via API (preserving order)
- Set main image flag for first image of each property
- Link amenities via junction table

**Step 4: Validation**
- Compare migrated data to source
- Test all API endpoints
- Verify image URLs and thumbnails
- Check permissions for each role

### 4.3 Rollback Plan

- Keep current static files in `backup/` directory
- Maintain `PROPERTIES_MAP_DATA` as fallback
- Implement feature flag: `window.USE_API = true/false`
- If issues, revert to static data in < 1 hour

---

## 5. Frontend Integration Plan

### 5.1 API Client Setup

**New File: `js/api.js`**
```javascript
// Centralized API client for Directus
const API_BASE = 'https://api.kastellbreizh.fr';
const API_TOKEN = localStorage.getItem('kb_api_token');

class KastellAPI {
    // Public endpoints
    static async getProperties(filters = {}) { }
    static async getProperty(slug) { }
    static async getPropertyImages(propertyId) { }
    static async submitPropertyApplication(data) { }
    
    // Admin endpoints (require auth)
    static async updateProperty(id, data) { }
    static async uploadImage(propertyId, file) { }
    static async togglePublish(id, published) { }
    static async getSubmissions() { }
    static async approveSubmission(id) { }
}
```

### 5.2 Page-by-Page Changes

#### properties.html
**Current:** Hardcoded `PROPERTIES_MAP_DATA` array  
**New:** Fetch from API on load

```javascript
// BEFORE
const PROPERTIES_MAP_DATA = [/* hardcoded */];

// AFTER
async function loadProperties() {
    const response = await fetch(`${API_BASE}/items/properties?filter[published][_eq]=true`);
    const { data } = await response.json();
    return data;
}
```

**Changes:**
- Remove hardcoded data array
- Add loading spinner during fetch
- Add error state ("Unable to load properties")
- Cache results in sessionStorage for performance

#### property-detail.html
**Current:** Hardcoded property object  
**New:** Fetch by slug from URL

```javascript
// BEFORE
const property = PROPERTIES[propertyId];

// AFTER
async function loadProperty(slug) {
    const response = await fetch(
        `${API_BASE}/items/properties?filter[slug][_eq]=${slug}&fields=*,images.*,amenities.amenity_id.*`
    );
    const { data } = await response.json();
    return data[0];
}
```

**Changes:**
- Parse slug from URL query param
- Fetch property + nested images + amenities
- Handle 404 (property not found)
- Gallery loads from `property.images` array

#### dashboard.html
**Current:** Mock data, local changes lost on refresh  
**New:** Real-time updates via API

**Sections to Update:**

1. **Mes Propriétés Grid**
   - Fetch from `/items/properties?filter[owner_email][_eq]=${userEmail}`
   - Real occupancy/revenue stats from database

2. **Property Edit Modal**
   - Save to `PATCH /items/properties/${id}`
   - Image upload to `POST /files`
   - Then `POST /items/property_images` to link

3. **Admin Property Management**
   - Publish toggle: `PATCH /items/properties/${id}` with `{ published: true/false }`
   - Shows in list immediately when published

4. **Submissions Section**
   - Fetch from `/items/property_submissions?filter[status][_eq]=pending`
   - Approve: `PATCH` status + trigger email + create property record

### 5.3 Authentication Flow

```
User clicks "Espace propriétaire"
        │
        ▼
┌───────────────┐
│  Show Login   │
│   Modal       │
└───────┬───────┘
        │
        ▼
POST /auth/login
(email, password)
        │
        ▼
┌───────────────┐
│  Directus     │
│  validates    │
└───────┬───────┘
        │
        ▼
┌─────────────────────┐
│  Returns:           │
│  - access_token     │
│  - refresh_token    │
│  - user data        │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────┐
│  Store in:           │
│  localStorage.token  │
│  localStorage.user   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Redirect to         │
│  Dashboard           │
│  (now with auth)     │
└──────────────────────┘
```

**Token Refresh:**
- Access tokens expire (e.g., 15 minutes)
- Use refresh token to get new access token
- Implement automatic retry on 401 responses

---

## 6. Email Integration Plan

### 6.1 Trigger Points

| Event | Trigger | Email Recipients | Template |
|-------|---------|------------------|----------|
| New Submission | `property_submissions` created | Admin | "New Property Submission" |
| Submission Approved | Status changed to 'approved' | Owner | "Your Property is Approved" |
| Submission Rejected | Status changed to 'rejected' | Owner | "Update on Your Submission" |
| Property Published | `published` set to true | Owner | "Your Property is Now Live" |
| New Booking | `bookings` created | Admin + Owner | "New Booking Request" |
| Booking Confirmed | Booking status changed | Guest | "Booking Confirmed" |

### 6.2 Implementation Options

**Option A: Directus Hooks (Recommended)**
- Use Directus `items.create` and `items.update` hooks
- Call SendGrid API directly from hook
- Pros: Real-time, reliable, built into backend
- Cons: Requires custom extension code

**Option B: External Cron Job**
- Poll database every 5 minutes for new events
- Send emails from separate service
- Pros: Simpler to implement
- Cons: Delayed, requires separate hosting

**Option C: Zapier/Make.com**
- Directus → Zapier → SendGrid
- Pros: No code, visual workflow
- Cons: Cost, rate limits, external dependency

**Recommended: Option A with Directus Extensions**

### 6.3 Email Templates

Store as HTML files in version control:

```
/templates/
  /emails/
    new-submission-admin.html
    submission-approved-owner.html
    submission-rejected-owner.html
    property-published-owner.html
    new-booking-admin.html
    booking-confirmed-guest.html
```

Use Handlebars for variable substitution:
```html
<!-- new-submission-admin.html -->
<h1>New Property Submission</h1>
<p><strong>From:</strong> {{owner_name}}</p>
<p><strong>Property:</strong> {{property_name}}</p>
<p><a href="{{admin_review_url}}">Review in Admin</a></p>
```

---

## 7. File Storage Configuration

### 7.1 Cloudinary Setup

**Why Cloudinary:**
- Automatic image optimization (WebP conversion)
- Dynamic resizing via URL parameters
- CDN delivery (global edge locations)
- Free tier: 25GB storage, 25GB bandwidth/month
- Directus has built-in storage adapter

**URL Transformation Examples:**
```
Original: https://res.cloudinary.com/kastell/image/upload/v123/kerollivier/main.jpg
Thumbnail (300x200): .../upload/w_300,h_200,c_fill/kerollivier/main.jpg
Web optimized: .../upload/f_webp,q_auto/kerollivier/main.jpg
Gallery (800x600): .../upload/w_800,h_600,c_fit/kerollivier/main.jpg
```

**Directus Configuration:**
```env
# .env
STORAGE_LOCATIONS=cloudinary
STORAGE_CLOUDINARY_DRIVER=cloudinary
STORAGE_CLOUDINARY_ROOT=properties
STORAGE_CLOUDINARY_CLOUD_NAME=kastell
STORAGE_CLOUDINARY_API_KEY=xxx
STORAGE_CLOUDINARY_API_SECRET=xxx
```

### 7.2 Image Upload Flow

```
Admin selects images
        │
        ▼
┌───────────────┐
│ Browser sends │
│ multipart     │
│ form data     │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Directus      │
│ receives      │
│ files         │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Uploads to    │
│ Cloudinary    │
│ (async)       │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Stores URL    │
│ in directus_  │
│ files table   │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Creates       │
│ property_     │
│ images link   │
└───────────────┘
```

---

## 8. Implementation Roadmap

### Phase 1: Infrastructure Setup (Week 1)

**Day 1-2: Development Environment**
- [ ] Install Docker locally
- [ ] Run Directus locally: `docker compose up`
- [ ] Install PostgreSQL client (TablePlus/DBeaver)
- [ ] Create initial database schema

**Day 3-4: Directus Configuration**
- [ ] Create all collections with fields
- [ ] Configure field types and validations
- [ ] Set up relationships (O2M, M2M)
- [ ] Configure roles and permissions
- [ ] Create admin user

**Day 5: File Storage**
- [ ] Create Cloudinary account
- [ ] Configure Directus storage adapter
- [ ] Test image upload flow
- [ ] Verify CDN URLs working

**Deliverable:** Working local Directus instance with all collections configured

### Phase 2: Data Migration (Week 2)

**Day 1-2: Data Preparation**
- [ ] Export current property data to JSON
- [ ] Normalize and validate data structure
- [ ] Create image manifest (file → property mapping)
- [ ] Write migration scripts

**Day 3: Import Properties**
- [ ] Import properties via Directus API
- [ ] Import amenities
- [ ] Create property_amenities junction records
- [ ] Validate imported data

**Day 4: Import Images**
- [ ] Upload images to Cloudinary via API
- [ ] Create property_images records
- [ ] Set sort_order and is_main flags
- [ ] Verify all images accessible via CDN

**Day 5: Testing**
- [ ] Compare migrated data to source
- [ ] Test all Directus interfaces
- [ ] Verify permissions working
- [ ] Document any data issues

**Deliverable:** All current data migrated to Directus, ready for API integration

### Phase 3: API Integration (Week 3)

**Day 1: API Client Setup**
- [ ] Create `js/api.js` with base client
- [ ] Implement public endpoints (getProperties, getProperty)
- [ ] Add error handling and retry logic
- [ ] Set up API token management

**Day 2: properties.html Update**
- [ ] Replace hardcoded data with API calls
- [ ] Add loading states
- [ ] Implement caching (sessionStorage)
- [ ] Test filtering and sorting

**Day 3: property-detail.html Update**
- [ ] Fetch property by slug
- [ ] Load images from API
- [ ] Handle 404 errors
- [ ] Update gallery to use API data

**Day 4: Authentication**
- [ ] Implement login flow
- [ ] Store tokens securely
- [ ] Add token refresh logic
- [ ] Protect admin routes

**Day 5: Dashboard Integration**
- [ ] Fetch properties for logged-in owner
- [ ] Implement property edit (PATCH requests)
- [ ] Implement image upload
- [ ] Test publish/unpublish toggle

**Deliverable:** Frontend fully connected to Directus API, all features working

### Phase 4: Email & Workflows (Week 4)

**Day 1: SendGrid Setup**
- [ ] Create SendGrid account
- [ ] Verify sender domain
- [ ] Create email templates
- [ ] Test email sending

**Day 2: Directus Hooks**
- [ ] Set up extension development environment
- [ ] Create `items.create` hook for submissions
- [ ] Create `items.update` hook for approvals
- [ ] Test hook firing

**Day 3: Email Templates**
- [ ] Design all 6 email templates
- [ ] Implement Handlebars rendering
- [ ] Add template variables
- [ ] Test all email scenarios

**Day 4: Submission Workflow**
- [ ] Create submission form on website
- [ ] Implement submission API endpoint
- [ ] Connect admin approval UI to API
- [ ] End-to-end test workflow

**Day 5: Polish**
- [ ] Add loading spinners
- [ ] Improve error messages
- [ ] Add success notifications
- [ ] Browser testing (Chrome, Firefox, Safari)

**Deliverable:** Complete workflow from submission → approval → published property

### Phase 5: Deployment (Week 5)

**Day 1: Production Directus**
- [ ] Create Railway/Render account
- [ ] Deploy PostgreSQL database
- [ ] Deploy Directus instance
- [ ] Configure production env vars

**Day 2: Production Data**
- [ ] Run migration scripts on production DB
- [ ] Upload images to production Cloudinary
- [ ] Verify all data accessible
- [ ] Create production admin user

**Day 3: Frontend Deployment**
- [ ] Update API_BASE_URL to production
- [ ] Deploy to Netlify/Vercel
- [ ] Configure custom domain
- [ ] Set up SSL certificate

**Day 4: Testing**
- [ ] Full end-to-end testing on production
- [ ] Test all user flows
- [ ] Performance testing (Lighthouse)
- [ ] Security review (CORS, tokens, etc.)

**Day 5: Soft Launch**
- [ ] Enable for 10% of traffic (if applicable)
- [ ] Monitor error logs
- [ ] Collect feedback
- [ ] Fix critical issues

**Deliverable:** Live production system at api.kastellbreizh.fr

### Phase 6: Documentation & Handoff (Week 6)

**Day 1-2: Documentation**
- [ ] Admin user guide (with screenshots)
- [ ] API documentation
- [ ] Deployment runbook
- [ ] Troubleshooting guide

**Day 3: Training**
- [ ] Walkthrough with Anne-Marie/Romuald
- [ ] Practice: Add new property
- [ ] Practice: Approve submission
- [ ] Practice: Edit property details

**Day 4-5: Buffer & Final Polish**
- [ ] Address feedback from training
- [ ] Fix any remaining issues
- [ ] Full system backup
- [ ] Celebrate! 🎉

**Deliverable:** Documented system, trained users, production ready

---

## 9. Testing Strategy

### 9.1 Test Environments

| Environment | URL | Purpose |
|-------------|-----|---------|
| Local | `http://localhost:8055` | Development |
| Staging | `https://staging-api.kastellbreizh.fr` | Pre-production testing |
| Production | `https://api.kastellbreizh.fr` | Live system |

### 9.2 Test Cases

**Public Website:**
- [ ] Homepage loads with all published properties
- [ ] Property detail page shows correct data
- [ ] Gallery displays all images in order
- [ ] Map shows correct location
- [ ] Filtering works (price, capacity)
- [ ] Unpublished properties not visible

**Admin Dashboard:**
- [ ] Login with valid credentials
- [ ] Login rejected with invalid credentials
- [ ] Token refresh works
- [ ] Property edit saves correctly
- [ ] Image upload works
- [ ] Image delete works
- [ ] Image reorder persists
- [ ] Publish toggle updates immediately
- [ ] Unpublished properties visible to admin

**Submission Workflow:**
- [ ] Submit new property application
- [ ] Admin receives email notification
- [ ] Submission appears in admin queue
- [ ] Approve creates new property
- [ ] Owner receives approval email
- [ ] Reject sends rejection email
- [ ] Property not visible until approved

**Edge Cases:**
- [ ] API unavailable (show error message)
- [ ] Large image uploads (test 10MB+ files)
- [ ] Special characters in property names
- [ ] Concurrent edits (last write wins)
- [ ] Slow network (loading states)

---

## 10. Security Considerations

### 10.1 Authentication Security
- Use HTTPS only (enforced)
- Access tokens: 15-minute expiry
- Refresh tokens: 7-day expiry
- Store tokens in httpOnly cookies (if possible) or secure localStorage
- Implement CSRF protection

### 10.2 API Security
- Rate limiting: 100 requests/minute per IP
- CORS: whitelist only kastellbreizh.fr domains
- Input validation on all endpoints
- SQL injection protection (parameterized queries via Directus)
- XSS protection (sanitize HTML in descriptions)

### 10.3 File Upload Security
- Validate file types (jpg, jpeg, png, webp only)
- Maximum file size: 10MB
- Scan for malware (Cloudinary does this)
- Store files outside web root
- Use signed URLs for private files

### 10.4 Admin Security
- Strong password policy (12+ chars, mixed case, numbers, symbols)
- 2FA optional but recommended
- Failed login lockout (5 attempts = 15 min lockout)
- Session timeout after 30 minutes inactivity
- Audit log for all admin actions

---

## 11. Performance Optimization

### 11.1 Frontend Performance
- Cache API responses in sessionStorage (5-minute TTL)
- Lazy load images (Intersection Observer)
- Use Cloudinary transforms for appropriate sizes
- Minimize JavaScript bundle size
- Use CDN for static assets

### 11.2 API Performance
- Enable Directus caching (Redis)
- Use GraphQL for complex queries (single request)
- Implement pagination for large lists
- Database indexing on frequently queried fields

### 11.3 Image Optimization
- Serve WebP format when supported
- Responsive images (srcset for different screen sizes)
- Lazy loading below the fold
- Preload main property image

---

## 12. Backup & Disaster Recovery

### 12.1 Backup Strategy
- **Database:** Daily automated backups (Retained: 30 days)
- **Images:** Cloudinary maintains backups (no action needed)
- **Configuration:** Environment variables in version control

### 12.2 Recovery Procedures
- Database restore: < 1 hour
- Complete rebuild: < 4 hours
- RPO (Recovery Point Objective): 24 hours max data loss
- RTO (Recovery Time Objective): 4 hours

### 12.3 Monitoring
- Uptime monitoring (UptimeRobot/Pingdom)
- Error tracking (Sentry)
- Performance monitoring (Lighthouse CI)
- Database performance (pgHero)

---

## 13. Cost Breakdown (Monthly)

| Service | Plan | Cost |
|---------|------|------|
| **Directus Hosting** | Railway Starter | $5-15 |
| **PostgreSQL** | Railway 1GB | $5-10 |
| **Cloudinary** | Free Tier (25GB) | $0 |
| **SendGrid** | Free (100 emails/day) | $0 |
| **Frontend Hosting** | Netlify Pro | $0 (free tier sufficient) |
| **Domain** | Cloudflare Registrar | $10/year |
| **Monitoring** | Sentry + UptimeRobot | $0 (free tiers) |
| **Total** | | **$10-25/month** |

**Scaling Costs (if needed):**
- Cloudinary: $25/month for 125GB storage
- SendGrid: $15/month for 50,000 emails
- Railway: Scale to $50/month for more resources

---

## 14. Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Directus learning curve | Medium | Medium | Training, documentation, community support |
| Migration data loss | Low | High | Backup, validation, rollback plan |
| Performance issues | Medium | Medium | Caching, CDN, optimization |
| Email deliverability | Medium | Medium | Use SendGrid, SPF/DKIM setup |
| API rate limits | Low | Low | Implement caching, respect quotas |
| Cloudinary costs | Low | Low | Monitor usage, optimize images |
| Security breach | Low | Critical | Follow security best practices, audit logs |

---

## 15. Success Criteria

The implementation is successful when:

1. ✅ Admin can add/edit/delete properties via Directus UI
2. ✅ Property changes reflect on public website within 1 minute
3. ✅ Image uploads work and images display optimized
4. ✅ New property submissions trigger email to admin
5. ✅ Admin can approve/reject submissions
6. ✅ Approved properties appear on website automatically
7. ✅ Publish/unpublish toggle controls visibility
8. ✅ Page load times < 3 seconds
9. ✅ 99.9% uptime (measured over 30 days)
10. ✅ Anne-Marie and Romuald can use system without developer help

---

## 16. Next Steps

**Immediate (This Week):**
1. Review this plan with stakeholders
2. Create accounts: Railway, Cloudinary, SendGrid
3. Set up local development environment
4. Begin Phase 1 (Infrastructure Setup)

**Before Development Starts:**
1. Finalize data model (any field changes?)
2. Confirm email template content
3. Set up project management board (GitHub Issues/Trello)
4. Schedule weekly check-in meetings

**Questions to Resolve:**
- Should we keep the existing dashboard.html UI or use Directus default admin?
- Do you need multi-language support (French/English)?
- Should bookings be stored in Directus or kept manual for now?
- What is the budget ceiling for monthly hosting?

---

## Appendix A: Directus Resources

- **Documentation:** https://docs.directus.io/
- **GitHub:** https://github.com/directus/directus
- **Discord Community:** https://directus.chat/
- **API Reference:** https://docs.directus.io/reference/introduction.html

## Appendix B: Glossary

- **Headless CMS:** Backend system that provides content via API, without a frontend
- **Collection:** Equivalent to a database table in Directus
- **Field:** Equivalent to a database column
- **Item:** Equivalent to a database row/record
- **Hook:** Server-side function triggered by events
- **Storage Adapter:** Interface for file storage (local, S3, Cloudinary, etc.)
- **Junction Table:** Table that enables many-to-many relationships

---

*Document Version: 1.0*  
*Last Updated: 2026-04-25*  
*Author: Development Team*  
*Status: Draft - Awaiting Review*
