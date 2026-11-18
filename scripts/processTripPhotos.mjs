// Publishes the traveler's own photos for a past trip: matches each photo to the stop it was taken at (by visit time and GPS),
// picks a few per stop, and writes resized WebP copies with every piece of metadata removed.
//
// Run by hand: node scripts/processTripPhotos.mjs <trip> <photoFolder> [--utc-offset=1] [--per-stop=4] [--reselect] [--review=<file.html>]
//
// The originals stay in Input/ (never committed). The chosen photos are listed in src/trips/<trip>/photoSelection.json:
// the first run fills it automatically, later runs reuse it, so removing or adding file names there is how a review sticks.
// --reselect throws the list away and picks again. --review writes a local contact sheet of the chosen photos.
import exifr from "exifr";
import sharp from "sharp";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const [tripId, photoFolder] = process.argv.slice(2);
const readOption = (name, fallback) => process.argv.find((argument) => argument.startsWith(`--${name}=`))?.split("=")[1] ?? fallback;
const utcOffsetHours = Number(readOption("utc-offset", "1"));
const photosPerStop = Number(readOption("per-stop", "4"));
const reviewPath = readOption("review", undefined);
const isReselecting = process.argv.includes("--reselect");

const tripFolder = `src/trips/${tripId}`;
const selectionPath = `${tripFolder}/photoSelection.json`;
const outputPath = `${tripFolder}/tripPhotos.generated.json`;
const publicFolder = `public/photos/${tripId}`;
const fullSize = 1600;
const smallSize = 480;
const visitMarginMinutes = 10;
const maximumStopDistanceKilometers = 1.5;
const burstSeconds = 45;
// Hotel rooms are private; their photos are never published.
const unpublishedCategories = new Set(["hotel"]);

