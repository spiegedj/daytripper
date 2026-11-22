import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { MapRef } from "react-map-gl/maplibre";
import type { ICoordinates, IPlace } from "../../itinerary/types";
import { getLandmarkSizing, getMarkerFootprint, isLandmark, type IMarkerFootprint } from "./markerFootprint";

/** Experimental: landmarks slide apart instead of shrinking. Add ?landmarks=shrink to the address to compare the old behavior. */
export const isLandmarkDetachEnabled = new URLSearchParams(window.location.search).get("landmarks") !== "shrink";

interface IScreenOffset
{
	x: number;
	y: number;
}

interface IBox
{
	left: number;
	top: number;
	right: number;
	bottom: number;
}

export interface ILayoutItem
{
	stopIndex: number;
	home: IScreenOffset;
	footprint: IMarkerFootprint;
	/** The current stop stays on its true location; the others move around it. */
	isPinned: boolean;
}

const landmarkGap = 3;
// Keeps illustrations off the small target that marks another landmark's true location.
const targetObstacleSize = 18;
const pinObstacleSize = 36;
const homeReturnMargin = 6;
const targetRestDistance = 0.05;
// MapLibre's world is this many pixels wide at zoom 0.
const mapTileSize = 512;

// The spots a landmark may move to: rings around its location, as multiples of its size.
const spotAngleCount = 16;
const spotDistances = [0.35, 0.5, 0.65, 0.8, 1, 1.2, 1.45, 1.75, 2.1, 2.6];
// What makes a spot worse, in the same units as a pixel of distance from home.
const collisionCost = 3000;
const hiddenCost = 1500;
const crossedLinesCost = 600;
const lineBehindLandmarkCost = 400;
const edgeComfortDistance = 28;
const edgeCrowdingCost = 1.5;
const offsetLengthCost = 0.2;

// Nearly critically damped: smooth, but quick enough that landmarks arrive with the camera instead of drifting after it stops.
const springStiffness = 260;
const springDamping = 30;
const longestFrameSeconds = 1 / 30;
const restDistance = 0.25;
const restSpeed = 3;
// The leader line fades in over this many pixels of movement, so a tiny nudge doesn't sprout a line.
const leaderFadeStart = 5;
const leaderFadeEnd = 18;

function getBox(home: IScreenOffset, offset: IScreenOffset, footprint: IMarkerFootprint): IBox
{
	const left = home.x + offset.x + footprint.left;
	const top = home.y + offset.y + footprint.top;
	return { left, top, right: left + footprint.width, bottom: top + footprint.height };
}

function centeredBox(point: IScreenOffset, size: number): IBox
{
	return { left: point.x - size / 2, top: point.y - size / 2, right: point.x + size / 2, bottom: point.y + size / 2 };
}

function getOverlapArea(first: IBox, second: IBox): number
{
	const width = Math.min(first.right, second.right) - Math.max(first.left, second.left);
	const height = Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top);
	return width > 0 && height > 0 ? width * height : 0;
}

function inflateBox(box: IBox, margin: number): IBox
{
	return { left: box.left - margin, top: box.top - margin, right: box.right + margin, bottom: box.bottom + margin };
}

function doSegmentsCross(firstStart: IScreenOffset, firstEnd: IScreenOffset, secondStart: IScreenOffset, secondEnd: IScreenOffset): boolean
{
	const sideOf = (start: IScreenOffset, end: IScreenOffset, point: IScreenOffset) => (end.x - start.x) * (point.y - start.y) - (end.y - start.y) * (point.x - start.x);
	return sideOf(firstStart, firstEnd, secondStart) * sideOf(firstStart, firstEnd, secondEnd) < 0
		&& sideOf(secondStart, secondEnd, firstStart) * sideOf(secondStart, secondEnd, firstEnd) < 0;
}

