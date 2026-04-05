# apartments_rent_app
An automated real-time apartment hunter for Petah Tikva, Israel. This tool utilizes Python and Playwright to extract listings from multiple Facebook groups, stores the structured data in SQLite, and serves it through a custom React dashboard

file tree
apartments_rent_app
├─ client
│  ├─ eslint.config.js
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ public
│  │  ├─ icon.svg
│  │  └─ vite.svg
│  ├─ README.md
│  ├─ src
│  │  ├─ App.css
│  │  ├─ App.jsx
│  │  ├─ assets
│  │  │  └─ react.svg
│  │  ├─ index.css
│  │  └─ main.jsx
│  └─ vite.config.js
├─ README.md
├─ scraper
│  ├─ facebook_scraper_experiment.py
│  ├─ fb_scraper.py
│  └─ init_db.py
└─ server
   ├─ package-lock.json
   ├─ package.json
   └─ server.js


app tree (app.jsx)

App  (root)
│
│  state: apartments · loading · error · selectedImage(s) · filter
│  logic: fetch from DB · process images · filter apartments
│
├── <header>  (static JSX inside App)
│       filter bar — minRooms, maxPrice dropdowns
│
├── <ApartmentCard />  ×N  (one per filtered apartment)
│   │   props:  apt, onImageClick
│   │
│   ├── <ImageGrid />
│   │   │   props:  images, onImageClick
│   │   │   logic:  slices to max 4 · picks grid layout class · shows +N overlay
│   │   │
│   │   └── <div class="grid-item" />  ×N  (one per displayed image)
│   │           click → calls onImageClick(img)
│   │                        ↓
│   │               bubbles up to App
│   │               sets selectedImage + selectedImages in state
│   │                        ↓
│   │               triggers ImageModal to mount
│   │
│   └── card body
│           badges: price · rooms · size
│           text:   post content
│           footer: date · group name
│
└── <ImageModal />  (mounted only when selectedImage !== null)
        props:  image, allImages, onClose
        logic:  keyboard nav (← →  Esc) · scroll lock · image counter
        note:   rendered via createPortal → document.body
                (NOT inside the card, to avoid CSS transform bugs)

```