import type { Feature, FeatureCollection, LineString } from "geojson";
import { useEffect, useMemo } from "react";
import { Layer, Source, useMap } from "react-map-gl/maplibre";
import { createCurvedLegCoordinates } from "../../itinerary/routeGeometry";
import type { IDay, IPlace } from "../../itinerary/types";

export interface IRouteLayerProps
{
	day: IDay;
	places: Record<string, IPlace>;
	currentStopIndex: number;
}

type LegProgress = "traveled" | "upcoming";

const currentLegLayerId = "route-current-leg";
const legDrawDurationMilliseconds = 1100;

/** Draws a day's route: traveled legs solid, upcoming legs dotted, and the leg just traveled drawing itself in. */
export function RouteLayer({ day, places, currentStopIndex }: IRouteLayerProps)
{
	const { current: map } = useMap();

	const legs = useMemo(() =>
	{
		return day.stops.slice(1).map((stop, legIndex) =>
		{
			const start = places[day.stops[legIndex].placeId].coordinates;
			const end = places[stop.placeId].coordinates;
			const arrivingStopIndex = legIndex + 1;
			const progress: LegProgress = arrivingStopIndex < currentStopIndex ? "traveled" : "upcoming";
			const feature: Feature<LineString, { progress: LegProgress; isCurrentLeg: boolean }> =
			{
				type: "Feature",
				geometry: { type: "LineString", coordinates: createCurvedLegCoordinates(start, end) },
				properties: { progress, isCurrentLeg: arrivingStopIndex === currentStopIndex },
			};
			return feature;
		});
	}, [day, places, currentStopIndex]);

	const otherLegs: FeatureCollection = { type: "FeatureCollection", features: legs.filter((leg) => !leg.properties.isCurrentLeg) };
	const currentLeg: FeatureCollection = { type: "FeatureCollection", features: legs.filter((leg) => leg.properties.isCurrentLeg) };

	useEffect(() =>
	{
		const mapInstance = map?.getMap();
		if (!mapInstance)
		{
			return;
		}

		let animationFrame = 0;
		const startTime = performance.now();
		const drawFrame = (now: number) =>
		{
			if (!mapInstance.getLayer(currentLegLayerId))
			{
				animationFrame = requestAnimationFrame(drawFrame);
				return;
			}
			const linearProgress = Math.min((now - startTime) / legDrawDurationMilliseconds, 1);
			const easedProgress = 1 - Math.pow(1 - linearProgress, 3);
			// line-gradient needs a step strictly above 0, otherwise the whole line shows on the first frame.
			const visibleUntil = Math.max(easedProgress, 0.0001);
			mapInstance.setPaintProperty(currentLegLayerId, "line-gradient",
				["step", ["line-progress"], day.color, visibleUntil, "rgba(0, 0, 0, 0)"]);
			if (linearProgress < 1)
			{
				animationFrame = requestAnimationFrame(drawFrame);
			}
		};
		animationFrame = requestAnimationFrame(drawFrame);
		return () => cancelAnimationFrame(animationFrame);
	}, [map, currentStopIndex, day.color]);

	return (
		<>
			<Source id="route-legs" type="geojson" data={otherLegs}>
				<Layer
					id="route-traveled-casing"
					type="line"
					filter={["==", ["get", "progress"], "traveled"]}
					layout={{ "line-cap": "round", "line-join": "round" }}
					paint={{ "line-color": "#ffffff", "line-width": 10 }}
				/>
				<Layer
					id="route-traveled"
					type="line"
					filter={["==", ["get", "progress"], "traveled"]}
					layout={{ "line-cap": "round", "line-join": "round" }}
					paint={{ "line-color": day.color, "line-width": 5.5 }}
				/>
				<Layer
					id="route-upcoming"
					type="line"
					filter={["==", ["get", "progress"], "upcoming"]}
					layout={{ "line-cap": "round", "line-join": "round" }}
					paint={{ "line-color": day.color, "line-opacity": 0.55, "line-width": 5, "line-dasharray": [0.1, 2.2] }}
				/>
			</Source>
			<Source id="route-current" type="geojson" data={currentLeg} lineMetrics>
				<Layer
					id="route-current-casing"
					type="line"
					layout={{ "line-cap": "round", "line-join": "round" }}
					paint={{ "line-color": "#ffffff", "line-width": 10, "line-opacity": 0.9 }}
				/>
				<Layer
					id={currentLegLayerId}
					type="line"
					layout={{ "line-cap": "round", "line-join": "round" }}
					paint={{ "line-width": 5.5, "line-gradient": ["step", ["line-progress"], day.color, 0.0001, "rgba(0, 0, 0, 0)"] }}
				/>
			</Source>
		</>
	);
}
