import type { Feature, FeatureCollection, LineString, Point } from "geojson";
import type { Map as MapLibreMap } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Layer, Marker, Source, useMap } from "react-map-gl/maplibre";
import { getLegSegments } from "../../itinerary/routeGeometry";
import { getDayLabel, getDayRangeLabel } from "../../itinerary/dayLabels";
import { findDayTrips, findExploredAreas, formatDayRanges } from "../../itinerary/tripOverview";
import type { ICity, ILegSegment, IPlace, ITrip } from "../../itinerary/types";
import { ExploredAreaLayer } from "../ExploredAreaLayer/ExploredAreaLayer";
import { getFitPadding } from "../MapView/fitPadding";
import { getLandmarkArtScale } from "../Markers/landmarkArt";
import type { ICameraPadding } from "../MapView/MapView";
import { spreadLabels } from "./spreadLabels";
import styles from "./TripOverviewLayer.module.css";

// Experimental: from about a region's width (zoom 7) the city badges give way to each day's areas and badge,
// nudged apart so they don't overlap. Landmarks and the badges for a day's extra areas wait for a single city.
const dayAreasZoom = 7;
const cityCloseUpZoom = 10.6;
const areaFadeStartZoom = dayAreasZoom - 0.5;
const areaFadeEndZoom = dayAreasZoom + 0.5;
// A badge pushed further than this from its area gets a thin line pointing back to it.
const leaderLineMinimumPixels = 8;
const areaLandmarkSize = 46;
const areaLandmarkSpacing = 4;
// Room around a zoomed-into city for the area badges, which hang below each area.
const cityZoomExtraPadding = { top: 30, right: 30, bottom: 60, left: 30 };
const cityMaximumZoom = 13.5;
const minimumCityZoom = cityCloseUpZoom + 0.5;
const cityZoomMilliseconds = 1600;

export interface ITripOverviewLayerProps
{
	trip: ITrip;
	legPaths: Record<string, ILegSegment[]>;
	/** Space taken by panels over the map, so zooming into a city keeps it in the visible part. */
	cameraPadding: ICameraPadding;
	highlightedDayNumber?: number;
	onSelectDay: (dayIndex: number) => void;
	onHighlightDay: (dayNumber: number | undefined) => void;
}

interface IAreaLandmark
{
	place: IPlace;
	dayIndex: number;
}

/**
 * Picks the landmark illustrations that fit without covering each other at the current zoom.
 * Earlier days win, so the first visit to a place keeps its illustration.
 */
function findUncoveredLandmarkIds(map: MapLibreMap, landmarks: IAreaLandmark[]): Set<string>
{
	const keptBoxes: { left: number; top: number; right: number; bottom: number }[] = [];
	const uncoveredIds = new Set<string>();
	landmarks.forEach(({ place }) =>
	{
		const point = map.project([place.coordinates.longitude, place.coordinates.latitude]);
		const size = areaLandmarkSize * getLandmarkArtScale(place);
		const box = { left: point.x - size / 2, top: point.y - size, right: point.x + size / 2, bottom: point.y };
		const isCovering = keptBoxes.some((kept) =>
			box.left < kept.right + areaLandmarkSpacing && box.right + areaLandmarkSpacing > kept.left
			&& box.top < kept.bottom + areaLandmarkSpacing && box.bottom + areaLandmarkSpacing > kept.top);
		if (!isCovering)
		{
			keptBoxes.push(box);
			uncoveredIds.add(place.id);
		}
	});
	return uncoveredIds;
}

/**
 * The whole trip at a glance: every day's route in its color, a badge per city, and a badge per day trip.
 * Zooming into a city swaps its badge for the neighborhoods each day explores and the landmarks seen there.
 */