function distanceKilometers(first, second)
{
	const toRadians = (degrees) => degrees * Math.PI / 180;
	const latitudeDelta = toRadians(second.latitude - first.latitude);
	const longitudeDelta = toRadians(second.longitude - first.longitude);
	const haversine = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(toRadians(first.latitude)) * Math.cos(toRadians(second.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
	return 2 * 6371 * Math.asin(Math.sqrt(haversine));
}

function toMinutes(clock)
{
	const [hours, minutes] = clock.split(":").map(Number);
	return hours * 60 + minutes;
}

function readPlaces()
{
	const source = readFileSync(`${tripFolder}/places.ts`, "utf8");
	const places = {};
	for (const match of source.matchAll(/(\w+):\s*\{[^}]*category:\s*"(\w+)",\s*latitude:\s*(-?[\d.]+),\s*longitude:\s*(-?[\d.]+)/g))
	{
		places[match[1]] = { category: match[2], latitude: Number(match[3]), longitude: Number(match[4]) };
	}
	return places;
}

// Reads each day's date and its stops' place ids and visit times from days.ts.
function readDays()
{
	const source = readFileSync(`${tripFolder}/days.ts`, "utf8");
	const dayStarts = [...source.matchAll(/dayNumber:\s*(\d+),/g)];
	return dayStarts.map((match, index) =>
	{
		const daySource = source.slice(match.index, dayStarts[index + 1]?.index);
		const date = daySource.match(/date:\s*"(\d{4}-\d{2}-\d{2})"/)?.[1];
		const stops = [...daySource.matchAll(/\{\s*placeId:\s*"(\w+)"([^\n]*)/g)].map((stopMatch) =>
		{
			const visit = stopMatch[2].match(/visit:\s*at\("(\d\d:\d\d)"(?:,\s*"(\d\d:\d\d)")?\)/);
			return { placeId: stopMatch[1], visitStart: visit?.[1], visitEnd: visit?.[2] ?? visit?.[1] };
		});
		return { dayNumber: Number(match[1]), date, stops };
	});
}

async function readPhotos()
{
	const photos = [];
	for (const fileName of readdirSync(photoFolder).filter((name) => /\.jpe?g$/i.test(name)))
	{
		// Pixel file names carry the UTC capture time (PXL_YYYYMMDD_HHMMSS), which is more reliable than the camera clock.
		const nameMatch = fileName.match(/PXL_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
		if (!nameMatch)
		{
			continue;
		}
		const [, year, month, day, hours, minutes, seconds] = nameMatch.map(Number);
		const local = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds) + utcOffsetHours * 3600 * 1000);
		const tags = await exifr.parse(readFileSync(join(photoFolder, fileName)), { gps: true, tiff: false, exif: false, xmp: false, icc: false, iptc: false }).catch(() => null);
		if (tags?.latitude === undefined)
		{
			continue;
		}
		photos.push(
		{
			fileName,
			date: local.toISOString().slice(0, 10),
			clock: local.toISOString().slice(11, 16),
			secondOfDay: local.getUTCHours() * 3600 + local.getUTCMinutes() * 60 + local.getUTCSeconds(),
			latitude: tags.latitude,
			longitude: tags.longitude,
		});
	}
	return photos;
}

// Each photo goes to the stop whose visit window contains it; when two overlap, the nearer place wins.
function matchPhotosToStops(days, places, photos)
{
	const candidatesByStop = new Map();
	for (const photo of photos)
	{
		let best = null;
		for (const day of days.filter((candidate) => candidate.date === photo.date))
		{
			day.stops.forEach((stop, stopIndex) =>
			{
				const place = places[stop.placeId];
				if (!stop.visitStart || !place || unpublishedCategories.has(place.category))
				{
					return;
				}
				const minute = photo.secondOfDay / 60;
				if (minute < toMinutes(stop.visitStart) - visitMarginMinutes || minute > toMinutes(stop.visitEnd) + visitMarginMinutes)
				{
					return;
				}
				const kilometers = distanceKilometers(photo, place);
				if (kilometers <= maximumStopDistanceKilometers && (!best || kilometers < best.kilometers))
				{
					best = { key: `${day.dayNumber}:${stopIndex}`, kilometers };
				}
			});
		}
		if (best)
		{
			candidatesByStop.set(best.key, [...(candidatesByStop.get(best.key) ?? []), photo]);
		}
	}
	return candidatesByStop;
}

async function measureSharpness(fileName)
{
	const stats = await sharp(readFileSync(join(photoFolder, fileName))).rotate().resize(800, 800, { fit: "inside" }).stats();
	return stats.sharpness;
}

// Bursts of near-identical shots collapse to their sharpest frame; then picks spread evenly across the visit.
async function choosePhotos(candidates)
{
	const sorted = [...candidates].sort((first, second) => first.secondOfDay - second.secondOfDay);
	const bursts = [];
	for (const photo of sorted)
	{
		const lastBurst = bursts[bursts.length - 1];
		if (lastBurst && photo.secondOfDay - lastBurst[lastBurst.length - 1].secondOfDay <= burstSeconds)
		{
			lastBurst.push(photo);
		}
		else
		{
			bursts.push([photo]);
		}
	}
	const keepers = [];
	for (const burst of bursts)
	{
		let sharpest = burst[0];
		let sharpestScore = -Infinity;
		for (const photo of burst)
		{
			const score = await measureSharpness(photo.fileName);
			if (score > sharpestScore)
			{
				sharpest = photo;
				sharpestScore = score;
			}
		}
		keepers.push(sharpest);
	}
	if (keepers.length <= photosPerStop)
	{
		return keepers;
	}
	return Array.from({ length: photosPerStop }, (_, index) => keepers[Math.round(index * (keepers.length - 1) / (photosPerStop - 1))]);
}

async function main()
{
	const days = readDays();
	const places = readPlaces();
	const photos = await readPhotos();
	const photosByName = new Map(photos.map((photo) => [photo.fileName, photo]));

	let selection;
	if (existsSync(selectionPath) && !isReselecting)
	{
		selection = JSON.parse(readFileSync(selectionPath, "utf8")).stops;
		console.log(`Using the reviewed selection in ${selectionPath}`);
	}
	else
	{
		selection = {};
		const candidatesByStop = matchPhotosToStops(days, places, photos);
		const sortedKeys = [...candidatesByStop.keys()].sort((first, second) =>
		{
			const [firstDay, firstStop] = first.split(":").map(Number);
			const [secondDay, secondStop] = second.split(":").map(Number);
			return firstDay - secondDay || firstStop - secondStop;
		});
		for (const key of sortedKeys)
		{
			selection[key] = (await choosePhotos(candidatesByStop.get(key))).map((photo) => photo.fileName);
			console.log(`  ${key.padEnd(6)} ${candidatesByStop.get(key).length} photos, picked ${selection[key].length}`);
		}
		writeFileSync(selectionPath, JSON.stringify(
		{
			_comment: "Photos published for each stop, keyed dayNumber:stopIndex. Remove a file name to unpublish it; re-run scripts/processTripPhotos.mjs afterwards.",
			stops: selection,
		}, null, "\t") + "\n");
	}

	rmSync(publicFolder, { recursive: true, force: true });
	mkdirSync(publicFolder, { recursive: true });
	const output = {};
	for (const [key, fileNames] of Object.entries(selection))
	{
		const [dayNumber, stopIndex] = key.split(":");
		output[key] = [];
		for (const [photoIndex, fileName] of fileNames.entries())
		{
			const photo = photosByName.get(fileName);
			if (!photo)
			{
				throw new Error(`${fileName} (stop ${key}) is not in ${photoFolder} or has no GPS`);
			}
			const baseName = `${dayNumber}-${stopIndex}-${photoIndex + 1}`;
			const original = readFileSync(join(photoFolder, fileName));
			// rotate() bakes in the camera orientation; sharp then writes no metadata at all because none is requested.
			const full = await sharp(original).rotate().resize(fullSize, fullSize, { fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toFile(`${publicFolder}/${baseName}.webp`);
			await sharp(original).rotate().resize(smallSize, smallSize, { fit: "inside", withoutEnlargement: true }).webp({ quality: 75 }).toFile(`${publicFolder}/${baseName}-small.webp`);
			for (const written of [`${publicFolder}/${baseName}.webp`, `${publicFolder}/${baseName}-small.webp`])
			{
				const writtenMetadata = await sharp(written).metadata();
				if (writtenMetadata.exif || writtenMetadata.xmp || writtenMetadata.iptc || writtenMetadata.icc)
				{
					throw new Error(`${written} still carries metadata`);
				}
			}
			output[key].push({ path: `photos/${tripId}/${baseName}.webp`, thumbnailPath: `photos/${tripId}/${baseName}-small.webp`, width: full.width, height: full.height, takenAt: photo.clock });
		}
	}
	writeFileSync(outputPath, JSON.stringify(output) + "\n");
	const count = Object.values(output).reduce((total, list) => total + list.length, 0);
	console.log(`Wrote ${count} photos for ${Object.keys(output).length} stops to ${publicFolder} and ${outputPath}`);

	if (reviewPath)
	{
		writeReviewSheet(days, places, output, selection);
	}
}

// A local page for reviewing the choice: every published photo, grouped by stop, with its original file name.
function writeReviewSheet(days, places, output, selection)
{
	const sections = Object.entries(output).map(([key, photos]) =>
	{
		const [dayNumber, stopIndex] = key.split(":").map(Number);
		const day = days.find((candidate) => candidate.dayNumber === dayNumber);
		const stop = day.stops[stopIndex];
		const cells = photos.map((photo, index) => `<figure><img src="${pathToFileURL(join(process.cwd(), "public", photo.thumbnailPath)).href}"><figcaption>${photo.takenAt} · ${selection[key][index]}</figcaption></figure>`).join("");
		return `<section><h2>Day ${dayNumber} · ${day.date} · stop ${stopIndex + 1}: ${stop.placeId} <small>(${key})</small></h2><div class="grid">${cells}</div></section>`;
	}).join("\n");
	writeFileSync(reviewPath, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Photo review</title>
<style>body{margin:0;padding:20px 16px;background:#f4f1ea;color:#1d2433;font:14px/1.4 system-ui,sans-serif}h1{font-size:20px}h2{font-size:15px;margin:22px 0 8px}small{color:#868e96;font-weight:400}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}figure{margin:0;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e3ddd0}img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block}figcaption{padding:5px 8px;font-size:11.5px;color:#5c6370;word-break:break-all}</style></head>
<body><h1>Photo review: ${tripId}</h1><p>Every photo that would be published, by stop. To drop one, tell Claude its file name (or delete it from ${selectionPath}).</p>${sections}</body></html>`);
	console.log(`Review sheet: ${reviewPath}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href)
{
	await main();
}
