import type { Map as MapLibreMap, PaddingOptions } from "maplibre-gl";

export interface IFollowLegOptions
{
	/** The zoom to arrive at, the same as any other stop. */
	arrivalZoom: number;
	padding: PaddingOptions;
	/** Called every frame; returning false stops the camera, for example when a newer move has started. */
	shouldContinue: () => boolean;
	/** Called once when the camera stops, whether it arrived or was interrupted. */
	onEnd?: () => void;
	/** Receives the ride's progress every frame, so the route drawing keeps pace with the camera. */
	rideChannel?: ILegRideChannel;
}

// The leg spans this many screen widths while traveling, so the camera follows it rather than seeing it all at once.
const legScreenWidthsWhileTraveling = 1.4;
const lowestTravelZoom = 7;
// Share of the trip spent easing out to the travel zoom at the start, and back in at the end.
const zoomTransitionShare = 0.35;
// Share of the trip spent speeding up at the start and slowing down at the end.
const speedRampShare = 0.2;
// Comfort limits: how fast the map may slide across the screen, and how many zoom levels it may change per second.
const maximumScreenPixelsPerSecond = 450;
const maximumZoomLevelsPerSecond = 3.2;
const shortestRideMilliseconds = 1100;
const longestRideMilliseconds = 12000;
const motionPlanSteps = 400;

/** Passes a ride's progress (0 to 1 along the leg) from the camera to whatever draws the leg, such as the route line. */
export interface ILegRideChannel
{
	publish: (progress: number) => void;
	/** Listens for progress; returns a function that stops listening. */
	subscribe: (listener: (progress: number) => void) => () => void;
}

