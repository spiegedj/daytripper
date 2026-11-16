// Builds real-world paths for every travel leg of a trip.
// Walks follow streets and trails, buses follow roads, rail follows OpenStreetMap track geometry, boats follow the river,
// and ferries, ropeways and flights are drawn as arcs. Legs whose arrival mode is "walk" need no configuration.
// Run by hand when legs change: node scripts/fetchTransitRoutes.mjs japan [--only=6:1]
// The output is committed, so the public site never calls these services at runtime.
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const tripId = process.argv[2] ?? "japan";
const onlyLegKey = process.argv.find((argument) => argument.startsWith("--only="))?.slice("--only=".length);
const tripFolder = `src/trips/${tripId}`;
const config = JSON.parse(readFileSync(`${tripFolder}/transitRoutes.json`, "utf8"));
const outputPath = `${tripFolder}/transitRoutes.generated.json`;
const requestHeaders = { "User-Agent": "daytripper-build-script/0.1" };

const overpassUrl = "https://overpass-api.de/api/interpreter";
const footRouterUrl = "https://routing.openstreetmap.de/routed-foot/route/v1/driving";
const carRouterUrl = "https://routing.openstreetmap.de/routed-car/route/v1/driving";
const searchMarginDegrees = 0.05;
const simplifyToleranceDegrees = 0.00006;
const maximumGapKilometers = 0.25;
const arcModes = new Set(["ferry", "ropeway", "flight"]);

// Place coordinates live in places.ts; read them from its object literals so this script needs no TypeScript build.
function readPlaceCoordinates()
{
	const source = readFileSync(`${tripFolder}/places.ts`, "utf8");
	const coordinates = {};
	for (const match of source.matchAll(/(\w+):\s*\{[^}]*latitude:\s*(-?[\d.]+),\s*longitude:\s*(-?[\d.]+)/g))
	{
		coordinates[match[1]] = { latitude: Number(match[2]), longitude: Number(match[3]) };
	}
	return coordinates;
}

