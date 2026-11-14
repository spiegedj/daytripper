import type { Feature, FeatureCollection, LineString } from "geojson";
import { useMemo, type CSSProperties } from "react";
import { Layer, Marker, Source } from "react-map-gl/maplibre";
import { getLegSegments } from "../../itinerary/routeGeometry";
import { findDayTrips, formatDayRanges } from "../../itinerary/tripOverview";
import type { ITrip } from "../../itinerary/types";
import styles from "./TripOverviewLayer.module.css";

export interface ITripOverviewLayerProps
{
	trip: ITrip;
	highlightedDayNumber?: number;
	onSelectDay: (dayIndex: number) => void;
	onHighlightDay: (dayNumber: number | undefined) => void;
}

/** The whole trip at a glance: every day's route in its color, a badge per city, and a badge per day trip. */
export function TripOverviewLayer({ trip, highlightedDayNumber, onSelectDay, onHighlightDay }: ITripOverviewLayerProps)
{
	const routes = useMemo<FeatureCollection<LineString>>(() =>
	{
		const features: Feature<LineString>[] = [];
		trip.days.forEach((day) =>
		{
			day.stops.slice(1).forEach((stop, legIndex) =>
			{
				const start = trip.places[day.stops[legIndex].placeId].coordinates;
				const end = trip.places[stop.placeId].coordinates;
				const segments = getLegSegments(trip.legPaths, day.dayNumber, legIndex + 1, start, end, stop.arrival?.mode ?? "walk");
				features.push(
				{
					type: "Feature",
					geometry: { type: "LineString", coordinates: segments.flatMap((segment) => segment.coordinates) },
					properties: { dayNumber: day.dayNumber, color: day.color },
				});
			});
		});
		return { type: "FeatureCollection", features };
	}, [trip]);

	const cityBadges = useMemo(() => trip.cities.map((city) =>
	{
		const dayIndexes = trip.days.flatMap((day, dayIndex) => (day.baseCity === city.name ? [dayIndex] : []));
		return { city, dayIndexes };
	}).filter((badge) => badge.dayIndexes.length > 0), [trip]);

	const dayTrips = useMemo(() => findDayTrips(trip), [trip]);
	const isAnyDayHighlighted = highlightedDayNumber !== undefined;
	const highlightExpression = ["==", ["get", "dayNumber"], highlightedDayNumber ?? -1];

	return (
		<>
			<Source id="trip-routes" type="geojson" data={routes}>
				<Layer
					id="trip-routes-casing"
					type="line"
					layout={{ "line-cap": "round", "line-join": "round" }}
					paint={{ "line-color": "#ffffff", "line-width": ["case", highlightExpression, 9, 6] as never, "line-opacity": 0.9 }}
				/>
				<Layer
					id="trip-routes"
					type="line"
					layout={{ "line-cap": "round", "line-join": "round" }}
					paint={{
						"line-color": ["get", "color"],
						"line-width": ["case", highlightExpression, 5, 3] as never,
						"line-opacity": isAnyDayHighlighted ? (["case", highlightExpression, 1, 0.25] as never) : 0.9,
					}}
				/>
			</Source>

			{cityBadges.map(({ city, dayIndexes }) => (
				<Marker
					key={city.name}
					longitude={city.coordinates.longitude}
					latitude={city.coordinates.latitude}
					anchor={city.badgePlacement === "below" ? "top" : "bottom"}
					offset={[0, city.badgePlacement === "below" ? 8 : -8]}
				>
					<div className={`${styles.cityBadge} ${city.badgePlacement === "below" ? styles.below : ""}`}>
						<span className={styles.cityHeader}>
							<span className={styles.cityName}>{city.name}</span>
							{city.localName && <span className={styles.cityLocalName}>{city.localName}</span>}
						</span>
						<span className={styles.cityDays}>Day {formatDayRanges(dayIndexes.map((dayIndex) => trip.days[dayIndex].dayNumber))}</span>
						<span className={styles.dayChips}>
							{dayIndexes.map((dayIndex) =>
							{
								const day = trip.days[dayIndex];
								return (
									<button
										key={day.dayNumber}
										type="button"
										className={styles.dayChip}
										style={{ "--day-color": day.color } as CSSProperties}
										onClick={() => onSelectDay(dayIndex)}
										onMouseEnter={() => onHighlightDay(day.dayNumber)}
										onMouseLeave={() => onHighlightDay(undefined)}
										title={`Day ${day.dayNumber}: ${day.title}`}
									>
										{day.dayNumber}
									</button>
								);
							})}
						</span>
					</div>
				</Marker>
			))}

			{dayTrips.map(({ dayIndex, coordinates, extendsToward }) =>
			{
				const day = trip.days[dayIndex];
				return (
					<Marker
						key={`trip-${day.dayNumber}`}
						longitude={coordinates.longitude}
						latitude={coordinates.latitude}
						anchor={extendsToward === "east" ? "left" : "right"}
						offset={[extendsToward === "east" ? -14 : 14, 0]}
					>
						<button
							type="button"
							className={`${styles.dayTripBadge} ${extendsToward === "west" ? styles.towardWest : ""}`}
							style={{ "--day-color": day.color } as CSSProperties}
							onClick={() => onSelectDay(dayIndex)}
							onMouseEnter={() => onHighlightDay(day.dayNumber)}
							onMouseLeave={() => onHighlightDay(undefined)}
						>
							<span className={styles.dayTripNumber}>{day.dayNumber}</span>
							{day.title}
						</button>
					</Marker>
				);
			})}
		</>
	);
}
