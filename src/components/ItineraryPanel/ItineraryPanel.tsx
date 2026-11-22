import { AnimatePresence, motion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";
import { getDayLabel } from "../../itinerary/dayLabels";
import type { ITrip } from "../../itinerary/types";
import { DayRail } from "../DayRail/DayRail";
import { DayTimeline } from "../DayTimeline/DayTimeline";
import { TripPicker } from "../TripPicker/TripPicker";
import { TripSummary } from "../TripSummary/TripSummary";
import styles from "./ItineraryPanel.module.css";

export interface IItineraryPanelProps
{
	trip: ITrip;
	/** Every trip on the site, for the trip picker. */
	trips: ITrip[];
	onSelectTrip: (tripId: string) => void;
	/** The settings button, shown at the end of the panel's header. */
	settingsMenu: ReactNode;
	dayIndex: number;
	stopIndex: number;
	isOverview: boolean;
	highlightedDayNumber?: number;
	onSelectDay: (dayIndex: number) => void;
	onSelectStop: (stopIndex: number) => void;
	onOpenDetails: () => void;
	onShowOverview: () => void;
	onHighlightDay: (dayNumber: number | undefined) => void;
	/** Width of the panel while details are switched on, so photos have room; unset keeps the usual width. */
	widePanelWidth?: number;
	/** The current stop's photos and details, shown inside the timeline; see DayTimeline. */
	currentStopDetails?: ReactNode;
	isCurrentStopDetailsOpen?: boolean;
	onCloseDetails?: () => void;
}

/** The side panel (a bottom sheet on phones): trip title, Day/Trip switch, day rail, and either one day's timeline or the trip summary. */
export function ItineraryPanel(props: IItineraryPanelProps)
{
	const { trip, trips, onSelectTrip, dayIndex, stopIndex, isOverview, highlightedDayNumber, onSelectDay, onSelectStop, onOpenDetails, onShowOverview, onHighlightDay } = props;
	const { settingsMenu, widePanelWidth, currentStopDetails, isCurrentStopDetailsOpen = false, onCloseDetails } = props;
	const day = trip.days[dayIndex];

	return (
		<aside className={styles.panel} style={{ "--day-color": day.color, width: widePanelWidth } as CSSProperties}>
			<header className={styles.header}>
				<img className={styles.logo} src={`${import.meta.env.BASE_URL}icon.svg`} alt="" />
				<span className={styles.brand}>Daytripper</span>
				<div className={styles.tripName}><TripPicker trips={trips} currentTripId={trip.id} onSelectTrip={onSelectTrip} /></div>
				<div className={styles.viewSwitch} role="group" aria-label="View">
					<button type="button" className={`${styles.viewOption} ${isOverview ? "" : styles.viewOptionActive}`} onClick={() => onSelectDay(dayIndex)} aria-pressed={!isOverview}>Day</button>
					<button type="button" className={`${styles.viewOption} ${isOverview ? styles.viewOptionActive : ""}`} onClick={onShowOverview} aria-pressed={isOverview}>Trip</button>
				</div>
				<div className={styles.settings}>{settingsMenu}</div>
			</header>
			<div className={styles.body}>
				<DayRail days={trip.days} selectedDayIndex={isOverview ? -1 : dayIndex} onSelectDay={onSelectDay} />
				<div className={styles.scrollArea}>
					<AnimatePresence mode="wait" initial={false}>
						<motion.div
							key={isOverview ? "overview" : day.dayNumber}
							initial={{ opacity: 0, y: 14 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -14 }}
							transition={{ duration: 0.2, ease: "easeOut" }}
						>
							{isOverview
								? <TripSummary trip={trip} highlightedDayNumber={highlightedDayNumber} onSelectDay={onSelectDay} onHighlightDay={onHighlightDay} />
								: (
									<>
										<div className={styles.dayHeader}>
											<span className={styles.dayEyebrow}>{getDayLabel(day)} · {day.baseCity}</span>
											<h1 className={styles.dayTitle}>{day.title}</h1>
											<span className={styles.daySummary}>{day.stops.length} stops</span>
										</div>
										<DayTimeline day={day} places={trip.places} currentStopIndex={stopIndex} onSelectStop={onSelectStop} onOpenDetails={onOpenDetails}
												tripPhotos={trip.tripPhotos}
												placeDetails={trip.placeDetails}
												currentStopDetails={currentStopDetails}
												isCurrentStopDetailsOpen={isCurrentStopDetailsOpen}
												onCloseDetails={onCloseDetails}
											/>
									</>
								)}
						</motion.div>
					</AnimatePresence>
				</div>
			</div>
		</aside>
	);
}
