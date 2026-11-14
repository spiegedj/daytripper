import { useEffect, useState } from "react";
import { ItineraryPanel } from "./components/ItineraryPanel/ItineraryPanel";
import { MapView, type ICameraPadding } from "./components/MapView/MapView";
import { StepPlayer } from "./components/StepPlayer/StepPlayer";
import { useItineraryNavigation } from "./itinerary/useItineraryNavigation";
import { trips } from "./trips";
import styles from "./App.module.css";

const narrowScreenQuery = "(max-width: 760px)";
const wideScreenPadding: ICameraPadding = { top: 90, bottom: 130, left: 440, right: 80 };
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

	// On phones the bottom sheet covers the lower part of the map, so the camera keeps stops above it.
	const cameraPadding = isNarrowScreen
		? { ...narrowScreenPadding, bottom: Math.round(window.innerHeight * 0.46) + 90 }
		: wideScreenPadding;

	return (
		<div className={styles.app}>
			<MapView
				day={day}
				places={trip.places}
				currentStopIndex={stopIndex}
				cameraPadding={cameraPadding}
				onSelectStop={navigation.goToStop}
			/>
			<ItineraryPanel
				trip={trip}
				dayIndex={dayIndex}
				stopIndex={stopIndex}
				onSelectDay={navigation.goToDay}
				onSelectStop={navigation.goToStop}
			/>
			<div className={styles.playerDock}>
				<StepPlayer
					day={day}
					nextDay={trip.days[dayIndex + 1]}
					currentStopIndex={stopIndex}
					currentStopName={currentPlace.name}
					isAtTripStart={navigation.isAtTripStart}
					isAtTripEnd={navigation.isAtTripEnd}
					onPrevious={navigation.goToPreviousStop}
					onNext={navigation.goToNextStop}
				/>
			</div>
		</div>
	);
}
