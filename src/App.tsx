import { useCallback, useEffect, useState } from "react";
import { ItineraryPanel } from "./components/ItineraryPanel/ItineraryPanel";
import { MapView, type ICameraPadding } from "./components/MapView/MapView";
import { PlaceDetailPanel } from "./components/PlaceDetailPanel/PlaceDetailPanel";
import { StepPlayer } from "./components/StepPlayer/StepPlayer";
import { useItineraryNavigation } from "./itinerary/useItineraryNavigation";
import { trips } from "./trips";
import styles from "./App.module.css";

const narrowScreenQuery = "(max-width: 760px)";
const wideScreenPadding: ICameraPadding = { top: 90, bottom: 140, left: 480, right: 80 };
const detailPanelWidth = 420;
const narrowScreenPadding: ICameraPadding = { top: 110, bottom: 0, left: 50, right: 50 };

function useIsNarrowScreen(): boolean
{
	const [isNarrowScreen, setIsNarrowScreen] = useState(() => window.matchMedia(narrowScreenQuery).matches);

	useEffect(() =>
	{
		const mediaQuery = window.matchMedia(narrowScreenQuery);
		const handleChange = () => setIsNarrowScreen(mediaQuery.matches);
		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, []);

	return isNarrowScreen;
}

/** The whole app: map, itinerary panel and step player for the selected trip. */
export function App()
{
	const trip = trips[0];
	const navigation = useItineraryNavigation(trip);
	const isNarrowScreen = useIsNarrowScreen();
	const { dayIndex, stopIndex } = navigation.position;
	const day = trip.days[dayIndex];
	const currentPlace = trip.places[day.stops[stopIndex].placeId];
	const [isDetailOpen, setIsDetailOpen] = useState(false);
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
		? { ...narrowScreenPadding, bottom: Math.round(window.innerHeight * 0.46) + 90 }
		: { ...wideScreenPadding, right: isDetailOpen ? detailPanelWidth + 40 : wideScreenPadding.right };

	return (
		<div className={styles.app}>
			<MapView
				day={day}
				places={trip.places}
				currentStopIndex={stopIndex}
				cameraPadding={cameraPadding}
				onSelectStop={selectStopOnMap}
			/>
			<ItineraryPanel
				trip={trip}
				dayIndex={dayIndex}
				stopIndex={stopIndex}
				onSelectDay={navigation.goToDay}
				onSelectStop={navigation.goToStop}
				onOpenDetails={openDetails}
			/>
			<div className={`${styles.playerDock} ${isDetailOpen && !isNarrowScreen ? styles.besideDetails : ""}`}>
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
			<PlaceDetailPanel
				isOpen={isDetailOpen}
				place={currentPlace}
				details={trip.placeDetails[currentPlace.id]}
				day={day}
				stopIndex={stopIndex}
				onClose={closeDetails}
			/>
		</div>
	);
}
