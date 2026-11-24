import { AnimatePresence } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ItineraryPanel } from "./components/ItineraryPanel/ItineraryPanel";
import { MapView, type ICameraPadding } from "./components/MapView/MapView";
import { PhotoViewer, type IViewerPhoto } from "./components/PhotoViewer/PhotoViewer";
import { hasPlaceDetails, PlaceDetails, type OpenPhotoHandler } from "./components/PlaceDetails/PlaceDetails";
import { useRouteStyle } from "./components/RouteStyleSwitch/RouteStyleSwitch";
import { SettingsMenu } from "./components/SettingsMenu/SettingsMenu";
import { StepPlayer } from "./components/StepPlayer/StepPlayer";
import { useTravelSpeed } from "./components/TravelSpeedSwitch/TravelSpeedSwitch";
import type { ILegSegment, ITrip } from "./itinerary/types";
import { TripOverviewLayer } from "./components/TripOverviewLayer/TripOverviewLayer";
import { dayOverviewStopIndex, useItineraryNavigation } from "./itinerary/useItineraryNavigation";
import { trips } from "./trips";
import styles from "./App.module.css";

const narrowScreenQuery = "(max-width: 760px)";
const wideScreenPadding: ICameraPadding = { top: 90, bottom: 140, left: 480, right: 80 };
// The itinerary floats 16 px from the left edge; the map's visible area starts 12 px after it.
const panelEdge = 16;
const panelGap = 12;
const itineraryWidth = 420;
// While details are open the itinerary widens to this, leaving the map at least minimumMapWidth pixels.
const detailsItineraryWidth = 720;
const minimumMapWidth = 300;
// Room left of the photos inside the widened itinerary: the day rail, the timeline's rail and the card's margins.
const photoInset = 150;
const narrowScreenPadding: ICameraPadding = { top: 60, bottom: 0, left: 50, right: 50 };

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

