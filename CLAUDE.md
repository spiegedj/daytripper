# Daytripper

An interactive map of travel plans, one trip at a time: day-by-day stops, real transit routes and landmark illustrations. TypeScript, React and Vite with MapLibre (through react-map-gl). Hosted on GitHub Pages under `/daytripper/`, so there is no server: everything ships as static files.

The original brief and the coding style are in [TravelMapPlan.md](TravelMapPlan.md).

## Backlog

**Add entries to [backlog.md](backlog.md)** whenever new to-dos, follow-ups, known bugs or unconfirmed guesses come up, under the matching category. Remove items once they are done.

## Commands

- `npm run dev`: local dev server.
- `npm run build`: runs the privacy check (`scripts/checkSensitiveData.mjs`), then type-checks and builds to `dist/`.
- `npm run preview`: serves the built site on port 4173.
- `node scripts/fetchTransitRoutes.mjs <trip> [--only=day:stop]`: rebuilds route paths from OpenStreetMap (Overpass plus the OSRM foot and car routers). A full Japan run takes about 30 minutes.
- `node scripts/fetchPlaceDetails.mjs <trip> [--refresh]`: fetches Wikipedia summaries and photos.

Both fetch scripts write committed `*.generated.json` files, so the site never calls those services at runtime. The public Overpass server sometimes returns 502 or 504 errors; retry later.

## Privacy (the site is public)

- `Input/` holds the raw sources: Wanderlog exports and the traveler's photos. It is gitignored. Never commit it, and never copy anything sensitive out of it.
- Trip data may contain only place names, coordinates, dates, visit times, travel modes and hotel names.
- Never include confirmation numbers, the traveler's name, prices, or Wanderlog URLs.
- Never show the home airport or connecting flights. A trip starts at its arrival airport.
- Calendar dates are shown for past trips only. Upcoming trips (Japan) are numbered by day.
- Photos of the traveler's own trip are never published unless they choose them, and then only resized and with GPS and time metadata stripped.

## Code layout

- `src/trips/<id>/`:
  - `trip.ts`, `places.ts`, `days.ts`, `cities.ts`
  - `transitRoutes.json`: the route config, written by hand
  - `wikipediaTitles.json`
  - the generated files
  - `landmarks/*.svg`: an SVG named after a place id gives that place a landmark icon

  Register new trips in `src/trips/index.ts`. Japan stays first, because the first trip is the default.
- `src/itinerary/`: the data types, navigation state (`useItineraryNavigation`), day and date labels, and route geometry.
- `src/components/`: one folder per reusable component, styled with CSS Modules.

## Adding or correcting a past trip

- **Ground truth:** the traveler's photos come first. Their metadata gives the local time and GPS, and Pixel file names are in UTC. Read them, then cluster them by place to get the order and visit times (`IStop.visit`).
- **Conflicts:** when the traveler's memory contradicts the photos, flag it and leave the data as the photos show. When something is unclear, ask; don't guess.
- **Recording guesses:** guesses the traveler approves (Tube lines, interchanges) go in code comments and in the backlog's "To confirm" section.
- **Stop field order:** in `days.ts` stops, keep the fields in the order `placeId`, `arrival`, `visit`. The route script parses the file with a regex.
- **`transitRoutes.json` legs:** legs are keyed by `dayNumber` and `arrivalStopIndex`, so update them whenever stops are inserted or removed. Walk legs are routed automatically. Segments support:
  - `to`/`from` waypoints
  - `lineMatch` and `railway` for rail
  - `reverseOf` to retrace an earlier leg, for example a return bus on the same line
  - `isStraight` for hill paths the foot router doesn't know

## Checking changes

- Build, then screenshot the preview with Puppeteer (Chrome at `C:/Program Files/Google/Chrome/Application/chrome.exe`) at desktop (1280×800) and phone (390 wide) sizes. Do this before calling UI or route work done.
- Show design mockups before changing UI appearance when the direction is uncertain.
- Commit on request or when a piece of work is finished. Don't push unless asked.
