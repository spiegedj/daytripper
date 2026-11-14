import type { ICoordinates, IDay, IPlace, ITrip, PlaceCategory } from "./types";

/** Consecutive days spent based in the same city. */
export interface ICityStay
{
	city: string;
	dayIndexes: number[];
}

/** A day spent mostly away from its base city, such as a day trip to Nikkō. */
export interface IDayTrip
{
	dayIndex: number;
	coordinates: ICoordinates;
	/** The side the badge extends toward: away from the nearest city, so it doesn't sit on that city's badge. */
	extendsToward: "east" | "west";
}

const dayTripMinimumKilometers = 30;
const dayTripClusterKilometers = 15;
const placesThatAreNotDestinations: PlaceCategory[] = ["hotel", "station", "airport"];

/** Groups consecutive days by the city you sleep in. A city visited twice (like Tokyo at both ends) forms two stays. */
export function groupDaysByCity(days: IDay[]): ICityStay[]
{
	const stays: ICityStay[] = [];
	days.forEach((day, dayIndex) =>
	{
		const lastStay = stays[stays.length - 1];
		if (lastStay && lastStay.city === day.baseCity)
		{
			lastStay.dayIndexes.push(dayIndex);
		}
		else
		{
			stays.push({ city: day.baseCity, dayIndexes: [dayIndex] });
		}
	});
	return stays;
}

