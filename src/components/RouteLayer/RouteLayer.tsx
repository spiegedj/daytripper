import type { Feature, FeatureCollection, LineString } from "geojson";
import { useEffect, useMemo } from "react";
import { Layer, Source, useMap } from "react-map-gl/maplibre";
import { easeLegTravel, getLegPathKey, getLegSegments, getLegTravelMilliseconds } from "../../itinerary/routeGeometry";
import type { IDay, ILegSegment, IPlace } from "../../itinerary/types";
import type { ILegRideChannel } from "../MapView/followLegWithCamera";

export interface IRouteLayerProps
{
	day: IDay;
	places: Record<string, IPlace>;
	currentStopIndex: number;
	legPaths: Record<string, ILegSegment[]>;
	/** When the camera rides along the leg, the line draws in step with it instead of on its own timer. */
	rideChannel?: ILegRideChannel;
}

type LegProgress = "traveled" | "upcoming";

const currentLegLayerId = "route-current-leg";

/** Draws a day's route: traveled legs solid, upcoming legs dotted, and the leg just traveled drawing itself in. */
export function RouteLayer({ day, places, currentStopIndex, legPaths, rideChannel }: IRouteLayerProps)
{
	const { current: map } = useMap();

	const { otherLegs, currentLeg, currentLegMilliseconds } = useMemo(() =>
	{
		const otherLegFeatures: Feature<LineString, { progress: LegProgress; isWalk: boolean }>[] = [];
		const currentLegFeatures: Feature<LineString>[] = [];
		let currentLegCoordinates: [number, number][] = [];
		day.stops.slice(1).forEach((stop, legIndex) =>
		{
			const start = places[day.stops[legIndex].placeId].coordinates;
			const end = places[stop.placeId].coordinates;
			const arrivingStopIndex = legIndex + 1;
			const segments = getLegSegments(legPaths, day.dayNumber, arrivingStopIndex, start, end, stop.arrival?.mode ?? "walk");
			const hasRealPath = legPaths[getLegPathKey(day.dayNumber, arrivingStopIndex)] !== undefined;
			if (arrivingStopIndex === currentStopIndex)
			{
				// The leg being drawn in is one continuous line so the reveal animation runs smoothly from start to end.
				currentLegCoordinates = segments.flatMap((segment) => segment.coordinates);
				currentLegFeatures.push(
				{
					type: "Feature",
					geometry: { type: "LineString", coordinates: currentLegCoordinates },
					properties: {},
				});
				return;
			}
			const progress: LegProgress = arrivingStopIndex < currentStopIndex ? "traveled" : "upcoming";
			for (const segment of segments)
			{
				otherLegFeatures.push(
				{
					type: "Feature",
					geometry: { type: "LineString", coordinates: segment.coordinates },
					properties: { progress, isWalk: hasRealPath && segment.mode === "walk" },
				});
			}
		});
		return {
			otherLegs: { type: "FeatureCollection", features: otherLegFeatures } as FeatureCollection,
			currentLeg: { type: "FeatureCollection", features: currentLegFeatures } as FeatureCollection,
			// Drawn at the same pace as the camera riding along it, so the line's tip stays under the camera.
			currentLegMilliseconds: getLegTravelMilliseconds(currentLegCoordinates),
		};
	}, [day, places, currentStopIndex, legPaths]);

	useEffect(() =>
	{
		const mapInstance = map?.getMap();
		if (!mapInstance)
		{
			return;
		}

		const showProgress = (progress: number) =>
		{
			if (!mapInstance.getLayer(currentLegLayerId))
			{
				return false;
			}
			// line-gradient needs a step strictly above 0, otherwise the whole line shows on the first frame.
			const visibleUntil = Math.max(progress, 0.0001);
			mapInstance.setPaintProperty(currentLegLayerId, "line-gradient",
				["step", ["line-progress"], day.color, visibleUntil, "rgba(0, 0, 0, 0)"]);
			return true;
		};

		let animationFrame = 0;
		let isFollowingCamera = false;
		const stopListening = rideChannel?.subscribe((progress) =>
		{
			isFollowingCamera = true;
			cancelAnimationFrame(animationFrame);
			showProgress(progress);
		});

		// Without a camera ride (jumping between stops, changing days) the line draws in on its own.
		const startTime = performance.now();
		const drawFrame = (now: number) =>
		{
			if (isFollowingCamera)
			{
				return;
			}
			const linearProgress = Math.min((now - startTime) / currentLegMilliseconds, 1);
			const hasLayer = showProgress(easeLegTravel(linearProgress));
			if (!hasLayer || linearProgress < 1)
			{
				animationFrame = requestAnimationFrame(drawFrame);
			}
		};
		animationFrame = requestAnimationFrame(drawFrame);
		return () =>
		{
			cancelAnimationFrame(animationFrame);
			stopListening?.();
		};
	}, [map, currentStopIndex, day.color, currentLegMilliseconds, rideChannel]);

	return (
		<>
			<Source id="route-legs" type="geojson" data={otherLegs}>
				<Layer
					id="route-traveled-casing"
					type="line"
					filter={["all", ["==", ["get", "progress"], "traveled"], ["!", ["get", "isWalk"]]]}
					layout={{ "line-cap": "round", "line-join": "round" }}
					paint={{ "line-color": "#ffffff", "line-width": 10 }}
				/>
				<Layer
					id="route-traveled"
					type="line"
					filter={["all", ["==", ["get", "progress"], "traveled"], ["!", ["get", "isWalk"]]]}
					layout={{ "line-cap": "round", "line-join": "round" }}
					paint={{ "line-color": day.color, "line-width": 5.5 }}
				/>
				<Layer
					id="route-traveled-walk"
					type="line"
					filter={["all", ["==", ["get", "progress"], "traveled"], ["get", "isWalk"]]}
					layout={{ "line-cap": "round", "line-join": "round" }}
					paint={{ "line-color": day.color, "line-width": 3.5, "line-dasharray": [1.2, 1.4] }}
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
