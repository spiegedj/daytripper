import type { ICoordinates } from "./types";

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
