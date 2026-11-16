# Daytripper backlog

Open work for the travel map, grouped by kind. Finished items are in the git history.

## Bug fixes

- **Trip overview badges overlap.** On the England & Scotland overview, the Windsor day-trip badge sits partly behind the London city card. The label-spreading pass should move it clear.
- **Zoomed-out landmark pins can overlap.** Landmarks shrink to pins when they would cover another stop, but the pins can still overlap each other at low zoom.

## Enhancements

- **Show the traveler's own photos at each stop.** Photos live in `Input/` (never committed) and carry the time and GPS in their metadata. Before anything is published: the traveler picks which photos to use, the copies are resized, and the GPS and time metadata are stripped.
- **Make place photos more prominent in the details pane.** Two attempts were reverted:
  - A tall hero image grew the pane too much vertically and always showed a scrollbar.
  - A wider responsive pane was too wide on smaller windows.

  Photos inside the timeline (too small) and a full-screen gallery were also ruled out. Ideas still open: widen the pane only on large screens, or show the photo as a postcard on the map.
- **Redraw the Kelpies illustration.** It is the weakest of the England & Scotland landmark icons.

## New content

- **Add the Ireland trip.** Needs:
  - the Wanderlog export and the trip photos in `Input/`
  - where the map should start (the arrival airport, with no home airport or connecting flights)
  - how the traveler got around (car, coach, train)

  Dates can be shown, as for the England trip.
- **Hand-written summaries for places without a Wikipedia article.**
  - Japan: Shinkyō Bridge, Kanmangafuchi, Sōsha shrine, Nintendo Tokyo, the hotels.
  - England & Scotland: The Sill. St Anthony's Chapel ruins currently borrow the Holyrood Park article.

## To confirm with the traveler (England & Scotland)

These are best guesses in the data; correct them if memory or photos say otherwise.

- **London Tube:** which stations and lines were used (the Northern, Central, Jubilee, Bakerloo and District legs), and the Bond Street interchange from Heathrow.
- **Oxford, Oct 13:**
  - the bus stop on Woodstock Road by the cemetery
  - the walk from St Giles to the station
  - changing at Basingstoke on the way to Salisbury
- **Oct 16:** Bakerloo then Victoria line from Waterloo to King's Cross.
- **Oct 20:** the order of the Scottish National Gallery and the National Museum of Scotland; neither has photos.
- **Trafalgar Square:** only on Oct 9, where a photo puts it. Add it to Oct 10 as well if the walk to the galleries crossed it again.
- **Cathedral label:** Westminster Abbey and Bath Abbey are not strictly cathedrals. Decide whether the label should be "Church" or "Cathedral & abbey".

## Maintenance

- **Regenerate routes after plan changes.**
  - Routes: `node scripts/fetchTransitRoutes.mjs <trip>`, or `--only=day:stop` for a single leg. A full Japan run takes about 30 minutes.
  - Place details: `node scripts/fetchPlaceDetails.mjs <trip>`.
- **Japan transit routes are best guesses.** Revisit them once the transport plans are firm.
- **Publish.** Recent England & Scotland commits are local only; push to update the public site.
