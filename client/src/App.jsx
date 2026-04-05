import { useState, useEffect, useCallback } from 'react' //hooks
import { createPortal } from 'react-dom' //enable render a component's HTML outside its normal place in the tree
import './App.css'

// ─── Sort options ─────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'date_desc',  label: 'תאריך (חדש ראשון)' },
  { value: 'date_asc',   label: 'תאריך (ישן ראשון)' },
  { value: 'price_asc',  label: 'מחיר (נמוך לגבוה)' },
  { value: 'price_desc', label: 'מחיר (גבוה לנמוך)' },
  { value: 'rooms_asc',  label: 'חדרים (פחות ליותר)' },
  { value: 'rooms_desc', label: 'חדרים (יותר לפחות)' },
]

// ─── Filter Icon ──────────────────────────────────────────────────────────────
// inline SVG that looks like the standard "sliders" filter icon:
// 3 horizontal lines with a circle (thumb) at a different position on each.
const FilterIcon = () => (
  <svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="0" y1="2"  x2="20" y2="2"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="5"  cy="2"  r="2.2" fill="white" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="0" y1="8"  x2="20" y2="8"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="14" cy="8"  r="2.2" fill="white" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="0" y1="14" x2="20" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="8"  cy="14" r="2.2" fill="white" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
)