/** Creates a channel for one map's rides. */
export function createLegRideChannel(): ILegRideChannel
{
	const listeners = new Set<(progress: number) => void>();
	return {
		publish: (progress) => listeners.forEach((listener) => listener(progress)),
		subscribe: (listener) =>
		{
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
	};
}
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

type ScreenPoint = [number, number];

function getCumulativeLengths(points: ScreenPoint[]): number[]
{
	const lengths = [0];
	for (let index = 1; index < points.length; index++)
	{
		lengths.push(lengths[index - 1] + Math.hypot(points[index][0] - points[index - 1][0], points[index][1] - points[index - 1][1]));
	}
	return lengths;
}

function pointAtLength(points: ScreenPoint[], cumulativeLengths: number[], target: number): ScreenPoint
{
	const segmentIndex = Math.max(1, cumulativeLengths.findIndex((length) => length >= target));
	if (segmentIndex >= points.length || cumulativeLengths[segmentIndex] < target)
	{
		return points[points.length - 1];
	}
	const segmentLength = cumulativeLengths[segmentIndex] - cumulativeLengths[segmentIndex - 1];
	const segmentShare = segmentLength === 0 ? 1 : (target - cumulativeLengths[segmentIndex - 1]) / segmentLength;
	const [startX, startY] = points[segmentIndex - 1];
	const [endX, endY] = points[segmentIndex];
	return [interpolate(startX, endX, segmentShare), interpolate(startY, endY, segmentShare)];
}

// The path is redrawn as this many evenly spaced points, then blurred over this share of its length.
const resampledPointCount = 240;
const smoothingShareOfPath = 0.1;

/**
 * Turns a leg's path into a gentle camera track: evenly resampled, then blurred so street corners and switchbacks
 * become sweeping curves. The track still starts and ends exactly at the two stops.
 */
function createCameraTrack(map: MapLibreMap, coordinates: [number, number][])
{
	const points = coordinates.map((coordinate): ScreenPoint =>
	{
		const point = map.project(coordinate);
		return [point.x, point.y];
	});
	const pathLengths = getCumulativeLengths(points);
	const totalLength = pathLengths[pathLengths.length - 1];
	const evenPoints = Array.from({ length: resampledPointCount }, (_, index) =>
		pointAtLength(points, pathLengths, (index / (resampledPointCount - 1)) * totalLength));

	const sigma = Math.max(1, smoothingShareOfPath * resampledPointCount);
	const reach = Math.ceil(sigma * 3);
	const weights = Array.from({ length: reach * 2 + 1 }, (_, offset) => Math.exp(-((offset - reach) ** 2) / (2 * sigma * sigma)));
	const blurred = evenPoints.map((_, index): ScreenPoint =>
	{
		let sumX = 0;
		let sumY = 0;
		let sumWeight = 0;
		weights.forEach((weight, offset) =>
		{
			const neighbor = evenPoints[Math.min(Math.max(index + offset - reach, 0), resampledPointCount - 1)];
			sumX += neighbor[0] * weight;
			sumY += neighbor[1] * weight;
			sumWeight += weight;
		});
		return [sumX / sumWeight, sumY / sumWeight];
	});
	// Blurring pulls the ends inward; a gradual correction pins them back onto the stops.
	const first = evenPoints[0];
	const last = evenPoints[resampledPointCount - 1];
	const startCorrection = [first[0] - blurred[0][0], first[1] - blurred[0][1]];
	const endCorrection = [last[0] - blurred[resampledPointCount - 1][0], last[1] - blurred[resampledPointCount - 1][1]];
	const track = blurred.map(([x, y], index): ScreenPoint =>
	{
		const share = index / (resampledPointCount - 1);
		return [x + interpolate(startCorrection[0], endCorrection[0], share), y + interpolate(startCorrection[1], endCorrection[1], share)];
	});

	const trackLengths = getCumulativeLengths(track);
	const trackLength = trackLengths[trackLengths.length - 1];
	// Converted to map coordinates now, while the camera still matches the projection used above.
	const trackCoordinates = track.map(([x, y]): [number, number] =>
	{
		const coordinate = map.unproject([x, y]);
		return [coordinate.lng, coordinate.lat];
	});
	const sample = (share: number): [number, number] =>
	{
		const target = share * trackLength;
		const index = Math.max(1, trackLengths.findIndex((length) => length >= target));
		if (index >= trackCoordinates.length || trackLengths[index] < target)
		{
			return trackCoordinates[trackCoordinates.length - 1];
		}
		const segmentLength = trackLengths[index] - trackLengths[index - 1];
		const segmentShare = segmentLength === 0 ? 1 : (target - trackLengths[index - 1]) / segmentLength;
		return [
			interpolate(trackCoordinates[index - 1][0], trackCoordinates[index][0], segmentShare),
			interpolate(trackCoordinates[index - 1][1], trackCoordinates[index][1], segmentShare),
		];
	};
	// Zooming is sized by the real path, so a winding walk still gets room to show its wiggles.
	return { sample, totalLength, trackLength };
}

interface IRidePlan
{
	durationMilliseconds: number;
	/** Share of the track covered at a given share of the ride's time. */
	progressAt: (timeShare: number) => number;
	zoomAt: (timeShare: number) => number;
}

/**
 * Plans how the camera moves over time so it never slides across the screen faster than the comfort limit.
 * Ground speed scales with how far out the camera is zoomed, so most of the distance is covered while zoomed out,
 * and long legs simply take longer.
 */
function planRide(trackPixelsAtStartZoom: number, startZoom: number, travelZoom: number, arrivalZoom: number): IRidePlan
{
	const zoomAt = (timeShare: number) => timeShare < 1 - zoomTransitionShare
		? interpolate(startZoom, travelZoom, smoothStep(timeShare / zoomTransitionShare))
		: interpolate(travelZoom, arrivalZoom, smoothStep((timeShare - (1 - zoomTransitionShare)) / zoomTransitionShare));
	const speedRamp = (timeShare: number) => smoothStep(timeShare / speedRampShare) * smoothStep((1 - timeShare) / speedRampShare);

	// Ground covered per step, measured in pixels at the starting zoom: screen speed times how far out the camera is.
	const cumulativeGround = [0];
	for (let step = 1; step <= motionPlanSteps; step++)
	{
		const timeShare = (step - 0.5) / motionPlanSteps;
		cumulativeGround.push(cumulativeGround[step - 1] + speedRamp(timeShare) * 2 ** (startZoom - zoomAt(timeShare)) / motionPlanSteps);
	}
	const groundPerUnitSpeed = cumulativeGround[motionPlanSteps];

	// The peak screen speed is trackPixels / (groundPerUnitSpeed * duration); solve for the duration that keeps it under the limit.
	const durationForSpeed = 1000 * trackPixelsAtStartZoom / (groundPerUnitSpeed * maximumScreenPixelsPerSecond);
	const largestZoomChange = Math.max(Math.abs(startZoom - travelZoom), Math.abs(arrivalZoom - travelZoom));
	// Smoothstep changes zoom at up to 1.5 times its average rate.
	const durationForZoom = 1000 * 1.5 * largestZoomChange / (zoomTransitionShare * maximumZoomLevelsPerSecond);
	const durationMilliseconds = Math.min(longestRideMilliseconds, Math.max(shortestRideMilliseconds, durationForSpeed, durationForZoom));

	const progressAt = (timeShare: number) =>
	{
		const position = Math.min(Math.max(timeShare, 0), 1) * motionPlanSteps;
		const step = Math.min(Math.floor(position), motionPlanSteps - 1);
		const ground = interpolate(cumulativeGround[step], cumulativeGround[step + 1], position - step);
		return groundPerUnitSpeed === 0 ? timeShare : ground / groundPerUnitSpeed;
	};
	return { durationMilliseconds, progressAt, zoomAt };
}

/**
 * Moves the camera along a travel leg instead of flying straight to the next stop: it eases out to a zoom that suits
 * the leg's length, follows a smoothed version of the path at a comfortable speed, and settles on the arrival stop.
 * Each frame publishes the progress on the ride channel so the route drawing can keep pace. Dragging or zooming the map
 * stops the ride. Returns a function that cancels it.
 */
export function followLegWithCamera(map: MapLibreMap, coordinates: [number, number][], options: IFollowLegOptions): () => void
{
	const startZoom = map.getZoom();
	const startCenter = map.getCenter();
	const { sample, totalLength, trackLength } = createCameraTrack(map, coordinates);
	const visibleWidth = map.getContainer().clientWidth - (options.padding.left ?? 0) - (options.padding.right ?? 0);
	const zoomForTravel = startZoom + Math.log2((legScreenWidthsWhileTraveling * Math.max(visibleWidth, 200)) / Math.max(totalLength, 1));
	const travelZoom = Math.max(lowestTravelZoom, Math.min(zoomForTravel, startZoom, options.arrivalZoom));
	const plan = planRide(trackLength, startZoom, travelZoom, options.arrivalZoom);
	// The camera may have been panned away from the leg's start; that offset fades out over the first part of the trip.
	const [pathStartLongitude, pathStartLatitude] = coordinates[0];
	const startOffset = [startCenter.lng - pathStartLongitude, startCenter.lat - pathStartLatitude];

	let animationFrame = 0;
	let hasEnded = false;
	const end = (shouldFinishLine: boolean) =>
	{
		if (hasEnded)
		{
			return;
		}
		hasEnded = true;
		cancelAnimationFrame(animationFrame);
		cancellingEvents.forEach((eventName) => map.off(eventName, interrupt));
		// An interrupted ride still completes the line; a ride replaced by a newer one leaves the new leg's line alone.
		if (shouldFinishLine)
		{
			options.rideChannel?.publish(1);
		}
		options.onEnd?.();
	};
	const interrupt = () => end(true);
	cancellingEvents.forEach((eventName) => map.on(eventName, interrupt));

	const startTime = performance.now();
	const drawFrame = (now: number) =>
	{
		if (!options.shouldContinue())
		{
			end(false);
			return;
		}
		const timeShare = Math.min((now - startTime) / plan.durationMilliseconds, 1);
		const progress = plan.progressAt(timeShare);
		const [longitude, latitude] = sample(progress);
		const offsetRemaining = 1 - smoothStep(timeShare / zoomTransitionShare);
		map.jumpTo(
		{
			center: [longitude + startOffset[0] * offsetRemaining, latitude + startOffset[1] * offsetRemaining],
			zoom: plan.zoomAt(timeShare),
			padding: options.padding,
		});
		options.rideChannel?.publish(progress);
		if (timeShare < 1)
		{
			animationFrame = requestAnimationFrame(drawFrame);
			return;
		}
		end(true);
	};
	animationFrame = requestAnimationFrame(drawFrame);
	return () => end(false);
}
