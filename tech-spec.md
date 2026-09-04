# Jersey Unicorn - Technical Specification

## Dependencies

| Package | Version | Purpose |
|---|---|---|
| react | ^19.0.0 | UI framework |
| react-dom | ^19.0.0 | React DOM renderer |
| vite | ^6.0.0 | Build tool |
| @vitejs/plugin-react | ^4.0.0 | Vite React plugin |
| tailwindcss | ^4.0.0 | Utility CSS |
| @tailwindcss/vite | ^4.0.0 | Tailwind Vite integration |
| gsap | ^3.12.0 | Animation engine |
| lucide-react | ^0.460.0 | Icons |
| typescript | ^5.6.0 | Type safety |
| @types/react | ^19.0.0 | React types |
| @types/react-dom | ^19.0.0 | React DOM types |

---

## Component Inventory

### Layout

| Component | Source | Notes |
|---|---|---|
| AnnouncementBar | Custom | Marquee + hide/show on scroll |
| Header | Custom | Sticky with blur effect |
| Footer | Custom | 3-column dark footer |

### Sections

| Component | Source | Notes |
|---|---|---|
| HeroSection | Custom | Full-width bg image + CTA |
| CategoryTabs | Custom | 5-tab sticky navigation |
| ProductSection | Custom | Reused for all 5 categories |
| TrustBadges | Custom | 4-icon feature row |

### Reusable Components

| Component | Source | Used By |
|---|---|---|
| ProductCard | Custom | ProductSection x20 |
| SectionHeader | Custom | ProductSection x5 |

### Hooks

| Hook | Purpose |
|---|---|
| useScrollDirection | Detect scroll up/down for announcement bar |
| useInView | IntersectionObserver wrapper for animations |
| useActiveSection | Track which category section is in viewport |

---

## Animation Implementation Table

| Animation | Library | Implementation Approach | Complexity |
|---|---|---|---|
| Announcement marquee | CSS | translateX animation, infinite linear | Low |
| Announcement bar hide/show | CSS + React state | translateY based on scroll direction | Low |
| Header scroll effect | CSS | backdrop-filter + border transition on scroll class | Low |
| Hero bg fade-in | GSAP | Opacity 0→1 on load | Low |
| Hero button slide-up | GSAP | translateY(30px→0) + opacity on load | Low |
| Category tab active switch | CSS | Background/color transition on active class | Low |
| **Product card stagger entrance** | **GSAP + ScrollTrigger** | **batch() with scrollTrigger, stagger 0.1s, fade+translateY** | **High** |
| **Section header slide-in** | **GSAP + ScrollTrigger** | **translateX(-30px→0) + opacity, triggered at section top** | **High** |
| Product card hover | CSS | transform scale + shadow transition | Low |
| Trust badges stagger | GSAP + ScrollTrigger | Stagger fade-up on scroll into view | Medium |
| Footer fade-in | GSAP + ScrollTrigger | Simple opacity animation | Low |
| Tab smooth scroll | Native | scrollIntoView({ behavior: 'smooth' }) | Low |
| Floating button hover | CSS | scale + brightness transition | Low |

---

## State & Logic Plan

### Announcement Bar Hide/Show

- Track `scrollDirection` ("up" | "down")
- Track `lastScrollY` for comparison
- If scroll down > 100px: hide bar (translateY(-100%))
- If scroll up: show bar
- Use `useScrollDirection` hook with scroll event listener

### Header Scroll Effect

- Track `isScrolled` boolean (true when scrollY > 50px)
- Toggle `scrolled` class for CSS transitions
- Simple useEffect with scroll listener

### Category Tab Active State

- Track `activeSection` string (category id)
- Use IntersectionObserver on each ProductSection
- Observer config: threshold 0.3, rootMargin "-100px 0px"
- When section enters viewport, update active tab

### Product Data

- Static data array for all 5 categories
- Each product: id, name, category, price, oldPrice, image, discount
- Pass as props to ProductSection

---

## Project File Structure

```
src/
├── components/
│   ├── AnnouncementBar.tsx
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── HeroSection.tsx
│   ├── CategoryTabs.tsx
│   ├── ProductSection.tsx
│   ├── ProductCard.tsx
│   ├── SectionHeader.tsx
│   ├── TrustBadges.tsx
│   └── FloatingButton.tsx
├── hooks/
│   ├── useScrollDirection.ts
│   └── useInView.ts
├── data/
│   └── products.ts
├── App.tsx
├── main.tsx
└── index.css
```

---

## Key Implementation Notes

1. **GSAP ScrollTrigger**: Use `gsap.utils.toArray()` + `ScrollTrigger.batch()` for product card animations to avoid creating individual triggers for each card.

2. **Sticky Tabs**: CategoryTabs uses `position: sticky; top: 64px` (below header). Active state managed by IntersectionObserver on each section.

3. **Product Images**: All images served from `/assets/jerseys/` folder. Use `loading="lazy"` for images below fold.

4. **Performance**: Use CSS `will-change: transform` sparingly, only on actively animating elements. Use transform-based animations only (no layout-triggering properties).

5. **Mobile**: Category tabs scroll horizontally with `overflow-x: auto` on mobile. Product grid switches to 1 column.
