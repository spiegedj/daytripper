// Builds real-world paths for travel legs: rail segments follow OpenStreetMap track geometry, walking segments follow streets.
// Run by hand when legs change: node scripts/fetchTransitRoutes.mjs japan
// The output is committed, so the public site never calls these services at runtime.
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const tripId = process.argv[2] ?? "japan";
const tripFolder = `src/trips/${tripId}`;
const config = JSON.parse(readFileSync(`${tripFolder}/transitRoutes.json`, "utf8"));
const outputPath = `${tripFolder}/transitRoutes.generated.json`;
const requestHeaders = { "User-Agent": "daytripper-build-script/0.1" };

const overpassUrl = "https://overpass-api.de/api/interpreter";
const footRouterUrl = "https://routing.openstreetmap.de/routed-foot/route/v1/driving";
const searchMarginDegrees = 0.05;
const railSimplifyToleranceDegrees = 0.00008;

// Place coordinates live in places.ts; read them from its object literals so this script needs no TypeScript build.
function readPlaceCoordinates()
{
	const source = readFileSync(`${tripFolder}/places.ts`, "utf8");
	const coordinates = {};
	for (const match of source.matchAll(/(\w+):\s*\{[^}]*latitude:\s*([\d.]+),\s*longitude:\s*([\d.]+)/g))
	{
		coordinates[match[1]] = { latitude: Number(match[2]), longitude: Number(match[3]) };
	}
	return coordinates;
}

function readLegEndpoints(dayNumber, arrivalStopIndex)
{
	const source = readFileSync(`${tripFolder}/days.ts`, "utf8");
	const dayStart = source.indexOf(`dayNumber: ${dayNumber},`);
	const nextDayStart = source.indexOf("dayNumber:", dayStart + 1);
	const daySource = source.slice(dayStart, nextDayStart === -1 ? undefined : nextDayStart);
	const placeIds = [...daySource.matchAll(/placeId:\s*"(\w+)"/g)].map((match) => match[1]);
	return { fromPlaceId: placeIds[arrivalStopIndex - 1], toPlaceId: placeIds[arrivalStopIndex] };
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
			console.warn(`  ${response.status} from ${new URL(url).host}, retrying`);
		}
		catch (networkError)
		{
			console.warn(`  network error (${networkError.message}), retrying`);
		}
		await wait(attempt * 8000);
	}
	throw new Error(`Gave up on ${url}`);
}

