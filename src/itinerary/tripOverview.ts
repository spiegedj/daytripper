import type { ICoordinates, IDay, ITrip, PlaceCategory } from "./types";

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
