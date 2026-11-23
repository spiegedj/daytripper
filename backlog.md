# Daytripper backlog

Open work for the travel map, grouped by kind. Finished items are in the git history.

## Bug fixes

- **Trip overview badges overlap.** The label-spreading pass leaves some badges covered:
  - England & Scotland: the Windsor day-trip badge sits partly behind the London city card.
  - Ireland: the Kilkenny city card hides behind the Powerscourt & Glendalough day-trip label, and the Killarney card is partly covered.
- **Wikipedia summaries keep stray punctuation where pronunciations were removed,** for example "The Cliffs of Moher (; Irish: …".
- **Zoomed-out landmark pins can overlap.** Landmarks shrink to pins when they would cover another stop, but the pins can still overlap each other at low zoom.
- **Repeated stops without an illustration stack their pins.** Bath Abbey (stops 3 and 6 on Oct 15) draws two pins on the same spot. Repeated landmarks with art already share one marker with a "3, 6" badge.

## Enhancements

- **Publish the traveler's own photos for England & Scotland.** Ireland's are published. Run `scripts/processTripPhotos.mjs`, have the traveler review the selection (flag photos that show people), then commit `public/photos/<trip>/`, `photoSelection.json`, `tripPhotos.generated.json` and the trip's `tripPhotos` import together.
- **Decide on the experimental detached landmarks.** Overlapping landmarks now slide apart with a line and target (`landmarkDetachment.ts`); `?landmarks=shrink` shows the old behavior. Keep it and delete the shrink path, or revert.
- **Size landmark illustrations by their visible drawing.** Ireland's and England & Scotland's PNGs are 320 px squares whose drawings fill roughly 50–88% of the height (Stonehenge and Windsor are short), so each place needs a hand-set `landmarkIconScale`. The overlap box also counts the empty sky above short drawings, and the stop number floats there. Measuring each image's drawn bounds (or trimming the files) would let one size rule fit them all.
- **Redraw the weakest landmark illustrations.** The Cliffs of Moher and Dún Aonghasa (Ireland).
- **Shrink the 640 px landmark PNGs.** Japan's 22 now total about 17 MB, and the UK's revised ones are 0.7–0.9 MB each. Convert them to WebP (about a third of the size) and let each trip's `landmarks/index.ts` load `.webp`.
- **Regenerate landmarks whose art runs off the image.** Tōdai-ji is the most visible (cherry trees and lawn), then Tokyo National Museum, Sensō-ji and Shinkyō Bridge: each ends in a straight edge. Shibuya Crossing fills its frame, so it is a rounded tile rather than a cutout, and shows real brand signs.
- **More Ireland landmark illustrations.** Guinness Storehouse, the Book of Kells (Long Room), Dublin Castle, Ross Castle, Muckross House, Charles Fort and St Fin Barre's have none yet.

## New content

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

## To confirm with the traveler (Ireland)

Built from the photos and the hotel and spending sheets (there was no Wanderlog plan).

- **Meals without photos:** their place in each day's order follows the sheet (lunch before dinner), but the exact order around sights is a guess. Examples: the Kilkenny Café lunch before the Liffey walk on Apr 1; Grogan's after Hore Abbey on Apr 4.
- **Apr 5:** drove back to the hotel after Kinsale, then walked to St Fin Barre's for the evening.
- **Apr 1 at Trinity:** the Book of Kells (no photos) is placed between the Museum Building photo (16:18, shown as "Trinity College") and the Long Room (17:01–17:09), following the usual exhibition route.
- **Apr 10:** the bike route on Inis Mór follows the photos, but the exact roads are routed. The ferry home has no photos after Doolin (16:45), so its path round Black Head and up Galway Bay is drawn through offshore points.

## Maintenance

- **Regenerate routes after plan changes.**
  - Routes: `node scripts/fetchTransitRoutes.mjs <trip>`, or `--only=day:stop` for a single leg. A full Japan run takes about 30 minutes.
  - Place details: `node scripts/fetchPlaceDetails.mjs <trip>`.
- **Japan transit routes are best guesses.** Revisit them once the transport plans are firm.
- **Publish.** The England & Scotland and Ireland commits are local only; push to update the public site.
