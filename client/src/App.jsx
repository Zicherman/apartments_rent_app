import { useState, useEffect, useCallback } from 'react' //hooks
import { createPortal } from 'react-dom' //enable render a component's HTML outside its normal place in the tree
import './App.css' 

// ─── Modal ────────────────────────────────────────────────────────────────────
// Rendered via portal directly into document.body so it is NEVER
// be child of the card itself. this is prevent image-displaing bugs.

const ImageModal = ({ image, allImages, onClose }) => {
  const [current, setCurrent] = useState(image) //for tracking the current image, use to nevigate inside the images window

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
    
    document.addEventListener('keydown', handleKey) //telling the browser to call handleKey where we press a key
    document.body.style.overflow = 'hidden' //lock the possibilty to scroll the body when ImageModal open
    
    //a cleanup function that run when the modal closed. this stop the keyboard listener and enable scrolling.
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose, current, allImages])

  const currentIdx = allImages.indexOf(current)

  //createPortal function place a component inside the location in his argument, instead of in its parent
  // this is important because we want it directly in document.body and not inside the card (makes bugs)
  return createPortal(
    //makes the dark fill that close the modal on click
    <div className="modal-overlay" onClick={onClose}> 
      {/* modal Close button*/}
      <button className="modal-close" onClick={onClose} aria-label="סגור">✕</button>

      {/* img Prev button*/}
      {/* checks if we have image left*/}
      {currentIdx < allImages.length - 1 && (
        <button
          className="modal-nav modal-prev"
          onClick={(e) => { e.stopPropagation(); setCurrent(allImages[currentIdx + 1]) }}
        >‹</button>
      )}

      {/* current Image counter (example: 1/5)) */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <img key={current} src={current} alt="תמונת דירה" />
        {allImages.length > 1 && (
          <div className="modal-counter">{allImages.length} / {currentIdx + 1}</div>
        )}
      </div>

      {/* img Next button */}
      {/* checks if we have image left */}
      {currentIdx > 0 && ( 
        <button
          className="modal-nav modal-next"
          onClick={(e) => { e.stopPropagation(); setCurrent(allImages[currentIdx - 1]) }}
        >›</button>
      )}
    </div>,
    document.body //the location where we wants to render the modal
  )
}

// ─── Image Grid ───────────────────────────────────────────────────────────────

const ImageGrid = ({ images, onImageClick }) => {
  //return span with no photos where images is empty
  if (!images || images.length === 0)
    return <div className="no-photos"><span>אין תמונות</span></div>

  //defined the max number of images in the grid, and seperate the images to those who displaid and those who not
  const MAX = 4
  const displayed = images.slice(0, MAX)
  const remaining = images.length - MAX
  const count = Math.min(displayed.length, MAX)

  return (
    <div className={`image-grid grid-${count}`}> {/* this makes dynemic grid for the css */}
      {displayed.map((img, i) => (
        <div key={i} className="grid-item" onClick={() => onImageClick(img)}>
          <img src={img} alt={`דירה ${i + 1}`} loading="lazy" /> {/* lazy mean the images will not dowmload till we scroll near to them */}
          {i === MAX - 1 && remaining > 0 && (
            <div className="overlay">+{remaining}</div>
          )} {/* the 2 rows above makes the +remains images when we have more than 4 images */}
        </div>
      ))}
    </div>
  )
}

// ─── Apartment Card ───────────────────────────────────────────────────────────
const ApartmentCard = ({ apt, onImageClick }) => { //apt = the full apartment object from the database (price, rooms, text, etc.)
  const hasPrice = apt.price && apt.price !== 'ללא מחיר במודעה'

  return (
    <article className="card">
      <ImageGrid images={apt.images} onImageClick={onImageClick} /> {/* create imagegrid in the top of the card */}

      <div className="card-body">
        {/* data preperation for the card */}
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
        <p className="card-text" dir="rtl">{apt.text || 'מודעת דירה'}</p>

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
  const [filter, setFilter] = useState({ minRooms: '', maxPrice: '' }) //The current filter dropdowns

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

  //refresh SelectedImage after modal is close
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

  //filtering apartments logic
  const filtered = processed.filter(apt => {
    if (filter.minRooms && apt.rooms < Number(filter.minRooms)) return false
    if (filter.maxPrice && apt.price && apt.price !== 'ללא מחיר במודעה') {
      if (Number(apt.price) > Number(filter.maxPrice)) return false
    }
    return true
  })

  return (
    <>
      {/* app header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-text">
            <h1 className="app-title">דירות להשכרה</h1>
            <p className="app-subtitle">פתח תקווה והסביבה · עדכון בזמן אמת</p>
          </div>
          {!loading && (
            <div className="header-count">{filtered.length} מודעות</div>
          )}
        </div>

        {/* Filter bar */}
        <div className="filter-bar">
          <label className="filter-item">
            <span>חדרים מינימום</span>
            <select
              value={filter.minRooms}
              onChange={e => setFilter(f => ({ ...f, minRooms: e.target.value }))}
            >
              <option value="">הכל</option>
              {[2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <label className="filter-item">
            <span>מחיר מקסימום</span>
            <select
              value={filter.maxPrice}
              onChange={e => setFilter(f => ({ ...f, maxPrice: e.target.value }))}
            >
              <option value="">הכל</option>
              {[3000, 4000, 5000, 6000, 7000, 8000, 10000].map(n => (
                <option key={n} value={n}>₪{n.toLocaleString()}</option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <main>
        {loading && <div className="state-msg">מתחבר למסד הנתונים...</div>} 
        {error && <div className="state-msg error">שגיאה: {error}</div>}

        
        {!loading && !error && (
          <div className="card-container">
            {filtered.map(apt => (
              <ApartmentCard
                key={apt.post_id}
                apt={apt}
                onImageClick={(img) => handleImageClick(img, apt.images)}
              />
            ))}
          </div>
        )}
      </main>

      {/* rendering the modal only if selectedImage is not null */}
      {selectedImage && ( 
        <ImageModal
          image={selectedImage}
          allImages={selectedImages}
          onClose={handleCloseModal}
        />
      )}
    </>
  )
}

export default App