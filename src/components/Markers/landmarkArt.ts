import type { ILandmarkBounds, IPlace } from "../../itinerary/types";

/** How long the longest side of every landmark drawing is at full size, in pixels at the 88 px base. */
const drawingLongestSide = 124;
/** The base size of a landmark image's square box, which CSS multiplies by the landmark's scale. */
export const landmarkArtSize = 88;
/** Used until an image's drawn area is known: the whole width, standing 7% above the bottom like the illustrations. */
export const defaultLandmarkBounds: ILandmarkBounds = { left: 0, top: 0, right: 1, bottom: 0.932 };

export function getLandmarkBounds(place: IPlace): ILandmarkBounds
{
	return place.landmarkBounds ?? defaultLandmarkBounds;
}

/**
 * How much a landmark's image is enlarged so its drawing, rather than its canvas, comes out at one common size:
 * the drawing's longest side becomes drawingLongestSide. A place's own landmarkIconScale nudges that when needed.
 */
export function getLandmarkArtScale(place: IPlace): number
{
	const bounds = getLandmarkBounds(place);
	const longestShare = Math.max(bounds.right - bounds.left, bounds.bottom - bounds.top);
	return drawingLongestSide / (landmarkArtSize * longestShare) * (place.landmarkIconScale ?? 1);
}

/** The CSS variables that size a landmark image and place its badge and ground ring on the drawing. */
export function getLandmarkArtVariables(place: IPlace): Record<string, number>
{
	const bounds = getLandmarkBounds(place);
	return {
		"--landmark-scale": getLandmarkArtScale(place),
		"--art-top": bounds.top,
		"--art-right": bounds.right,
		"--art-bottom": bounds.bottom,
	};
}

/** Keys a trip's landmark image imports by place id (the file name), preferring a PNG over an SVG of the same name. */
export function keyLandmarkFiles<TValue>(modules: Record<string, TValue>): Record<string, TValue>
{
	return Object.fromEntries(
		Object.entries(modules)
			.sort(([first], [second]) => Number(first.endsWith(".png")) - Number(second.endsWith(".png")))
			.map(([path, value]) => [path.replace("./", "").replace(/\.(svg|png)$/, ""), value]),
	);
}
