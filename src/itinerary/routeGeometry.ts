import { getDistanceKilometers } from "./tripOverview";
import type { ICoordinates, ILegSegment, TravelMode } from "./types";

const curveSampleCount = 32;
const curveBendRatio = 0.18;

/** Builds a gently curved line between two points, returned as GeoJSON [longitude, latitude] pairs. */
export function createCurvedLegCoordinates(start: ICoordinates, end: ICoordinates): [number, number][]
{
	const deltaLongitude = end.longitude - start.longitude;
	const deltaLatitude = end.latitude - start.latitude;
	const controlPoint =
	{
		longitude: start.longitude + deltaLongitude / 2 - deltaLatitude * curveBendRatio,
		latitude: start.latitude + deltaLatitude / 2 + deltaLongitude * curveBendRatio,
	};

	const coordinates: [number, number][] = [];
	for (let sampleIndex = 0; sampleIndex <= curveSampleCount; sampleIndex++)
	{
		const progress = sampleIndex / curveSampleCount;
		const remaining = 1 - progress;
		coordinates.push(
		[
			remaining * remaining * start.longitude + 2 * remaining * progress * controlPoint.longitude + progress * progress * end.longitude,
			remaining * remaining * start.latitude + 2 * remaining * progress * controlPoint.latitude + progress * progress * end.latitude,
		]);
	}
	return coordinates;
}

/** Key used to look up a leg's real path: the day number and the index of the stop the leg arrives at. */
export function getLegPathKey(dayNumber: number, arrivalStopIndex: number): string
{
	return `${dayNumber}:${arrivalStopIndex}`;
}

/** A leg's path as segments: the real path when one was generated, otherwise a single curved segment. */
export function getLegSegments(
	legPaths: Record<string, ILegSegment[]>,
	dayNumber: number,
	arrivalStopIndex: number,
	start: ICoordinates,
	end: ICoordinates,
	mode: TravelMode,
): ILegSegment[]
{
	return legPaths[getLegPathKey(dayNumber, arrivalStopIndex)] ?? [{ mode, coordinates: createCurvedLegCoordinates(start, end) }];
}

/** Length of a path of [longitude, latitude] pairs, following every bend. */
export function getPathLengthKilometers(coordinates: [number, number][]): number
{
	let total = 0;
	for (let index = 1; index < coordinates.length; index++)
	{
		total += getDistanceKilometers(
			{ longitude: coordinates[index - 1][0], latitude: coordinates[index - 1][1] },
			{ longitude: coordinates[index][0], latitude: coordinates[index][1] },
		);
	}
	return total;
}

const shortestLegTravelMilliseconds = 1100;
const longestLegTravelMilliseconds = 4000;

/**
 * How long the map takes to travel a leg. It grows with distance but flattens out, so a walk takes about
 * a second and a half and a Shinkansen ride a few seconds. The route drawing and the camera share this timing.
 */
export function getLegTravelMilliseconds(coordinates: [number, number][]): number
{
	const duration = shortestLegTravelMilliseconds + 700 * Math.log2(1 + getPathLengthKilometers(coordinates));
	return Math.min(duration, longestLegTravelMilliseconds);
}

/** The easing shared by the route drawing and the camera following it: slow start, steady middle, gentle arrival. */
export function easeLegTravel(progress: number): number
{
	return progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
}