function useWindowWidth(): number
{
	const [width, setWidth] = useState(() => window.innerWidth);

	useEffect(() =>
	{
		const handleResize = () => setWidth(window.innerWidth);
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return width;
}

interface IOpenViewer
{
	photos: IViewerPhoto[];
	startIndex: number;
}

function readTripIdFromHash(): string
{
	return window.location.hash.match(/^#\/([^/]+)/)?.[1] ?? trips[0].id;
}

/** The whole app. Opens the trip named in the address (#/uk/...), or the first trip, and lets the viewer switch. */
export function App()
{
	const [tripId, setTripId] = useState(readTripIdFromHash);
	const trip = trips.find((candidate) => candidate.id === tripId) ?? trips[0];
	const selectTrip = useCallback((nextTripId: string) =>
	{
		// A newly picked trip opens on its overview, so the whole trip is the first thing you see.
		window.history.replaceState(null, "", `#/${nextTripId}/overview`);
		setTripId(nextTripId);
	}, []);
	// Whether stop details are shown is one setting for the whole visit: only collapsing them turns it off, so it outlasts
	// overviews (where there is no stop to show) and switching trips.
	const [isDetailOpen, setIsDetailOpen] = useState(false);
	// Keyed by trip, so switching starts the map, navigation and panels fresh for the new trip.
	return <TripView key={trip.id} trip={trip} onSelectTrip={selectTrip} isDetailOpen={isDetailOpen} onDetailOpenChange={setIsDetailOpen} />;
}

interface ITripViewProps
{
	trip: ITrip;
	onSelectTrip: (tripId: string) => void;
	/** Whether the current stop's details are shown; see App. */
	isDetailOpen: boolean;
	onDetailOpenChange: (isDetailOpen: boolean) => void;
}

/** One trip's map, itinerary panel and step player. */
function TripView({ trip, onSelectTrip, isDetailOpen, onDetailOpenChange: setIsDetailOpen }: ITripViewProps)
{
	const navigation = useItineraryNavigation(trip);
	const isNarrowScreen = useMediaQuery(narrowScreenQuery);
	const { dayIndex, stopIndex } = navigation.position;
	const day = trip.days[dayIndex];
	const isDayOverview = stopIndex === dayOverviewStopIndex;
	// The day overview has no place of its own and shows no details, so the first stop stands in.
	const detailStopIndex = Math.max(stopIndex, 0);
	const currentPlace = trip.places[day.stops[detailStopIndex].placeId];
	const [highlightedDayNumber, setHighlightedDayNumber] = useState<number | undefined>();
	const [routeStyle, setRouteStyle] = useRouteStyle();
	const [travelSpeed, setTravelSpeed] = useTravelSpeed();
	// With arcs selected, no real paths are handed to the map, so every leg falls back to its curve.
	const visibleLegPaths = useMemo<Record<string, ILegSegment[]>>(() => (routeStyle === "real" ? trip.legPaths : {}), [routeStyle, trip]);
	const { isOverview } = navigation;
	const tripCoordinates = useMemo(() => trip.days.flatMap((tripDay) => tripDay.stops.map((stop) => trip.places[stop.placeId].coordinates)), [trip]);
	const showOverview = navigation.showOverview;
	// Overviews hide the details without changing the setting, so they come back on the next stop.
	const openDetails = useCallback(() => setIsDetailOpen(true), [setIsDetailOpen]);
	const closeDetails = useCallback(() => setIsDetailOpen(false), [setIsDetailOpen]);
	const [openViewer, setOpenViewer] = useState<IOpenViewer | undefined>();
	const openPhoto = useCallback<OpenPhotoHandler>((photos, startIndex) => setOpenViewer({ photos, startIndex }), []);
	const closeViewer = useCallback(() => setOpenViewer(undefined), []);
	const windowWidth = useWindowWidth();
	const isShowingStopDetails = isDetailOpen && !isOverview && !isDayOverview;
	// While details are switched on, the day's itinerary stays at its widest, even on the day overview and at stops with
	// nothing to unfold, so it doesn't change width as you step through the day.
	const isItineraryWidened = isDetailOpen && !isOverview && !isNarrowScreen;
	const widenedItineraryWidth = Math.min(detailsItineraryWidth, windowWidth - panelEdge - minimumMapWidth);
	const mapLeftEdge = panelEdge + (isItineraryWidened ? widenedItineraryWidth : itineraryWidth) + panelGap;
	const currentStopPhotos = trip.tripPhotos?.[`${day.dayNumber}:${detailStopIndex}`];
	const currentDetails = trip.placeDetails[currentPlace.id];
	// Null when the stop has nothing to unfold, so the timeline shows no empty box for it; its card still has the links.
	const currentStopDetails = hasPlaceDetails(currentPlace, currentDetails, currentStopPhotos)
		? (
			<PlaceDetails
				place={currentPlace}
				details={currentDetails}
				day={day}
				tripPhotos={currentStopPhotos}
				photoDisplayWidth={widenedItineraryWidth - photoInset}
				onOpenPhoto={openPhoto}
			/>
		)
		: null;

	useEffect(() =>
	{
		// Escape collapses the details; the photo viewer catches it first while it is open.
		const handleKeyDown = (event: KeyboardEvent) =>
		{
			if (event.key === "Escape")
			{
				setIsDetailOpen(false);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [setIsDetailOpen]);
	const { goToStop } = navigation;
	const selectStopOnMap = useCallback((selectedStopIndex: number) =>
	{
		goToStop(selectedStopIndex);
		setIsDetailOpen(true);
	}, [goToStop, setIsDetailOpen]);

	// On phones the bottom sheet covers the lower part of the map, so the camera keeps stops above it.
	const cameraPadding = isNarrowScreen
		? { ...narrowScreenPadding, top: isOverview ? 40 : narrowScreenPadding.top, bottom: Math.round(window.innerHeight * 0.46) + (isOverview ? 16 : 90) }
		: { ...wideScreenPadding, left: Math.max(wideScreenPadding.left, mapLeftEdge + 40) };

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
			<ItineraryPanel
				trip={trip}
				trips={trips}
				onSelectTrip={onSelectTrip}
				settingsMenu={(
					<SettingsMenu
						routeStyle={routeStyle}
						onRouteStyleChange={setRouteStyle}
						travelSpeed={travelSpeed}
						onTravelSpeedChange={setTravelSpeed}
					/>
				)}
				dayIndex={dayIndex}
				stopIndex={stopIndex}
				onSelectDay={navigation.goToDay}
				isOverview={isOverview}
				highlightedDayNumber={highlightedDayNumber}
				onSelectStop={navigation.goToStop}
				onOpenDetails={openDetails}
				onShowOverview={showOverview}
				onHighlightDay={setHighlightedDayNumber}
				widePanelWidth={isItineraryWidened ? widenedItineraryWidth : undefined}
				currentStopDetails={isDayOverview ? undefined : currentStopDetails}
				isCurrentStopDetailsOpen={isShowingStopDetails}
				onCloseDetails={closeDetails}
			/>
			{!isOverview && (
				<div
					className={styles.playerDock}
					// Centered in the map's free area, which moves right as the itinerary widens.
					style={isNarrowScreen ? undefined : { left: `calc(50% + ${mapLeftEdge / 2}px)`, maxWidth: `calc(100vw - ${mapLeftEdge + 32}px)` }}
				>
					<StepPlayer
						day={day}
						nextDay={trip.days[dayIndex + 1]}
						currentStopIndex={stopIndex}
						currentStopName={isDayOverview ? day.title : currentPlace.name}
						isAtTripStart={navigation.isAtTripStart}
						isAtTripEnd={navigation.isAtTripEnd}
						isCompact={isItineraryWidened}
						onPrevious={navigation.goToPreviousStop}
						onNext={navigation.goToNextStop}
					/>
				</div>
			)}
			<AnimatePresence>
				{openViewer && <PhotoViewer key="viewer" photos={openViewer.photos} startIndex={openViewer.startIndex} onClose={closeViewer} />}
			</AnimatePresence>
		</div>
	);
}