// Reads each day's stops (place id and arrival mode) from days.ts.
function readDays()
{
	const source = readFileSync(`${tripFolder}/days.ts`, "utf8");
	const days = [];
	const dayStarts = [...source.matchAll(/dayNumber:\s*(\d+),/g)];
	dayStarts.forEach((match, index) =>
	{
		const daySource = source.slice(match.index, dayStarts[index + 1]?.index);
		// Any leg helper works (guessed("train", ...), traveled("walk"), ...); the arrival must come right after the place id.
		const stops = [...daySource.matchAll(/\{\s*placeId:\s*"(\w+)"(?:,\s*arrival:\s*\w+\("(\w+)")?/g)]
			.map((stopMatch) => ({ placeId: stopMatch[1], arrivalMode: stopMatch[2] }));
		days.push({ dayNumber: Number(match[1]), stops });
	});
	return days;
}

function wait(milliseconds)
{
	return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchWithRetry(url, options)
{
	for (let attempt = 1; attempt <= 4; attempt++)
	{
		try
		{
			const response = await fetch(url, { ...options, headers: { ...requestHeaders, ...options?.headers } });
			if (response.ok)
			{
				return response.json();
			}
			console.warn(`    ${response.status} from ${new URL(url).host}, retrying`);
		}
		catch (networkError)
		{
			console.warn(`    network error (${networkError.message}), retrying`);
		}
		await wait(attempt * 8000);
	}
	throw new Error(`Gave up on ${new URL(url).host}`);
}

function distanceKilometers(first, second)
{
	const toRadians = (degrees) => degrees * Math.PI / 180;
	const latitudeDelta = toRadians(second[1] - first[1]);
	const longitudeDelta = toRadians(second[0] - first[0]);
	const haversine = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(toRadians(first[1])) * Math.cos(toRadians(second[1])) * Math.sin(longitudeDelta / 2) ** 2;
	return 2 * 6371 * Math.asin(Math.sqrt(haversine));
}

// Same gentle curve the app draws when no real path exists, so arcs look identical either way.
function createArc(from, to)
{
	const deltaLongitude = to.longitude - from.longitude;
	const deltaLatitude = to.latitude - from.latitude;
	const control = [from.longitude + deltaLongitude / 2 - deltaLatitude * 0.18, from.latitude + deltaLatitude / 2 + deltaLongitude * 0.18];
	const points = [];
	for (let sample = 0; sample <= 32; sample++)
	{
		const progress = sample / 32;
		const remaining = 1 - progress;
		points.push([
			remaining * remaining * from.longitude + 2 * remaining * progress * control[0] + progress * progress * to.longitude,
			remaining * remaining * from.latitude + 2 * remaining * progress * control[1] + progress * progress * to.latitude,
		]);
	}
	return points;
}

// Douglas–Peucker: drops points that barely change the line's shape, keeping files small.
function simplify(points, tolerance)
{
	if (points.length < 3)
	{
		return points;
	}
	const [startX, startY] = points[0];
	const [endX, endY] = points[points.length - 1];
	const lengthSquared = (endX - startX) ** 2 + (endY - startY) ** 2 || 1e-12;
	let farthestIndex = 0;
	let farthestDistance = 0;
	for (let index = 1; index < points.length - 1; index++)
	{
		const [pointX, pointY] = points[index];
		const projection = Math.max(0, Math.min(1, ((pointX - startX) * (endX - startX) + (pointY - startY) * (endY - startY)) / lengthSquared));
		const distance = Math.hypot(pointX - (startX + projection * (endX - startX)), pointY - (startY + projection * (endY - startY)));
		if (distance > farthestDistance)
		{
			farthestDistance = distance;
			farthestIndex = index;
		}
	}
	if (farthestDistance <= tolerance)
	{
		return [points[0], points[points.length - 1]];
	}
	return [...simplify(points.slice(0, farthestIndex + 1), tolerance).slice(0, -1), ...simplify(points.slice(farthestIndex), tolerance)];
}

// Joins track pieces whose ends nearly touch, which papers over small mapping gaps such as junctions split across pieces.
function bridgeSmallGaps(ways, connect, nodePositions)
{
	const endpoints = [...new Set(ways.flatMap((way) => [way.nodes[0], way.nodes[way.nodes.length - 1]]))];
	const cellSize = 0.005;
	const grid = new Map();
	for (const id of endpoints)
	{
		const [longitude, latitude] = nodePositions.get(id);
		const key = `${Math.floor(longitude / cellSize)}:${Math.floor(latitude / cellSize)}`;
		grid.set(key, [...(grid.get(key) ?? []), id]);
	}
	for (const id of endpoints)
	{
		const [longitude, latitude] = nodePositions.get(id);
		for (let dx = -1; dx <= 1; dx++)
		{
			for (let dy = -1; dy <= 1; dy++)
			{
				const key = `${Math.floor(longitude / cellSize) + dx}:${Math.floor(latitude / cellSize) + dy}`;
				for (const otherId of grid.get(key) ?? [])
				{
					if (otherId !== id && distanceKilometers(nodePositions.get(id), nodePositions.get(otherId)) <= maximumGapKilometers)
					{
						connect(id, otherId);
					}
				}
			}
		}
	}
}

function buildOverpassQuery(segment, bbox)
{
	if (segment.mode === "boat")
	{
		return `[out:json][timeout:180];way["waterway"~"^(river|canal)$"]["name"~"${segment.waterwayMatch}"](${bbox});out body;>;out skel qt;`;
	}
	const railway = segment.railway ?? "rail|subway|light_rail|monorail|tram|narrow_gauge";
	if (!segment.lineMatch)
	{
		return `[out:json][timeout:180];way["railway"~"^(${railway})$"](${bbox});out body;>;out skel qt;`;
	}
	// Tunnels and bridges are often named after themselves, so the line's route relation is needed to get every piece of track.
	return `[out:json][timeout:180];(way["railway"~"^(${railway})$"]["name"~"${segment.lineMatch}"](${bbox});`
		+ `relation["route"~"^(train|subway|light_rail|monorail|tram|railway)$"]["name"~"${segment.lineMatch}"](${bbox});way(r)(${bbox}););out body;>;out skel qt;`;
}

// Shortest path along matching OpenStreetMap ways (rail tracks or a river) between the points nearest two stations.
async function fetchTrackPath(segment, from, to)
{
	const south = Math.min(from.latitude, to.latitude) - searchMarginDegrees;
	const north = Math.max(from.latitude, to.latitude) + searchMarginDegrees;
	const west = Math.min(from.longitude, to.longitude) - searchMarginDegrees;
	const east = Math.max(from.longitude, to.longitude) + searchMarginDegrees;
	const result = await fetchWithRetry(overpassUrl, { method: "POST", body: new URLSearchParams({ data: buildOverpassQuery(segment, `${south},${west},${north},${east}`) }) });

	const nodePositions = new Map(result.elements.filter((element) => element.type === "node").map((node) => [node.id, [node.lon, node.lat]]));
	const neighbors = new Map();
	const connect = (first, second) =>
	{
		const weight = distanceKilometers(nodePositions.get(first), nodePositions.get(second));
		neighbors.set(first, [...(neighbors.get(first) ?? []), [second, weight]]);
	};
	const ways = result.elements.filter((element) => element.type === "way");
	for (const way of ways)
	{
		for (let index = 1; index < way.nodes.length; index++)
		{
			connect(way.nodes[index - 1], way.nodes[index]);
			connect(way.nodes[index], way.nodes[index - 1]);
		}
	}
	if (ways.length === 0)
	{
		throw new Error("no matching track or river found");
	}
	bridgeSmallGaps(ways, connect, nodePositions);

	const nearestNode = (target) =>
	{
		let bestId;
		let bestDistance = Infinity;
		for (const id of neighbors.keys())
		{
			const distance = distanceKilometers(nodePositions.get(id), [target.longitude, target.latitude]);
			if (distance < bestDistance)
			{
				bestDistance = distance;
				bestId = id;
			}
		}
		return bestId;
	};
	const startId = nearestNode(from);
	const goalId = nearestNode(to);

	// Dijkstra with a binary heap; track graphs here reach tens of thousands of points.
	const distances = new Map([[startId, 0]]);
	const previous = new Map();
	const heap = [[0, startId]];
	const push = (entry) =>
	{
		heap.push(entry);
		let index = heap.length - 1;
		while (index > 0)
		{
			const parent = (index - 1) >> 1;
			if (heap[parent][0] <= heap[index][0])
			{
				break;
			}
			[heap[parent], heap[index]] = [heap[index], heap[parent]];
			index = parent;
		}
	};
	const pop = () =>
	{
		const top = heap[0];
		const last = heap.pop();
		if (heap.length > 0)
		{
			heap[0] = last;
			let index = 0;
			for (;;)
			{
				const left = index * 2 + 1;
				const right = left + 1;
				let smallest = index;
				if (left < heap.length && heap[left][0] < heap[smallest][0])
				{
					smallest = left;
				}
				if (right < heap.length && heap[right][0] < heap[smallest][0])
				{
					smallest = right;
				}
				if (smallest === index)
				{
					break;
				}
				[heap[smallest], heap[index]] = [heap[index], heap[smallest]];
				index = smallest;
			}
		}
		return top;
	};
	const visited = new Set();
	while (heap.length > 0)
	{
		const [distance, id] = pop();
		if (visited.has(id))
		{
			continue;
		}
		visited.add(id);
		if (id === goalId)
		{
			break;
		}
		for (const [neighborId, weight] of neighbors.get(id) ?? [])
		{
			const candidate = distance + weight;
			if (candidate < (distances.get(neighborId) ?? Infinity))
			{
				distances.set(neighborId, candidate);
				previous.set(neighborId, id);
				push([candidate, neighborId]);
			}
		}
	}
	if (!visited.has(goalId))
	{
		throw new Error("track pieces found but not connected between the two stations");
	}
	const path = [];
	for (let id = goalId; id !== undefined; id = previous.get(id))
	{
		path.unshift(nodePositions.get(id));
	}
	const straightLine = distanceKilometers([from.longitude, from.latitude], [to.longitude, to.latitude]);
	const ratio = distances.get(goalId) / Math.max(straightLine, 0.1);
	console.log(`    ${distances.get(goalId).toFixed(1)} km along the way (${straightLine.toFixed(1)} km straight${ratio > 1.8 ? ", CHECK: long detour" : ""})`);
	return path;
}

async function fetchRoadPath(routerUrl, from, to)
{
	const url = `${routerUrl}/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson`;
	const result = await fetchWithRetry(url);
	const coordinates = result.routes?.[0]?.geometry?.coordinates;
	if (!coordinates)
	{
		throw new Error("router returned no route");
	}
	return coordinates;
}

async function buildSegmentPath(segment, from, to)
{
	if (arcModes.has(segment.mode))
	{
		return createArc(from, to);
	}
	// Hill paths the foot router doesn't know: draw the stretch straight between known positions (photo GPS) instead of a long detour.
	if (segment.isStraight)
	{
		return [[from.longitude, from.latitude], [to.longitude, to.latitude]];
	}
	if (segment.mode === "walk")
	{
		return fetchRoadPath(footRouterUrl, from, to);
	}
	if (segment.mode === "bus")
	{
		return fetchRoadPath(carRouterUrl, from, to);
	}
	return fetchTrackPath(segment, from, to);
}

function roundCoordinates(points)
{
	return points.map(([longitude, latitude]) => [Number(longitude.toFixed(5)), Number(latitude.toFixed(5))]);
}

// A waypoint just off the path makes the router walk out to it and straight back; drop that out-and-back where two walks meet.
function trimWaypointSpurs(segments)
{
	const spurToleranceKilometers = 0.012;
	for (let index = 0; index + 1 < segments.length; index++)
	{
		const incoming = segments[index].coordinates;
		const outgoing = segments[index + 1].coordinates;
		if (segments[index].mode !== "walk" || segments[index + 1].mode !== "walk")
		{
			continue;
		}
		while (incoming.length > 2 && outgoing.length > 2 && distanceKilometers(incoming[incoming.length - 2], outgoing[1]) < spurToleranceKilometers)
		{
			incoming.pop();
			outgoing.shift();
		}
		outgoing[0] = incoming[incoming.length - 1];
	}
}

async function main()
{
	const placeCoordinates = readPlaceCoordinates();
	const configuredLegs = new Map(config.legs.map((leg) => [`${leg.dayNumber}:${leg.arrivalStopIndex}`, leg.segments]));
	let routes = {};
	try
	{
		routes = onlyLegKey ? JSON.parse(readFileSync(outputPath, "utf8")) : {};
	}
	catch
	{
		routes = {};
	}

	const problems = [];
	for (const day of readDays())
	{
		for (let arrivalStopIndex = 1; arrivalStopIndex < day.stops.length; arrivalStopIndex++)
		{
			const legKey = `${day.dayNumber}:${arrivalStopIndex}`;
			if (onlyLegKey && legKey !== onlyLegKey)
			{
				continue;
			}
			const fromPlaceId = day.stops[arrivalStopIndex - 1].placeId;
			const toPlaceId = day.stops[arrivalStopIndex].placeId;
			const segmentPlan = configuredLegs.get(legKey) ?? (day.stops[arrivalStopIndex].arrivalMode === "walk" ? [{ mode: "walk" }] : undefined);
			if (!segmentPlan)
			{
				problems.push(`${legKey} (${fromPlaceId} → ${toPlaceId}): no route configured, drawn as an arc`);
				continue;
			}
			console.log(`Day ${legKey} ${fromPlaceId} → ${toPlaceId}`);

			const destination = { name: toPlaceId, ...placeCoordinates[toPlaceId] };
			let position = { name: fromPlaceId, ...placeCoordinates[fromPlaceId] };
			const segments = [];
			for (const segment of segmentPlan)
			{
				const target = segment.to ?? destination;
				// A rail segment may board at a slightly different spot than where the previous segment ended (another platform).
				const start = segment.from ?? position;
				const label = segment.lineMatch ?? segment.waterwayMatch ?? segment.railway ?? segment.mode;
				console.log(`  ${segment.mode} ${label}: ${start.name} → ${target.name}`);
				let coordinates;
				try
				{
					// A return trip on the same bus line retraces an earlier leg's path backwards instead of being routed afresh.
					const retraced = segment.reverseOf ? routes[segment.reverseOf.leg]?.[segment.reverseOf.segment] : undefined;
					if (segment.reverseOf && !retraced)
					{
						throw new Error(`leg ${segment.reverseOf.leg} segment ${segment.reverseOf.segment} has no path to retrace`);
					}
					coordinates = retraced ? [...retraced.coordinates].reverse() : await buildSegmentPath(segment, start, target);
				}
				catch (error)
				{
					problems.push(`${legKey} ${segment.mode} ${label} (${start.name} → ${target.name}): ${error.message}, drawn as an arc`);
					coordinates = createArc(start, target);
				}
				segments.push({ mode: segment.mode, coordinates: roundCoordinates(simplify(coordinates, simplifyToleranceDegrees)) });
				position = target;
				await wait(arcModes.has(segment.mode) ? 0 : 1200);
			}
			trimWaypointSpurs(segments);
			routes[legKey] = segments;
		}
	}

	writeFileSync(outputPath, JSON.stringify(routes) + "\n");
	console.log(`\nWrote ${Object.keys(routes).length} legs to ${outputPath}`);
	if (problems.length > 0)
	{
		console.log(`\nNeeds attention:\n${problems.join("\n")}`);
	}
}

if (import.meta.url === pathToFileURL(process.argv[1]).href)
{
	await main();
}
