import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef } from "react";
import { Map, Marker, NavigationControl, type MapRef } from "react-map-gl/maplibre";
import type { MapLibreEvent } from "maplibre-gl";
import type { IDay, IPlace } from "../../itinerary/types";
import { createMapStyle } from "../../mapStyle/createMapStyle";
import { pastelPalette } from "../../mapStyle/palette";
import { createWavePatternImage, wavePatternImageId } from "../../mapStyle/wavePattern";
import { StopMarker, type StopProgress } from "../Markers/StopMarker";
import { RouteLayer } from "../RouteLayer/RouteLayer";

export interface IMapViewProps
{
	day: IDay;
	places: Record<string, IPlace>;
	currentStopIndex: number;
	onSelectStop: (stopIndex: number) => void;
}

const stopZoom = 15.2;
const cameraPadding = { top: 80, bottom: 140, left: 80, right: 80 };

function getStopProgress(stopIndex: number, currentStopIndex: number): StopProgress
{
	if (stopIndex === currentStopIndex)
	{
		return "current";
	}
	return stopIndex < currentStopIndex ? "visited" : "upcoming";
}

/** The stylized, pannable map showing one day's stops and route. The camera follows the current stop. */
export function MapView({ day, places, currentStopIndex, onSelectStop }: IMapViewProps)
{
	const mapRef = useRef<MapRef>(null);
	const hasCameraMovedRef = useRef(false);
	const mapStyle = useMemo(() => createMapStyle(pastelPalette), []);
	const dayPlaces = day.stops.map((stop) => places[stop.placeId]);

	const dayBounds = useMemo(() =>
	{
		const longitudes = dayPlaces.map((place) => place.coordinates.longitude);
		const latitudes = dayPlaces.map((place) => place.coordinates.latitude);
		return [[Math.min(...longitudes), Math.min(...latitudes)], [Math.max(...longitudes), Math.max(...latitudes)]] as [[number, number], [number, number]];
	}, [dayPlaces]);

	useEffect(() =>
	{
		// The first render keeps the whole-day overview; only later stop changes fly the camera.
		if (!hasCameraMovedRef.current)
		{
			hasCameraMovedRef.current = true;
			return;
		}
		const currentPlace = dayPlaces[currentStopIndex];
		mapRef.current?.flyTo(
		{
			center: [currentPlace.coordinates.longitude, currentPlace.coordinates.latitude],
			zoom: stopZoom,
			duration: 1400,
			padding: cameraPadding,
			essential: false,
		});
	}, [currentStopIndex]);

	const handleLoad = (event: MapLibreEvent) =>
	{
		const map = event.target;
		if (!map.hasImage(wavePatternImageId))
		{
			map.addImage(wavePatternImageId, createWavePatternImage(), { pixelRatio: 2 });
		}
	};

	return (
		<Map
			ref={mapRef}
			mapStyle={mapStyle}
			initialViewState={currentStopIndex === 0
				? { bounds: dayBounds, fitBoundsOptions: { padding: cameraPadding } }
				: { longitude: dayPlaces[currentStopIndex].coordinates.longitude, latitude: dayPlaces[currentStopIndex].coordinates.latitude, zoom: stopZoom }}
			onLoad={handleLoad}
			style={{ position: "absolute", inset: 0 }}
			attributionControl={{ compact: true }}
		>
			<NavigationControl position="top-right" showCompass={false} />
			<RouteLayer day={day} places={places} currentStopIndex={currentStopIndex} />
			{dayPlaces.map((place, stopIndex) =>
			{
				const progress = getStopProgress(stopIndex, currentStopIndex);
				return (
					<Marker
						key={place.id}
						longitude={place.coordinates.longitude}
						latitude={place.coordinates.latitude}
						anchor={place.landmarkIconUrl ? "top" : "center"}
						offset={place.landmarkIconUrl ? [0, -82 * (place.landmarkIconScale ?? 1)] : [0, 0]}
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
