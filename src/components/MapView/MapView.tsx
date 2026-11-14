import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef } from "react";
import { Map, Marker, NavigationControl, type MapRef } from "react-map-gl/maplibre";
import type { LngLatBoundsLike, MapLibreEvent } from "maplibre-gl";
import type { ICoordinates, IDay, IPlace } from "../../itinerary/types";
import { createMapStyle } from "../../mapStyle/createMapStyle";
import { pastelPalette } from "../../mapStyle/palette";
import { createWavePatternImage, wavePatternImageId } from "../../mapStyle/wavePattern";
import { StopMarker, type StopProgress } from "../Markers/StopMarker";
import { RouteLayer } from "../RouteLayer/RouteLayer";

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
	currentStopIndex: number;
	cameraPadding: ICameraPadding;
	onSelectStop: (stopIndex: number) => void;
}

const stopZoom = 15.2;
const maximumDayZoom = 15;
const stopFlightMilliseconds = 1400;
const dayFlightMilliseconds = 1600;
const intercityDistanceKilometers = 40;

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

function getDistanceKilometers(start: ICoordinates, end: ICoordinates): number
{
	const earthRadiusKilometers = 6371;
	const toRadians = (degrees: number) => degrees * Math.PI / 180;
	const latitudeDelta = toRadians(end.latitude - start.latitude);
	const longitudeDelta = toRadians(end.longitude - start.longitude);
	const haversine = Math.sin(latitudeDelta / 2) ** 2
		+ Math.cos(toRadians(start.latitude)) * Math.cos(toRadians(end.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
	return 2 * earthRadiusKilometers * Math.asin(Math.sqrt(haversine));
}

/** The stylized, pannable map showing one day's stops and route. The camera follows the current stop and glides between days. */
export function MapView({ day, places, currentStopIndex, cameraPadding, onSelectStop }: IMapViewProps)
{
	const mapRef = useRef<MapRef>(null);
	const previousPositionRef = useRef<{ dayNumber: number; stopIndex: number } | null>(null);
	const cameraMoveIdRef = useRef(0);
	const previousPaddingRef = useRef(cameraPadding);
	const mapStyle = useMemo(() => createMapStyle(pastelPalette), []);
	const dayPlaces = useMemo(() => day.stops.map((stop) => places[stop.placeId]), [day, places]);
	const dayBounds = useMemo(() => getBounds(dayPlaces.map((place) => place.coordinates)), [dayPlaces]);

	useEffect(() =>
	{
		const map = mapRef.current;
		const previousPosition = previousPositionRef.current;
		const isSamePosition = previousPosition?.dayNumber === day.dayNumber && previousPosition.stopIndex === currentStopIndex;
		previousPositionRef.current = { dayNumber: day.dayNumber, stopIndex: currentStopIndex };
		if (!map || !previousPosition || isSamePosition)
		{
			return;
		}

		const cameraMoveId = ++cameraMoveIdRef.current;
		const currentPlace = dayPlaces[currentStopIndex];
		const flyToCurrentStop = (duration: number) => map.flyTo(
		{
			center: [currentPlace.coordinates.longitude, currentPlace.coordinates.latitude],
			zoom: stopZoom,
			duration,
			padding: cameraPadding,
		});
		const showTarget = (duration: number) =>
		{
			// Arriving at the start of a day shows the whole day; stepping back into a day lands on its last stop.
			if (currentStopIndex === 0)
			{
				map.fitBounds(dayBounds, { padding: cameraPadding, maxZoom: maximumDayZoom, duration });
			}
			else
			{
				flyToCurrentStop(duration);
			}
		};

		const isNewDay = previousPosition.dayNumber !== day.dayNumber;
		if (!isNewDay)
		{
			flyToCurrentStop(stopFlightMilliseconds);
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
		map.fitBounds(mergeBounds(visibleBounds, dayBounds) as LngLatBoundsLike, { padding: cameraPadding, duration: dayFlightMilliseconds });
		map.once("moveend", () =>
		{
			// A newer click may have started another camera move; only the latest one continues.
			if (cameraMoveId === cameraMoveIdRef.current)
			{
				showTarget(dayFlightMilliseconds);
			}
		});
	}, [day.dayNumber, currentStopIndex, dayPlaces, dayBounds, cameraPadding]);

	useEffect(() =>
	{
		const previousPadding = previousPaddingRef.current;
		previousPaddingRef.current = cameraPadding;
		const hasSideSpaceChanged = previousPadding.left !== cameraPadding.left || previousPadding.right !== cameraPadding.right;
		const map = mapRef.current;
		if (!map || !hasSideSpaceChanged)
		{
			return;
		}
		// A panel opened or closed beside the map: slide the current stop back into the visible area.
		const currentPlace = dayPlaces[currentStopIndex];
		map.easeTo(
		{
			center: [currentPlace.coordinates.longitude, currentPlace.coordinates.latitude],
			padding: cameraPadding,
			duration: 600,
		});
	}, [cameraPadding, dayPlaces, currentStopIndex]);

	const handleLoad = (event: MapLibreEvent) =>
	{
		const map = event.target;
		if (!map.hasImage(wavePatternImageId))
		{
			map.addImage(wavePatternImageId, createWavePatternImage(), { pixelRatio: 2 });
		}
	};

	const initialPlace = dayPlaces[currentStopIndex];
	const initialViewState = currentStopIndex === 0
		? { bounds: dayBounds, fitBoundsOptions: { padding: cameraPadding, maxZoom: maximumDayZoom } }
		: { longitude: initialPlace.coordinates.longitude, latitude: initialPlace.coordinates.latitude, zoom: stopZoom, padding: cameraPadding };

	return (
		<Map
			ref={mapRef}
			mapStyle={mapStyle}
			initialViewState={initialViewState}
			onLoad={handleLoad}
			style={{ position: "absolute", inset: 0 }}
			attributionControl={{ compact: true }}
		>
			<NavigationControl position="top-right" showCompass={false} />
			<RouteLayer day={day} places={places} currentStopIndex={currentStopIndex} />
			{dayPlaces.map((place, stopIndex) =>
			{
				const progress = getStopProgress(stopIndex, currentStopIndex);
				const landmarkScale = place.landmarkIconScale ?? 1;
				return (
					<Marker
						key={`${day.dayNumber}-${place.id}-${stopIndex}`}
						longitude={place.coordinates.longitude}
						latitude={place.coordinates.latitude}
						anchor={place.landmarkIconUrl ? "top" : "center"}
						offset={place.landmarkIconUrl ? [0, -82 * landmarkScale] : [0, 0]}
						style={{ zIndex: progress === "current" ? 3 : place.landmarkIconUrl ? 2 : 1 }}
					>
						<StopMarker
							place={place}
							stopNumber={stopIndex + 1}
							progress={progress}
							dayColor={day.color}
							onSelect={() => onSelectStop(stopIndex)}
						/>
					</Marker>
				);
			})}
		</Map>
	);
}
