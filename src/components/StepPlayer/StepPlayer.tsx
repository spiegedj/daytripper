import type { CSSProperties } from "react";
import type { IDay } from "../../itinerary/types";
import styles from "./StepPlayer.module.css";

export interface IStepPlayerProps
{
	day: IDay;
	nextDay?: IDay;
	currentStopIndex: number;
	currentStopName: string;
	isAtTripStart: boolean;
	isAtTripEnd: boolean;
	onPrevious: () => void;
	onNext: () => void;
}

/** Floating back / next control with a progress bar for the day. On the last stop, Next moves on to the following day. */
export function StepPlayer({ day, nextDay, currentStopIndex, currentStopName, isAtTripStart, isAtTripEnd, onPrevious, onNext }: IStepPlayerProps)
{
	const isLastStopOfDay = currentStopIndex === day.stops.length - 1;
	const nextLabel = isLastStopOfDay && nextDay ? `Day ${nextDay.dayNumber}` : "Next stop";

	return (
		<div className={styles.player} style={{ "--day-color": day.color } as CSSProperties}>
			<button type="button" className={styles.previous} onClick={onPrevious} disabled={isAtTripStart} aria-label="Previous stop">
				<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
			</button>
			<div className={styles.status}>
				<span className={styles.eyebrow}>Day {day.dayNumber} · Stop {currentStopIndex + 1} of {day.stops.length}</span>
				<span className={styles.title}>{currentStopName}</span>
				<span className={styles.progress} aria-hidden="true">
					{day.stops.map((stop, stopIndex) => (
						<span
							key={`${stop.placeId}-${stopIndex}`}
							className={`${styles.segment} ${stopIndex < currentStopIndex ? styles.segmentDone : ""} ${stopIndex === currentStopIndex ? styles.segmentCurrent : ""}`}
						/>
					))}
				</span>
			</div>
			<button type="button" className={styles.next} onClick={onNext} disabled={isAtTripEnd}>
				<span className={styles.nextLabel}>{nextLabel}</span>
				<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
			</button>
		</div>
	);
}