export function TripOverviewLayer({ trip, legPaths, cameraPadding, highlightedDayNumber, onSelectDay, onHighlightDay }: ITripOverviewLayerProps)
{
	const { current: mapRef } = useMap();
	const [isDayDetail, setIsDayDetail] = useState(false);
	const [isCityDetail, setIsCityDetail] = useState(false);
	const badgeSlotsRef = useRef(new Map<number, HTMLSpanElement>());
	const leaderLinesRef = useRef<SVGSVGElement | null>(null);
	const [uncoveredLandmarkIds, setUncoveredLandmarkIds] = useState<Set<string>>(new Set());

	const routes = useMemo<FeatureCollection<LineString>>(() =>
	{
		const features: Feature<LineString>[] = [];
		trip.days.forEach((day) =>
		{
			day.stops.slice(1).forEach((stop, legIndex) =>
			{
				const start = trip.places[day.stops[legIndex].placeId].coordinates;
				const end = trip.places[stop.placeId].coordinates;
				const segments = getLegSegments(legPaths, day.dayNumber, legIndex + 1, start, end, stop.arrival?.mode ?? "walk");
				features.push(
				{
					type: "Feature",
					geometry: { type: "LineString", coordinates: segments.flatMap((segment) => segment.coordinates) },
					properties: { dayNumber: day.dayNumber, color: day.color },
				});
			});
		});
		return { type: "FeatureCollection", features };
	}, [trip, legPaths]);

	const cityBadges = useMemo(() => trip.cities.map((city) =>
	{
		const dayIndexes = trip.days.flatMap((day, dayIndex) => (day.baseCity === city.name ? [dayIndex] : []));
		return { city, dayIndexes };
	}).filter((badge) => badge.dayIndexes.length > 0), [trip]);

	const dayTrips = useMemo(() => findDayTrips(trip), [trip]);
	const exploredAreas = useMemo(() => findExploredAreas(trip), [trip]);

	const sightDots = useMemo<FeatureCollection<Point>>(() => (
	{
		type: "FeatureCollection",
		features: exploredAreas.flatMap((area) => area.places.map((place): Feature<Point> => (
		{
			type: "Feature",
			geometry: { type: "Point", coordinates: [place.coordinates.longitude, place.coordinates.latitude] },
			properties: { dayNumber: area.dayNumber, color: area.color },
		}))),
	}), [exploredAreas, trip]);

	const areaLandmarks = useMemo<IAreaLandmark[]>(() =>
	{
		const landmarks: IAreaLandmark[] = [];
		exploredAreas.forEach((area) => area.places.forEach((place) =>
		{
			if (place.landmarkIconUrl && !landmarks.some((landmark) => landmark.place.id === place.id))
			{
				landmarks.push({ place, dayIndex: area.dayIndex });
			}
		}));
		return landmarks;
	}, [exploredAreas]);

	// Only a city's own days count, not its day trips, so zooming into Kyoto frames Kyoto rather than Nara too.
	const cityAreaCoordinates = useMemo(() =>
	{
		const dayTripIndexes = new Set(dayTrips.map((dayTrip) => dayTrip.dayIndex));
		return new Map(trip.cities.map((city) =>
		{
			const coordinates = exploredAreas
				.filter((area) => trip.days[area.dayIndex].baseCity === city.name && !dayTripIndexes.has(area.dayIndex))
				.flatMap((area) => area.outline);
			const fallback: [number, number][] = [[city.coordinates.longitude, city.coordinates.latitude]];
			return [city.name, coordinates.length > 0 ? coordinates : fallback];
		}));
	}, [trip, dayTrips, exploredAreas]);

	useEffect(() =>
	{
		const map = mapRef?.getMap();
		if (!map)
		{
			return;
		}
		const updateDetailLevel = () =>
		{
			setIsDayDetail(map.getZoom() >= dayAreasZoom);
			setIsCityDetail(map.getZoom() >= cityCloseUpZoom);
		};
		const updateLandmarks = () => setUncoveredLandmarkIds(findUncoveredLandmarkIds(map, areaLandmarks));
		updateDetailLevel();
		updateLandmarks();
		map.on("zoom", updateDetailLevel);
		map.on("moveend", updateLandmarks);
		return () =>
		{
			map.off("zoom", updateDetailLevel);
			map.off("moveend", updateLandmarks);
		};
	}, [mapRef, areaLandmarks]);

	// Until a single city fills the map, only each day's main area carries a badge.
	const badgedAreaIndexes = useMemo(
		() => exploredAreas.flatMap((area, areaIndex) => (isDayDetail && (isCityDetail || area.isMainArea) ? [areaIndex] : [])),
		[exploredAreas, isDayDetail, isCityDetail],
	);

	useEffect(() =>
	{
		const map = mapRef?.getMap();
		const leaderLines = leaderLinesRef.current;
		if (!map || !leaderLines)
		{
			return;
		}
		let animationFrame = 0;
		const layOutBadges = () =>
		{
			animationFrame = 0;
			// Read every size and position first, then move the badges, so the browser lays out the page only once.
			const badges = badgedAreaIndexes.flatMap((areaIndex) =>
			{
				const slot = badgeSlotsRef.current.get(areaIndex);
				if (!slot)
				{
					return [];
				}
				const { longitude, latitude } = exploredAreas[areaIndex].badgeCoordinates;
				const anchor = map.project([longitude, latitude]);
				return [{ areaIndex, slot, anchorX: anchor.x, anchorY: anchor.y + 3, width: slot.offsetWidth, height: slot.offsetHeight }];
			});
			const offsets = spreadLabels(badges);
			const lines: string[] = [];
			badges.forEach((badge, index) =>
			{
				const offset = offsets[index];
				badge.slot.style.transform = `translate(${offset.x}px, ${offset.y}px)`;
				if (Math.hypot(offset.x, offset.y) < leaderLineMinimumPixels)
				{
					return;
				}
				const left = badge.anchorX - badge.width / 2 + offset.x;
				const top = badge.anchorY + offset.y;
				const pointX = badge.anchorX;
				const pointY = badge.anchorY - 3;
				const endX = Math.min(Math.max(pointX, left), left + badge.width);
				const endY = Math.min(Math.max(pointY, top), top + badge.height);
				const color = exploredAreas[badge.areaIndex].color;
				lines.push(`<line x1="${pointX}" y1="${pointY}" x2="${endX}" y2="${endY}" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>`
					+ `<circle cx="${pointX}" cy="${pointY}" r="2.5" fill="${color}" stroke="#ffffff" stroke-width="1.2"/>`);
			});
			leaderLines.innerHTML = lines.join("");
		};
		const scheduleLayout = () =>
		{
			if (!animationFrame)
			{
				animationFrame = requestAnimationFrame(layOutBadges);
			}
		};
		scheduleLayout();
		map.on("move", scheduleLayout);
		return () =>
		{
			map.off("move", scheduleLayout);
			cancelAnimationFrame(animationFrame);
			leaderLines.innerHTML = "";
		};
	}, [mapRef, exploredAreas, badgedAreaIndexes]);

	const zoomIntoCity = (city: ICity) =>
	{
		const coordinates = cityAreaCoordinates.get(city.name) ?? [];
		const longitudes = coordinates.map((point) => point[0]);
		const latitudes = coordinates.map((point) => point[1]);
		const padding =
		{
			top: cameraPadding.top + cityZoomExtraPadding.top,
			right: cameraPadding.right + cityZoomExtraPadding.right,
			bottom: cameraPadding.bottom + cityZoomExtraPadding.bottom,
			left: cameraPadding.left + cityZoomExtraPadding.left,
		};
		const bounds: [[number, number], [number, number]] =
			[[Math.min(...longitudes), Math.min(...latitudes)], [Math.max(...longitudes), Math.max(...latitudes)]];
		if (!mapRef)
		{
			return;
		}
		const fitPadding = getFitPadding(mapRef.getMap(), padding);
		const camera = mapRef.cameraForBounds(bounds, { padding: fitPadding, maxZoom: cityMaximumZoom });
		if (!camera)
		{
			return;
		}
		if ((camera.zoom ?? 0) >= minimumCityZoom)
		{
			mapRef.fitBounds(bounds, { padding: fitPadding, maxZoom: cityMaximumZoom, duration: cityZoomMilliseconds });
			return;
		}
		// On small screens a whole city only fits below the detail zoom; going in deeper is better than not showing the areas.
		const center: [number, number] = [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2];
		mapRef.flyTo({ center, zoom: minimumCityZoom, padding, duration: cityZoomMilliseconds });
	};

	const isAnyDayHighlighted = highlightedDayNumber !== undefined;
	const highlightExpression = ["==", ["get", "dayNumber"], highlightedDayNumber ?? -1];
	const fadeInWithZoom = (visibleValue: unknown) =>
		["interpolate", ["linear"], ["zoom"], areaFadeStartZoom, 0, areaFadeEndZoom, visibleValue] as never;

	return (
		<>
			<ExploredAreaLayer
				id="trip"
				areas={exploredAreas}
				highlightedDayNumber={highlightedDayNumber}
				fadeInZoomRange={[areaFadeStartZoom, areaFadeEndZoom]}
			/>

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

			<Source id="trip-sights" type="geojson" data={sightDots}>
				<Layer
					id="trip-sights"
					type="circle"
					paint={{
						"circle-color": ["get", "color"],
						"circle-radius": 4,
						"circle-stroke-color": "#ffffff",
						"circle-stroke-width": 2,
						"circle-opacity": fadeInWithZoom(1),
						"circle-stroke-opacity": fadeInWithZoom(1),
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
					<div
						className={`${styles.cityBadge} ${city.badgePlacement === "below" ? styles.below : ""} ${isDayDetail ? styles.isHidden : ""}`}
						aria-hidden={isDayDetail}
					>
						<button
							type="button"
							className={styles.cityHeader}
							onClick={() => zoomIntoCity(city)}
							title={`Zoom into ${city.name}`}
							tabIndex={isDayDetail ? -1 : undefined}
						>
							<span className={styles.cityName}>{city.name}</span>
							{city.localName && <span className={styles.cityLocalName}>{city.localName}</span>}
							<svg className={styles.zoomGlyph} width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
								<circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.6" />
								<path d="M15.5 15.5 21 21M10.5 7.5v6M7.5 10.5h6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
							</svg>
						</button>
						<span className={styles.cityDays}>{getDayRangeLabel(dayIndexes.map((dayIndex) => trip.days[dayIndex]), formatDayRanges)}</span>
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
										title={`${getDayLabel(day)}: ${day.title}`}
										tabIndex={isDayDetail ? -1 : undefined}
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
							className={`${styles.dayTripBadge} ${extendsToward === "west" ? styles.towardWest : ""} ${isDayDetail ? styles.isHidden : ""}`}
							style={{ "--day-color": day.color } as CSSProperties}
							onClick={() => onSelectDay(dayIndex)}
							onMouseEnter={() => onHighlightDay(day.dayNumber)}
							onMouseLeave={() => onHighlightDay(undefined)}
							tabIndex={isDayDetail ? -1 : undefined}
							aria-hidden={isDayDetail}
						>
							<span className={styles.dayTripNumber}>{day.dayNumber}</span>
							{day.title}
						</button>
					</Marker>
				);
			})}

			{isCityDetail && areaLandmarks.filter(({ place }) => uncoveredLandmarkIds.has(place.id)).map(({ place, dayIndex }) =>
			{
				const day = trip.days[dayIndex];
				return (
					<Marker key={`landmark-${place.id}`} longitude={place.coordinates.longitude} latitude={place.coordinates.latitude} anchor="bottom">
						<button
							type="button"
							className={styles.areaLandmark}
							style={{ "--day-color": day.color, "--landmark-scale": getLandmarkArtScale(place) } as CSSProperties}
							onClick={() => onSelectDay(dayIndex)}
							onMouseEnter={() => onHighlightDay(day.dayNumber)}
							onMouseLeave={() => onHighlightDay(undefined)}
							title={`${place.name} · ${getDayLabel(day)}`}
							aria-label={`${place.name}, ${getDayLabel(day)}`}
						>
							<img src={place.landmarkIconUrl} alt="" draggable={false} />
						</button>
					</Marker>
				);
			})}

			<svg ref={leaderLinesRef} className={styles.leaderLines} aria-hidden="true" />

			{badgedAreaIndexes.map((areaIndex) =>
			{
				const area = exploredAreas[areaIndex];
				const day = trip.days[area.dayIndex];
				return (
					<Marker
						key={`area-${areaIndex}`}
						longitude={area.badgeCoordinates.longitude}
						latitude={area.badgeCoordinates.latitude}
						anchor="top"
						offset={[0, 3]}
						style={{ zIndex: area.isMainArea ? 2 : 1 }}
					>
						<span
							className={styles.badgeSlot}
							ref={(slot) =>
							{
								if (slot)
								{
									badgeSlotsRef.current.set(areaIndex, slot);
								}
								else
								{
									badgeSlotsRef.current.delete(areaIndex);
								}
							}}
						>
							<button
								type="button"
								className={area.isMainArea ? styles.areaBadge : styles.areaNumberBadge}
								style={{ "--day-color": day.color } as CSSProperties}
								onClick={() => onSelectDay(area.dayIndex)}
								onMouseEnter={() => onHighlightDay(day.dayNumber)}
								onMouseLeave={() => onHighlightDay(undefined)}
								title={`${getDayLabel(day)}: ${day.title}`}
							>
								<span className={styles.dayTripNumber}>{day.dayNumber}</span>
								{area.isMainArea && day.title}
							</button>
						</span>
					</Marker>
				);
			})}
		</>
	);
}