// ─── Dual Range Slider ────────────────────────────────────────────────────────
// a custom slider with two handles representing min and max values.
// HTML has no built-in dual-range input, so we stack two regular range inputs
// on top of each other: both are transparent, only their thumbs are visible.
// pointer-events:none on the inputs lets clicks pass through to the one below.
const DualRangeSlider = ({ label, min, max, step, valueMin, valueMax, onChangeMin, onChangeMax, format }) => {
  // calculate how far along the track each handle sits (as a percentage).
  // direction:ltr is set on the track wrapper so these percentages match
  // the actual visual thumb positions (left = min, right = max).
  const pctMin = ((valueMin - min) / (max - min)) * 100
  const pctMax = ((valueMax - min) / (max - min)) * 100

  return (
    <div className="dual-slider">
      <div className="dual-slider-header">
        <span className="dual-slider-label">{label}</span>
        <span className="dual-slider-values" dir="ltr">{format(valueMin)} – {format(valueMax)}</span>
      </div>
      {/* direction:ltr is applied here in CSS so that the range thumbs
          go from left(min) to right(max), which is the expected slider UX
          even in an RTL app */}
      <div className="dual-slider-track-wrap">
        <div className="dual-slider-bg" /> {/* the unselected (gray) track behind both handles */}
        <div
          className="dual-slider-fill"
          style={{ left: `${pctMin}%`, right: `${100 - pctMax}%` }} // golden fill between the two handles
        />
        {/* min handle - Math.min prevents it from crossing over the max handle */}
        <input
          type="range" min={min} max={max} step={step} value={valueMin}
          className="dual-slider-input"
          onChange={e => onChangeMin(Math.min(Number(e.target.value), valueMax - step))}
        />
        {/* max handle - Math.max prevents it from crossing over the min handle */}
        <input
          type="range" min={min} max={max} step={step} value={valueMax}
          className="dual-slider-input"
          onChange={e => onChangeMax(Math.max(Number(e.target.value), valueMin + step))}
        />
      </div>
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
// Rendered via portal directly into document.body so it is NEVER
// a child of the card itself. this prevents image-displaying bugs.

const ImageModal = ({ image, allImages, onClose }) => {
  const [current, setCurrent] = useState(image) //for tracking the current image, used to navigate inside the images window

  useEffect(() => {
    //keyboard listener
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose() // escape key logic
      
      //ArrowRight key logic - next image if any
      if (e.key === 'ArrowRight') {
        const idx = allImages.indexOf(current)
        if (idx > 0) setCurrent(allImages[idx - 1])
      }
      
      //ArrowLeft key logic - prev image if any
      if (e.key === 'ArrowLeft') {
        const idx = allImages.indexOf(current)
        if (idx < allImages.length - 1) setCurrent(allImages[idx + 1])
      }
    }
    
    document.addEventListener('keydown', handleKey) //telling the browser to call handleKey when we press a key
    document.body.style.overflow = 'hidden' //lock the possibility to scroll the body when ImageModal is open
    
    //a cleanup function that runs when the modal closes. this stops the keyboard listener and enables scrolling.
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose, current, allImages])

  const currentIdx = allImages.indexOf(current)

  //createPortal function places a component inside the location in its argument, instead of in its parent.
  // this is important because we want it directly in document.body and not inside the card (causes bugs).
  return createPortal(
    //makes the dark fill that closes the modal on click
    <div className="modal-overlay" onClick={onClose}> 
      {/* modal Close button */}
      <button className="modal-close" onClick={onClose} aria-label="סגור">✕</button>

      {/* img Prev button */}
      {/* checks if we have images left */}
      {currentIdx < allImages.length - 1 && (
        <button
          className="modal-nav modal-prev"
          onClick={(e) => { e.stopPropagation(); setCurrent(allImages[currentIdx + 1]) }}
        >‹</button>
      )}

      {/* current Image counter (example: 1/5) */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <img key={current} src={current} alt="תמונת דירה" />
        {allImages.length > 1 && (
          <div className="modal-counter">{allImages.length} / {currentIdx + 1}</div>
        )}
      </div>

      {/* img Next button */}
      {/* checks if we have images left */}
      {currentIdx > 0 && ( 
        <button
          className="modal-nav modal-next"
          onClick={(e) => { e.stopPropagation(); setCurrent(allImages[currentIdx - 1]) }}
        >›</button>
      )}
    </div>,
    document.body //the location where we want to render the modal
  )
}

// ─── Image Grid ───────────────────────────────────────────────────────────────

const ImageGrid = ({ images, onImageClick }) => {
  //return span with no photos when images is empty
  if (!images || images.length === 0)
    return <div className="no-photos"><span>אין תמונות</span></div>

  //defined the max number of images in the grid, and separate the images to those displayed and those who not
  const MAX = 4
  const displayed = images.slice(0, MAX)
  const remaining = images.length - MAX
  const count = Math.min(displayed.length, MAX)

  return (
    <div className={`image-grid grid-${count}`}> {/* this makes dynamic grid layout class for the css */}
      {displayed.map((img, i) => (
        <div key={i} className="grid-item" onClick={() => onImageClick(img)}>
          <img src={img} alt={`דירה ${i + 1}`} loading="lazy" /> {/* lazy means the images will not download till we scroll near to them */}
          {i === MAX - 1 && remaining > 0 && (
            <div className="overlay">+{remaining}</div>
          )} {/* the 2 rows above make the +remaining indicator when we have more than 4 images */}
        </div>
      ))}
    </div>
  )
}

// ─── Expandable Card Text ──────────────────────────────────────────────────────
const CardText = ({ text }) => {
  const [expanded, setExpanded] = useState(false)
  if (!text) return <p className="card-text" dir="rtl">מודעת דירה</p>
  return (
    <div>
      <p className={`card-text ${expanded ? 'expanded' : ''}`} dir="rtl">{text}</p>
      <button className="card-expand-btn" onClick={() => setExpanded(e => !e)}>
        {expanded ? 'הצג פחות' : 'עוד'}
      </button>
    </div>
  )
}
const ApartmentCard = ({ apt, onImageClick }) => { //apt = the full apartment object from the database (price, rooms, text, etc.)
  const hasPrice = apt.price && apt.price !== 'ללא מחיר במודעה'

  return (
    <article className="card">
      <ImageGrid images={apt.images} onImageClick={onImageClick} /> {/* create imagegrid in the top of the card */}

      <div className="card-body">
        {/* data preparation for the card */}
        <div className="card-meta">
          {hasPrice && (
            <span className="badge badge-price">₪{Number(apt.price).toLocaleString()}</span>
          )}
          {apt.rooms && (
            <span className="badge badge-rooms">{apt.rooms} חד'</span>
          )}
          {apt.size && (
            <span className="badge badge-size">{apt.size} מ"ר</span>
          )}
        </div>

        {/* post text */}
        <CardText text={apt.text} />

        {/* Footer */}
        <div className="card-footer">
          <span className="card-date">{apt.date_published || ''}</span> {/* date */}
          {apt.group_name_or_website && (
            <span className="card-source" title={apt.group_name_or_website}> {/* group name */}
              {apt.group_name_or_website}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  const [apartments, setApartments] = useState([]) //raw data from the DB
  const [loading, setLoading] = useState(true) //Whether the fetch is still in progress
  const [error, setError] = useState(null) //Any error message from the fetch
  const [selectedImage, setSelectedImage] = useState(null) //Which single image the modal should show
  const [selectedImages, setSelectedImages] = useState([]) //All images for the current apartment (for navigation)
  const [filterOpen, setFilterOpen] = useState(false) //controls whether the right-side filter panel is expanded

  // applied filter - what's actually filtering the cards
  const [filter, setFilter] = useState({
    minRooms: 1,    maxRooms: 6,
    minPrice: 2000, maxPrice: 15000
  })

  // pending filter - what the user is currently dragging (not yet applied)
  const [pending, setPending] = useState({
    minRooms: 1,    maxRooms: 6,
    minPrice: 2000, maxPrice: 15000
  })

  // sort state
  const [sortBy, setSortBy] = useState('date_desc')

  //pulls the data from the DB
  useEffect(() => {
    fetch('http://localhost:5000/api/apartments') //server host, fetch is a browser built-in func that makes an HTTP request
      .then(res => res.json()) 
      .then(data => { setApartments(data); setLoading(false) }) //update apartments with the data. update loading
      .catch(err => { setError(err.message); setLoading(false) }) //update error if any, update loading
  }, [])

  //update SelectedImage on image click
  const handleImageClick = useCallback((img, allImgs) => {
    setSelectedImage(img)
    setSelectedImages(allImgs)
  }, [])

  //refresh SelectedImage after modal is closed
  const handleCloseModal = useCallback(() => {
    setSelectedImage(null)
    setSelectedImages([])
  }, [])

  //split the imageURLs string into array
  const processed = apartments.map(apt => ({
    ...apt,
    images: apt.pictures_url
      ? apt.pictures_url.split(' | ').map(s => s.trim()).filter(Boolean)
      : []
  }))

  //filtering apartments logic - now uses min/max range for both rooms and price
  const filtered = processed.filter(apt => {
    // rooms filter - skip apartments outside the selected rooms range
    if (apt.rooms !== null && apt.rooms !== undefined) {
      if (apt.rooms < filter.minRooms || apt.rooms > filter.maxRooms) return false
    }
    // price filter - skip apartments outside the selected price range
    if (apt.price && apt.price !== 'ללא מחיר במודעה') {
      const price = Number(apt.price)
      if (price < filter.minPrice || price > filter.maxPrice) return false
    }
    return true
  })

  // sorting logic
  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'date_desc': return (b.date_published || '').localeCompare(a.date_published || '')
      case 'date_asc':  return (a.date_published || '').localeCompare(b.date_published || '')
      case 'price_asc': return (Number(a.price) || 0) - (Number(b.price) || 0)
      case 'price_desc': return (Number(b.price) || 0) - (Number(a.price) || 0)
      case 'rooms_asc': return (a.rooms || 0) - (b.rooms || 0)
      case 'rooms_desc': return (b.rooms || 0) - (a.rooms || 0)
      default: return 0
    }
  })

  return (
    // app-layout is a flex row: main body on the left, filter sidebar on the right.
    // direction:ltr is set here so the sidebar always stays on the visual right,
    // even though the rest of the app uses RTL (Hebrew). RTL is restored inside app-body.
    <div className="app-layout">

      <div className="app-body"> {/* main area: header + results bar + cards */}

        {/* app header - sticky so it stays visible while scrolling */}
        <header className="app-header">
          <img src="/icon.svg" alt="לוגו" className="app-logo" /> {/* logo on the left side of the header */}
          <div className="app-titles">
            <h1 className="app-title">דירות להשכרה</h1>
            <span className="app-divider">·</span>
            <p className="app-subtitle">פתח תקווה והסביבה · עדכון בזמן אמת</p>
          </div>
        </header>

        {/* results bar - sits between the header and the first card row */}
        {!loading && (
          <div className="results-bar">
            <span className="results-count">{sorted.length} מודעות</span>
          </div>
        )}

        <main>
          {loading && <div className="state-msg">מתחבר למסד הנתונים...</div>}
          {error && <div className="state-msg error">שגיאה: {error}</div>}

          {!loading && !error && (
            <div className="card-container">
              {sorted.map(apt => (
                <ApartmentCard
                  key={apt.post_id}
                  apt={apt}
                  onImageClick={(img) => handleImageClick(img, apt.images)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* filter sidebar */}
      <aside className={`filter-sidebar ${filterOpen ? 'open' : ''}`}>

        {/* filter panel content - dual sliders, only visible when sidebar is open */}
        <div className="filter-panel">
          <p className="filter-title">סינון</p>

          {/* rooms dual range slider */}
          <DualRangeSlider
            label="חדרים"
            min={1} max={6} step={0.5}
            valueMin={pending.minRooms}
            valueMax={pending.maxRooms}
            onChangeMin={v => setPending(f => ({ ...f, minRooms: v }))}
            onChangeMax={v => setPending(f => ({ ...f, maxRooms: v }))}
            format={v => `${v}`}
          />

          {/* price dual range slider */}
          <DualRangeSlider
            label="מחיר ₪"
            min={2000} max={15000} step={500}
            valueMin={pending.minPrice}
            valueMax={pending.maxPrice}
            onChangeMin={v => setPending(f => ({ ...f, minPrice: v }))}
            onChangeMax={v => setPending(f => ({ ...f, maxPrice: v }))}
            format={v => `₪${v.toLocaleString()}`}
          />

          {/* apply filter button */}
          <button
            className="filter-apply-btn"
            onClick={() => setFilter({ ...pending })}
          >
            סנן
          </button>

          <hr className="filter-divider" />

          {/* sort section */}
          <div className="filter-sort-section">
            <p className="filter-section-label">מיון</p>
            <select
              className="filter-sort-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              dir="rtl"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* reset all filters back to their default values */}
          <button
            className="filter-reset-btn"
            onClick={() => {
              const def = { minRooms: 1, maxRooms: 6, minPrice: 2000, maxPrice: 15000 }
              setPending(def)
              setFilter(def)
            }}
          >
            איפוס
          </button>
        </div>

        {/* toggle button */}
        <button
          className="filter-toggle-btn"
          onClick={() => setFilterOpen(o => !o)}
          aria-label={filterOpen ? 'סגור פילטרים' : 'פתח פילטרים'}
        >
          {filterOpen ? '✕' : <FilterIcon />}
        </button>
      </aside>

      {/* rendering the modal only if selectedImage is not null */}
      {selectedImage && (
        <ImageModal
          image={selectedImage}
          allImages={selectedImages}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}

export default App