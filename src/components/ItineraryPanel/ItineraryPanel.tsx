import { AnimatePresence, motion } from "motion/react";
import type { CSSProperties } from "react";
import type { ITrip } from "../../itinerary/types";
import { DayRail } from "../DayRail/DayRail";
import { DayTimeline } from "../DayTimeline/DayTimeline";
import styles from "./ItineraryPanel.module.css";

export interface IItineraryPanelProps
{
	trip: ITrip;
	dayIndex: number;
	stopIndex: number;
	onSelectDay: (dayIndex: number) => void;
	onSelectStop: (stopIndex: number) => void;
}

/** The side panel (a bottom sheet on phones): trip title, a vertical day rail, and the selected day's timeline. */
export function ItineraryPanel({ trip, dayIndex, stopIndex, onSelectDay, onSelectStop }: IItineraryPanelProps)
{
	const day = trip.days[dayIndex];

	return (
		<aside className={styles.panel} style={{ "--day-color": day.color } as CSSProperties}>
			<header className={styles.header}>
				<span className={styles.logo} aria-hidden="true">旅</span>
				<span className={styles.brand}>Daytripper</span>
				<span className={styles.tripName}>{trip.name} · {trip.days.length} days</span>
			</header>
			<div className={styles.body}>
				<DayRail days={trip.days} selectedDayIndex={dayIndex} onSelectDay={onSelectDay} />
				<div className={styles.scrollArea}>
					<AnimatePresence mode="wait" initial={false}>
						<motion.div
							key={day.dayNumber}
							initial={{ opacity: 0, y: 14 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -14 }}
							transition={{ duration: 0.2, ease: "easeOut" }}
						>
							<div className={styles.dayHeader}>
								<span className={styles.dayEyebrow}>Day {day.dayNumber} · {day.baseCity}</span>
								<h1 className={styles.dayTitle}>{day.title}</h1>
								<span className={styles.daySummary}>{day.stops.length} stops</span>
							</div>
							<DayTimeline day={day} places={trip.places} currentStopIndex={stopIndex} onSelectStop={onSelectStop} />
						</motion.div>
					</AnimatePresence>
				</div>
			</div>
		</aside>
	);
}
