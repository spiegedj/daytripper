import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Map, Marker, NavigationControl, type MapRef } from "react-map-gl/maplibre";
import type { LngLatBoundsLike } from "maplibre-gl";
import { getDistanceKilometers } from "../../itinerary/tripOverview";
import type { ICoordinates, IDay, ILegSegment, IPlace } from "../../itinerary/types";
import { createMapStyle } from "../../mapStyle/createMapStyle";
import { pastelPalette } from "../../mapStyle/palette";
import { createWavePatternImage, wavePatternImageId } from "../../mapStyle/wavePattern";
import { StopMarker, type StopProgress } from "../Markers/StopMarker";
import { RouteLayer } from "../RouteLayer/RouteLayer";
import { LabelBlockerLayer, createBlockerImage } from "./LabelBlockerLayer";
import { findDayExploredAreas } from "../../itinerary/tripOverview";
import { dayOverviewStopIndex } from "../../itinerary/useItineraryNavigation";
import { ExploredAreaLayer } from "../ExploredAreaLayer/ExploredAreaLayer";
import { getLegSegments } from "../../itinerary/routeGeometry";
import { getFitPadding } from "./fitPadding";
import { createLegRideChannel, followLegWithCamera, ridePaces, type TravelSpeed } from "./followLegWithCamera";
import { findCompactStops, fullLandmarkSizing, getLandmarkSizing, type ILandmarkSizing } from "./markerFootprint";

/** Screen space, in pixels, the camera keeps clear for floating panels. */
export interface ICameraPadding
{
	top: number;
	bottom: number;
	left: number;
	right: number;
}

export interface IMapViewProps
{
	day: IDay;
	places: Record<string, IPlace>;
	legPaths: Record<string, ILegSegment[]>;
	currentStopIndex: number;
	cameraPadding: ICameraPadding;
	/** When true the map shows the whole trip (the children) instead of the current day. */
	isOverview: boolean;
	/** Every location in the trip, used to frame the overview. */
	tripCoordinates: ICoordinates[];
	onSelectStop: (stopIndex: number) => void;
	/** How quickly the camera rides along a leg when stepping to the next stop. */
	travelSpeed: TravelSpeed;
	/** Map content for the trip overview. */
	children?: ReactNode;
}

const stopZoom = 15.2;
const maximumDayZoom = 15;
const stopFlightMilliseconds = 1400;
const dayFlightMilliseconds = 1600;
const intercityDistanceKilometers = 40;
// Overview badges stick out around their cities, so the trip is framed with extra room on every side.
const overviewExtraPadding = { top: 110, bottom: 90, left: 110, right: 170 };
const narrowOverviewExtraPadding = { top: 50, bottom: 20, left: 40, right: 60 };
const narrowMapWidth = 760;

function getOverviewPadding(cameraPadding: ICameraPadding): ICameraPadding
{
	return addPadding(cameraPadding, window.innerWidth <= narrowMapWidth ? narrowOverviewExtraPadding : overviewExtraPadding);
}

function addPadding(padding: ICameraPadding, extra: ICameraPadding): ICameraPadding
{
	return { top: padding.top + extra.top, bottom: padding.bottom + extra.bottom, left: padding.left + extra.left, right: padding.right + extra.right };
}

type Bounds = [[number, number], [number, number]];

function getStopProgress(stopIndex: number, currentStopIndex: number): StopProgress
{
	if (stopIndex === currentStopIndex)
	{
		return "current";
	}
	return stopIndex < currentStopIndex ? "visited" : "upcoming";
}

function getBounds(coordinates: ICoordinates[]): Bounds
{
	const longitudes = coordinates.map((point) => point.longitude);
	const latitudes = coordinates.map((point) => point.latitude);
	return [[Math.min(...longitudes), Math.min(...latitudes)], [Math.max(...longitudes), Math.max(...latitudes)]];
}

function mergeBounds(first: Bounds, second: Bounds): Bounds
{
	return [
		[Math.min(first[0][0], second[0][0]), Math.min(first[0][1], second[0][1])],
		[Math.max(first[1][0], second[1][0]), Math.max(first[1][1], second[1][1])],
	];
}

