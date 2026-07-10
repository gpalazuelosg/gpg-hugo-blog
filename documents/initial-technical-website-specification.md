# Technical Website Specification Document

## Project Overview

A technical website featuring public content (blog, reviews, affiliate links) with private content management capabilities through a headless CMS. The site will be built using Hugo static site generator with either Strapi or Sanity as the backend CMS.

---

## 1. Public Pages

### 1.1 Home Page
- Landing page with overview of site content
- Links to main sections (Blog, Reviews, Affiliate Links)
- Author social links and name display

### 1.2 Blog Articles Listing Page
- Display all published blog articles
- Organized by categories and tags
- Preview of each article (title, summary, featured image, publication date)

### 1.3 Login Page
- Authentication interface to access CMS
- Single user authentication (admin only)

### 1.4 Affiliate Links Listing Page
- Display all affiliate links
- Organized by vendor categories
- Show affiliate description and default image for each link

### 1.5 Review Items Page
- Display all published item reviews
- Organized by categories and tags
- Preview of each review (title, summary, featured image, publication date)
- Reviews for: Books, Software/Apps, Gadgets, Websites

---

## 2. Private Content (CMS)

### 2.1 CMS Selection
**Options:** Strapi or Sanity
- Single user access (admin)
- Content management for blog articles, item reviews, and affiliate links

### 2.2 User Management
- Single user (admin/author)
- Author profile includes:
  - Author name
  - Social links

---

## 3. Content Structure

### 3.1 Blog Articles

#### Fields:
- **Title** (text, required)
- **Summary** (text, required)
- **Body** (rich text, required)
  - Support for code syntax highlighting
  - Support for embedded images/screenshots
- **Article Image** (featured image, required)
- **Image Gallery** (list of images, optional)
- **Categories** (select from predefined list, required)
- **Tags** (multiple selection, optional)
- **Author** (auto-populated)
- **Status** (draft/published, default: draft)
- **Created On** (auto-generated timestamp)
- **Updated On** (auto-generated timestamp)
- **SEO Metadata:**
  - Meta description
  - Keywords
  - Custom URL slug
  - Open Graph image

#### Features:
- Draft status by default
- Ability to change status to published
- Categories and tags for organization
- No comments functionality
- No related articles suggestions
- Rich text editor with code syntax highlighting
- Image insertion capability within body

### 3.2 Item Reviews

#### Fields:
- **Title** (text, required)
- **Summary** (text, required)
- **Body** (rich text, required)
  - Support for code syntax highlighting
  - Support for embedded images/screenshots
- **Pros** (rich text or structured list, required)
- **Cons** (rich text or structured list, required)
- **Featured Image** (required)
- **Item Type** (categories: Books, Software/Apps, Gadgets, Websites)
- **Categories** (select from predefined list, required)
- **Tags** (multiple selection, optional)
- **Affiliated Links** (relationship to affiliate links, optional)
- **Author** (auto-populated)
- **Status** (draft/published, default: draft)
- **Created On** (auto-generated timestamp)
- **Updated On** (auto-generated timestamp)
- **SEO Metadata:**
  - Meta description
  - Keywords
  - Custom URL slug
  - Open Graph image

#### Features:
- No formal rating system (stars/scores)
- Structured pros/cons sections
- Link to related affiliate links
- Categories and tags for organization
- Rich text editor with code syntax highlighting

### 3.3 Affiliate Links

#### Fields:
- **Affiliate URL** (text, required)
- **Description** (text, required)
- **Default Image** (image, required)
- **Vendor Category** (select from predefined vendor list, required)
- **Click Tracking** (auto-generated metrics)
- **Created On** (auto-generated timestamp)
- **Updated On** (auto-generated timestamp)

#### Vendor Categories (Examples):
- Amazon
- Other vendors (to be defined)

#### Features:
- Organization by vendor
- Click tracking capability
- Display on dedicated affiliate links page
- Embeddable within blog articles and reviews

---

## 4. Workflow & Publishing

### 4.1 Content Creation Workflow
1. User logs into CMS
2. User creates new content (article, review, or affiliate link)
3. Content defaults to "draft" status
4. User can edit and preview content
5. User manually changes status to "published"
6. User manually triggers Hugo rebuild and Vercel deployment

### 4.2 Content Publishing Process
- **Manual deployment trigger** (no automatic webhooks)
- User publishes content in CMS
- User manually initiates Hugo build
- Hugo generates static files
- User deploys to Vercel manually (or via CLI/Git push)

### 4.3 Preview Environment
- Use Hugo's local development server for content previews
- No separate staging environment required

---

## 5. Technical Architecture

### 5.1 Frontend
**Static Site Generator:** Hugo

**Key Features:**
- Static HTML generation
- Fast page loads
- SEO-friendly URLs
- Automatic sitemap generation
- Open Graph and Twitter Card meta tags

### 5.2 Backend/CMS
**Options:** Strapi or Sanity

**Requirements:**
- Headless CMS architecture
- RESTful or GraphQL API
- Rich text editor with code syntax highlighting
- Image upload and management
- Content relationships (reviews ↔ affiliate links)
- User authentication (single user)

**Recommended:** Sanity
- Better Hugo integration via sanity-to-hugo CLI
- Flexible content modeling
- Built-in image optimization
- Real-time collaboration features (future-proof)
- Portable Text for rich content

### 5.3 Hosting
**Platform:** Vercel

**Features:**
- Static site hosting
- Git-based deployments
- Built-in CDN
- Automatic HTTPS
- Image optimization support

### 5.4 Images & Media

**Storage:** Within CMS (Sanity or Strapi)

