import { useCallback, useEffect, useMemo, useState } from "react";
import { ItineraryPanel } from "./components/ItineraryPanel/ItineraryPanel";
import { MapView, type ICameraPadding } from "./components/MapView/MapView";
import { PlaceDetailPanel } from "./components/PlaceDetailPanel/PlaceDetailPanel";
import { RouteStyleSwitch, useRouteStyle } from "./components/RouteStyleSwitch/RouteStyleSwitch";
import { StepPlayer } from "./components/StepPlayer/StepPlayer";
import { TravelSpeedSwitch, useTravelSpeed } from "./components/TravelSpeedSwitch/TravelSpeedSwitch";
import type { ILegSegment } from "./itinerary/types";
import { TripOverviewLayer } from "./components/TripOverviewLayer/TripOverviewLayer";
import { dayOverviewStopIndex, useItineraryNavigation } from "./itinerary/useItineraryNavigation";
import { trips } from "./trips";
import styles from "./App.module.css";

const narrowScreenQuery = "(max-width: 760px)";
const sideBySidePanelsQuery = "(min-width: 1181px)";
const wideScreenPadding: ICameraPadding = { top: 90, bottom: 140, left: 480, right: 80 };
// The details pane sits right next to the itinerary panel, so the map's visible area starts after both.
const leftWithDetailsOpen = 16 + 420 + 12 + 400 + 40;
const narrowScreenPadding: ICameraPadding = { top: 110, bottom: 0, left: 50, right: 50 };

function useMediaQuery(query: string): boolean
{
	const [isMatch, setIsMatch] = useState(() => window.matchMedia(query).matches);

	useEffect(() =>
	{
		const mediaQuery = window.matchMedia(query);
		const handleChange = () => setIsMatch(mediaQuery.matches);
		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, [query]);

	return isMatch;
}

/** The whole app: map, itinerary panel and step player for the selected trip. */
export function App()
{
	const trip = trips[0];
	const navigation = useItineraryNavigation(trip);
	const isNarrowScreen = useMediaQuery(narrowScreenQuery);
	const canShowPanelsSideBySide = useMediaQuery(sideBySidePanelsQuery);
	const { dayIndex, stopIndex } = navigation.position;
	const day = trip.days[dayIndex];
	const isDayOverview = stopIndex === dayOverviewStopIndex;
	// The day overview has no place of its own; the details pane stays closed there, so the first stop stands in.
	const detailStopIndex = Math.max(stopIndex, 0);
	const currentPlace = trip.places[day.stops[detailStopIndex].placeId];
	const [isDetailOpen, setIsDetailOpen] = useState(false);
	const [highlightedDayNumber, setHighlightedDayNumber] = useState<number | undefined>();
	const [routeStyle, setRouteStyle] = useRouteStyle();
	const [travelSpeed, setTravelSpeed] = useTravelSpeed();
	// With arcs selected, no real paths are handed to the map, so every leg falls back to its curve.
	const visibleLegPaths = useMemo<Record<string, ILegSegment[]>>(() => (routeStyle === "real" ? trip.legPaths : {}), [routeStyle, trip]);
	const { isOverview } = navigation;
	const tripCoordinates = useMemo(() => trip.days.flatMap((tripDay) => tripDay.stops.map((stop) => trip.places[stop.placeId].coordinates)), [trip]);
	const showOverview = useCallback(() =>
	{
		setIsDetailOpen(false);
		navigation.showOverview();
	}, [navigation]);
	const openDetails = useCallback(() => setIsDetailOpen(true), []);

	useEffect(() =>
	{
		// The overview is about the whole day, so details for a single place make way for it.
		if (isDayOverview)
		{
			setIsDetailOpen(false);
		}
	}, [isDayOverview]);
	const closeDetails = useCallback(() => setIsDetailOpen(false), []);
	const { goToStop } = navigation;
	const selectStopOnMap = useCallback((selectedStopIndex: number) =>
	{
		goToStop(selectedStopIndex);
		setIsDetailOpen(true);
	}, [goToStop]);

	// On phones the bottom sheet covers the lower part of the map, so the camera keeps stops above it.
	const cameraPadding = isNarrowScreen
		? { ...narrowScreenPadding, top: isOverview ? 40 : narrowScreenPadding.top, bottom: Math.round(window.innerHeight * 0.46) + (isOverview ? 16 : 90) }
		: { ...wideScreenPadding, left: isDetailOpen && !isDayOverview && canShowPanelsSideBySide ? leftWithDetailsOpen : wideScreenPadding.left };

	return (
		<div className={styles.app}>
			<MapView
				day={day}
				places={trip.places}
				legPaths={visibleLegPaths}
				currentStopIndex={stopIndex}
				cameraPadding={cameraPadding}
				isOverview={isOverview}
				tripCoordinates={tripCoordinates}
				onSelectStop={selectStopOnMap}
				travelSpeed={travelSpeed}
			>
				<TripOverviewLayer
					trip={trip}
					legPaths={visibleLegPaths}
					cameraPadding={cameraPadding}
					highlightedDayNumber={highlightedDayNumber}
					onSelectDay={navigation.goToDay}
					onHighlightDay={setHighlightedDayNumber}
				/>
			</MapView>
			<div className={styles.routeStyleDock}>
				<RouteStyleSwitch routeStyle={routeStyle} onChange={setRouteStyle} />
				{!isOverview && <TravelSpeedSwitch travelSpeed={travelSpeed} onChange={setTravelSpeed} />}
			</div>
			<ItineraryPanel
				trip={trip}
				dayIndex={dayIndex}
				stopIndex={stopIndex}
				onSelectDay={navigation.goToDay}
				isOverview={isOverview}
				highlightedDayNumber={highlightedDayNumber}
				onSelectStop={navigation.goToStop}
				onOpenDetails={openDetails}
				onShowOverview={showOverview}
				onHighlightDay={setHighlightedDayNumber}
			/>
			{!isOverview && (
				<div className={`${styles.playerDock} ${isDetailOpen && !isDayOverview && canShowPanelsSideBySide ? styles.besideDetails : ""}`}>
					<StepPlayer
						day={day}
						nextDay={trip.days[dayIndex + 1]}
						currentStopIndex={stopIndex}
						currentStopName={isDayOverview ? day.title : currentPlace.name}
						isAtTripStart={navigation.isAtTripStart}
						isAtTripEnd={navigation.isAtTripEnd}
						isCompact={isDetailOpen && !isDayOverview && !isNarrowScreen}
						onPrevious={navigation.goToPreviousStop}
						onNext={navigation.goToNextStop}
					/>
				</div>
			)}
			<PlaceDetailPanel
				isOpen={isDetailOpen && !isOverview && !isDayOverview}
				place={currentPlace}
				details={trip.placeDetails[currentPlace.id]}
				day={day}
				stopIndex={detailStopIndex}
				onClose={closeDetails}
			/>
		</div>
	);
}