/** Whether a line passes through a box, by clipping the line to the box's four sides. */
function doesSegmentHitBox(start: IScreenOffset, end: IScreenOffset, box: IBox): boolean
{
	const deltaX = end.x - start.x;
	const deltaY = end.y - start.y;
	let enter = 0;
	let exit = 1;
	const sides = [[-deltaX, start.x - box.left], [deltaX, box.right - start.x], [-deltaY, start.y - box.top], [deltaY, box.bottom - start.y]];
	for (const [direction, distance] of sides)
	{
		if (direction === 0)
		{
			if (distance < 0)
			{
				return false;
			}
			continue;
		}
		const crossing = distance / direction;
		if (direction < 0)
		{
			enter = Math.max(enter, crossing);
		}
		else
		{
			exit = Math.min(exit, crossing);
		}
	}
	return enter <= exit;
}

function getSpotOffset(spot: number, size: number): IScreenOffset
{
	const angle = Math.floor(spot / spotDistances.length) / spotAngleCount * Math.PI * 2;
	const distance = spotDistances[spot % spotDistances.length] * size;
	return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
}

/** How close a box comes to the visible area's nearest edge; negative when it pokes past it. */
function getEdgeCost(box: IBox, visibleArea: IBox): number
{
	const area = (box.right - box.left) * (box.bottom - box.top);
	const hiddenShare = 1 - getOverlapArea(box, visibleArea) / area;
	const gaps = [box.left - visibleArea.left, box.top - visibleArea.top, visibleArea.right - box.right, visibleArea.bottom - box.bottom];
	const crowding = gaps.reduce((total, gap) => total + Math.max(0, edgeComfortDistance - gap), 0);
	return hiddenShare * hiddenCost + crowding * edgeCrowdingCost;
}

interface IPlacedLandmark
{
	box: IBox;
	home: IScreenOffset;
	ground: IScreenOffset;
}

interface IPlacement
{
	offsets: Map<number, IScreenOffset>;
	spots: Map<number, number>;
	totalCost: number;
}

/** Scores every spot around a landmark and returns the cheapest. */
function findBestSpot(item: ILayoutItem, size: number, blockers: IBox[], placed: IPlacedLandmark[], visibleArea: IBox): { spot: number; offset: IScreenOffset; cost: number }
{
	const boxArea = item.footprint.width * item.footprint.height;
	let best = { spot: 0, offset: getSpotOffset(0, size), cost: Infinity };
	for (let spot = 0; spot < spotAngleCount * spotDistances.length; spot++)
	{
		const offset = getSpotOffset(spot, size);
		const box = getBox(item.home, offset, item.footprint);
		const ground = { x: item.home.x + offset.x, y: item.home.y + offset.y };
		const gapX = Math.max(box.left - item.home.x, 0, item.home.x - box.right);
		const gapY = Math.max(box.top - item.home.y, 0, item.home.y - box.bottom);
		let cost = Math.hypot(gapX, gapY) + Math.hypot(offset.x, offset.y) * offsetLengthCost + getEdgeCost(box, visibleArea);
		for (const blocker of blockers)
		{
			cost += getOverlapArea(inflateBox(box, landmarkGap), blocker) / boxArea * collisionCost;
		}
		for (const landmark of placed)
		{
			if (doesSegmentHitBox(item.home, ground, landmark.box) || doesSegmentHitBox(landmark.home, landmark.ground, box))
			{
				cost += lineBehindLandmarkCost;
			}
			if (doSegmentsCross(item.home, ground, landmark.home, landmark.ground))
			{
				cost += crossedLinesCost;
			}
		}
		if (cost < best.cost)
		{
			best = { spot, offset, cost };
		}
	}
	return best;
}

