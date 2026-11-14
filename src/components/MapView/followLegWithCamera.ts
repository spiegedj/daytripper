import type { Map as MapLibreMap, PaddingOptions } from "maplibre-gl";
import { easeLegTravel, getLegTravelMilliseconds } from "../../itinerary/routeGeometry";

export interface IFollowLegOptions
{
	/** The zoom to arrive at, the same as any other stop. */
	arrivalZoom: number;
	padding: PaddingOptions;
	/** Called every frame; returning false stops the camera, for example when a newer move has started. */
	shouldContinue: () => boolean;
	onFinish?: () => void;
}

// The leg spans this many screen widths while traveling, so the camera follows it rather than seeing it all at once.
const legScreenWidthsWhileTraveling = 1.4;
const lowestTravelZoom = 7;
// Share of the trip spent easing out to the travel zoom at the start, and back in at the end.
const zoomTransitionShare = 0.3;
const cancellingEvents = ["dragstart", "wheel", "touchstart", "dblclick"] as const;

function smoothStep(progress: number): number
{
	const clamped = Math.min(Math.max(progress, 0), 1);
	return clamped * clamped * (3 - 2 * clamped);
}

function interpolate(from: number, to: number, progress: number): number
{
	return from + (to - from) * progress;
}

/** Positions along a path by share of its on-screen length, so the camera moves at an even pace around bends. */
function createPathSampler(map: MapLibreMap, coordinates: [number, number][])
{
	const points = coordinates.map((coordinate) => map.project(coordinate));
	const cumulativeLengths = [0];
	for (let index = 1; index < points.length; index++)
	{
		cumulativeLengths.push(cumulativeLengths[index - 1] + Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y));
	}
	const totalLength = cumulativeLengths[cumulativeLengths.length - 1];
	const sample = (share: number): [number, number] =>
	{
		const target = share * totalLength;
		const segmentIndex = Math.max(1, cumulativeLengths.findIndex((length) => length >= target));
		const segmentLength = cumulativeLengths[segmentIndex] - cumulativeLengths[segmentIndex - 1];
		const segmentShare = segmentLength === 0 ? 1 : (target - cumulativeLengths[segmentIndex - 1]) / segmentLength;
		const [startLongitude, startLatitude] = coordinates[segmentIndex - 1];
		const [endLongitude, endLatitude] = coordinates[Math.min(segmentIndex, coordinates.length - 1)];
		return [interpolate(startLongitude, endLongitude, segmentShare), interpolate(startLatitude, endLatitude, segmentShare)];
	};
	return { sample, totalLength };
}

/**
 * Moves the camera along a travel leg instead of flying straight to the next stop: it eases out to a zoom that suits
 * the leg's length, follows the path, and settles on the arrival stop. Dragging or zooming the map stops it.
 * Returns a function that cancels the move.
 */
export function followLegWithCamera(map: MapLibreMap, coordinates: [number, number][], options: IFollowLegOptions): () => void
{
	const startZoom = map.getZoom();
	const startCenter = map.getCenter();
	const { sample, totalLength } = createPathSampler(map, coordinates);
	const visibleWidth = map.getContainer().clientWidth - (options.padding.left ?? 0) - (options.padding.right ?? 0);
	const zoomForTravel = startZoom + Math.log2((legScreenWidthsWhileTraveling * Math.max(visibleWidth, 200)) / Math.max(totalLength, 1));
	const travelZoom = Math.max(lowestTravelZoom, Math.min(zoomForTravel, startZoom, options.arrivalZoom));
	// The camera may have been panned away from the leg's start; that offset fades out over the first part of the trip.
	const [pathStartLongitude, pathStartLatitude] = coordinates[0];
	const startOffset = [startCenter.lng - pathStartLongitude, startCenter.lat - pathStartLatitude];
	const duration = getLegTravelMilliseconds(coordinates);

	let animationFrame = 0;
	let isCancelled = false;
	const cancel = () =>
	{
		isCancelled = true;
		cancelAnimationFrame(animationFrame);
		cancellingEvents.forEach((eventName) => map.off(eventName, cancel));
	};
	cancellingEvents.forEach((eventName) => map.on(eventName, cancel));

	const startTime = performance.now();
	const drawFrame = (now: number) =>
	{
		if (isCancelled || !options.shouldContinue())
		{
			cancel();
			return;
		}
		const timeShare = Math.min((now - startTime) / duration, 1);
		const [longitude, latitude] = sample(easeLegTravel(timeShare));
		const offsetRemaining = 1 - smoothStep(timeShare / zoomTransitionShare);
		const zoom = timeShare < 1 - zoomTransitionShare
			? interpolate(startZoom, travelZoom, smoothStep(timeShare / zoomTransitionShare))
			: interpolate(travelZoom, options.arrivalZoom, smoothStep((timeShare - (1 - zoomTransitionShare)) / zoomTransitionShare));
		map.jumpTo(
		{
			center: [longitude + startOffset[0] * offsetRemaining, latitude + startOffset[1] * offsetRemaining],
			zoom,
			padding: options.padding,
		});
		if (timeShare < 1)
		{
			animationFrame = requestAnimationFrame(drawFrame);
			return;
		}
		cancel();
		options.onFinish?.();
	};
	animationFrame = requestAnimationFrame(drawFrame);
	return cancel;
}
