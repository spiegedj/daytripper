import type { Map as MapLibreMap } from "maplibre-gl";

/** Padding on all four sides, in pixels. */
export interface ISidePadding
{
	top: number;
	bottom: number;
	left: number;
	right: number;
}

/**
 * The padding to pass when fitting bounds so the total matches the space panels take up.
 * Moves made with `padding` (flyTo, easeTo, jumpTo) leave that padding on the map, and fitBounds adds its own padding
 * on top of it. Without this, the two stack up; on a phone that is taller than the screen and the fit is skipped.
 */
export function getFitPadding(map: MapLibreMap, desiredPadding: ISidePadding): ISidePadding
{
	const mapPadding = map.getPadding();
	return {
		top: Math.max(0, desiredPadding.top - (mapPadding.top ?? 0)),
		bottom: Math.max(0, desiredPadding.bottom - (mapPadding.bottom ?? 0)),
		left: Math.max(0, desiredPadding.left - (mapPadding.left ?? 0)),
		right: Math.max(0, desiredPadding.right - (mapPadding.right ?? 0)),
	};
}