function distanceKilometers(first, second)
{
	const toRadians = (degrees) => degrees * Math.PI / 180;
	const latitudeDelta = toRadians(second[1] - first[1]);
	const longitudeDelta = toRadians(second[0] - first[0]);
	const haversine = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(toRadians(first[1])) * Math.cos(toRadians(second[1])) * Math.sin(longitudeDelta / 2) ** 2;
	return 2 * 6371 * Math.asin(Math.sqrt(haversine));
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

const maximumGapKilometers = 0.25;

// Joins track pieces whose ends nearly touch, which papers over small mapping gaps such as junctions split across pieces.
function bridgeSmallGaps(ways, connect, nodePositions)
{
	const endpoints = [...new Set(ways.flatMap((way) => [way.nodes[0], way.nodes[way.nodes.length - 1]]))];
	const cellSize = 0.005;
	const grid = new Map();
	const cellKey = (position) => `${Math.floor(position[0] / cellSize)}:${Math.floor(position[1] / cellSize)}`;
	for (const id of endpoints)
	{
		const key = cellKey(nodePositions.get(id));
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

async function fetchRailPath(lineMatch, from, to)
{
	const south = Math.min(from.latitude, to.latitude) - searchMarginDegrees;
	const north = Math.max(from.latitude, to.latitude) + searchMarginDegrees;
	const west = Math.min(from.longitude, to.longitude) - searchMarginDegrees;
	const east = Math.max(from.longitude, to.longitude) + searchMarginDegrees;
	const bbox = `${south},${west},${north},${east}`;
	// Tunnels and bridges are often named after themselves, so the line's route relation is needed to get every piece of track.
	const query = `[out:json][timeout:180];(way["railway"~"^(rail|subway|light_rail)$"]["name"~"${lineMatch}"](${bbox});relation["route"~"^(train|subway|light_rail|railway)$"]["name"~"${lineMatch}"](${bbox});way(r)(${bbox}););out body;>;out skel qt;`;
	const result = await fetchWithRetry(overpassUrl, { method: "POST", body: new URLSearchParams({ data: query }) });

	const nodePositions = new Map();
	for (const element of result.elements.filter((element) => element.type === "node"))
	{
		nodePositions.set(element.id, [element.lon, element.lat]);
	}
	const neighbors = new Map();
	const connect = (first, second) =>
	{
		const weight = distanceKilometers(nodePositions.get(first), nodePositions.get(second));
		if (!neighbors.has(first))
		{
			neighbors.set(first, []);
		}
		neighbors.get(first).push([second, weight]);
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
	bridgeSmallGaps(ways, connect, nodePositions);
	console.log(`  ${lineMatch}: ${ways.length} track pieces, ${nodePositions.size} points`);

	const nearestNode = (target) =>
	{
		let bestId;
		let bestDistance = Infinity;
		for (const [id, position] of nodePositions)
		{
			if (!neighbors.has(id))
			{
				continue;
			}
			const distance = distanceKilometers(position, [target.longitude, target.latitude]);
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

	// Dijkstra over the track graph; a sorted frontier array is plenty for a few tens of thousands of points.
	const distances = new Map([[startId, 0]]);
	const previous = new Map();
	const frontier = [[0, startId]];
	const visited = new Set();
	while (frontier.length > 0)
	{
		const [distance, id] = frontier.shift();
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
				let insertAt = frontier.findIndex(([queuedDistance]) => queuedDistance > candidate);
				if (insertAt === -1)
				{
					insertAt = frontier.length;
				}
				frontier.splice(insertAt, 0, [candidate, neighborId]);
			}
		}
	}
	if (!visited.has(goalId))
	{
		throw new Error(`No connected track for ${lineMatch} between ${from.name} and ${to.name}`);
	}
	const path = [];
	for (let id = goalId; id !== undefined; id = previous.get(id))
	{
		path.unshift(nodePositions.get(id));
	}
	const straightLine = distanceKilometers([from.longitude, from.latitude], [to.longitude, to.latitude]);
	console.log(`  ${lineMatch}: ${from.name} → ${to.name}, ${distances.get(goalId).toFixed(1)} km along the track (${straightLine.toFixed(1)} km straight line)`);
	return simplify(path, railSimplifyToleranceDegrees);
}

async function fetchWalkingPath(from, to)
{
	const url = `${footRouterUrl}/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson`;
	const result = await fetchWithRetry(url);
	const coordinates = result.routes?.[0]?.geometry?.coordinates;
	if (!coordinates)
	{
		throw new Error(`No walking route from ${from.name} to ${to.name}`);
	}
	return coordinates;
}

function roundCoordinates(points)
{
	return points.map(([longitude, latitude]) => [Number(longitude.toFixed(5)), Number(latitude.toFixed(5))]);
}

async function main()
{
	const placeCoordinates = readPlaceCoordinates();
	const routes = {};
	for (const leg of config.legs)
	{
		const { fromPlaceId, toPlaceId } = readLegEndpoints(leg.dayNumber, leg.arrivalStopIndex);
		console.log(`Day ${leg.dayNumber}, ${fromPlaceId} → ${toPlaceId}`);
		let position = { name: fromPlaceId, ...placeCoordinates[fromPlaceId] };
		const segments = [];
		for (const segment of leg.segments)
		{
			const target = segment.to ?? { name: toPlaceId, ...placeCoordinates[toPlaceId] };
			// A rail segment may board at a slightly different spot than where the previous segment ended (another platform).
			const start = segment.from ?? position;
			const coordinates = segment.mode === "walk"
				? await fetchWalkingPath(start, target)
				: await fetchRailPath(segment.lineMatch, start, target);
			segments.push({ mode: segment.mode, coordinates: roundCoordinates(coordinates) });
			position = target;
			await wait(1500);
		}
		routes[`${leg.dayNumber}:${leg.arrivalStopIndex}`] = segments;
	}
	writeFileSync(outputPath, JSON.stringify(routes) + "\n");
	console.log(`Wrote ${Object.keys(routes).length} legs to ${outputPath}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href)
{
	await main();
}