**Features:**
- Automatic image compression
- No specific file size limits
- Image gallery support
- Featured images for articles and reviews
- Inline image insertion in rich text

### 5.5 Search Functionality
**Implementation:** Third-party search solution

**Options:**
- Pagefind (static search, privacy-friendly)
- Algolia (cloud-based, powerful)
- Lunr.js (client-side search)

**Scope:** Search across blog articles and reviews

### 5.6 Analytics & Tracking
- Affiliate link click tracking
- Integration with Google Analytics or alternative (optional)

---

## 6. SEO & Performance

### 6.1 SEO Features
- Custom meta descriptions
- Keywords management
- Custom URL slugs
- Automatic sitemap generation
- Open Graph meta tags
- Twitter Card meta tags
- Semantic HTML structure
- Mobile-responsive design

### 6.2 Performance Features
- Static site generation (fast load times)
- Automatic image compression
- CDN delivery via Vercel
- Minified CSS/JS
- Lazy loading for images

### 6.3 Not Required
- RSS feed
- Archive pages
- Breadcrumb navigation

---

## 7. User Interface & Experience

### 7.1 Navigation
- Main navigation: Home, Blog, Reviews, Affiliate Links
- Category/tag filtering on blog and review pages
- Search functionality (third-party integration)

### 7.2 Content Display
- Responsive design (mobile, tablet, desktop)
- Clean, readable typography
- Code syntax highlighting in articles and reviews
- Image galleries with lightbox/modal view
- Social sharing buttons (using Open Graph/Twitter Cards)

### 7.3 Author Display
- Author name on articles and reviews
- Social links in author section

---

## 8. Content Types Summary

| Content Type | Key Fields | Features |
|--------------|------------|----------|
| Blog Article | Title, Summary, Body, Images, Categories, Tags, SEO | Code highlighting, Draft/Published, Image insertion |
| Item Review | Title, Summary, Body, Pros/Cons, Images, Categories, Tags, SEO | Code highlighting, Affiliate link integration |
| Affiliate Link | URL, Description, Image, Vendor Category | Click tracking, Embeddable |

---

## 9. Development Phases

### Phase 1: Setup & Infrastructure
- Choose CMS (Strapi vs Sanity)
- Set up Hugo project structure
- Configure Vercel hosting
- Implement authentication

### Phase 2: CMS Configuration
- Define content models (articles, reviews, affiliate links)
- Configure rich text editor
- Set up image handling
- Create categories and tags structure

### Phase 3: Hugo Theme Development
- Design and implement homepage
- Create blog listing and detail pages
- Create review listing and detail pages
- Create affiliate links page
- Implement responsive design

### Phase 4: Integration
- Connect Hugo to CMS API
- Implement manual build/deploy workflow
- Set up image optimization
- Configure SEO meta tags

### Phase 5: Search & Additional Features
- Integrate third-party search
- Implement affiliate link click tracking
- Add social sharing functionality
- Test and optimize performance

### Phase 6: Testing & Launch
- Content creation testing
- Cross-browser testing
- Mobile responsiveness testing
- SEO verification
- Final deployment

---

## 10. Future Considerations

### Potential Enhancements:
- Newsletter subscription functionality
- Multiple author support
- Comment system integration
- Advanced analytics dashboard
- Automated deployment workflows
- A/B testing for affiliate links
- Content scheduling
- RSS feed (if needed later)

---

## 11. Technical Decisions Summary

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Static Site Generator | Hugo | Fast, flexible, SEO-friendly |
| CMS | Sanity (recommended) | Better Hugo integration, flexible content modeling |
| Hosting | Vercel | Easy deployment, built-in CDN, image optimization |
| Deployment | Manual trigger | Full control over publish timing |
| Search | Third-party (Pagefind/Algolia) | Better search experience than basic static search |
| Image Storage | Within CMS | Centralized media management |
| Image Optimization | Automatic compression | Better performance without manual work |
| Preview | Hugo local server | Quick feedback during development |

---

## 12. Success Metrics

### Content Management:
- Time to create and publish new article < 30 minutes
- Time to create and publish new review < 45 minutes
- Zero downtime during content updates

### Performance:
- Page load time < 2 seconds
- Lighthouse performance score > 90
- Mobile-friendly (Google Mobile-Friendly Test)

### SEO:
- All pages indexed by Google within 48 hours
- Proper Open Graph previews on social media
- Clean, semantic URLs

---

## Appendix A: Recommended Tech Stack

**Frontend:**
- Hugo (latest stable version)
- Tailwind CSS or custom CSS framework
- Vanilla JavaScript or Alpine.js for interactions

**Backend:**
- Sanity CMS
- Sanity Studio (CMS interface)

**Hosting & Deployment:**
- Vercel (hosting)
- GitHub/GitLab (version control)

**Search:**
- Pagefind (recommended for privacy and simplicity)
- Alternative: Algolia

**Image Optimization:**
- Sanity's built-in image pipeline
- Vercel Image Optimization

**Analytics:**
- Plausible Analytics or Simple Analytics (privacy-friendly)
- Custom affiliate link tracking

---

## Appendix B: Content Model Relationships

```
Blog Article
├── Has many: Tags
├── Belongs to: Categories
└── Has one: Author

Item Review
├── Has many: Tags
├── Belongs to: Categories
├── Has many: Affiliate Links
└── Has one: Author

Affiliate Link
├── Belongs to: Vendor Category
└── Can be referenced by: Reviews
```

---

**Document Version:** 1.0  
**Last Updated:** January 20, 2026  
**Project Status:** Specification Phase  
**Next Steps:** CMS selection and initial setup
