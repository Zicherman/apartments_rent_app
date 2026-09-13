# Apartments Rent App

An apartment discovery tool for Petah Tikva, Israel. The project collects rental posts from selected Facebook groups, stores the listing data in SQLite, and presents the results in a Hebrew, RTL-friendly web dashboard.

## What It Does

- Scrapes Facebook group feeds with a persistent browser session.
- Extracts post text, publication time, post URL, group URL, and apartment images.
- Filters out selected non-rental posts and removes duplicate listings.
- Serves stored listings through a small REST API.
- Displays listings as searchable-by-range cards with price, room count, size, images, source, and date.
- Supports sorting by date, price, and number of rooms.
- Opens listing images in a modal with keyboard navigation.

## Architecture

```text
Facebook groups
        |
        v
Python scraper + Playwright
        |
        v
SQLite database (apartments.db)
        |
        v
Express API (localhost:5000)
        |
        v
React dashboard (Vite)
```

The scraper and API are separate processes. The scraper writes data to SQLite, while the Express server reads from the database and returns JSON to the client.

## Technologies

### Scraper

- **Python**: scraping and data-processing runtime.
- **Playwright**: controls Chromium and reads Facebook group feeds.
- **pandas**: collects and de-duplicates scraped posts in a DataFrame.
- **SQLite**: local file-based database.

### Server

- **Node.js**: server runtime.
- **Express 5**: HTTP server and API routing.
- **better-sqlite3**: synchronous SQLite access from Node.js.
- **CORS**: allows the Vite development client to call the API.

### Client

- **React 19**: dashboard UI and component state.
- **Vite**: development server and production build tool.
- **CSS**: responsive layout and RTL presentation.

## Project Structure

```text
apartments_rent_app/
├── client/                 # React + Vite dashboard
│   ├── public/             # Static assets and app icon
│   └── src/                # React components and styles
├── scraper/                # Python scraping and database scripts
│   ├── fb_scraper.py       # Facebook group scraping logic
│   ├── init_db.py          # SQLite database initialization
│   └── fb_session/         # Persistent browser profile
├── server/                 # Express API
│   └── server.js           # SQLite connection and API route
└── README.md
```

## Getting Started

### Prerequisites

- Node.js and npm
- Python 3.9 or newer
- A Chromium installation supported by Playwright
- Access to the Facebook groups you want to scrape

### Install JavaScript dependencies

```bash
cd server
npm install

cd ../client
npm install
```

Install the Python packages used by the scraper in your preferred virtual environment:

```bash
pip install playwright playwright-stealth pandas
playwright install chromium
```

### Run the application

1. Initialize or prepare the SQLite database used by the scraper and server.
2. Run the scraper to collect listings into the database.
3. Start the API:

   ```bash
   cd server
   npm start
   ```

4. Start the client in a second terminal:

   ```bash
   cd client
   npm run dev
   ```

5. Open the local URL printed by Vite, usually `http://localhost:5173`.

The API endpoint used by the client is:

```text
GET http://localhost:5000/api/apartments
```

## Client Commands

Run these commands from `client/`:

```bash
npm run dev      # Start the Vite development server
npm run build    # Create a production build
npm run lint     # Run ESLint
npm run preview  # Preview the production build locally
```

## Important Notes

- Facebook scraping requires an authenticated browser session. The scraper uses the local `scraper/fb_session/` profile, so keep that directory private and do not commit its contents.
- The API currently expects the SQLite database at the path configured in `server/server.js`. Update that path for your machine before starting the server.
- The database schema and column names must match the fields consumed by the client, including listing text, price, rooms, size, publication date, source, and image URLs.
- Scraping Facebook may be affected by login state, permissions, page changes, rate limits, and Facebook's terms and policies. Use the project only with accounts and groups you are authorized to access.

```