/** Places landmarks one at a time in the given order, each taking the cheapest spot left by those before it. */
function placeLandmarks(order: ILayoutItem[], items: ILayoutItem[], pinBoxes: IBox[], visibleArea: IBox, rememberedSpots: Map<number, number>): IPlacement
{
	const placed: IPlacedLandmark[] = [];
	const offsets = new Map<number, IScreenOffset>();
	const spots = new Map<number, number>();
	let totalCost = 0;
	let longestOffset = 0;

	for (const item of order)
	{
		const obstacles = [...pinBoxes, ...items.filter((other) => other !== item).map((other) => centeredBox(other.home, targetObstacleSize))];
		const blockers = [...obstacles, ...placed.map((landmark) => landmark.box)];
		const homeBox = getBox(item.home, { x: 0, y: 0 }, item.footprint);
		// A landmark already moved needs a little extra room to come back, so it doesn't flicker at the threshold.
		const homeMargin = rememberedSpots.has(item.stopIndex) ? homeReturnMargin : 0;
		let bestOffset = { x: 0, y: 0 };
		let bestSpot: number | undefined;
		if (!item.isPinned && blockers.some((blocker) => getOverlapArea(inflateBox(homeBox, homeMargin), blocker) > 0))
		{
			const size = Math.max(item.footprint.width, item.footprint.height);
			const rememberedSpot = rememberedSpots.get(item.stopIndex);
			const rememberedOffset = rememberedSpot === undefined ? undefined : getSpotOffset(rememberedSpot, size);
			// A landmark keeps its spot for as long as that spot is clear, even if another now scores better: this is what stops it switching sides.
			const isRememberedSpotClear = rememberedOffset !== undefined
				&& !blockers.some((blocker) => getOverlapArea(inflateBox(getBox(item.home, rememberedOffset, item.footprint), landmarkGap), blocker) > 0);
			if (isRememberedSpotClear)
			{
				bestOffset = rememberedOffset;
				bestSpot = rememberedSpot;
				totalCost += Math.hypot(rememberedOffset.x, rememberedOffset.y) * offsetLengthCost;
			}
			else
			{
				const best = findBestSpot(item, size, blockers, placed, visibleArea);
				bestOffset = best.offset;
				bestSpot = best.spot;
				totalCost += best.cost;
			}
			longestOffset = Math.max(longestOffset, Math.hypot(bestOffset.x, bestOffset.y));
		}
		if (bestSpot !== undefined)
		{
			spots.set(item.stopIndex, bestSpot);
		}
		offsets.set(item.stopIndex, bestOffset);
		placed.push({ box: getBox(item.home, bestOffset, item.footprint), home: item.home, ground: { x: item.home.x + bestOffset.x, y: item.home.y + bestOffset.y } });
	}
	// Counting the longest line favors two moderate moves over one short move that forces the other far away.
	return { offsets, spots, totalCost: totalCost + longestOffset };
}

/**
 * Finds where each landmark goes. One with room stays on its true location, wherever that is. Otherwise it scores spots
 * all around its location and takes the cheapest: close to home, clear of other stops, away from the map's edges, and
 * with a line that doesn't run behind another landmark. Distance is measured to the illustration's nearest side;
 * measuring to its base would favor north, because the drawing already stands above its point.
 *
 * The first landmark placed can take the spot another badly needs, so several orders are tried and the best layout wins.
 * `rememberedSpots` makes landmarks keep their side while zooming.
 */
export function solveLandmarkLayout(items: ILayoutItem[], pinPoints: IScreenOffset[], visibleArea: IBox, rememberedSpots: Map<number, number>): Map<number, IScreenOffset>
{
	const getEdgeDistance = (point: IScreenOffset) => Math.min(point.x - visibleArea.left, point.y - visibleArea.top, visibleArea.right - point.x, visibleArea.bottom - point.y);
	const pinned = items.filter((item) => item.isPinned);
	// Those nearest the map's edge go first by default, because they have the fewest places to go.
	const movable = items.filter((item) => !item.isPinned).sort((first, second) => getEdgeDistance(first.home) - getEdgeDistance(second.home) || first.stopIndex - second.stopIndex);
	const pinBoxes = pinPoints.map((point) => centeredBox(point, pinObstacleSize));
	const orders = [movable, [...movable].reverse(), ...movable.slice(1).map((item) => [item, ...movable.filter((other) => other !== item)])];

	let best: IPlacement | undefined;
	for (const order of orders)
	{
		const placement = placeLandmarks([...pinned, ...order], items, pinBoxes, visibleArea, rememberedSpots);
		if (!best || placement.totalCost < best.totalCost)
		{
			best = placement;
		}
	}
	rememberedSpots.clear();
	best?.spots.forEach((spot, stopIndex) => rememberedSpots.set(stopIndex, spot));
	return best?.offsets ?? new Map();
}

