import type { IPlace } from "../../itinerary/types";

/** Screen-space box a marker occupies, relative to its map coordinate, in pixels. */
export interface IMarkerFootprint
{
	left: number;
	top: number;
	width: number;
	height: number;
}

export const landmarkArtSize = 88;
// The illustration's ground line sits this far above the bottom of its 88px box.
export const landmarkGroundOffset = 82;
const pinSize = 34;
const labelHeight = 36;
// Room for the hover/current "lift" (translate and 1.12x scale) plus a little breathing space.
const landmarkMargin = 8;

function estimateLabelWidth(place: IPlace): number
{
	const englishWidth = place.name.length * 8.4 + 12;
	const japaneseWidth = (place.localName?.length ?? 0) * 12 + 12;
	return Math.max(englishWidth, japaneseWidth);
}

/** Returns whether a place is drawn as a full landmark illustration (rather than a pin) when not decluttered. */
export function isLandmark(place: IPlace): boolean
{
	return place.landmarkIconUrl !== undefined;
}

/** The box a stop's marker covers: the illustration plus its two-line label, or just the pin when compact. */
export function getMarkerFootprint(place: IPlace, isCompact: boolean): IMarkerFootprint
{
	if (!isLandmark(place) || isCompact)
	{
		return { left: -pinSize / 2, top: -pinSize / 2, width: pinSize, height: pinSize };
	}
	const scale = place.landmarkIconScale ?? 1;
	const artWidth = landmarkArtSize * scale;
	const width = Math.max(artWidth, estimateLabelWidth(place)) + landmarkMargin * 2;
	const top = -landmarkGroundOffset * scale - landmarkMargin;
	const bottom = (landmarkArtSize - landmarkGroundOffset) * scale + labelHeight + landmarkMargin / 2;
	return { left: -width / 2, top, width, height: bottom - top };
}

interface IPlacedBox
{
	left: number;
	top: number;
	right: number;
	bottom: number;
}

function toScreenBox(point: { x: number; y: number }, footprint: IMarkerFootprint): IPlacedBox
{
	return {
		left: point.x + footprint.left,
		top: point.y + footprint.top,
		right: point.x + footprint.left + footprint.width,
		bottom: point.y + footprint.top + footprint.height,
	};
}

function doBoxesOverlap(first: IPlacedBox, second: IPlacedBox): boolean
{
	return first.left < second.right && second.left < first.right && first.top < second.bottom && second.top < first.bottom;
}

/**
 * Decides which landmarks shrink to plain pins so markers don't cover each other.
 * The current stop is placed first and always stays full size; other landmarks keep their illustration only if it fits.
 */
export function findCompactStops(
	places: IPlace[],
	currentStopIndex: number,
	projectToScreen: (place: IPlace) => { x: number; y: number },
): Set<number>
{
	const placementOrder = places
		.map((place, stopIndex) => ({ place, stopIndex }))
		.sort((first, second) =>
		{
			const firstPriority = first.stopIndex === currentStopIndex ? 0 : isLandmark(first.place) ? 2 : 1;
			const secondPriority = second.stopIndex === currentStopIndex ? 0 : isLandmark(second.place) ? 2 : 1;
			if (firstPriority !== secondPriority)
			{
				return firstPriority - secondPriority;
			}
			return Math.abs(first.stopIndex - currentStopIndex) - Math.abs(second.stopIndex - currentStopIndex);
		});

	const placedBoxes: IPlacedBox[] = [];
	const compactStops = new Set<number>();
	for (const { place, stopIndex } of placementOrder)
	{
		const point = projectToScreen(place);
		const fullBox = toScreenBox(point, getMarkerFootprint(place, false));
		const isCurrent = stopIndex === currentStopIndex;
		const doesFullSizeFit = isCurrent || !isLandmark(place) || !placedBoxes.some((box) => doBoxesOverlap(box, fullBox));
		if (doesFullSizeFit)
		{
			placedBoxes.push(fullBox);
		}
		else
		{
			compactStops.add(stopIndex);
			placedBoxes.push(toScreenBox(point, getMarkerFootprint(place, true)));
		}
	}
	return compactStops;
}
