import { AnimatePresence, motion } from "motion/react";
import type { CSSProperties } from "react";
import type { ITrip } from "../../itinerary/types";
import { DayRail } from "../DayRail/DayRail";
import { DayTimeline } from "../DayTimeline/DayTimeline";
import { TripSummary } from "../TripSummary/TripSummary";
import styles from "./ItineraryPanel.module.css";

export interface IItineraryPanelProps
{
	trip: ITrip;
	dayIndex: number;
	stopIndex: number;
	isOverview: boolean;
	highlightedDayNumber?: number;
	onSelectDay: (dayIndex: number) => void;
	onSelectStop: (stopIndex: number) => void;
	onOpenDetails: () => void;
	onShowOverview: () => void;
	onHighlightDay: (dayNumber: number | undefined) => void;
}

/** The side panel (a bottom sheet on phones): trip title, Day/Trip switch, day rail, and either one day's timeline or the trip summary. */
export function ItineraryPanel(props: IItineraryPanelProps)
{
	const { trip, dayIndex, stopIndex, isOverview, highlightedDayNumber, onSelectDay, onSelectStop, onOpenDetails, onShowOverview, onHighlightDay } = props;
	const day = trip.days[dayIndex];

	return (
		<aside className={styles.panel} style={{ "--day-color": day.color } as CSSProperties}>
			<header className={styles.header}>
				<span className={styles.logo} aria-hidden="true">旅</span>
				<span className={styles.brand}>Daytripper</span>
				<span className={styles.tripName}>{trip.name} · {trip.days.length} days</span>
				<div className={styles.viewSwitch} role="group" aria-label="View">
					<button type="button" className={`${styles.viewOption} ${isOverview ? "" : styles.viewOptionActive}`} onClick={() => onSelectDay(dayIndex)} aria-pressed={!isOverview}>Day</button>
					<button type="button" className={`${styles.viewOption} ${isOverview ? styles.viewOptionActive : ""}`} onClick={onShowOverview} aria-pressed={isOverview}>Trip</button>
				</div>
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
											<span className={styles.dayEyebrow}>Day {day.dayNumber} · {day.baseCity}</span>
											<h1 className={styles.dayTitle}>{day.title}</h1>
											<span className={styles.daySummary}>{day.stops.length} stops</span>
										</div>
										<DayTimeline day={day} places={trip.places} currentStopIndex={stopIndex} onSelectStop={onSelectStop} onOpenDetails={onOpenDetails} />
									</>
								)}
						</motion.div>
					</AnimatePresence>
				</div>
			</div>
		</aside>
	);
}
