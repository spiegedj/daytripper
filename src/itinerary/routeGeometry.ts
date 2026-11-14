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
