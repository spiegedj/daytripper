import { useEffect, useRef, type CSSProperties } from "react";
import type { IDay } from "../../itinerary/types";
import styles from "./DayStrip.module.css";

export interface IDayStripProps
{
	days: IDay[];
	selectedDayIndex: number;
	onSelectDay: (dayIndex: number) => void;
}

/** Horizontal, scrollable row of day chips. Each chip carries its day's color; the selected one is filled. */
export function DayStrip({ days, selectedDayIndex, onSelectDay }: IDayStripProps)
{
	const selectedChipRef = useRef<HTMLButtonElement>(null);

	useEffect(() =>
	{
		selectedChipRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
	}, [selectedDayIndex]);

	return (
		<nav className={styles.strip} aria-label="Days">
			{days.map((day, dayIndex) =>
			{
				const isSelected = dayIndex === selectedDayIndex;
				return (
					<button
						key={day.dayNumber}
						ref={isSelected ? selectedChipRef : undefined}
						type="button"
						className={`${styles.chip} ${isSelected ? styles.selected : ""}`}
						style={{ "--day-color": day.color } as CSSProperties}
						onClick={() => onSelectDay(dayIndex)}
						aria-current={isSelected ? "true" : undefined}
					>
						<span className={styles.dayLabel}>
							<span className={styles.dot} />
							Day {day.dayNumber}
						</span>
						<span className={styles.city}>{day.baseCity}</span>
						<span className={styles.stopCount}>{day.stops.length} stops</span>
					</button>
				);
			})}
		</nav>
	);
}