/** Which stop draws each repeated landmark, and the numbers on its badge: a place visited twice is one illustration. */
export function groupRepeatedLandmarks(places: IPlace[], currentStopIndex: number): Map<number, number[]>
{
	const stopsByPlace = new Map<string, number[]>();
	places.forEach((place, stopIndex) =>
	{
		if (isLandmark(place))
		{
			stopsByPlace.set(place.id, [...(stopsByPlace.get(place.id) ?? []), stopIndex]);
		}
	});
	const groups = new Map<number, number[]>();
	for (const stopIndexes of stopsByPlace.values())
	{
		const drawnStop = stopIndexes.includes(currentStopIndex) ? currentStopIndex : stopIndexes[0];
		groups.set(drawnStop, stopIndexes);
	}
	return groups;
}

interface ISpring
{
	x: number;
	y: number;
	velocityX: number;
	velocityY: number;
}

/** Space the floating panels cover on each side of the map, in pixels. */
interface ILandmarkAreaPadding
{
	top: number;
	bottom: number;
	left: number;
	right: number;
}

/** Runs the landmark springs and writes straight to the DOM, so the animation never re-renders React. */
export function useLandmarkDetachment(mapRef: RefObject<MapRef | null>, places: IPlace[], currentStopIndex: number, padding: ILandmarkAreaPadding, isPaused: () => boolean)
{
	const springsRef = useRef(new Map<number, ISpring>());
	const rememberedSpotsRef = useRef(new Map<number, number>());
	// The layout worked out for where the camera is heading; while set, landmarks hold it instead of re-solving each frame.
	const heldLayoutRef = useRef<{ offsets: Map<number, IScreenOffset>; sizeFactor: number } | null>(null);
	const targetsRef = useRef(new Map<number, IScreenOffset>());
	const artElementsRef = useRef(new Map<number, HTMLElement>());
	const leaderElementsRef = useRef(new Map<number, HTMLElement>());
	const frameRef = useRef<number | null>(null);
	const lastFrameTimeRef = useRef<number | null>(null);
	const publishedKeyRef = useRef("");
	const solveTargetsRef = useRef<() => void>(() => undefined);
	const [settledCoordinates, setSettledCoordinates] = useState<Map<number, ICoordinates>>(() => new Map());
	const repeatedLandmarks = useMemo(() => groupRepeatedLandmarks(places, currentStopIndex), [places, currentStopIndex]);

	const paint = useCallback((stopIndex: number) =>
	{
		const spring = springsRef.current.get(stopIndex);
		const x = spring?.x ?? 0;
		const y = spring?.y ?? 0;
		const art = artElementsRef.current.get(stopIndex);
		if (art)
		{
			art.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
		}
		const leader = leaderElementsRef.current.get(stopIndex);
		if (leader)
		{
			const length = Math.hypot(x, y);
			leader.style.setProperty("--leader-length", `${length.toFixed(2)}px`);
			leader.style.setProperty("--leader-angle", `${Math.atan2(y, x).toFixed(4)}rad`);
			leader.style.opacity = Math.min(1, Math.max(0, (length - leaderFadeStart) / (leaderFadeEnd - leaderFadeStart))).toFixed(3);
		}
	}, []);

	const publishSettled = useCallback(() =>
	{
		const map = mapRef.current?.getMap();
		if (!map || map.isMoving() || isPaused())
		{
			return;
		}
		// Map labels are hidden under where each landmark ended up, which is only worth updating once it's at rest.
		const moved = [...targetsRef.current].filter(([, offset]) => Math.hypot(offset.x, offset.y) > 1);
		const key = `${map.getZoom().toFixed(2)}|${moved.map(([stopIndex, offset]) => `${stopIndex}:${Math.round(offset.x)},${Math.round(offset.y)}`).join(";")}`;
		if (key === publishedKeyRef.current)
		{
			return;
		}
		publishedKeyRef.current = key;
		setSettledCoordinates(new Map(moved.map(([stopIndex, offset]) =>
		{
			const place = places[stopIndex];
			const point = map.project([place.coordinates.longitude, place.coordinates.latitude]);
			const shifted = map.unproject([point.x + offset.x, point.y + offset.y]);
			return [stopIndex, { longitude: shifted.lng, latitude: shifted.lat }];
		})));
	}, [mapRef, places, isPaused]);

	const step = useCallback((time: number) =>
	{
		const seconds = Math.min(longestFrameSeconds, lastFrameTimeRef.current === null ? 1 / 60 : (time - lastFrameTimeRef.current) / 1000);
		lastFrameTimeRef.current = time;
		const isMotionReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const previousTargets = targetsRef.current;
		solveTargetsRef.current();
		let isAtRest = true;
		for (const [stopIndex, target] of targetsRef.current)
		{
			const previousTarget = previousTargets.get(stopIndex);
			if (!previousTarget || Math.hypot(target.x - previousTarget.x, target.y - previousTarget.y) > targetRestDistance)
			{
				isAtRest = false;
			}
			const spring = springsRef.current.get(stopIndex) ?? { x: 0, y: 0, velocityX: 0, velocityY: 0 };
			springsRef.current.set(stopIndex, spring);
			spring.velocityX += (springStiffness * (target.x - spring.x) - springDamping * spring.velocityX) * seconds;
			spring.velocityY += (springStiffness * (target.y - spring.y) - springDamping * spring.velocityY) * seconds;
			spring.x += spring.velocityX * seconds;
			spring.y += spring.velocityY * seconds;
			const isSettled = Math.hypot(target.x - spring.x, target.y - spring.y) < restDistance && Math.hypot(spring.velocityX, spring.velocityY) < restSpeed;
			if (isSettled || isMotionReduced)
			{
				spring.x = target.x;
				spring.y = target.y;
				spring.velocityX = 0;
				spring.velocityY = 0;
			}
			else
			{
				isAtRest = false;
			}
			paint(stopIndex);
		}
		if (isAtRest)
		{
			frameRef.current = null;
			lastFrameTimeRef.current = null;
			publishSettled();
			return;
		}
		frameRef.current = requestAnimationFrame(step);
	}, [paint, publishSettled]);

	/** Solves the layout for a camera at the given zoom, with places positioned by `project`. */
	const solveForCamera = useCallback((container: HTMLElement, zoom: number, project: (place: IPlace) => IScreenOffset) =>
	{
		const sizing = getLandmarkSizing(zoom, container.clientWidth, container.clientHeight);
		const isOnScreen = (point: IScreenOffset) => point.x >= 0 && point.x <= container.clientWidth && point.y >= 0 && point.y <= container.clientHeight;
		const items: ILayoutItem[] = [...repeatedLandmarks.keys()].map((stopIndex) =>
		{
			const isCurrent = stopIndex === currentStopIndex;
			return {
				stopIndex,
				home: project(places[stopIndex]),
				footprint: getMarkerFootprint(places[stopIndex], false, isCurrent ? { ...sizing, areLabelsShown: true } : sizing),
				isPinned: isCurrent,
			};
		});
		// Landmarks whose true location is off screen stay on it, so they can't nudge visible ones as the camera passes.
		const visibleItems = items.filter((item) => isOnScreen(item.home));
		const pinPoints = places.filter((place) => !isLandmark(place)).map(project).filter(isOnScreen);
		// The camera's top padding only frames the stops' points; illustrations may rise into it, so the top limit is the map's edge.
		const visibleArea = { left: padding.left, top: 0, right: container.clientWidth - padding.right, bottom: container.clientHeight - padding.bottom };
		const offsets = solveLandmarkLayout(visibleItems, pinPoints, visibleArea, rememberedSpotsRef.current);
		items.filter((item) => !isOnScreen(item.home)).forEach((item) =>
		{
			offsets.set(item.stopIndex, { x: 0, y: 0 });
			rememberedSpotsRef.current.delete(item.stopIndex);
		});
		return { offsets, sizeFactor: sizing.sizeFactor };
	}, [places, repeatedLandmarks, currentStopIndex, padding]);

	// Runs inside the animation loop. A held layout only scales with the zoom, so landmarks can't change sides mid-flight.
	const solveTargets = useCallback(() =>
	{
		const map = mapRef.current?.getMap();
		if (!map)
		{
			return;
		}
		const container = map.getContainer();
		const held = heldLayoutRef.current;
		if (held)
		{
			const scale = getLandmarkSizing(map.getZoom(), container.clientWidth, container.clientHeight).sizeFactor / held.sizeFactor;
			targetsRef.current = new Map([...held.offsets].map(([stopIndex, offset]) => [stopIndex, { x: offset.x * scale, y: offset.y * scale }]));
			return;
		}
		targetsRef.current = solveForCamera(container, map.getZoom(), (place) =>
		{
			const point = map.project([place.coordinates.longitude, place.coordinates.latitude]);
			return { x: point.x, y: point.y };
		}).offsets;
	}, [mapRef, solveForCamera]);

	useEffect(() =>
	{
		solveTargetsRef.current = solveTargets;
	}, [solveTargets]);

	/** Wakes the animation loop, which re-solves the layout for the camera and lets the springs chase it. */
	const updateLayout = useCallback(() =>
	{
		if (isLandmarkDetachEnabled && frameRef.current === null)
		{
			frameRef.current = requestAnimationFrame(step);
		}
	}, [step]);

	/**
	 * Works out the layout for where the camera is about to land, so landmarks make one glide to their final spots during
	 * the trip and are already there when it ends. Positions use the map's Web Mercator projection at the destination.
	 */
	const planLayout = useCallback((center: ICoordinates, zoom: number) =>
	{
		const map = mapRef.current?.getMap();
		if (!isLandmarkDetachEnabled || !map)
		{
			return;
		}
		const container = map.getContainer();
		const worldSize = mapTileSize * 2 ** zoom;
		const toWorld = ({ longitude, latitude }: ICoordinates) => (
		{
			x: (longitude + 180) / 360 * worldSize,
			y: (180 - 180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + latitude * Math.PI / 360))) / 360 * worldSize,
		});
		const centerPoint = toWorld(center);
		const anchorX = padding.left + (container.clientWidth - padding.left - padding.right) / 2;
		const anchorY = padding.top + (container.clientHeight - padding.top - padding.bottom) / 2;
		heldLayoutRef.current = solveForCamera(container, zoom, (place) =>
		{
			const point = toWorld(place.coordinates);
			return { x: point.x - centerPoint.x + anchorX, y: point.y - centerPoint.y + anchorY };
		});
		updateLayout();
	}, [mapRef, padding, solveForCamera, updateLayout]);

	/** The traveler took over the camera, so there's no destination to plan for: landmarks respond to the view again. */
	const releaseHeldLayout = useCallback(() =>
	{
		heldLayoutRef.current = null;
	}, []);

	useEffect(() =>
	{
		updateLayout();
	}, [updateLayout, solveTargets]);

	// The loop must be marked as stopped, or updateLayout would believe it's still running and never wake it again
	// (React's StrictMode cancels it this way on every mount in development). A new day's stops also need a fresh loop.
	useEffect(() => () =>
	{
		if (frameRef.current !== null)
		{
			cancelAnimationFrame(frameRef.current);
			frameRef.current = null;
			lastFrameTimeRef.current = null;
		}
	}, [step]);

	// A new day's stops share indexes with the old day's, so their springs must not carry over.
	useEffect(() =>
	{
		springsRef.current.clear();
		rememberedSpotsRef.current.clear();
		heldLayoutRef.current = null;
		targetsRef.current = new Map();
		publishedKeyRef.current = "";
		setSettledCoordinates(new Map());
	}, [places]);

	const registerArt = useCallback((stopIndex: number, element: HTMLElement | null) =>
	{
		if (element)
		{
			artElementsRef.current.set(stopIndex, element);
			paint(stopIndex);
		}
		else
		{
			artElementsRef.current.delete(stopIndex);
		}
	}, [paint]);

	const registerLeader = useCallback((stopIndex: number, element: HTMLElement | null) =>
	{
		if (element)
		{
			leaderElementsRef.current.set(stopIndex, element);
			paint(stopIndex);
		}
		else
		{
			leaderElementsRef.current.delete(stopIndex);
		}
	}, [paint]);

	return { repeatedLandmarks, settledCoordinates, updateLayout, planLayout, releaseHeldLayout, registerArt, registerLeader };
}
