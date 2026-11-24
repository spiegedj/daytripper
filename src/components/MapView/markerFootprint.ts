import type { IPlace } from "../../itinerary/types";
import { getLandmarkArtScale, getLandmarkBounds, landmarkArtSize } from "../Markers/landmarkArt";

/** Screen-space box a marker occupies, relative to its map coordinate, in pixels. */
export interface IMarkerFootprint
{
	left: number;
	top: number;
	width: number;
	height: number;
}

// Landmarks that don't fit at full size shrink to this smaller illustration, so they stay recognizable.
const miniLandmarkSize = 46;
const pinSize = 34;
const labelHeight = 36;
// Room for the hover/current "lift" (translate and 1.12x scale) plus a little breathing space.
const landmarkMargin = 8;

// Landmarks are drawn at full size from this zoom in (a single stop's view) and halve for every
// zoomLevelsPerHalving levels further out, so they don't cover a zoomed-out map. They never shrink below the
// floor, so they stay recognizable on a day's overview.
const fullSizeZoom = 15;
const zoomLevelsPerHalving = 2;
const minimumZoomFactor = 0.8;
// Below this zoom factor only the current stop's and a hovered landmark's names show; the rest would crowd the map.
const labelZoomFactor = 0.9;
// Small maps (phones) draw landmarks smaller, scaled by the map's shorter side against a desktop-sized map.
const referenceMapSide = 720;
const minimumScreenFactor = 0.6;

/** How big landmarks are drawn at the map's current zoom and size, and whether their names show. */
export interface ILandmarkSizing
{
	/** Multiplies every landmark's drawn size; 1 at a single stop's zoom on a desktop-sized map. */
	sizeFactor: number;
	areLabelsShown: boolean;
}

export const fullLandmarkSizing: ILandmarkSizing = { sizeFactor: 1, areLabelsShown: true };

/** Works out the landmark sizing for a zoom level and a map of the given size in pixels. */
export function getLandmarkSizing(zoom: number, mapWidth: number, mapHeight: number): ILandmarkSizing
{
	const zoomFactor = Math.min(1, Math.max(minimumZoomFactor, 2 ** ((zoom - fullSizeZoom) / zoomLevelsPerHalving)));
	const screenFactor = Math.min(1, Math.max(minimumScreenFactor, Math.min(mapWidth, mapHeight) / referenceMapSide));
	return { sizeFactor: zoomFactor * screenFactor, areLabelsShown: zoomFactor >= labelZoomFactor };
}

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

/**
 * The box a stop's marker covers: the drawn part of the illustration plus its two-line label (when names show), the
 * small illustration when compact, or a pin. The empty canvas around a drawing doesn't count. Landmarks follow the
 * sizing; pins and labels keep their size at every zoom.
 */
export function getMarkerFootprint(place: IPlace, isCompact: boolean, sizing: ILandmarkSizing = fullLandmarkSizing): IMarkerFootprint
{
	if (!isLandmark(place))
	{
		return { left: -pinSize / 2, top: -pinSize / 2, width: pinSize, height: pinSize };
	}
	const bounds = getLandmarkBounds(place);
	// The image is a square of this many pixels, standing with its drawing's base on the place.
	const imageSize = (isCompact ? miniLandmarkSize : landmarkArtSize) * getLandmarkArtScale(place) * sizing.sizeFactor;
	const drawingLeft = (bounds.left - 0.5) * imageSize;
	const drawingRight = (bounds.right - 0.5) * imageSize;
	const drawingTop = (bounds.top - bounds.bottom) * imageSize;
	const belowGround = (1 - bounds.bottom) * imageSize;
	if (isCompact)
	{
		return { left: drawingLeft, top: drawingTop, width: drawingRight - drawingLeft, height: belowGround - drawingTop };
	}
	const halfLabelWidth = sizing.areLabelsShown ? estimateLabelWidth(place) / 2 : 0;
	const left = Math.min(drawingLeft, -halfLabelWidth) - landmarkMargin;
	const right = Math.max(drawingRight, halfLabelWidth) + landmarkMargin;
	const top = drawingTop - landmarkMargin;
	const bottom = belowGround + (sizing.areLabelsShown ? labelHeight : 0) + landmarkMargin / 2;
	return { left, top, width: right - left, height: bottom - top };
}

interface IPlacedBox
{
	left: number;
	top: number;
	right: number;
	bottom: number;
}

function toScreenBox(point: { x: number; y: number; }, footprint: IMarkerFootprint): IPlacedBox
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
 * Decides which landmarks shrink to their small illustration so landmarks don't cover each other.
 * Only landmarks count: an ordinary pin (a café, a hotel) may sit under the edge of an illustration rather than shrink it.
 * The current stop is placed first and always stays full size; other landmarks keep their illustration only if it fits.
 */
export function findCompactStops(
	places: IPlace[],
	currentStopIndex: number,
	projectToScreen: (place: IPlace) => { x: number; y: number; },
	sizing: ILandmarkSizing,
): Set<number>
{
	const placementOrder = places
		.map((place, stopIndex) => ({ place, stopIndex }))
		.filter(({ place }) => isLandmark(place))
		.sort((first, second) =>
		{
			const firstPriority = first.stopIndex === currentStopIndex ? 0 : 1;
			const secondPriority = second.stopIndex === currentStopIndex ? 0 : 1;
			if (firstPriority !== secondPriority)
			{
				return firstPriority - secondPriority;
			}
			return Math.abs(first.stopIndex - currentStopIndex) - Math.abs(second.stopIndex - currentStopIndex);
		});

	const isCurrentStop = (stopIndex: number) => stopIndex === currentStopIndex;
	const placedBoxes: IPlacedBox[] = [];
	const compactStops = new Set<number>();
	for (const { place, stopIndex } of placementOrder)
	{
		const point = projectToScreen(place);
		// The current stop's name always shows, so its box keeps the label.
		const fullBox = toScreenBox(point, getMarkerFootprint(place, false, isCurrentStop(stopIndex) ? { ...sizing, areLabelsShown: true } : sizing));
		const isCurrent = stopIndex === currentStopIndex;
		const doesFullSizeFit = isCurrent || !placedBoxes.some((box) => doBoxesOverlap(box, fullBox));
		if (doesFullSizeFit)
		{
			placedBoxes.push(fullBox);
		}
		else
		{
			compactStops.add(stopIndex);
			placedBoxes.push(toScreenBox(point, getMarkerFootprint(place, true, sizing)));
		}
	}
	return compactStops;
}