/** Straight-line distance between two points on Earth. */
export function getDistanceKilometers(start: ICoordinates, end: ICoordinates): number
{
	const earthRadiusKilometers = 6371;
	const toRadians = (degrees: number) => degrees * Math.PI / 180;
	const latitudeDelta = toRadians(end.latitude - start.latitude);
	const longitudeDelta = toRadians(end.longitude - start.longitude);
	const haversine = Math.sin(latitudeDelta / 2) ** 2
		+ Math.cos(toRadians(start.latitude)) * Math.cos(toRadians(end.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
	return 2 * earthRadiusKilometers * Math.asin(Math.sqrt(haversine));
}

function getCentroid(points: ICoordinates[]): ICoordinates
{
	return {
		latitude: points.reduce((sum, point) => sum + point.latitude, 0) / points.length,
		longitude: points.reduce((sum, point) => sum + point.longitude, 0) / points.length,
	};
}

/**
 * Finds days whose sights lie well away from the base city. The farthest sight marks the destination,
 * and the badge sits at the middle of the sights clustered around it.
 */
export function findDayTrips(trip: ITrip): IDayTrip[]
{
	const dayTrips: IDayTrip[] = [];
	trip.days.forEach((day, dayIndex) =>
	{
		const city = trip.cities.find((candidate) => candidate.name === day.baseCity);
		if (!city)
		{
			return;
		}
		const sights = day.stops
			.map((stop) => trip.places[stop.placeId])
			.filter((place) => !placesThatAreNotDestinations.includes(place.category));
		if (sights.length === 0)
		{
			return;
		}
		const farthestSight = sights.reduce((farthest, sight) =>
			getDistanceKilometers(city.coordinates, sight.coordinates) > getDistanceKilometers(city.coordinates, farthest.coordinates) ? sight : farthest);
		if (getDistanceKilometers(city.coordinates, farthestSight.coordinates) < dayTripMinimumKilometers)
		{
			return;
		}
		const cluster = sights.filter((sight) => getDistanceKilometers(sight.coordinates, farthestSight.coordinates) <= dayTripClusterKilometers);
		const coordinates = getCentroid(cluster.map((sight) => sight.coordinates));
		const nearestCity = trip.cities.reduce((nearest, candidate) =>
			getDistanceKilometers(coordinates, candidate.coordinates) < getDistanceKilometers(coordinates, nearest.coordinates) ? candidate : nearest);
		dayTrips.push({ dayIndex, coordinates, extendsToward: coordinates.longitude >= nearestCity.coordinates.longitude ? "east" : "west" });
	});
	return dayTrips;
}

/** Formats day numbers as compact ranges, for example [1, 2, 3, 4, 5, 15] becomes "1–5, 15". */
export function formatDayRanges(dayNumbers: number[]): string
{
	const sortedNumbers = [...dayNumbers].sort((first, second) => first - second);
	const ranges: string[] = [];
	let rangeStart = sortedNumbers[0];
	for (let index = 1; index <= sortedNumbers.length; index++)
	{
		const previous = sortedNumbers[index - 1];
		if (sortedNumbers[index] !== previous + 1)
		{
			ranges.push(rangeStart === previous ? `${rangeStart}` : `${rangeStart}–${previous}`);
			rangeStart = sortedNumbers[index];
		}
	}
	return ranges.join(", ");
}

/** One neighborhood explored on a day, such as Odaiba on the Imperial Palace & Odaiba day. */
export interface IExploredArea
{
	dayIndex: number;
	places: IPlace[];
	/** Closed ring of [longitude, latitude] pairs: a rounded outline around the area's sights. */
	outline: [number, number][];
	/** Bottom of the outline, where the area's badge hangs. Landmark illustrations rise upward from their sights, so below stays clear. */
	badgeCoordinates: ICoordinates;
	/** True for the day's area with the most sights, which carries the full title; other areas get only the day number. */
	isMainArea: boolean;
}

// Sights closer than this to each other count as the same neighborhood.
const neighborhoodLinkKilometers = 2.2;
const areaPaddingMeters = 380;
const areaOutlinePointsPerSight = 20;

function groupIntoNeighborhoods(places: IPlace[]): IPlace[][]
{
	const neighborhoods: IPlace[][] = [];
	places.forEach((place) =>
	{
		const touching = neighborhoods.filter((neighborhood) =>
			neighborhood.some((member) => getDistanceKilometers(member.coordinates, place.coordinates) <= neighborhoodLinkKilometers));
		const merged = [place, ...touching.flat()];
		touching.forEach((neighborhood) => neighborhoods.splice(neighborhoods.indexOf(neighborhood), 1));
		neighborhoods.push(merged);
	});
	return neighborhoods;
}

function getConvexHull(points: [number, number][]): [number, number][]
{
	const sorted = [...points].sort((first, second) => first[0] - second[0] || first[1] - second[1]);
	const cross = (origin: [number, number], first: [number, number], second: [number, number]) =>
		(first[0] - origin[0]) * (second[1] - origin[1]) - (first[1] - origin[1]) * (second[0] - origin[0]);
	const buildChain = (ordered: [number, number][]) =>
	{
		const chain: [number, number][] = [];
		ordered.forEach((point) =>
		{
			while (chain.length >= 2 && cross(chain[chain.length - 2], chain[chain.length - 1], point) <= 0)
			{
				chain.pop();
			}
			chain.push(point);
		});
		chain.pop();
		return chain;
	};
	return [...buildChain(sorted), ...buildChain([...sorted].reverse())];
}

function buildAreaOutline(places: IPlace[]): [number, number][]
{
	// A ring of points around every sight, then the hull around all of them, gives an outline with rounded ends.
	const metersPerDegreeLatitude = 111320;
	const ringPoints = places.flatMap((place) =>
	{
		const { latitude, longitude } = place.coordinates;
		const metersPerDegreeLongitude = metersPerDegreeLatitude * Math.cos(latitude * Math.PI / 180);
		return Array.from({ length: areaOutlinePointsPerSight }, (_, index): [number, number] =>
		{
			const angle = (index / areaOutlinePointsPerSight) * Math.PI * 2;
			return [
				longitude + Math.cos(angle) * areaPaddingMeters / metersPerDegreeLongitude,
				latitude + Math.sin(angle) * areaPaddingMeters / metersPerDegreeLatitude,
			];
		});
	});
	const hull = getConvexHull(ringPoints);
	return [...hull, hull[0]];
}

/**
 * Splits each day's sights into the neighborhoods explored, each with a rounded outline for the map.
 * Hotels, stations and airports are left out because passing through them isn't exploring.
 */
export function findExploredAreas(trip: ITrip): IExploredArea[]
{
	return trip.days.flatMap((day, dayIndex) =>
	{
		const sights = day.stops
			.map((stop) => trip.places[stop.placeId])
			.filter((place, index, places) => !placesThatAreNotDestinations.includes(place.category) && places.indexOf(place) === index);
		const neighborhoods = groupIntoNeighborhoods(sights);
		const largestSize = Math.max(...neighborhoods.map((neighborhood) => neighborhood.length));
		const mainNeighborhood = neighborhoods.find((neighborhood) => neighborhood.length === largestSize);
		return neighborhoods.map((places): IExploredArea =>
		{
			const outline = buildAreaOutline(places);
			const bottom = outline.reduce((lowest, point) => (point[1] < lowest[1] ? point : lowest));
			return {
				dayIndex,
				places,
				outline,
				badgeCoordinates: { longitude: getCentroid(places.map((place) => place.coordinates)).longitude, latitude: bottom[1] },
				isMainArea: places === mainNeighborhood,
			};
		});
	});
}