function getBoundsCenter(bounds: Bounds): ICoordinates
{
	return { longitude: (bounds[0][0] + bounds[1][0]) / 2, latitude: (bounds[0][1] + bounds[1][1]) / 2 };
}

/** The stylized, pannable map showing one day's stops and route. The camera follows the current stop and glides between days. */
export function MapView({ day, places, legPaths, currentStopIndex, cameraPadding, isOverview, tripCoordinates, onSelectStop, travelSpeed, children }: IMapViewProps)
{
	const mapRef = useRef<MapRef | null>(null);
	const previousPositionRef = useRef<{ dayNumber: number; stopIndex: number } | null>(null);
	const cameraMoveIdRef = useRef(0);
	const cancelFollowRef = useRef<(() => void) | null>(null);
	const isFollowingLegRef = useRef(false);
	const rideChannel = useMemo(() => createLegRideChannel(), []);
	const previousPaddingRef = useRef(cameraPadding);
	const mapStyle = useMemo(() => createMapStyle(pastelPalette), []);
	const dayPlaces = useMemo(() => day.stops.map((stop) => places[stop.placeId]), [day, places]);
	// The day's position in the trip doesn't matter here; the areas are only drawn, never used to navigate.
	const dayAreas = useMemo(() => findDayExploredAreas(day, 0, places), [day, places]);
	const dayBounds = useMemo(() => getBounds(dayPlaces.map((place) => place.coordinates)), [dayPlaces]);
	const tripBounds = useMemo(() => getBounds(tripCoordinates), [tripCoordinates]);
	const previousIsOverviewRef = useRef(isOverview);
	const [compactStopIndexes, setCompactStopIndexes] = useState<Set<number>>(() => new Set());
	const [settledLandmarkSizing, setSettledLandmarkSizing] = useState<ILandmarkSizing>(fullLandmarkSizing);

	// Landmark size follows the zoom on every frame, through a CSS variable on the map so nothing re-renders; this keeps
	// them from ballooning while a flight zooms out between stops.
	const applyLandmarkSizing = useCallback(() =>
	{
		const map = mapRef.current?.getMap();
		if (!map)
		{
			return;
		}
		const container = map.getContainer();
		const sizing = getLandmarkSizing(map.getZoom(), container.clientWidth, container.clientHeight);
		container.style.setProperty("--map-landmark-size", sizing.sizeFactor.toFixed(3));
		container.dataset.landmarkLabels = sizing.areLabelsShown ? "shown" : "hidden";
		return sizing;
	}, []);

	// Recomputed whenever the camera settles, because overlap depends on zoom and on which stop is current.
	const updateCompactStops = useCallback(() =>
	{
		const map = mapRef.current;
		// While riding along a leg every frame ends a move; markers switching size mid-ride would stutter, so wait until it ends.
		if (!map || isFollowingLegRef.current)
		{
			return;
		}
		const sizing = applyLandmarkSizing() ?? fullLandmarkSizing;
		setSettledLandmarkSizing((previous) => previous.sizeFactor === sizing.sizeFactor && previous.areLabelsShown === sizing.areLabelsShown ? previous : sizing);
		const nextCompactStops = findCompactStops(dayPlaces, currentStopIndex, (place) => map.project([place.coordinates.longitude, place.coordinates.latitude]), sizing);
		setCompactStopIndexes((previous) =>
		{
			const isUnchanged = previous.size === nextCompactStops.size && [...nextCompactStops].every((stopIndex) => previous.has(stopIndex));
			return isUnchanged ? previous : nextCompactStops;
		});
	}, [dayPlaces, currentStopIndex, applyLandmarkSizing]);

	useEffect(() =>
	{
		updateCompactStops();
	}, [updateCompactStops]);

	useEffect(() =>
	{
		const map = mapRef.current;
		const previousPosition = previousPositionRef.current;
		const wasOverview = previousIsOverviewRef.current;
		const isSamePosition = previousPosition?.dayNumber === day.dayNumber && previousPosition.stopIndex === currentStopIndex && wasOverview === isOverview;
		previousPositionRef.current = { dayNumber: day.dayNumber, stopIndex: currentStopIndex };
		previousIsOverviewRef.current = isOverview;
		if (!map || !previousPosition || isSamePosition)
		{
			return;
		}

		const cameraMoveId = ++cameraMoveIdRef.current;
		cancelFollowRef.current?.();
		cancelFollowRef.current = null;
		if (isOverview)
		{
			map.fitBounds(tripBounds, { padding: getFitPadding(map.getMap(), getOverviewPadding(cameraPadding)), duration: dayFlightMilliseconds });
			return;
		}
		const showTarget = (duration: number) =>
		{
			// A day's overview frames the whole day; stepping back into a day lands on its last stop.
			if (currentStopIndex === dayOverviewStopIndex)
			{
				map.fitBounds(dayBounds, { padding: getFitPadding(map.getMap(), cameraPadding), maxZoom: maximumDayZoom, duration });
				return;
			}
			const currentPlace = dayPlaces[currentStopIndex];
			map.flyTo(
			{
				center: [currentPlace.coordinates.longitude, currentPlace.coordinates.latitude],
				zoom: stopZoom,
				duration,
				padding: cameraPadding,
			});
		};

		if (wasOverview)
		{
			showTarget(dayFlightMilliseconds);
			return;
		}

		const isNewDay = previousPosition.dayNumber !== day.dayNumber;
		const isStepToNextStop = !isNewDay && !wasOverview && previousPosition.stopIndex >= 0 && currentStopIndex === previousPosition.stopIndex + 1;
		if (isStepToNextStop)
		{
			// Ride along the leg just like the traveler would, instead of flying straight over the city.
			const previousPlace = dayPlaces[previousPosition.stopIndex];
			const currentPlace = dayPlaces[currentStopIndex];
			const segments = getLegSegments(legPaths, day.dayNumber, currentStopIndex, previousPlace.coordinates, currentPlace.coordinates, day.stops[currentStopIndex].arrival?.mode ?? "walk");
			isFollowingLegRef.current = true;
			cancelFollowRef.current = followLegWithCamera(map.getMap(), segments.flatMap((segment) => segment.coordinates),
			{
				arrivalZoom: stopZoom,
				padding: cameraPadding,
				pace: ridePaces[travelSpeed],
				shouldContinue: () => cameraMoveId === cameraMoveIdRef.current,
				rideChannel,
				onEnd: () =>
				{
					isFollowingLegRef.current = false;
					updateCompactStops();
				},
			});
			return;
		}
		if (!isNewDay)
		{
			showTarget(stopFlightMilliseconds);
			return;
		}

		const cameraCenter = map.getCenter();
		const distanceKilometers = getDistanceKilometers({ longitude: cameraCenter.lng, latitude: cameraCenter.lat }, getBoundsCenter(dayBounds));
		if (distanceKilometers < intercityDistanceKilometers)
		{
			showTarget(dayFlightMilliseconds);
			return;
		}

		const visibleBounds = map.getBounds().toArray() as Bounds;
		map.fitBounds(mergeBounds(visibleBounds, dayBounds) as LngLatBoundsLike, { padding: getFitPadding(map.getMap(), cameraPadding), duration: dayFlightMilliseconds });
		map.once("moveend", () =>
		{
			// A newer click may have started another camera move; only the latest one continues.
			if (cameraMoveId === cameraMoveIdRef.current)
			{
				showTarget(dayFlightMilliseconds);
			}
		});
	}, [day, currentStopIndex, dayPlaces, dayBounds, tripBounds, cameraPadding, isOverview, legPaths, updateCompactStops, rideChannel, travelSpeed]);

	useEffect(() =>
	{
		const previousPadding = previousPaddingRef.current;
		previousPaddingRef.current = cameraPadding;
		const hasSideSpaceChanged = previousPadding.left !== cameraPadding.left || previousPadding.right !== cameraPadding.right;
		const map = mapRef.current;
		if (!map || !hasSideSpaceChanged || isOverview)
		{
			return;
		}
		// A panel opened or closed beside the map: slide the current stop (or whole day) back into the visible area.
		if (currentStopIndex === dayOverviewStopIndex)
		{
			map.fitBounds(dayBounds, { padding: getFitPadding(map.getMap(), cameraPadding), maxZoom: maximumDayZoom, duration: 600 });
			return;
		}
		const currentPlace = dayPlaces[currentStopIndex];
		map.easeTo(
		{
			center: [currentPlace.coordinates.longitude, currentPlace.coordinates.latitude],
			padding: cameraPadding,
			duration: 600,
		});
	}, [cameraPadding, dayPlaces, dayBounds, currentStopIndex, isOverview]);

	// Images the style needs but doesn't ship (the water pattern, label blockers) are generated when first requested.
	const attachMap = useCallback((mapInstance: MapRef | null) =>
	{
		mapRef.current = mapInstance;
		const map = mapInstance?.getMap();
		map?.setMissingStyleImageResolver((imageId) =>
		{
			if (map.hasImage(imageId))
			{
				return;
			}
			if (imageId === wavePatternImageId)
			{
				map.addImage(imageId, createWavePatternImage(), { pixelRatio: 2 });
				return;
			}
			const blockerImage = createBlockerImage(imageId);
			if (blockerImage)
			{
				map.addImage(imageId, blockerImage);
			}
		});
	}, []);

	const handleLoad = () =>
	{
		updateCompactStops();
	};

	const initialPlace = dayPlaces[Math.max(currentStopIndex, 0)];
	const initialViewState = isOverview
		? { bounds: tripBounds, fitBoundsOptions: { padding: getOverviewPadding(cameraPadding) } }
		: currentStopIndex === dayOverviewStopIndex
		? { bounds: dayBounds, fitBoundsOptions: { padding: cameraPadding, maxZoom: maximumDayZoom } }
		: { longitude: initialPlace.coordinates.longitude, latitude: initialPlace.coordinates.latitude, zoom: stopZoom, padding: cameraPadding };

	return (
		<Map
			ref={attachMap}
			mapStyle={mapStyle}
			initialViewState={initialViewState}
			onLoad={handleLoad}
			onMove={applyLandmarkSizing}
			onMoveEnd={updateCompactStops}
			style={{ position: "absolute", inset: 0, isolation: "isolate" }}
			attributionControl={{ compact: true }}
		>
			<NavigationControl position="top-right" showCompass={false} />
			{isOverview && children}
			{!isOverview && <ExploredAreaLayer id="day" areas={dayAreas} isVisible={currentStopIndex === dayOverviewStopIndex} />}
			{!isOverview && <RouteLayer day={day} places={places} currentStopIndex={currentStopIndex} legPaths={legPaths} rideChannel={rideChannel} />}
			{!isOverview && <LabelBlockerLayer places={dayPlaces} compactStopIndexes={compactStopIndexes} currentStopIndex={currentStopIndex} landmarkSizing={settledLandmarkSizing} />}
			{!isOverview && dayPlaces.map((place, stopIndex) =>
			{
				const progress = getStopProgress(stopIndex, currentStopIndex);
				const isCompact = compactStopIndexes.has(stopIndex);
				const isLandmark = place.landmarkIconUrl !== undefined;
				const isDrawnAsLandmark = isLandmark && !isCompact;
				const isDrawnAsMiniLandmark = isLandmark && isCompact;
				const anchor = isDrawnAsLandmark ? "top" : isDrawnAsMiniLandmark ? "bottom" : "center";
				return (
					<Marker
						// The map library applies a marker's anchor only when it is created, so switching between the full and
						// small illustration rebuilds the marker; otherwise it keeps the old anchor and drifts. The shift that puts the
						// illustration's ground line on the point is in the marker's CSS, so it follows the zoom.
						key={`${day.dayNumber}-${place.id}-${stopIndex}-${anchor}`}
						longitude={place.coordinates.longitude}
						latitude={place.coordinates.latitude}
						anchor={anchor}
						style={{ zIndex: progress === "current" ? 3 : isLandmark ? 2 : 1 }}
					>
						<StopMarker
							place={place}
							stopNumber={stopIndex + 1}
							progress={progress}
							dayColor={day.color}
							isCompact={isCompact}
							onSelect={() => onSelectStop(stopIndex)}
						/>
					</Marker>
				);
			})}
		</Map>
	);
}
