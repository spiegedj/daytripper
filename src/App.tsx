import { useCallback, useEffect, useMemo, useState } from "react";
import { ItineraryPanel } from "./components/ItineraryPanel/ItineraryPanel";
import { MapView, type ICameraPadding } from "./components/MapView/MapView";
import { PlaceDetailPanel } from "./components/PlaceDetailPanel/PlaceDetailPanel";
import { StepPlayer } from "./components/StepPlayer/StepPlayer";
import { TripOverviewLayer } from "./components/TripOverviewLayer/TripOverviewLayer";
import { useItineraryNavigation } from "./itinerary/useItineraryNavigation";
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
	const currentPlace = trip.places[day.stops[stopIndex].placeId];
	const [isDetailOpen, setIsDetailOpen] = useState(false);
	const [highlightedDayNumber, setHighlightedDayNumber] = useState<number | undefined>();
	const { isOverview } = navigation;
	const tripCoordinates = useMemo(() => trip.days.flatMap((tripDay) => tripDay.stops.map((stop) => trip.places[stop.placeId].coordinates)), [trip]);
	const showOverview = useCallback(() =>
	{
		setIsDetailOpen(false);
		navigation.showOverview();
	}, [navigation]);
	const openDetails = useCallback(() => setIsDetailOpen(true), []);
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
		: { ...wideScreenPadding, left: isDetailOpen && canShowPanelsSideBySide ? leftWithDetailsOpen : wideScreenPadding.left };

	return (
		<div className={styles.app}>
			<MapView
				day={day}
				places={trip.places}
				currentStopIndex={stopIndex}
				cameraPadding={cameraPadding}
				isOverview={isOverview}
				tripCoordinates={tripCoordinates}
				onSelectStop={selectStopOnMap}
			>
				<TripOverviewLayer
					trip={trip}
					highlightedDayNumber={highlightedDayNumber}
					onSelectDay={navigation.goToDay}
					onHighlightDay={setHighlightedDayNumber}
				/>
			</MapView>
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
				<div className={`${styles.playerDock} ${isDetailOpen && canShowPanelsSideBySide ? styles.besideDetails : ""}`}>
					<StepPlayer
						day={day}
						nextDay={trip.days[dayIndex + 1]}
						currentStopIndex={stopIndex}
						currentStopName={currentPlace.name}
						isAtTripStart={navigation.isAtTripStart}
						isAtTripEnd={navigation.isAtTripEnd}
						isCompact={isDetailOpen && !isNarrowScreen}
						onPrevious={navigation.goToPreviousStop}
						onNext={navigation.goToNextStop}
					/>
				</div>
			)}
			<PlaceDetailPanel
				isOpen={isDetailOpen && !isOverview}
				place={currentPlace}
				details={trip.placeDetails[currentPlace.id]}
				day={day}
				stopIndex={stopIndex}
				onClose={closeDetails}
			/>
		</div>
	);
}
